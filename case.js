/**
 * File case.js
 * Berisi handler untuk semua perintah bot
 */

import settings from './setting.js';
import { userFunctions, groupFunctions, commandFunctions, storeFunctions } from './database/functions.js';

// Dapatkan prefix dari setting
const getPrefix = () => {
  const { prefixEnabled, customPrefix, defaultPrefix } = settings.botSettings;
  return prefixEnabled ? (customPrefix || defaultPrefix) : '';
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
  
  // Tangani command dengan switch-case
  switch (command) {
    case 'ping':
      await sock.sendMessage(from, { text: 'Pong!' }, { quoted: msg });
      break;
      
    case 'menu':
    case 'help':
      const userBalance = storeFunctions.getUserBalance(sender);
      const formattedBalance = storeFunctions.formatMoney(userBalance);
      
      const menuText = `*${settings.botInfo.name} - MENU*
      
*Info Bot*
Nama: ${settings.botInfo.name}
Version: ${settings.botInfo.version}
Prefix: ${prefix}
Mode: ${isPublic ? 'Public' : 'Private'}
Saldo Anda: ${formattedBalance}

*Main Menu*
${prefix}ping - Cek koneksi bot
${prefix}menu - Menampilkan menu ini
${prefix}info - Informasi bot

*Store Menu*
${prefix}cekmoney - Cek saldo Anda
${prefix}listproduk - Lihat daftar produk
${prefix}buyproduk [kode] - Beli produk
${prefix}deposit - Deposit saldo
${prefix}kirimbuktop - Kirim bukti pembayaran

*Owner Commands*
${prefix}setprefix - Ubah prefix bot
${prefix}mode - Ubah mode bot (public/private)
${prefix}addmoney [nomor] [jumlah] - Tambah saldo user
${prefix}addproduk [nama] [harga] - Tambah produk baru

*Tools*
${prefix}sticker - Buat sticker dari gambar/video
${prefix}owner - Info pemilik bot

*Other*
${prefix}about - Tentang bot ini
`;

      // Buat tombol untuk menu
      const templateButtons = [
        { index: 1, urlButton: { displayText: `${prefix}cekmoney`, url: `https://wa.me/${settings.ownerInfo.number}?text=${encodeURIComponent(prefix + 'cekmoney')}` } },
        { index: 2, urlButton: { displayText: `${prefix}deposit`, url: `https://wa.me/${settings.ownerInfo.number}?text=${encodeURIComponent(prefix + 'deposit')}` } },
        { index: 3, urlButton: { displayText: `${prefix}listproduk`, url: `https://wa.me/${settings.ownerInfo.number}?text=${encodeURIComponent(prefix + 'listproduk')}` } },
        { index: 4, urlButton: { displayText: `${prefix}owner`, url: `https://wa.me/${settings.ownerInfo.number}?text=${encodeURIComponent(prefix + 'owner')}` } }
      ];

      await sock.sendMessage(from, { 
        text: menuText,
        footer: `${settings.botInfo.name} © ${new Date().getFullYear()}`,
        templateButtons: templateButtons
      }, { quoted: msg });
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
          text: `Penggunaan: ${prefix}addmoney [nomor] [jumlah]` 
        }, { quoted: msg });
        break;
      }
      
      const targetNumber = args[0].replace(/[^0-9]/g, '');
      const amount = parseInt(args[1]);
      
      if (isNaN(amount) || amount <= 0) {
        await sock.sendMessage(from, { 
          text: 'Jumlah saldo harus berupa angka positif!' 
        }, { quoted: msg });
        break;
      }
      
      try {
        const userWaId = targetNumber.includes('@') ? targetNumber : `${targetNumber}@s.whatsapp.net`;
        const newBalance = storeFunctions.addUserBalance(userWaId, amount);
        const formattedNewBalance = storeFunctions.formatMoney(newBalance);
        
        await sock.sendMessage(from, { 
          text: `Berhasil menambahkan ${storeFunctions.formatMoney(amount)} ke ${targetNumber}\nSaldo sekarang: ${formattedNewBalance}` 
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
          text: `Penggunaan: ${prefix}addproduk [nama] [harga]` 
        }, { quoted: msg });
        break;
      }
      
      const productName = args.slice(0, -1).join(' ');
      const productPrice = parseInt(args[args.length - 1]);
      
      if (isNaN(productPrice) || productPrice <= 0) {
        await sock.sendMessage(from, { 
          text: 'Harga produk harus berupa angka positif!' 
        }, { quoted: msg });
        break;
      }
      
      try {
        const product = storeFunctions.addProduct(productName, productPrice);
        await sock.sendMessage(from, { 
          text: `✅ Produk berhasil ditambahkan!\n\nNama: ${product.name}\nHarga: ${storeFunctions.formatMoney(product.price)}\nKode: ${product.code}` 
        }, { quoted: msg });
      } catch (error) {
        console.error('Error adding product:', error);
        await sock.sendMessage(from, { 
          text: settings.defaultMessages.error 
        }, { quoted: msg });
      }
      break;
      
    case 'cekmoney':
      const balance = storeFunctions.getUserBalance(sender);
      const formattedUserBalance = storeFunctions.formatMoney(balance);
      await sock.sendMessage(from, { 
        text: `💰 Saldo Anda: ${formattedUserBalance}` 
      }, { quoted: msg });
      break;
      
    case 'listproduk':
      const products = storeFunctions.getAllProducts();
      
      if (Object.keys(products).length === 0) {
        await sock.sendMessage(from, { 
          text: 'Belum ada produk yang tersedia.' 
        }, { quoted: msg });
        break;
      }
      
      let productList = '*DAFTAR PRODUK*\n\n';
      Object.values(products).forEach((product, index) => {
        productList += `*Produk ${index + 1}*\n`;
        productList += `Nama produk : ${product.name}\n`;
        productList += `Harga       : ${storeFunctions.formatMoney(product.price)}\n`;
        productList += `Kode produk : ${product.code}\n\n`;
      });
      
      productList += `Untuk membeli produk ketik: ${prefix}buyproduk [kode]`;
      
      await sock.sendMessage(from, { 
        text: productList 
      }, { quoted: msg });
      break;
      
    case 'buyproduk':
      if (args.length < 1) {
        await sock.sendMessage(from, { 
          text: `Penggunaan: ${prefix}buyproduk [kode]` 
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
          text: settings.defaultMessages.purchaseSuccess 
        }, { quoted: msg });
        
        // Kirim notifikasi ke owner
        const ownerJid = `${settings.ownerInfo.number}@s.whatsapp.net`;
        await sock.sendMessage(ownerJid, { 
          text: `📢 *NOTIFIKASI PEMBELIAN BARU*\n\nPembeli: ${pushName} (${sender.split('@')[0]})\nProduk: ${product.name}\nHarga: ${storeFunctions.formatMoney(product.price)}\nKode: ${product.code}\n\nMohon segera diproses!` 
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
          text: 'Silakan kirim bukti pembayaran Anda (foto).\n\nAdmin akan segera memproses deposit Anda.' 
        }, { quoted: msg });
        
        // Kirim notifikasi ke owner
        const ownerJid = `${settings.ownerInfo.number}@s.whatsapp.net`;
        await sock.sendMessage(ownerJid, { 
          text: `📢 *NOTIFIKASI DEPOSIT*\n\nUser: ${pushName} (${sender.split('@')[0]}) telah meminta deposit.\n\nMohon cek bukti pembayaran yang akan dikirimkan.` 
        });
      } catch (error) {
        console.error('Error processing deposit:', error);
        await sock.sendMessage(from, { 
          text: settings.defaultMessages.error 
        }, { quoted: msg });
      }
      break;
      
    default:
      // Command tidak ditemukan
      break;
  }
}
