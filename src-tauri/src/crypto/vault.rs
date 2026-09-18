use aes_gcm::{
    aead::{Aead, KeyInit},
    Aes256Gcm, Nonce,
};
use rand::RngCore;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};

const PBKDF2_ROUNDS: u32 = 100_000;
const KEY_LEN: usize = 32;

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct VaultMeta {
    pub salt: String,
    pub iv: String,
    #[serde(rename = "authTag")]
    pub auth_tag: String,
    #[serde(rename = "encryptedMasterKey")]
    pub encrypted_master_key: String,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct EncryptedVaultFile {
    pub vault: VaultMeta,
    #[serde(rename = "dataIv")]
    pub data_iv: String,
    #[serde(rename = "dataAuthTag")]
    pub data_auth_tag: String,
    #[serde(rename = "encryptedData")]
    pub encrypted_data: String,
}

pub struct VaultCrypto {
    pub enc_path: PathBuf,
    pub master_key: Option<[u8; 32]>,
    pub vault_meta: Option<VaultMeta>,
}

impl VaultCrypto {
    pub fn new<P: AsRef<Path>>(enc_path: P) -> Self {
        Self {
            enc_path: enc_path.as_ref().to_path_buf(),
            master_key: None,
            vault_meta: None,
        }
    }

    pub fn is_vault_setup(&self) -> bool {
        self.enc_path.exists()
    }

    pub fn is_locked(&self) -> bool {
        self.master_key.is_none()
    }

    pub fn lock(&mut self) {
        self.master_key = None;
    }

    pub fn get_recovery_code(&self) -> Option<String> {
        self.master_key.map(hex::encode)
    }

    /// Derives 32-byte key from password + salt via PBKDF2-HMAC-SHA256
    pub fn derive_key(password: &str, salt: &[u8]) -> [u8; 32] {
        let mut key = [0u8; KEY_LEN];
        pbkdf2::pbkdf2_hmac::<sha2::Sha256>(password.as_bytes(), salt, PBKDF2_ROUNDS, &mut key);
        key
    }

    /// Initializes a new vault with password, returning the 64-character recovery code
    pub fn setup_vault(&mut self, password: &str, initial_json: &str) -> Result<String, String> {
        let mut rng = rand::thread_rng();

        let mut master_key = [0u8; 32];
        rng.fill_bytes(&mut master_key);
        let recovery_code = hex::encode(master_key);

        let mut salt = [0u8; 16];
        rng.fill_bytes(&mut salt);

        let derived_key = Self::derive_key(password, &salt);

        let mut iv = [0u8; 12];
        rng.fill_bytes(&mut iv);

        let cipher = Aes256Gcm::new_from_slice(&derived_key)
            .map_err(|e| format!("Cipher init error: {}", e))?;
        let nonce = Nonce::from_slice(&iv);

        let ciphertext_with_tag = cipher
            .encrypt(nonce, master_key.as_ref())
            .map_err(|e| format!("Encryption error: {}", e))?;

        let (encrypted_master_key, auth_tag) =
            ciphertext_with_tag.split_at(ciphertext_with_tag.len() - 16);

        let meta = VaultMeta {
            salt: hex::encode(salt),
            iv: hex::encode(iv),
            auth_tag: hex::encode(auth_tag),
            encrypted_master_key: hex::encode(encrypted_master_key),
        };

        // Encrypt initial payload
        let mut data_iv = [0u8; 12];
        rng.fill_bytes(&mut data_iv);

        let data_cipher = Aes256Gcm::new_from_slice(&master_key)
            .map_err(|e| format!("Data cipher error: {}", e))?;
        let data_nonce = Nonce::from_slice(&data_iv);

        let enc_data_with_tag = data_cipher
            .encrypt(data_nonce, initial_json.as_bytes())
            .map_err(|e| format!("Data encryption error: {}", e))?;

        let (encrypted_data, data_tag) = enc_data_with_tag.split_at(enc_data_with_tag.len() - 16);

        let vault_file = EncryptedVaultFile {
            vault: meta.clone(),
            data_iv: hex::encode(data_iv),
            data_auth_tag: hex::encode(data_tag),
            encrypted_data: hex::encode(encrypted_data),
        };

        let json_str = serde_json::to_string_pretty(&vault_file)
            .map_err(|e| format!("Serialization error: {}", e))?;

        if let Some(parent) = self.enc_path.parent() {
            fs::create_dir_all(parent).map_err(|e| e.to_string())?;
        }
        fs::write(&self.enc_path, json_str).map_err(|e| e.to_string())?;

        self.master_key = Some(master_key);
        self.vault_meta = Some(meta);

        Ok(recovery_code)
    }

    /// Unlocks vault using master password
    pub fn unlock_vault(&mut self, password: &str) -> Result<String, String> {
        if !self.enc_path.exists() {
            return Err("Vault file does not exist".to_string());
        }

        let raw = fs::read_to_string(&self.enc_path).map_err(|e| e.to_string())?;
        let file_payload: EncryptedVaultFile =
            serde_json::from_str(&raw).map_err(|e| format!("Invalid vault file: {}", e))?;

        let salt = hex::decode(&file_payload.vault.salt).map_err(|e| e.to_string())?;
        let iv = hex::decode(&file_payload.vault.iv).map_err(|e| e.to_string())?;
        let auth_tag = hex::decode(&file_payload.vault.auth_tag).map_err(|e| e.to_string())?;
        let enc_mk = hex::decode(&file_payload.vault.encrypted_master_key).map_err(|e| e.to_string())?;

        let derived_key = Self::derive_key(password, &salt);
        let cipher = Aes256Gcm::new_from_slice(&derived_key).map_err(|e| e.to_string())?;
        let nonce = Nonce::from_slice(&iv);

        let mut combined_mk = enc_mk;
        combined_mk.extend_from_slice(&auth_tag);

        let decrypted_mk = cipher
            .decrypt(nonce, combined_mk.as_ref())
            .map_err(|_| "Incorrect master password".to_string())?;

        if decrypted_mk.len() != 32 {
            return Err("Decrypted master key length invalid".to_string());
        }

        let mut master_key = [0u8; 32];
        master_key.copy_from_slice(&decrypted_mk);

        // Decrypt data payload
        let data = Self::decrypt_data_payload(&file_payload, &master_key)?;

        self.master_key = Some(master_key);
        self.vault_meta = Some(file_payload.vault);

        Ok(data)
    }

    /// Unlocks vault with 64-character recovery code
    pub fn unlock_with_recovery_code(&mut self, code: &str) -> Result<String, String> {
        if !self.enc_path.exists() {
            return Err("Vault file does not exist".to_string());
        }

        let raw = fs::read_to_string(&self.enc_path).map_err(|e| e.to_string())?;
        let file_payload: EncryptedVaultFile =
            serde_json::from_str(&raw).map_err(|e| format!("Invalid vault file: {}", e))?;

        let key_bytes = hex::decode(code.trim()).map_err(|_| "Invalid recovery code format".to_string())?;
        if key_bytes.len() != 32 {
            return Err("Recovery code must be exactly 64 hex characters (32 bytes)".to_string());
        }

        let mut master_key = [0u8; 32];
        master_key.copy_from_slice(&key_bytes);

        let data = Self::decrypt_data_payload(&file_payload, &master_key)?;

        self.master_key = Some(master_key);
        self.vault_meta = Some(file_payload.vault);

        Ok(data)
    }

    fn decrypt_data_payload(
        file_payload: &EncryptedVaultFile,
        master_key: &[u8; 32],
    ) -> Result<String, String> {
        let data_iv = hex::decode(&file_payload.data_iv).map_err(|e| e.to_string())?;
        let data_tag = hex::decode(&file_payload.data_auth_tag).map_err(|e| e.to_string())?;
        let enc_data = hex::decode(&file_payload.encrypted_data).map_err(|e| e.to_string())?;

        let cipher = Aes256Gcm::new_from_slice(master_key).map_err(|e| e.to_string())?;
        let nonce = Nonce::from_slice(&data_iv);

        let mut combined_data = enc_data;
        combined_data.extend_from_slice(&data_tag);

        let decrypted = cipher
            .decrypt(nonce, combined_data.as_ref())
            .map_err(|_| "Failed to decrypt vault data payload".to_string())?;

        String::from_utf8(decrypted).map_err(|e| format!("UTF-8 decode error: {}", e))
    }

    /// Updates vault password and optionally rolls the 64-character recovery code
    pub fn change_password(
        &mut self,
        current_password: &str,
        new_password: &str,
        regenerate_recovery_key: bool,
    ) -> Result<Option<String>, String> {
        let current_data = self.unlock_vault(current_password)?;

        let mut rng = rand::thread_rng();
        let master_key = if regenerate_recovery_key {
            let mut mk = [0u8; 32];
            rng.fill_bytes(&mut mk);
            mk
        } else {
            self.master_key.ok_or_else(|| "Vault must be unlocked".to_string())?
        };

        let mut salt = [0u8; 16];
        rng.fill_bytes(&mut salt);
        let derived_key = Self::derive_key(new_password, &salt);

        let mut iv = [0u8; 12];
        rng.fill_bytes(&mut iv);

        let cipher = Aes256Gcm::new_from_slice(&derived_key).map_err(|e| e.to_string())?;
        let nonce = Nonce::from_slice(&iv);

        let ciphertext_with_tag = cipher
            .encrypt(nonce, master_key.as_ref())
            .map_err(|e| e.to_string())?;

        let (encrypted_master_key, auth_tag) =
            ciphertext_with_tag.split_at(ciphertext_with_tag.len() - 16);

        let meta = VaultMeta {
            salt: hex::encode(salt),
            iv: hex::encode(iv),
            auth_tag: hex::encode(auth_tag),
            encrypted_master_key: hex::encode(encrypted_master_key),
        };

        // Re-encrypt payload with master key
        let mut data_iv = [0u8; 12];
        rng.fill_bytes(&mut data_iv);

        let data_cipher = Aes256Gcm::new_from_slice(&master_key).map_err(|e| e.to_string())?;
        let data_nonce = Nonce::from_slice(&data_iv);

        let enc_data_with_tag = data_cipher
            .encrypt(data_nonce, current_data.as_bytes())
            .map_err(|e| e.to_string())?;

        let (encrypted_data, data_tag) = enc_data_with_tag.split_at(enc_data_with_tag.len() - 16);

        let vault_file = EncryptedVaultFile {
            vault: meta.clone(),
            data_iv: hex::encode(data_iv),
            data_auth_tag: hex::encode(data_tag),
            encrypted_data: hex::encode(encrypted_data),
        };

        let json_str = serde_json::to_string_pretty(&vault_file).map_err(|e| e.to_string())?;
        fs::write(&self.enc_path, json_str).map_err(|e| e.to_string())?;

        self.master_key = Some(master_key);
        self.vault_meta = Some(meta);

        if regenerate_recovery_key {
            Ok(Some(hex::encode(master_key)))
        } else {
            Ok(None)
        }
    }

    /// Regenerates recovery key using current password verification
    pub fn regenerate_recovery_key(&mut self, current_password: &str) -> Result<String, String> {
        self.change_password(current_password, current_password, true)?
            .ok_or_else(|| "Failed to generate new recovery code".to_string())
    }
}

