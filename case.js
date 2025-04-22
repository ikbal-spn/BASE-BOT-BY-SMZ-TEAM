/**
 * File case.js
 * Berisi handler untuk semua perintah bot
 */

import settings from './setting.js';
import { userFunctions, groupFunctions, commandFunctions, storeFunctions } from './database/functions.js';
import fs from 'fs';

// Dapatkan prefix dari setting
const getPrefix = () => {
  const { prefixEnabled, customPrefix, defaultPrefix } = settings.botSettings;
  return prefixEnabled ? (customPrefix || defaultPrefix) : '';
};

// Function to calculate bot runtime
const getRuntime = () => {
  const uptime = process.uptime();
  const hours = Math.floor(uptime / 3600);
  const minutes = Math.floor((uptime % 3600) / 60);
  const seconds = Math.floor(uptime % 60);
  return `${hours}h ${minutes}m ${seconds}s`;
};

// Function to get current date in a nice format
const getDate = () => {
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  return new Date().toLocaleDateString('id-ID', options);
};

// Fungsi untuk membuat button
const createButtons = (buttons) => {
  return {
    buttonText: { displayText: '📋 Menu Buttons' },
    buttons: buttons.map((button, index) => ({
      buttonId: `id${index+1}`,
      buttonText: { displayText: button.displayText },
      type: 1
    })),
    headerType: 1
  };
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


  // Handle antilink in groups
  if (isGroup && command !== 'antilink') {
    try {
      const groupData = groupFunctions.getGroup(from);
      if (groupData && groupData.antilink) {
        // Check if message contains a link
        const isLinkRegex = /(https?:\/\/|www\.|chat\.whatsapp\.com)/gi;
        if (isLinkRegex.test(text)) {
          // Check if sender is an admin
          const groupMetadata = await sock.groupMetadata(from);
          const isAdmin = groupMetadata.participants.find(p => p.id === sender)?.admin;
          
          if (!isAdmin) {
            await sock.sendMessage(from, { 
              text: `❌ @${sender.split('@')[0]} terdeteksi mengirim link!\nLink akan dihapus karena antilink aktif!`,
              mentions: [sender]
            });
            
            // Delete the message
            await sock.sendMessage(from, { delete: msg.key });
            return;
          }
        }
      }
    } catch (error) {
      console.error('Error checking antilink:', error);
    }
  }
  
  // Tangani command dengan switch-case
  switch (command) {
    case 'ping':
      await sock.sendMessage(from, { text: '🏓 Pong!' }, { quoted: msg });
      break;
      
    case 'menu':
    case 'help':
      const userBalance = storeFunctions.getUserBalance(sender);
      const formattedBalance = storeFunctions.formatMoney(userBalance);
      
      const menuText = `*${settings.botInfo.name}* 🤖✨
━━━━━━━━━━━━━━━━━━━━━━━━

👋 *Hai @${sender.split('@')[0]}* 
✨ Selamat Datang di Bot Store Premium SMZ!

📆 *Tanggal:* ${getDate()}
⏱️ *Runtime:* ${getRuntime()}
💬 *Prefix:* ${prefix}
💰 *Saldo:* ${formattedBalance}

┌|  *MAIN MENU* 🧩
│ฅ ${prefix}ping - Cek koneksi bot
│ฅ ${prefix}menu - Tampilkan menu utama
│ฅ ${prefix}info - Informasi bot
│ฅ ${prefix}about - Tentang bot ini
└— ◦

┌|  *STORE MENU* 🛒
│ฅ ${prefix}cekmoney - Cek saldo Anda
│ฅ ${prefix}listproduk - Lihat daftar produk
│ฅ ${prefix}buyproduk [kode] - Beli produk
│ฅ ${prefix}deposit - Deposit saldo
│ฅ ${prefix}kirimbuktop - Kirim bukti pembayaran
└— ◦

┌|  *TOOLS MENU* 🛠️
│ฅ ${prefix}sticker - Buat sticker dari gambar
│ฅ ${prefix}owner - Info pemilik bot
└— ◦

┌|  *OWNER MENU* 👑
│ฅ ${prefix}setprefix - Ubah prefix bot
│ฅ ${prefix}mode - Ubah mode bot
│ฅ ${prefix}addmoney - Tambah saldo user
│ฅ ${prefix}addproduk - Tambah produk baru
│ฅ ${prefix}delproduk - Hapus produk
│ฅ ${prefix}bc - Broadcast pesan ke grup
│ฅ ${prefix}culikmember - Ambil member dari grup
└— ◦

© *SMZ STORE PREMIUM* 💎
_The Best WhatsApp Bot Service_`;

      await sock.sendMessage(from, { 
        text: menuText,
        mentions: [sender],
        footer: `${settings.botInfo.name} © ${new Date().getFullYear()} | Premium Store Bot`,
      }, { quoted: msg });
      break;
      
    case 'info':
      const infoMessage = `*${settings.botInfo.name} - INFO* 🤖
━━━━━━━━━━━━━━━━━━━━━━

🤖 *Nama Bot:* ${settings.botInfo.name}
👨‍💻 *Developer:* ${settings.ownerInfo.name}
🔮 *Version:* ${settings.botInfo.version}
⚙️ *Library:* Baileys
📊 *Mode:* ${isPublic ? 'Public' : 'Private'}
🔄 *Runtime:* ${getRuntime()}
📆 *Tanggal:* ${getDate()}
⏰ *Waktu:* ${new Date().toLocaleTimeString()}

*Fitur Premium* ✨
🔰 Store System
🔒 Anti Link Group
👥 Member Grabber
📢 Auto Broadcast
🌟 Dan masih banyak lagi!

Made with ❤️ by ${settings.ownerInfo.name}`;

      await sock.sendMessage(from, { text: infoMessage }, { quoted: msg });
      break;
      
    case 'about':
      await sock.sendMessage(from, { 
        text: `*ABOUT ${settings.botInfo.name}* 🤖
━━━━━━━━━━━━━━━━━━━━━━

${settings.botInfo.description}

🌟 Bot ini dibuat untuk mempermudah kegiatan jual beli produk digital dengan sistem otomatis.

📋 *Fitur utama:*
✅ Sistem saldo terintegrasi
✅ Manajemen produk otomatis
✅ Notifikasi pembelian realtime
✅ Sistem deposit mudah
✅ Keamanan grup dengan anti-link

📞 Untuk info lebih lanjut hubungi owner:
wa.me/${settings.ownerInfo.number}`
      }, { quoted: msg });
      break;
      
    case 'owner':
      await sock.sendMessage(from, { 
        text: `*OWNER ${settings.botInfo.name}* 👑
━━━━━━━━━━━━━━━━━━━━━━

👨‍💻 *Nama:* ${settings.ownerInfo.name}
📱 *Nomor:* wa.me/${settings.ownerInfo.number}
🔰 *Status:* Active

📝 Silahkan hubungi owner jika ada pertanyaan atau kendala dalam penggunaan bot.`
      }, { quoted: msg });
      break;
    
    // Command sticker (contoh fungsi sederhana)
    case 'sticker':
    case 's':
      await sock.sendMessage(from, { 
        text: '🎨 Fitur sticker sedang dalam pengembangan. Silakan coba lagi nanti.'
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
          text: `⚙️ Prefix saat ini: ${prefix}\nPenggunaan: ${prefix}setprefix [newprefix]` 
        }, { quoted: msg });
        break;
      }
      
      const newPrefix = args[0];
      try {
        // Simpan prefix baru ke database settings
        settings.botSettings.customPrefix = newPrefix;
        await sock.sendMessage(from, { 
          text: `✅ Prefix berhasil diubah menjadi: ${newPrefix}` 
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
          text: `⚙️ Mode saat ini: ${isPublic ? 'public' : 'private'}\nPenggunaan: ${prefix}mode [public/private]` 
        }, { quoted: msg });
        break;
      }
      
      const newMode = args[0] === 'public';
      try {
        // Simpan mode baru ke database settings
        settings.botSettings.public = newMode;
        await sock.sendMessage(from, { 
          text: `✅ Mode berhasil diubah menjadi: ${newMode ? 'public' : 'private'}` 
        }, { quoted: msg });
      } catch (error) {
        console.error('Error setting mode:', error);
        await sock.sendMessage(from, { 
          text: settings.defaultMessages.error 
        }, { quoted: msg });
      }
      break;
      
    // Fitur Store
    case 'addmoney':
      // Cek jika bukan owner
      if (!settings.isOwner(sender)) {
        await sock.sendMessage(from, { 
          text: settings.defaultMessages.ownerOnly 
        }, { quoted: msg });
        break;
      }
      
      if (args.length < 2) {
        await sock.sendMessage(from, { 
          text: `📝 Penggunaan: ${prefix}addmoney [nomor] [jumlah]` 
        }, { quoted: msg });
        break;
      }
      
      const targetNumber = args[0].replace(/[^0-9]/g, '');
      const amount = parseInt(args[1]);
      
      if (isNaN(amount) || amount <= 0) {
        await sock.sendMessage(from, { 
          text: '❌ Jumlah saldo harus berupa angka positif!' 
        }, { quoted: msg });
        break;
      }
      
      try {
        const userWaId = targetNumber.includes('@') ? targetNumber : `${targetNumber}@s.whatsapp.net`;
        const newBalance = storeFunctions.addUserBalance(userWaId, amount);
        const formattedNewBalance = storeFunctions.formatMoney(newBalance);
        
        await sock.sendMessage(from, { 
          text: `✅ Berhasil menambahkan ${storeFunctions.formatMoney(amount)} ke ${targetNumber}\n💰 Saldo sekarang: ${formattedNewBalance}` 
        }, { quoted: msg });
      } catch (error) {
        console.error('Error adding money:', error);
        await sock.sendMessage(from, { 
          text: settings.defaultMessages.error 
        }, { quoted: msg });
      }
      break;
      
    case 'addproduk':
      // Cek jika bukan owner
      if (!settings.isOwner(sender)) {
        await sock.sendMessage(from, { 
          text: settings.defaultMessages.ownerOnly 
        }, { quoted: msg });
        break;
      }
      
      if (args.length < 2) {
        await sock.sendMessage(from, { 
          text: `📝 Penggunaan: ${prefix}addproduk [nama] [harga]` 
        }, { quoted: msg });
        break;
      }
      
      const productName = args.slice(0, -1).join(' ');
      const productPrice = parseInt(args[args.length - 1]);
      
      if (isNaN(productPrice) || productPrice <= 0) {
        await sock.sendMessage(from, { 
          text: '❌ Harga produk harus berupa angka positif!' 
        }, { quoted: msg });
        break;
      }
      
      try {
        const product = storeFunctions.addProduct(productName, productPrice);
        await sock.sendMessage(from, { 
          text: `✅ *PRODUK BERHASIL DITAMBAHKAN!*

📝 *Detail Produk*
📦 *Nama:* ${product.name}
💲 *Harga:* ${storeFunctions.formatMoney(product.price)}
🔑 *Kode:* ${product.code}` 
        }, { quoted: msg });
      } catch (error) {
        console.error('Error adding product:', error);
        await sock.sendMessage(from, { 
          text: settings.defaultMessages.error 
        }, { quoted: msg });
      }
      break;
      
    // Fitur hapus produk (baru)
    case 'delproduk':
      // Cek jika bukan owner
      if (!settings.isOwner(sender)) {
        await sock.sendMessage(from, { 
          text: settings.defaultMessages.ownerOnly 
        }, { quoted: msg });
        break;
      }
      
      if (args.length < 1) {
        await sock.sendMessage(from, { 
          text: `📝 Penggunaan: ${prefix}delproduk [kode]` 
        }, { quoted: msg });
        break;
      }
      
      const productCodeToDelete = args[0].toUpperCase();
      
      try {
        // Tambahkan fungsi untuk menghapus produk ke storeFunctions
        const deleted = storeFunctions.deleteProduct(productCodeToDelete);
        
        if (deleted) {
          await sock.sendMessage(from, { 
            text: `✅ Produk dengan kode ${productCodeToDelete} berhasil dihapus!` 
          }, { quoted: msg });
        } else {
          await sock.sendMessage(from, { 
            text: `❌ Produk dengan kode ${productCodeToDelete} tidak ditemukan!` 
          }, { quoted: msg });
        }
      } catch (error) {
        console.error('Error deleting product:', error);
        await sock.sendMessage(from, { 
          text: settings.defaultMessages.error 
        }, { quoted: msg });
      }
      break;
      
    case 'cekmoney':
      const balance = storeFunctions.getUserBalance(sender);
      const formattedUserBalance = storeFunctions.formatMoney(balance);
      await sock.sendMessage(from, { 
        text: `💰 *INFORMASI SALDO*
        
👤 *User:* @${sender.split('@')[0]}
💵 *Saldo Anda:* ${formattedUserBalance}

Untuk deposit silahkan ketik ${prefix}deposit`,
        mentions: [sender]
      }, { quoted: msg });
      break;
      
    case 'listproduk':
      const products = storeFunctions.getAllProducts();
      
      if (Object.keys(products).length === 0) {
        await sock.sendMessage(from, { 
          text: '❌ Belum ada produk yang tersedia.' 
        }, { quoted: msg });
        break;
      }
      
      let productList = `*📋 DAFTAR PRODUK ${settings.botInfo.name}* 🛒
━━━━━━━━━━━━━━━━━━━━━━\n\n`;
      
      Object.values(products).forEach((product, index) => {
        productList += `*🛍️ Produk ${index + 1}*\n`;
        productList += `📦 *Nama:* ${product.name}\n`;
        productList += `💲 *Harga:* ${storeFunctions.formatMoney(product.price)}\n`;
        productList += `🔑 *Kode:* ${product.code}\n\n`;
      });
      
      productList += `Untuk membeli produk ketik: ${prefix}buyproduk [kode]`;
      
      await sock.sendMessage(from, { 
        text: productList 
      }, { quoted: msg });
      break;
      
    case 'buyproduk':
      if (args.length < 1) {
        await sock.sendMessage(from, { 
          text: `📝 Penggunaan: ${prefix}buyproduk [kode]` 
        }, { quoted: msg });
        break;
      }
      
      const productCode = args[0].toUpperCase();
      const product = storeFunctions.getProduct(productCode);
      
      if (!product) {
        await sock.sendMessage(from, { 
          text: settings.defaultMessages.productNotFound 
        }, { quoted: msg });
        break;
      }
      
      const userCurrentBalance = storeFunctions.getUserBalance(sender);
      
      if (userCurrentBalance < product.price) {
        await sock.sendMessage(from, { 
          text: settings.defaultMessages.insufficientBalance 
        }, { quoted: msg });
        break;
      }
      
      try {
        // Kurangi saldo user
        const newUserBalance = storeFunctions.reduceUserBalance(sender, product.price);
        
        if (newUserBalance === false) {
          await sock.sendMessage(from, { 
            text: settings.defaultMessages.insufficientBalance 
          }, { quoted: msg });
          break;
        }
        
        // Kirim notifikasi ke pembeli
        await sock.sendMessage(from, { 
          text: `✅ *PEMBELIAN BERHASIL* 🎉
          
📦 *Produk:* ${product.name}
💲 *Harga:* ${storeFunctions.formatMoney(product.price)}
💰 *Sisa saldo:* ${storeFunctions.formatMoney(newUserBalance)}

Pesanan Anda sedang diproses oleh admin.
Terima kasih telah berbelanja di ${settings.botInfo.name}! 🙏` 
        }, { quoted: msg });
        
        // Kirim notifikasi ke owner
        const ownerJid = `${settings.ownerInfo.number}@s.whatsapp.net`;
        await sock.sendMessage(ownerJid, { 
          text: `📢 *NOTIFIKASI PEMBELIAN BARU* 🛒

👤 *Pembeli:* ${pushName} (${sender.split('@')[0]})
📦 *Produk:* ${product.name}
💲 *Harga:* ${storeFunctions.formatMoney(product.price)}
🔑 *Kode:* ${product.code}

Mohon segera diproses! ⚡` 
        });
      } catch (error) {
        console.error('Error processing purchase:', error);
        await sock.sendMessage(from, { 
          text: settings.defaultMessages.error 
        }, { quoted: msg });
      }
      break;
      
   case 'deposit':
      try {
        const depositMessage = `*DEPOSIT SALDO*\n\nScan QRIS di bawah untuk melakukan deposit saldo:\n`;
        
        await sock.sendMessage(from, { 
          image: { url: settings.storeSettings.qrisImage },
          caption: depositMessage + settings.storeSettings.paymentInstructions.join('\n')
        }, { quoted: msg });
      } catch (error) {
        console.error('Error sending deposit info:', error);
        await sock.sendMessage(from, { 
          text: settings.defaultMessages.error 
        }, { quoted: msg });
      }
      break; 
      
    case 'kirimbuktop':
      try {
        await sock.sendMessage(from, { 
          text: `*📤 KIRIM BUKTI PEMBAYARAN* 📝
          
Silakan kirim foto bukti pembayaran Anda.
Admin akan segera memproses deposit Anda.

Terima kasih 🙏` 
        }, { quoted: msg });
        
        // Kirim notifikasi ke owner
        const ownerJid = `${settings.ownerInfo.number}@s.whatsapp.net`;
        await sock.sendMessage(ownerJid, { 
          text: `📢 *NOTIFIKASI DEPOSIT* 💰

👤 *User:* ${pushName} (${sender.split('@')[0]}) telah meminta deposit.

Mohon cek bukti pembayaran yang akan dikirimkan. 📝` 
        });
      } catch (error) {
        console.error('Error processing deposit:', error);
        await sock.sendMessage(from, { 
          text: settings.defaultMessages.error 
        }, { quoted: msg });
      }
      break;
  
  case 'antilink':
  // Cek jika bukan admin grup
  try {
    if (!isGroup) {
      await sock.sendMessage(from, { 
        text: '❌ Fitur ini hanya bisa digunakan di dalam grup!' 
      }, { quoted: msg });
      break;
    }
    
    // Check if sender is an admin
    const groupMetadata = await sock.groupMetadata(from);
    const isAdmin = groupMetadata.participants.find(p => p.id === sender)?.admin;
    
    if (!isAdmin) {
      await sock.sendMessage(from, { 
        text: '❌ Fitur ini hanya bisa digunakan oleh admin grup!' 
      }, { quoted: msg });
      break;
    }
    
    if (!args[0]) {
      const groupData = groupFunctions.getGroup(from);
      const status = groupData && groupData.antilink ? 'aktif' : 'nonaktif';
      await sock.sendMessage(from, { 
        text: `⚙️ Status antilink saat ini: ${status}\nPenggunaan: ${prefix}antilink [on/off]` 
      }, { quoted: msg });
      break;
    }
    
    const option = args[0].toLowerCase();
    
    if (option !== 'on' && option !== 'off') {
      await sock.sendMessage(from, { 
        text: `📝 Penggunaan: ${prefix}antilink [on/off]` 
      }, { quoted: msg });
      break;
    }
    
    const antilinkStatus = option === 'on';
    
    // Update group settings
    groupFunctions.updateGroup(from, { antilink: antilinkStatus });
    
    await sock.sendMessage(from, { 
      text: `✅ Fitur antilink berhasil ${antilinkStatus ? 'diaktifkan' : 'dinonaktifkan'}!` 
    }, { quoted: msg });
  } catch (error) {
    console.error('Error processing antilink:', error);
    await sock.sendMessage(from, { 
      text: settings.defaultMessages.error 
    }, { quoted: msg });
  }
  break;
  
  case 'bc':
  // Cek jika bukan owner
  if (!settings.isOwner(sender)) {
    await sock.sendMessage(from, { 
      text: settings.defaultMessages.ownerOnly 
    }, { quoted: msg });
    break;
  }
  
  if (args.length < 3) {
    await sock.sendMessage(from, { 
      text: `📝 Penggunaan: ${prefix}bc [text] [jeda dalam detik] [link grup]` 
    }, { quoted: msg });
    break;
  }
  
  try {
    // Ambil jeda dan link grup dari args
    // Format: .bc [text] [jeda] [link]
    const bcText = args.slice(0, -2).join(' ');
    const delaySeconds = parseInt(args[args.length - 2]);
    const groupLink = args[args.length - 1];
    
    if (isNaN(delaySeconds) || delaySeconds <= 0) {
      await sock.sendMessage(from, { 
        text: '❌ Jeda harus berupa angka positif!' 
      }, { quoted: msg });
      break;
    }
    
    if (!groupLink || !groupLink.includes('https://chat.whatsapp.com/')) {
      await sock.sendMessage(from, { 
        text: '❌ Link grup tidak valid!' 
      }, { quoted: msg });
      break;
    }
    
    // Extract code from link
    const groupCode = groupLink.split('https://chat.whatsapp.com/')[1];
    if (!groupCode) {
      await sock.sendMessage(from, { 
        text: '❌ Link grup tidak valid!' 
      }, { quoted: msg });
      break;
    }
    
    // Join group first
    await sock.sendMessage(from, { 
      text: '⏳ Memproses broadcast...' 
    }, { quoted: msg });
    
    try {
      const joinResult = await sock.groupAcceptInvite(groupCode);
      
      if (!joinResult) {
        await sock.sendMessage(from, { 
          text: '❌ Gagal masuk ke grup target!' 
        }, { quoted: msg });
        break;
      }
      
      // Get group metadata
      const targetGroupMeta = await sock.groupMetadata(joinResult);
      const memberCount = targetGroupMeta.participants.length;
      
      await sock.sendMessage(from, { 
        text: `✅ Berhasil masuk ke grup target!\n👥 Jumlah member: ${memberCount}\n⏳ Memulai proses broadcast...` 
      }, { quoted: msg });
      
      // Start broadcasting
      let successCount = 0;
      let failCount = 0;
      
      const broadcastPromise = new Promise(async (resolve) => {
        for (let i = 0; i < targetGroupMeta.participants.length; i++) {
          const participant = targetGroupMeta.participants[i];
          const botId = sock.user.id.replace(/:[0-9]+@/, '@');
          
          // Don't send to the bot itself
          if (participant.id === botId) continue;
          
          try {
            // Send the broadcast message
            await sock.sendMessage(participant.id, { 
              text: `*BROADCAST MESSAGE*\n\n${bcText}\n\n_Pesan ini dikirim oleh ${settings.botInfo.name}_` 
            });
            
            successCount++;
            
            // Send progress update every 5 successful sends
            if (successCount % 5 === 0) {
              await sock.sendMessage(from, { 
                text: `⏳ Progress: ${successCount}/${memberCount} pesan berhasil dikirim` 
              });
            }
          } catch (error) {
            failCount++;
            console.error(`Failed to send message to ${participant.id}:`, error);
          }
          
          // Apply delay between sends
          if (i < targetGroupMeta.participants.length - 1) {
            await new Promise(r => setTimeout(r, delaySeconds * 1000));
          }
        }
        
        resolve();
      });
      
      // Set timeout for the entire operation (30 minutes max)
      const timeoutPromise = new Promise((resolve) => {
        setTimeout(() => {
          resolve();
        }, 30 * 60 * 1000);
      });
      
      // Wait for either completion or timeout
      await Promise.race([broadcastPromise, timeoutPromise]);
      
      // Send final report
      await sock.sendMessage(from, { 
        text: `✅ *LAPORAN BROADCAST*\n\n👥 Total target: ${memberCount}\n✅ Berhasil dikirim: ${successCount}\n❌ Gagal dikirim: ${failCount}\n\n_Note: Pesan yang gagal dikirim mungkin karena privasi atau pengguna telah memblokir bot._` 
      }, { quoted: msg });
      
      // Leave target group
      await sock.groupLeave(joinResult);
      
    } catch (error) {
      console.error('Error in broadcast:', error);
      await sock.sendMessage(from, { 
        text: '❌ Terjadi kesalahan saat menjalankan fitur broadcast!' 
      }, { quoted: msg });
      
      // Try to leave the target group if there was an error
      try {
        const joinResult = groupLink.split('https://chat.whatsapp.com/')[1];
        if (joinResult) {
          await sock.groupLeave(joinResult);
        }
      } catch (leaveError) {
        console.error('Error leaving group:', leaveError);
      }
    }
  } catch (error) {
    console.error('Error processing broadcast:', error);
    await sock.sendMessage(from, { 
      text: settings.defaultMessages.error 
    }, { quoted: msg });
  }
  break;
      
 
            
    // Fitur Culik Member
   case 'culikmember':
  // Cek jika bukan owner
  if (!settings.isOwner(sender)) {
    await sock.sendMessage(from, { 
      text: settings.defaultMessages.ownerOnly 
    }, { quoted: msg });
    break;
  }
  
  if (!isGroup) {
    await sock.sendMessage(from, { 
      text: '❌ Fitur ini hanya bisa digunakan di dalam grup!' 
    }, { quoted: msg });
    break;
  }
  
  if (args.length < 2) {
    await sock.sendMessage(from, { 
      text: `📝 Penggunaan: ${prefix}culikmember [link grup target] [jeda]` 
    }, { quoted: msg });
    break;
  }
  
  try {
    const targetLink = args[0];
    const delaySeconds = parseInt(args[1]);
    
    if (isNaN(delaySeconds) || delaySeconds <= 0) {
      await sock.sendMessage(from, { 
        text: '❌ Jeda harus berupa angka positif!' 
      }, { quoted: msg });
      break;
    }
    
    if (!targetLink || !targetLink.includes('https://chat.whatsapp.com/')) {
      await sock.sendMessage(from, { 
        text: '❌ Link grup tidak valid!' 
      }, { quoted: msg });
      break;
    }
    
    // Extract code from link
    const groupCode = targetLink.split('https://chat.whatsapp.com/')[1];
    if (!groupCode) {
      await sock.sendMessage(from, { 
        text: '❌ Link grup tidak valid!' 
      }, { quoted: msg });
      break;
    }
    
    // Join group first
    await sock.sendMessage(from, { 
      text: '⏳ Memproses pengambilan member...' 
    }, { quoted: msg });
    
    try {
      const joinResult = await sock.groupAcceptInvite(groupCode);
      
      if (!joinResult) {
        await sock.sendMessage(from, { 
          text: '❌ Gagal masuk ke grup target!' 
        }, { quoted: msg });
        break;
      }
      
      // Get group metadata
      const targetGroupMeta = await sock.groupMetadata(joinResult);
      const memberCount = targetGroupMeta.participants.length;
      
      await sock.sendMessage(from, { 
        text: `✅ Berhasil masuk ke grup target!\n👥 Jumlah member: ${memberCount}\n⏳ Memulai proses pengambilan member...` 
      }, { quoted: msg });
      
      // Get current group metadata to check if bot is admin
      const currentGroupMeta = await sock.groupMetadata(from);
      const botId = sock.user.id.replace(/:[0-9]+@/, '@');
      const isBotAdmin = currentGroupMeta.participants.find(p => p.id === botId)?.admin;
      
      if (!isBotAdmin) {
        await sock.sendMessage(from, { 
          text: '❌ Bot harus menjadi admin di grup ini untuk menambahkan member!' 
        }, { quoted: msg });
        
        // Leave target group
        await sock.groupLeave(joinResult);
        break;
      }
      
      // Start adding members
      let successCount = 0;
      let failCount = 0;
      
      const addMemberPromise = new Promise(async (resolve) => {
        for (let i = 0; i < targetGroupMeta.participants.length; i++) {
          const participant = targetGroupMeta.participants[i];
          
          // Don't add the bot itself
          if (participant.id === botId) continue;
          
          try {
            // Try to add participant
            await sock.groupParticipantsUpdate(
              from,
              [participant.id],
              "add"
            );
            
            successCount++;
            
            // Send progress update every 5 successful adds
            if (successCount % 5 === 0) {
              await sock.sendMessage(from, { 
                text: `⏳ Progress: ${successCount}/${memberCount} member berhasil ditambahkan` 
              });
            }
          } catch (error) {
            failCount++;
            console.error(`Failed to add member ${participant.id}:`, error);
          }
          
          // Apply delay between adds
          if (i < targetGroupMeta.participants.length - 1) {
            await new Promise(r => setTimeout(r, delaySeconds * 1000));
          }
        }
        
        resolve();
      });
      
      // Set timeout for the entire operation (30 minutes max)
      const timeoutPromise = new Promise((resolve) => {
        setTimeout(() => {
          resolve();
        }, 30 * 60 * 1000);
      });
      
      // Wait for either completion or timeout
      await Promise.race([addMemberPromise, timeoutPromise]);
      
      // Send final report
      await sock.sendMessage(from, { 
        text: `✅ *LAPORAN PENGAMBILAN MEMBER*\n\n👥 Total member target: ${memberCount}\n✅ Berhasil ditambahkan: ${successCount}\n❌ Gagal ditambahkan: ${failCount}\n\n_Note: Member yang gagal ditambahkan mungkin karena privasi grup atau pembatasan dari WhatsApp._` 
      }, { quoted: msg });
      
      // Leave target group
      await sock.groupLeave(joinResult);
      
    } catch (error) {
      console.error('Error in culikmember:', error);
      await sock.sendMessage(from, { 
        text: '❌ Terjadi kesalahan saat menjalankan fitur culikmember!' 
      }, { quoted: msg });
      
      // Try to leave the target group if there was an error
      try {
        const joinResult = targetLink.split('https://chat.whatsapp.com/')[1];
        if (joinResult) {
          await sock.groupLeave(joinResult);
        }
      } catch (leaveError) {
        console.error('Error leaving group:', leaveError);
      }
    }
  } catch (error) {
    console.error('Error processing culikmember:', error);
    await sock.sendMessage(from, { 
      text: settings.defaultMessages.error 
    }, { quoted: msg });
  }
  break;
// Case untuk semua command yang tidak dikenali
default:
  // Jika command tidak ditemukan, tidak perlu memberikan respons
  break;
          }
    }