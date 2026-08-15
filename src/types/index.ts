export interface MaintenanceLog {
  id: number;
  date: string;
  type: 'Cleaning' | 'Range' | 'Modification' | 'Other';
  rounds_fired?: number;
  notes: string;
}

export interface Firearm {
  id?: number;
  make: string;
  model: string;
  serial_number: string;
  caliber: string;
  barrel_length: string;
  action_type: string;
  notes: string;
  purchase_price: number | null;
  purchase_date: string;
  condition: string;
  image_path: string;
  is_sold: boolean;
  sold_to_name: string;
  sold_date: string;
  sold_price: number | null;
  sale_notes: string;
  logs?: MaintenanceLog[];
}

declare global {
  interface Window {
    api: {
      getFirearms: () => Promise<Firearm[]>;
      addFirearm: (firearm: Firearm) => Promise<number>;
      updateFirearm: (id: number, firearm: Firearm) => Promise<number>;
      deleteFirearm: (id: number) => Promise<number>;
      savePhoto: (sourcePath: string, filename: string) => Promise<string | null>;
      exportData: (dataString: string, filename: string) => Promise<boolean>;
      onUpdateMessage: (callback: (message: any) => void) => void;
      restartApp: () => void;
    };
  }
}
