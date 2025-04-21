/**

 * File database/index.js

 * Module untuk mengelola database bot

 */

import fs from 'fs';

import path from 'path';

import { fileURLToPath } from 'url';

import settings from '../setting.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const dbFolder = settings.databaseSettings.path;

// Memastikan folder database ada

if (!fs.existsSync(dbFolder)) {

  fs.mkdirSync(dbFolder, { recursive: true });

  console.log('Folder database dibuat');

}

// Template database

const databaseTemplates = {

  users: {},

  groups: {},

  chats: {},

  commands: {},

  settings: {

    botSettings: settings.botSettings,

    groupSettings: settings.groupSettings,

    timeSettings: settings.timeSettings

  }

};

// Fungsi untuk memastikan file database ada

const ensureFileExists = (filePath, template) => {

  try {

    if (!fs.existsSync(filePath)) {

      fs.writeFileSync(filePath, JSON.stringify(template, null, 2));

      console.log(`File database ${path.basename(filePath)} dibuat`);

    }

  } catch (error) {

    console.error(`Error membuat file database ${path.basename(filePath)}:`, error);

  }

};

// Buat semua file database jika belum ada

ensureFileExists(settings.databaseSettings.usersDb, databaseTemplates.users);

ensureFileExists(settings.databaseSettings.groupsDb, databaseTemplates.groups);

ensureFileExists(settings.databaseSettings.chatsDb, databaseTemplates.chats);

ensureFileExists(settings.databaseSettings.commandsDb, databaseTemplates.commands);

ensureFileExists(settings.databaseSettings.settingsDb, databaseTemplates.settings);

/**

 * Class Database untuk mengelola operasi CRUD database

 */

class Database {

  constructor(dbPath, template = {}) {

    this.path = dbPath;

    this.data = template;

    this.load();

  }

  // Load data dari file

  load() {

    try {

      const data = fs.readFileSync(this.path);

      this.data = JSON.parse(data);

    } catch (error) {

      console.error(`Error loading database ${path.basename(this.path)}:`, error);

      // Jika error, tulis template data

      this.save();

    }

    return this;

  }

  // Simpan data ke file

  save() {

    try {

      fs.writeFileSync(this.path, JSON.stringify(this.data, null, 2));

    } catch (error) {

      console.error(`Error saving database ${path.basename(this.path)}:`, error);

    }

    return this;

  }

  // Dapatkan semua data

  getAll() {

    return this.data;

  }

  // Dapatkan data berdasarkan ID

  get(id) {

    return this.data[id];

  }

  // Tambah/update data

  set(id, value) {

    this.data[id] = value;

    this.save();

    return this;

  }

  // Hapus data

  delete(id) {

    delete this.data[id];

    this.save();

    return this;

  }

  // Cek apakah ID ada

  has(id) {

    return this.data.hasOwnProperty(id);

  }

}

// Buat instance database

const usersDb = new Database(settings.databaseSettings.usersDb, databaseTemplates.users);

const groupsDb = new Database(settings.databaseSettings.groupsDb, databaseTemplates.groups);

const chatsDb = new Database(settings.databaseSettings.chatsDb, databaseTemplates.chats);

const commandsDb = new Database(settings.databaseSettings.commandsDb, databaseTemplates.commands);

const settingsDb = new Database(settings.databaseSettings.settingsDb, databaseTemplates.settings);

// Exports

export {

  usersDb,

  groupsDb,

  chatsDb,

  commandsDb,

  settingsDb

};

// Default export

export default {

  users: usersDb,

  groups: groupsDb,

  chats: chatsDb,

  commands: commandsDb,

  settings: settingsDb

};