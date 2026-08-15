export interface MaintenanceLog {
  id: number;
  date: string;
  type: 'Cleaning' | 'Range' | 'Modification' | 'Other';
  rounds_fired?: number;
  ammo_used?: string;
  malfunctions?: number;
  cost?: number;
  image_path?: string;
  notes: string;
}

export interface Ammo {
  id?: number;
  caliber: string;
  category?: 'Pistol' | 'Rifle' | 'Shotgun' | 'Other' | string;
  type: 'factory' | 'handload';
  count: number;
  costPerRound?: number;
  manufacturer?: string;
  bullet_manufacturer?: string;
  grain?: number;
  projectile?: string;
  shell_length?: string;
  shot_size?: string;
  oz_payload?: string;
  pellet_count?: number;
  powder?: string;
  powderCharge?: number;
  primer_type?: string;
  primer?: string;
  brass?: string;
  oal?: number;
  notes?: string;
  upc_code?: string;
  upc_match?: string;
  isPlusP?: boolean;
}

export interface Firearm {
  id?: number;
  make: string;
  model: string;
  serial_number: string;
  caliber: string;
  barrel_length?: string;
  action_type?: string;
  finish?: string;
  notes?: string;
  purchase_price: number | null;
  purchase_date: string;
  condition: string;
  image_path: string;
  
  // Bound Book Fields
  purchased_from?: string;
  firearm_type?: string;

  // Sale info
  is_sold: boolean;
  sold_to_name: string;
  sold_date: string;
  sold_price: number | null;
  sale_notes: string;
  logs?: MaintenanceLog[];
  documents?: { name: string, path: string }[];
}

export type CustomSkuDatabase = Record<string, Partial<Ammo>>;

declare global {
  interface Window {
    api: {
      isVaultSetup: () => Promise<boolean>;
      isVaultLocked: () => Promise<boolean>;
      setupVault: (password: string) => Promise<string>;
      unlockVault: (password: string) => Promise<boolean>;
      unlockWithRecoveryCode: (code: string) => Promise<boolean>;
      
      getFirearms: () => Promise<Firearm[]>;
      addFirearm: (firearm: Firearm) => Promise<number>;
      updateFirearm: (id: number, firearm: Firearm) => Promise<number>;
      deleteFirearm: (id: number) => Promise<number>;
      
      getAmmo: () => Promise<Ammo[]>;
      addAmmo: (ammo: Ammo) => Promise<number>;
      updateAmmo: (id: number, ammo: Ammo) => Promise<number>;
      deleteAmmo: (id: number) => Promise<number>;
      
      getSkus: () => Promise<CustomSkuDatabase>;
      saveSkus: (skus: CustomSkuDatabase) => Promise<boolean>;
      deleteSku: (skuId: string) => Promise<string>;
      
      savePhoto: (sourcePath: string, filename: string) => Promise<string | null>;
      saveDocument: (sourcePath: string, filename: string) => Promise<string | null>;
      
      getBackupFolder: () => Promise<string | null>;
      selectBackupFolder: () => Promise<string | null>;
      
      selectAndSaveDocument: () => Promise<{name: string, path: string} | null>;
      selectAndSavePhoto: () => Promise<string | null>;
      openExternalFile: (filePath: string) => Promise<string>;
      lookupUPC: (upc: string) => Promise<any>;
      
      exportData: (dataString: string, filename: string) => Promise<boolean>;
      onUpdateMessage: (callback: (message: any) => void) => void;
      restartApp: () => void;
    };
  }
}
