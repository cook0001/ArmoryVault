import { Firearm, Ammo, CustomSkuDatabase } from './types';

// This provides a fallback localStorage backend if the app is run in a standard 
// web browser (via `npm run dev`) rather than inside the Electron shell.
export function setupMockBackend() {
  if (!window.api) {
    console.log('No Electron backend detected. Initializing browser localStorage fallback.');

    const STORAGE_KEY = 'firearms_inventory_data';
    const AMMO_STORAGE_KEY = 'ammo_inventory_data';
    const ACCESSORY_STORAGE_KEY = 'accessory_inventory_data';

    const getStoredFirearms = (): Firearm[] => {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    };

    const saveFirearms = (firearms: Firearm[]) => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(firearms));
    };

    const getStoredAmmo = (): Ammo[] => {
      const data = localStorage.getItem(AMMO_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    };

    const saveAmmo = (ammoList: Ammo[]) => {
      localStorage.setItem(AMMO_STORAGE_KEY, JSON.stringify(ammoList));
    };
    
    const getStoredAccessories = (): any[] => {
      const data = localStorage.getItem(ACCESSORY_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    };

    const saveAccessories = (list: any[]) => {
      localStorage.setItem(ACCESSORY_STORAGE_KEY, JSON.stringify(list));
    };

    let mockLocked = false;

    window.api = {
      isVaultSetup: async () => true,
      isVaultLocked: async () => mockLocked,
      setupVault: async (password: string) => {
        mockLocked = false;
        return "mock-recovery-code-1234567890abcdef";
      },
      unlockVault: async (password: string) => {
        if (password === 'test') { mockLocked = false; return true; }
        return false;
      },
      unlockWithRecoveryCode: async (code: string) => {
        mockLocked = false;
        return true;
      },
      getFirearms: async () => {
        if (mockLocked) return [];
        return getStoredFirearms();
      },
      addFirearm: async (firearm: Firearm) => {
        if (mockLocked) return -1;
        const firearms = getStoredFirearms();
        const newId = firearms.length > 0 ? Math.max(...firearms.map(f => f.id || 0)) + 1 : 1;
        const newFirearm = { ...firearm, id: newId };
        firearms.push(newFirearm);
        saveFirearms(firearms);
        return newId;
      },
      updateFirearm: async (id: number, firearm: Firearm) => {
        if (mockLocked) return -1;
        const firearms = getStoredFirearms();
        const index = firearms.findIndex(f => f.id === id);
        if (index !== -1) {
          firearms[index] = { ...firearm, id };
          saveFirearms(firearms);
        }
        return id;
      },
      deleteFirearm: async (id: number) => {
        if (mockLocked) return -1;
        let firearms = getStoredFirearms();
        firearms = firearms.filter(f => f.id !== id);
        saveFirearms(firearms);
        return id;
      },
      getAmmo: async () => {
        if (mockLocked) return [];
        return getStoredAmmo();
      },
      addAmmo: async (ammo: Ammo) => {
        if (mockLocked) return -1;
        const ammoList = getStoredAmmo();
        const newId = ammoList.length > 0 ? Math.max(...ammoList.map(a => a.id || 0)) + 1 : 1;
        const newAmmo = { ...ammo, id: newId };
        ammoList.push(newAmmo);
        saveAmmo(ammoList);
        return newId;
      },
      updateAmmo: async (id: number, ammo: Ammo) => {
        if (mockLocked) return -1;
        const ammoList = getStoredAmmo();
        const index = ammoList.findIndex(a => a.id === id);
        if (index !== -1) {
          ammoList[index] = { ...ammo, id };
          saveAmmo(ammoList);
        }
        return id;
      },
      deleteAmmo: async (id: number) => {
        if (mockLocked) return -1;
        let ammoList = getStoredAmmo();
        ammoList = ammoList.filter(a => a.id !== id);
        saveAmmo(ammoList);
        return id;
      },
      getAccessories: async () => {
        if (mockLocked) return [];
        return getStoredAccessories();
      },
      addAccessory: async (acc: any) => {
        if (mockLocked) return -1;
        const list = getStoredAccessories();
        const newId = list.length > 0 ? Math.max(...list.map(a => a.id || 0)) + 1 : 1;
        const newAcc = { ...acc, id: newId };
        list.push(newAcc);
        saveAccessories(list);
        return newId;
      },
      updateAccessory: async (id: number, acc: any) => {
        if (mockLocked) return -1;
        const list = getStoredAccessories();
        const index = list.findIndex(a => a.id === id);
        if (index !== -1) {
          list[index] = { ...acc, id };
          saveAccessories(list);
        }
        return id;
      },
      deleteAccessory: async (id: number) => {
        if (mockLocked) return -1;
        let list = getStoredAccessories();
        list = list.filter(a => a.id !== id);
        saveAccessories(list);
        return id;
      },
      getSkus: async () => {
        const data = localStorage.getItem('mock_skus');
        return data ? JSON.parse(data) : {};
      },
      saveSkus: async (skus: CustomSkuDatabase) => {
        localStorage.setItem('mock_skus', JSON.stringify(skus));
        return true;
      },
      deleteSku: async (skuId: string) => {
        const data = localStorage.getItem('mock_skus');
        if (data) {
          const skus = JSON.parse(data);
          delete skus[skuId];
          localStorage.setItem('mock_skus', JSON.stringify(skus));
        }
        return skuId;
      },
      savePhoto: async (sourcePath: string, filename: string) => {
        return sourcePath;
      },
      saveDocument: async (sourcePath: string, filename: string) => {
        return sourcePath;
      },
      getBackupFolder: async () => null,
      selectBackupFolder: async () => "/mock/backup/path",
      createZipBackup: async () => { console.log('Mock zip backup'); return true; },
      getConfig: async (key: string) => {
        const config = JSON.parse(localStorage.getItem('mock_config') || '{}');
        return config[key];
      },
      setConfig: async (key: string, value: any) => {
        const config = JSON.parse(localStorage.getItem('mock_config') || '{}');
        config[key] = value;
        localStorage.setItem('mock_config', JSON.stringify(config));
      },
      selectAndSaveDocument: async () => ({ name: "MockDoc.pdf", path: "/mock/path/MockDoc.pdf" }),
      selectAndSavePhoto: async () => { console.log('Mock select photo'); return null; },
      openExternalFile: async (filePath: string) => {
        console.log('Mock open external file:', filePath);
      },
      printQRLabel: async (data: any) => { console.log('Mock print QR', data); return true; },
      saveQRImage: async (data: any) => { console.log('Mock save QR', data); return true; },
      readFileBase64: async (filePath: string) => { console.log('Mock read base64', filePath); return null; },
      readFileBuffer: async (filePath: string) => { console.log('Mock read buffer', filePath); return null; },
      generateBillOfSale: async (data: any) => { console.log('Mock generate BoS', data); return null; },
      generateInsuranceReport: async (data: any) => { console.log('Mock generate Insurance', data); return null; },
      lookupUPC: async (upc: string) => ({ items: [] }),
      exportData: async (dataString: string, filename: string) => {
        const blob = new Blob([dataString], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return filename;
      },
      onUpdateMessage: (callback: (message: any) => void) => {
        return () => {};
      },
      restartApp: () => {
        window.location.reload();
      },
      openUrl: async (url: string) => {
        window.open(url, '_blank');
      },
      getPlatform: () => 'browser'
    };
  }
}
