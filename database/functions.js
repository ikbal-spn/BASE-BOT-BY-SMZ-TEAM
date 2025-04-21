/**
 * File database/functions.js
 * Fungsi-fungsi untuk bekerja dengan database
 */

import db from './index.js';
import settings from '../setting.js';
import fs from 'fs';

/**
 * User Functions
 */
const userFunctions = {
  // Cek apakah user terdaftar
  isRegistered: (userId) => {
    return db.users.has(userId);
  },
  
  // Daftarkan user baru
  register: (userId, name, extraData = {}) => {
    if (db.users.has(userId)) return false;
    
    db.users.set(userId, {
      id: userId,
      name: name,
      registeredAt: new Date().toISOString(),
      limit: 20,
      premium: false,
      banned: false,
      ...extraData
    });
    
    return true;
  },
  
  // Dapatkan data user
  getUser: (userId) => {
    if (!db.users.has(userId)) return null;
    return db.users.get(userId);
  },
  
  // Update data user
  updateUser: (userId, data) => {
    if (!db.users.has(userId)) return false;
    
    const user = db.users.get(userId);
    db.users.set(userId, {
      ...user,
      ...data
    });
    
    return true;
  },
  
  // Ban user
  banUser: (userId) => {
    if (!db.users.has(userId)) return false;
    
    const user = db.users.get(userId);
    db.users.set(userId, {
      ...user,
      banned: true
    });
    
    return true;
  },
  
  // Unban user
  unbanUser: (userId) => {
    if (!db.users.has(userId)) return false;
    
    const user = db.users.get(userId);
    db.users.set(userId, {
      ...user,
      banned: false
    });
    
    return true;
  }
};

/**
 * Group Functions
 */
const groupFunctions = {
  // Cek apakah group terdaftar
  isRegistered: (groupId) => {
    return db.groups.has(groupId);
  },
  
  // Daftarkan group baru
  register: (groupId, name, extraData = {}) => {
    if (db.groups.has(groupId)) return false;
    
    db.groups.set(groupId, {
      id: groupId,
      name: name,
      registeredAt: new Date().toISOString(),
      welcome: settings.groupSettings.welcome,
      leave: settings.groupSettings.leave,
      antilink: settings.groupSettings.antiLink,
      antitoxic: settings.groupSettings.antiToxic,
      nsfw: false,
      ...extraData
    });
    
    return true;
  },
  
  // Dapatkan data group
  getGroup: (groupId) => {
    if (!db.groups.has(groupId)) return null;
    return db.groups.get(groupId);
  },
  
  // Update data group
  updateGroup: (groupId, data) => {
    if (!db.groups.has(groupId)) return false;
    
    const group = db.groups.get(groupId);
    db.groups.set(groupId, {
      ...group,
      ...data
    });
    
    return true;
  }
};

/**
 * Command Functions
 */
const commandFunctions = {
  // Catat penggunaan command
  logCommand: (command, userId, success = true) => {
    const commandData = db.commands.get(command) || { 
      count: 0, 
      success: 0, 
      failed: 0, 
      users: {} 
    };
    
    // Update statistik command
    commandData.count += 1;
    if (success) {
      commandData.success += 1;
    } else {
      commandData.failed += 1;
    }
    
    // Update penggunaan user
    if (!commandData.users[userId]) {
      commandData.users[userId] = 0;
    }
    commandData.users[userId] += 1;
    
    // Simpan ke database
    db.commands.set(command, commandData);
    
    return commandData;
  },
  
  // Dapatkan statistik command
  getCommandStats: (command) => {
    if (!db.commands.has(command)) return null;
    return db.commands.get(command);
  },
  
  // Dapatkan semua statistik command
  getAllCommandStats: () => {
    return db.commands.getAll();
  }
};

// Settings Functions
const settingsFunctions = {
  // Get setting value
  get: (category, key) => {
    const settingsData = db.settings.getAll();
    if (!settingsData[category]) return null;
    return settingsData[category][key];
  },
  
  // Update setting value
  update: (category, key, value) => {
    const settingsData = db.settings.getAll();
    if (!settingsData[category]) {
      settingsData[category] = {};
    }
    
    settingsData[category][key] = value;
    db.settings.set(category, settingsData[category]);
    
    return true;
  },
  
  // Reset settings to default
  reset: () => {
    db.settings.set('botSettings', settings.botSettings);
    db.settings.set('groupSettings', settings.groupSettings);
    db.settings.set('timeSettings', settings.timeSettings);
    
    return true;
  }
};

/**
 * Store Functions
 */
const storeFunctions = {
  // Cek saldo user
  getUserBalance: (userId) => {
    if (!db.store.has('userBalance')) {
      db.store.set('userBalance', {});
    }
    
    const balanceData = db.store.get('userBalance');
    return balanceData[userId] || 0;
  },
  
  // Tambah saldo user
  addUserBalance: (userId, amount) => {
    if (!db.store.has('userBalance')) {
      db.store.set('userBalance', {});
    }
    
    const balanceData = db.store.get('userBalance');
    const currentBalance = balanceData[userId] || 0;
    balanceData[userId] = currentBalance + parseInt(amount);
    
    db.store.set('userBalance', balanceData);
    return balanceData[userId];
  },
  
  // Kurangi saldo user
  reduceUserBalance: (userId, amount) => {
    if (!db.store.has('userBalance')) {
      db.store.set('userBalance', {});
    }
    
    const balanceData = db.store.get('userBalance');
    const currentBalance = balanceData[userId] || 0;
    
    if (currentBalance < amount) {
      return false; // Saldo tidak cukup
    }
    
    balanceData[userId] = currentBalance - parseInt(amount);
    db.store.set('userBalance', balanceData);
    return balanceData[userId];
  },
  
  // Format saldo sebagai Rupiah
  formatMoney: (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  },
  
  // Generate kode produk acak
  generateProductCode: () => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let result = '';
    for (let i = 0; i < 3; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  },
  
  // Tambah produk baru
  addProduct: (name, price) => {
    if (!db.store.has('products')) {
      db.store.set('products', {});
    }
    
    const products = db.store.get('products');
    const code = storeFunctions.generateProductCode();
    
    products[code] = {
      name: name,
      price: parseInt(price),
      code: code
    };
    
    db.store.set('products', products);
    return products[code];
  },
  
  // Dapatkan semua produk
  getAllProducts: () => {
    if (!db.store.has('products')) {
      db.store.set('products', {});
    }
    
    return db.store.get('products');
  },
  
  // Dapatkan produk berdasarkan kode
  getProduct: (code) => {
    if (!db.store.has('products')) {
      return null;
    }
    
    const products = db.store.get('products');
    return products[code] || null;
  }
};

// Exports
export {
  userFunctions,
  groupFunctions,
  commandFunctions,
  settingsFunctions,
  storeFunctions
};

// Default export
export default {
  user: userFunctions,
  group: groupFunctions,
  command: commandFunctions,
  settings: settingsFunctions,
  store: storeFunctions
};
