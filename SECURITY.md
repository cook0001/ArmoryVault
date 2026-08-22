# Security Policy 🛡️

## Supported Versions

ArmoryVault maintains active security updates and patch support for the **2 most current stable releases** and the **most current nightly preview build** across both Desktop and Mobile ecosystems. All older legacy versions are considered End-of-Life (EOL) and are pruned from active release channels.

### Desktop Application (`cook0001/ArmoryVault`)

| Version | Status | Security Support |
| :--- | :--- | :---: |
| **`v2.8.0-nightly.x`** *(e.g. `v2.8.0-nightly.6`)* | Active Nightly Preview | :white_check_mark: |
| **`v2.7.1`** | Current Stable Release | :white_check_mark: |
| **`v2.7.0`** | Previous Stable Release | :white_check_mark: |
| **`<= v2.6.x`** | Legacy Releases (Pruned) | :x: |

---

### Mobile Companion Application (`cook0001/ArmoryVault-Companion-App`)

| Version | Status | Security Support |
| :--- | :--- | :---: |
| **`v2.6.0-nightly.x`** *(e.g. `v2.6.0-nightly.42`)* | Active Nightly Preview | :white_check_mark: |
| **`v2.6.0`** | Current Stable Release | :white_check_mark: |
| **`v2.5.1`** | Previous Stable Release | :white_check_mark: |
| **`<= v2.5.0`** | Legacy Releases (Pruned) | :x: |

---

## Release Retention Policy

To prevent users from inadvertently running outdated or vulnerable binaries, GitHub Releases across both repositories strictly adhere to the following retention rules:
1. **Stable Channel**: Exactly the **2 most current stable releases** are retained with binary installers.
2. **Nightly Channel**: Exactly the **1 most current nightly preview release** is retained with binary installers.
3. **Automated Pruning**: When a new release is published, older superseded releases are pruned from the releases distribution page.

---

## Core Security & Privacy Model

ArmoryVault is engineered from the ground up to protect user privacy and firearms record confidentiality:

- **100% Zero-Cloud Architecture**: ArmoryVault never transmits firearms data, ammunition counts, serial numbers, ATF Bound Book ledgers, or photos to remote cloud servers.
- **Strong Encryption at Rest**: Encrypted vault databases use industry-standard **AES-256-GCM** encryption with hardened **PBKDF2** key derivation.
- **Local Wi-Fi P2P Pairing**: Mobile companion sync operates strictly peer-to-peer over the user's local Wi-Fi router (LAN) using ephemeral single-use QR pairing tokens.

---

## Reporting a Vulnerability

If you discover a security vulnerability or potential exploit within ArmoryVault:

1. **GitHub Security Advisory (Preferred)**: Submit a private report via the **Security** -> **Advisories** -> **Report a vulnerability** tab on GitHub.
2. **Issue Tracker**: If the issue does not pose an immediate risk of sensitive data exposure, you may also open an issue on the [ArmoryVault Issues](https://github.com/cook0001/ArmoryVault/issues) tracker.

Please include detailed reproduction steps, environment details (OS, architecture, app version), and proof-of-concept payloads where appropriate. We take all security disclosures seriously and will review and respond promptly.

