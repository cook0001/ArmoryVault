import { Firearm } from './types';

// This provides a fallback localStorage backend if the app is run in a standard 
// web browser (via `npm run dev`) rather than inside the Electron shell.
if (!window.api) {
  console.log('No Electron backend detected. Initializing browser localStorage fallback.');

  const STORAGE_KEY = 'firearms_inventory_data';

  const getStoredFirearms = (): Firearm[] => {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  };

  const saveFirearms = (firearms: Firearm[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(firearms));
  };

  window.api = {
    getFirearms: async () => {
      return getStoredFirearms();
    },
    addFirearm: async (firearm: Firearm) => {
      const firearms = getStoredFirearms();
      const newId = firearms.length > 0 ? Math.max(...firearms.map(f => f.id || 0)) + 1 : 1;
      const newFirearm = { ...firearm, id: newId };
      firearms.push(newFirearm);
      saveFirearms(firearms);
      return newId;
    },
    updateFirearm: async (id: number, firearm: Firearm) => {
      const firearms = getStoredFirearms();
      const index = firearms.findIndex(f => f.id === id);
      if (index !== -1) {
        firearms[index] = { ...firearm, id };
        saveFirearms(firearms);
      }
      return id;
    },
    deleteFirearm: async (id: number) => {
      let firearms = getStoredFirearms();
      firearms = firearms.filter(f => f.id !== id);
      saveFirearms(firearms);
      return id;
    },
    savePhoto: async (sourcePath: string, filename: string) => {
      // In a browser, we can't save to the local file system. 
      // We'll just return the sourcePath (which will be a blob URL or base64 string)
      return sourcePath;
    },
    exportData: async (dataString: string, filename: string) => {
      const blob = new Blob([dataString], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return true;
    },
    onUpdateMessage: (callback: (message: any) => void) => {
      // Mock updater behavior
      // setTimeout(() => callback({ type: 'update-available' }), 2000);
    },
    restartApp: () => {
      window.location.reload();
    }
  };
}
