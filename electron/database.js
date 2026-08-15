const fs = require('fs');
const path = require('path');
const { app } = require('electron');

class Database {
  constructor() {
    this.dbPath = path.join(app.getPath('userData'), 'firearms_inventory.json');
    this.photoDir = path.join(app.getPath('userData'), 'photos');
    
    if (!fs.existsSync(this.photoDir)) {
      fs.mkdirSync(this.photoDir, { recursive: true });
    }
  }

  getFirearms() {
    if (!fs.existsSync(this.dbPath)) {
      return [];
    }
    const data = fs.readFileSync(this.dbPath, 'utf8');
    try {
      return JSON.parse(data);
    } catch (e) {
      return [];
    }
  }

  saveFirearms(data) {
    fs.writeFileSync(this.dbPath, JSON.stringify(data, null, 2));
  }

  addFirearm(firearm) {
    const firearms = this.getFirearms();
    const newId = firearms.length > 0 ? Math.max(...firearms.map(f => f.id || 0)) + 1 : 1;
    firearms.push({ ...firearm, id: newId });
    this.saveFirearms(firearms);
    return newId;
  }

  updateFirearm(id, firearm) {
    const firearms = this.getFirearms();
    const index = firearms.findIndex(f => f.id === id);
    if (index !== -1) {
      firearms[index] = { ...firearm, id };
      this.saveFirearms(firearms);
    }
    return id;
  }

  deleteFirearm(id) {
    let firearms = this.getFirearms();
    firearms = firearms.filter(f => f.id !== id);
    this.saveFirearms(firearms);
    return id;
  }
  
  savePhoto(sourcePath, filename) {
    const destPath = path.join(this.photoDir, filename);
    try {
      if (fs.existsSync(sourcePath)) {
        fs.copyFileSync(sourcePath, destPath);
        return `file://${destPath}`;
      }
      return null;
    } catch (error) {
      console.error('Failed to save photo:', error);
      return null;
    }
  }
}

module.exports = new Database();
