/**

 * File case.js

 * Berisi handler untuk semua perintah bot

 */

import settings from './setting.js';

import { userFunctions, groupFunctions, commandFunctions } from './database/functions.js';

// Dapatkan prefix dari setting

const getPrefix = () => {

  const { prefixEnabled, customPrefix, defaultPrefix } = settings.botSettings;

  return prefixEnabled ? (customPrefix || defaultPrefix) : '';

};

// Fungsi untuk handle command menggunakan switch-case

export async function handleCommand(sock, msg, text) {

  // Dapatkan informasi penting dari pesan

  const from = msg.key.remoteJid;

  const isGroup = from.endsWith('@g.us');

  const sender = isGroup ? msg.key.participant : from;

  const pushName = msg.pushName || 'User';

  

  // Ambil prefix dari setting

  const prefix = getPrefix();

  const isPublic = settings.isPublic();

  

  // Periksa apakah pesan adalah command (diawali dengan prefix)

  if (!text.startsWith(prefix)) return; // Bukan command, abaikan

  

  // Periksa apakah bot dalam mode private dan pengirim bukan owner

  if (!isPublic && !settings.isOwner(sender)) {

    await sock.sendMessage(from, { 

      text: settings.defaultMessages.ownerOnly 

    }, { quoted: msg });

    return;

  }

  

  // Parse command

  const command = text.slice(prefix.length).trim().split(/ +/).shift().toLowerCase();

  const args = text.slice(prefix.length).trim().split(/ +/).slice(1);

  const q = args.join(' ');

  

  // Log penggunaan command

  try {

    commandFunctions.logCommand(command, sender);

  } catch (error) {

    console.error('Error logging command:', error);

  }

  

  // Tangani command dengan switch-case

  switch (command) {

    case 'ping':

      await sock.sendMessage(from, { text: 'Pong!' }, { quoted: msg });

      break;

      

    case 'menu':

    case 'help':

      const menuText = `*${settings.botInfo.name} - MENU*

      

*Info Bot*

Nama: ${settings.botInfo.name}

Version: ${settings.botInfo.version}

Prefix: ${prefix}

Mode: ${isPublic ? 'Public' : 'Private'}

*Main Menu*

${prefix}ping - Cek koneksi bot

${prefix}menu - Menampilkan menu ini

${prefix}info - Informasi bot

*Owner Commands*

${prefix}setprefix - Ubah prefix bot

${prefix}mode - Ubah mode bot (public/private)

*Tools*

${prefix}sticker - Buat sticker dari gambar/video

${prefix}owner - Info pemilik bot

*Other*

${prefix}about - Tentang bot ini

`;

      await sock.sendMessage(from, { text: menuText }, { quoted: msg });

      break;

      

    case 'info':

      const infoMessage = `*INFO BOT*

🤖 Nama: ${settings.botInfo.name}

👨‍💻 Dibuat dengan: Baileys Library

🧠 Version: ${settings.botInfo.version}

🔮 Owner: ${settings.ownerInfo.name}

📅 Tanggal: ${new Date().toLocaleDateString()}

⏰ Waktu: ${new Date().toLocaleTimeString()}

`;

      await sock.sendMessage(from, { text: infoMessage }, { quoted: msg });

      break;

      

    case 'about':

      await sock.sendMessage(from, { 

        text: settings.botInfo.description

      }, { quoted: msg });

      break;

      

    case 'owner':

      await sock.sendMessage(from, { 

        text: `👨‍💻 Owner Bot: ${settings.ownerInfo.name}\n📱 Nomor: wa.me/${settings.ownerInfo.number}`

      }, { quoted: msg });

      break;

    // Command sticker (contoh fungsi sederhana)

    case 'sticker':

    case 's':

      await sock.sendMessage(from, { 

        text: 'Fitur sticker sedang dalam pengembangan. Silakan coba lagi nanti.'

      }, { quoted: msg });

      break;

    

    // Command untuk owner

    case 'setprefix':

      // Cek jika bukan owner

      if (!settings.isOwner(sender)) {

        await sock.sendMessage(from, { 

          text: settings.defaultMessages.ownerOnly 

        }, { quoted: msg });

        break;

      }

      

      if (!args[0]) {

        await sock.sendMessage(from, { 

          text: `Prefix saat ini: ${prefix}\nPenggunaan: ${prefix}setprefix [newprefix]` 

        }, { quoted: msg });

        break;

      }

      

      const newPrefix = args[0];

      try {

        // Simpan prefix baru ke database settings

        settings.botSettings.customPrefix = newPrefix;

        await sock.sendMessage(from, { 

          text: `Prefix berhasil diubah menjadi: ${newPrefix}` 

        }, { quoted: msg });

      } catch (error) {

        console.error('Error setting prefix:', error);

        await sock.sendMessage(from, { 

          text: settings.defaultMessages.error 

        }, { quoted: msg });

      }

      break;

    

    case 'mode':

      // Cek jika bukan owner

      if (!settings.isOwner(sender)) {

        await sock.sendMessage(from, { 

          text: settings.defaultMessages.ownerOnly 

        }, { quoted: msg });

        break;

      }

      

      if (!args[0] || (args[0] !== 'public' && args[0] !== 'private')) {

        await sock.sendMessage(from, { 

          text: `Mode saat ini: ${isPublic ? 'public' : 'private'}\nPenggunaan: ${prefix}mode [public/private]` 

        }, { quoted: msg });

        break;

      }

      

      const newMode = args[0] === 'public';

      try {

        // Simpan mode baru ke database settings

        settings.botSettings.public = newMode;

        await sock.sendMessage(from, { 

          text: `Mode berhasil diubah menjadi: ${newMode ? 'public' : 'private'}` 

        }, { quoted: msg });

      } catch (error) {

        console.error('Error setting mode:', error);

        await sock.sendMessage(from, { 

          text: settings.defaultMessages.error 

        }, { quoted: msg });

      }

      break;

      

    default:

      // Jika command tidak dikenali

      await sock.sendMessage(from, { 

        text: `Command *${prefix}${command}* tidak dikenali. Ketik *${prefix}menu* untuk melihat daftar perintah.`

      }, { quoted: msg });

      break;

  }

}