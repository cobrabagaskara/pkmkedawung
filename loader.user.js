// ==UserScript==
// @name         PKMKedawung Loader
// @namespace    http://tampermonkey.net/
// @version      8.1
// @description  Loader with update notification
// @author       You
// @match        *://*/*
// @grant        GM_notification
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_xmlhttpRequest
// @connect      raw.githubusercontent.com
// ==/UserScript==

(function() {
    'use strict';

    // URL untuk manifest terbaru
    const MANIFEST_URL = "https://raw.githubusercontent.com/cobrabagaskara/pkmkedawung/refs/heads/main/manifest.json";
    const CURRENT_VERSION = "8"; // Versi saat ini di loader
    
    // Fungsi utama untuk cek update
    function checkForUpdates() {
        GM_xmlhttpRequest({
            method: "GET",
            url: MANIFEST_URL,
            onload: function(response) {
                try {
                    const manifest = JSON.parse(response.responseText);
                    const latestVersion = manifest.version;
                    const lastNotifiedVersion = GM_getValue("lastNotifiedVersion", "0");
                    
                    console.log("Versi terbaru:", latestVersion);
                    console.log("Versi terakhir diberitahu:", lastNotifiedVersion);
                    console.log("Versi loader:", CURRENT_VERSION);
                    
                    // Cek jika versi terbaru lebih baru dari yang pernah diberitahu
                    if (compareVersions(latestVersion, lastNotifiedVersion) > 0 && 
                        compareVersions(latestVersion, CURRENT_VERSION) > 0) {
                        showUpdateNotification(latestVersion);
                        GM_setValue("lastNotifiedVersion", latestVersion);
                    }
                } catch (e) {
                    console.error("Error parsing manifest:", e);
                }
            },
            onerror: function(error) {
                console.error("Failed to fetch manifest:", error);
            }
        });
    }
    
    // Fungsi untuk membandingkan versi
    function compareVersions(a, b) {
        const aParts = a.split('.').map(Number);
        const bParts = b.split('.').map(Number);
        
        for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
            const aVal = aParts[i] || 0;
            const bVal = bParts[i] || 0;
            
            if (aVal > bVal) return 1;
            if (aVal < bVal) return -1;
        }
        return 0;
    }
    
    // Fungsi untuk menampilkan notifikasi
    function showUpdateNotification(version) {
        if (typeof GM_notification === 'function') {
            GM_notification({
                text: `Versi ${version} tersedia! Klik untuk memperbarui.`,
                title: "Pembaruan PKMKedawung Tersedia",
                timeout: 10000, // 10 detik
                onclick: function() {
                    window.open("https://github.com/cobrabagaskara/pkmkedawung", "_blank");
                }
            });
            
            // Juga tampilkan di console untuk debugging
            console.log(`🔔 NOTIFIKASI UPDATE: Versi ${version} tersedia!`);
        } else {
            // Fallback jika GM_notification tidak tersedia
            console.warn(`Versi ${version} tersedia! Kunjungi: https://github.com/cobrabagaskara/pkmkedawung`);
            alert(`PKMKedawung v${version} tersedia! Kunjungi GitHub untuk update.`);
        }
    }
    
    // Tambahkan pengecekan periodic (setiap 6 jam)
    function setupPeriodicCheck() {
        // Cek sekarang
        checkForUpdates();
        
        // Cek setiap 6 jam (21600000 ms)
        setInterval(checkForUpdates, 6 * 60 * 60 * 1000);
        
        // Juga cek saat halaman dimuat ulang
        window.addEventListener('load', checkForUpdates);
    }
    
    // Tunggu hingga halaman siap
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setupPeriodicCheck);
    } else {
        setupPeriodicCheck();
    }
})();
