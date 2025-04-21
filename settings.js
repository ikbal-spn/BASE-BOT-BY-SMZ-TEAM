/**
 * File setting.js
 * Berisi pengaturan/konfigurasi untuk bot WhatsApp
 */

// Info Bot
const botInfo = {
  name: "SMZ Bot", // Nama bot
  version: "1.0.0", // Versi bot
  description: "Bot WhatsApp menggunakan Baileys library", // Deskripsi bot
  author: "SMZ Team", // Author bot
}

// Info Owner
const ownerInfo = {
  name: "SMZ Team", // Nama owner
  number: "6283821115236", // Nomor owner (format: 62xxx)
  numbers: ["6283821115236"], // Daftar nomor owner (jika lebih dari 1)
}

// Pengaturan Bot
const botSettings = {
  public: true, // true: bot dapat digunakan oleh semua orang, false: bot hanya bisa digunakan owner
  prefixEnabled: true, // true: bot hanya merespons perintah dengan prefix, false: bot bisa tanpa prefix
  customPrefix: ".", // Custom prefix (contoh: ".", "!", "#", dll)
  defaultPrefix: "!", // Default prefix jika customPrefix tidak digunakan
  selfbot: false, // Mode selfbot (true/false)
  autoRead: true, // Otomatis membaca pesan (true/false)
  autoTyping: true, // Otomatis menampilkan status sedang mengetik (true/false)
  autoRecording: false, // Otomatis menampilkan status sedang merekam (true/false)
  multiPrefix: false, // Mengizinkan beberapa prefix (true/false)
  allPrefix: ['.', '!', '#', '/'], // Daftar prefix jika multiPrefix diaktifkan
}

// Pengaturan grup
const groupSettings = {
  antiLink: false, // Anti tautan grup (true/false)
  antiToxic: false, // Anti kata kasar (true/false)
  welcome: true, // Pesan welcome ketika anggota baru bergabung (true/false)
  leave: true, // Pesan leave ketika anggota keluar (true/false)
  detect: true, // Deteksi perubahan grup (true/false)
}

// Pengaturan waktu
const timeSettings = {
  timezone: "Asia/Jakarta", // Timezone
  format: "HH:mm:ss", // Format waktu
  dateFormat: "DD/MM/YYYY", // Format tanggal
}

// Path database
const databaseSettings = {
  path: "./database", // Path folder database
  usersDb: "./database/users.json", // Path database users
  groupsDb: "./database/groups.json", // Path database groups
  chatsDb: "./database/chats.json", // Path database chats
  commandsDb: "./database/commands.json", // Path database commands
  settingsDb: "./database/settings.json", // Path database settings
  storeDb: "./database/store.json", // Path database store
}

// Pengaturan Store
const storeSettings = {
  qrisImage: "https://i.ibb.co/gDJKrJt/qris.jpg", // Link gambar QRIS untuk pembayaran
  paymentInstructions: [
    "1. Scan QRIS diatas dengan aplikasi e-wallet seperti Dana, OVO, GoPay, dll",
    "2. Masukkan nominal sesuai keinginan",
    "3. Setelah melakukan pembayaran, silahkan kirim bukti transfer dengan mengetik .kirimbuktop",
    "4. Admin akan memproses deposit Anda segera"
  ]
}

// Pesan default
const defaultMessages = {
  wait: "Mohon tunggu sebentar...",
  success: "Berhasil!",
  error: "Terjadi kesalahan, coba lagi nanti!",
  ownerOnly: "Perintah ini hanya dapat digunakan oleh owner!",
  adminOnly: "Perintah ini hanya dapat digunakan oleh admin grup!",
  groupOnly: "Perintah ini hanya dapat digunakan di dalam grup!",
  privateOnly: "Perintah ini hanya dapat digunakan di private chat!",
  botAdmin: "Bot harus menjadi admin untuk menggunakan perintah ini!",
  notRegistered: "Anda belum terdaftar! Silakan daftar terlebih dahulu dengan mengetik .register",
  nsfw: "NSFW belum diaktifkan di grup ini!",
  premium: "Fitur ini hanya untuk pengguna premium!",
  insufficientBalance: "Saldo Anda tidak cukup untuk melakukan transaksi ini. Silahkan deposit terlebih dahulu!",
  depositSuccess: "Permintaan deposit Anda telah diterima. Silahkan tunggu konfirmasi dari admin.",
  purchaseSuccess: "Pembelian berhasil! Pesanan Anda sedang diproses oleh admin.",
  productNotFound: "Produk tidak ditemukan. Silahkan periksa kembali kode produk Anda."
}

// Ekspor semua pengaturan
export default {
  botInfo,
  ownerInfo,
  botSettings,
  groupSettings,
  timeSettings,
  databaseSettings,
  storeSettings,
  defaultMessages,
  // Fungsi helper
  getPrefix: () => {
    return botSettings.prefixEnabled ? 
      (botSettings.customPrefix || botSettings.defaultPrefix) : '';
  },
  isPublic: () => botSettings.public,
  isOwner: (number) => {
    const cleanNumber = number.replace(/[^0-9]/g, '');
    return ownerInfo.numbers.includes(cleanNumber) || cleanNumber === ownerInfo.number;
  }
};
