// main.js
console.log("PKMKedawung Loaded");

// Simpan versi saat ini di localStorage untuk akses mudah
localStorage.setItem('pkmkedawung_version', '8');

// Fungsi untuk handle update jika diperlukan
function handleUpdateNotification(version) {
    console.log(`Update available: v${version}`);
    // Tambahkan logika tambahan di sini jika perlu
}

// Export untuk modul lain
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { handleUpdateNotification };
}
