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

})();