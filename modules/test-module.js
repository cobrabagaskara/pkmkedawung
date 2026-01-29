// ============================================
// Test Module
// Menampilkan pesan sederhana di console
// ============================================

(function() {
    'use strict';

    // Pesan sederhana
    console.log('halo, saya disini');

    // Info tambahan
    console.log('[PKM-Test] Module test-module berhasil di-load!');
    console.log('[PKM-Test] URL saat ini:', window.location.href);

    // Tambahkan timestamp
    const now = new Date();
    console.log('[PKM-Test] Timestamp:', now.toLocaleString('id-ID'));

    // modules/test-module.js
console.log("Test Module Loaded");

// Cek versi dari localStorage
const currentVersion = localStorage.getItem('pkmkedawung_version');
console.log(`Running PKMKedawung v${currentVersion || 'unknown'}`);

// Listen untuk custom event jika loader mendeteksi update
document.addEventListener('pkmkedawung_update', function(e) {
    console.log(`Update detected to v${e.detail.version}`);
    // Tambahkan logika modul spesifik di sini
});
})();
