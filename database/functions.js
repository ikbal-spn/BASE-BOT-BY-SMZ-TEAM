/**

 * File database/functions.js

 * Fungsi-fungsi untuk bekerja dengan database

 */

import db from './index.js';

import settings from '../setting.js';

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

// Exports

export {

  userFunctions,

  groupFunctions,

  commandFunctions,

  settingsFunctions

};

// Default export

export default {

  user: userFunctions,

  group: groupFunctions,

  command: commandFunctions,

  settings: settingsFunctions

};