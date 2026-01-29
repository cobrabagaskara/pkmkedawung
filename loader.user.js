// ==UserScript==
// @name         PKMKedawung - Enhanced Loader
// @namespace    https://github.com/cobrabagaskara/pkmkedawung
// @version      1.2.1
// @description  Loader canggih dengan sistem notifikasi update, logging, dan kontrol manual
// @author       cobrabagaskara
// @match        *://*/*
// @grant        GM_notification
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_xmlhttpRequest
// @grant        GM_log
// @connect      raw.githubusercontent.com
// @license      MIT
// @updateURL    https://raw.githubusercontent.com/cobrabagaskara/pkmkedawung/main/loader.user.js
// @downloadURL  https://raw.githubusercontent.com/cobrabagaskara/pkmkedawung/main/loader.user.js
// ==/UserScript==

(function() {
    'use strict';

    // ========== KONFIGURASI ==========
    const CONFIG = {
        MANIFEST_URL: "https://raw.githubusercontent.com/cobrabagaskara/pkmkedawung/refs/heads/main/manifest.json",
        REPO_URL: "https://github.com/cobrabagaskara/pkmkedawung",
        LOADER_VERSION: "1.2.0",
        CHECK_INTERVAL: 5 * 60 * 1000, // 5 menit (produksi)
        DEBUG_MODE: false, // Set true untuk logging detail
        TEST_MODE: false   // Set true untuk interval 30 detik
    };

    // ========== SISTEM LOGGING ==========
    const Logger = {
        styles: {
            info: 'color: #3498db; font-weight: bold',
            success: 'color: #2ecc71; font-weight: bold',
            warning: 'color: #f39c12; font-weight: bold',
            error: 'color: #e74c3c; font-weight: bold',
            update: 'color: #9b59b6; font-weight: bold',
            debug: 'color: #95a5a6; font-style: italic'
        },

        info: (msg, data) => {
            console.log(`%cℹ️  PKMKedawung: ${msg}`, Logger.styles.info);
            if (data && CONFIG.DEBUG_MODE) console.dir(data);
            GM_log(`INFO: ${msg}`);
        },

        success: (msg) => {
            console.log(`%c✅ ${msg}`, Logger.styles.success);
            GM_log(`SUCCESS: ${msg}`);
        },

        warning: (msg) => {
            console.warn(`%c⚠️  ${msg}`, Logger.styles.warning);
            GM_log(`WARNING: ${msg}`);
        },

        error: (msg, error) => {
            console.error(`%c❌ ${msg}`, Logger.styles.error);
            if (error) console.error(error);
            GM_log(`ERROR: ${msg} - ${error?.message || ''}`);
        },

        update: (msg) => {
            console.log(`%c🔄 ${msg}`, Logger.styles.update);
            GM_log(`UPDATE: ${msg}`);
        },

        debug: (msg, data) => {
            if (CONFIG.DEBUG_MODE) {
                console.log(`%c🐛 ${msg}`, Logger.styles.debug);
                if (data) console.table(data);
            }
        }
    };

    // ========== CORE FUNCTIONS ==========
    class UpdateManager {
        constructor() {
            this.lastCheckTime = null;
            this.updateCallbacks = [];
        }

        async checkForUpdates(force = false) {
            try {
                this.lastCheckTime = new Date();
                Logger.info('Memulai pengecekan update...', { forced: force });
                
                const manifest = await this.fetchManifest();
                if (!manifest) return false;
                
                const updateAvailable = await this.compareVersions(manifest.version);
                
                if (updateAvailable) {
                    this.notifyUpdate(manifest.version);
                    this.triggerCallbacks('update', manifest);
                    return true;
                } else if (force) {
                    Logger.success('Anda sudah menggunakan versi terbaru!');
                    this.triggerCallbacks('latest', manifest);
                }
                
                return false;
            } catch (error) {
                Logger.error('Gagal mengecek update', error);
                return false;
            }
        }

        fetchManifest() {
            return new Promise((resolve, reject) => {
                GM_xmlhttpRequest({
                    method: "GET",
                    url: CONFIG.MANIFEST_URL,
                    timeout: 15000,
                    responseType: "json",
                    onload: (response) => {
                        if (response.status === 200) {
                            Logger.debug('Manifest berhasil diambil', response.response);
                            resolve(response.response);
                        } else {
                            reject(new Error(`HTTP ${response.status}`));
                        }
                    },
                    onerror: (error) => reject(error),
                    ontimeout: () => reject(new Error('Timeout'))
                });
            });
        }

        async compareVersions(latestVersion) {
            const lastNotified = GM_getValue("lastNotifiedVersion", "0");
            const currentVersion = CONFIG.LOADER_VERSION;
            
            Logger.debug('Perbandingan versi', {
                latest: latestVersion,
                lastNotified: lastNotified,
                current: currentVersion
            });

            // Gunakan sistem compare yang lebih cerdas
            const needsUpdate = this.versionCompare(latestVersion, lastNotified) > 0;
            
            if (needsUpdate) {
                Logger.update(`Versi baru ditemukan: v${latestVersion}`);
                Logger.info(`Versi saat ini: v${currentVersion}, Terakhir diberitahu: v${lastNotified}`);
                return true;
            }
            
            return false;
        }

        versionCompare(a, b) {
            const aParts = a.split('.').map(Number);
            const bParts = b.split('.').map(Number);
            
            for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
                const aVal = aParts[i] || 0;
                const bVal = bParts[i] || 0;
                if (aVal !== bVal) return aVal - bVal;
            }
            return 0;
        }

        notifyUpdate(version) {
            Logger.update(`Menampilkan notifikasi untuk v${version}`);
            
            // Update storage
            GM_setValue("lastNotifiedVersion", version);
            GM_setValue("lastUpdateTime", new Date().toISOString());
            
            // Desktop notification
            if (typeof GM_notification === 'function') {
                GM_notification({
                    text: `Versi ${version} tersedia!\nKlik untuk detail update.`,
                    title: "🔄 Pembaruan PKMKedawung",
                    timeout: 10000,
                    silent: false,
                    onclick: () => window.open(CONFIG.REPO_URL + '/releases', '_blank'),
                    ondone: () => Logger.debug('Notifikasi ditutup')
                });
            }
            
            // Console notification dengan styling
            this.showConsoleBanner(version);
            
            // Dispatch event untuk modul lain
            document.dispatchEvent(new CustomEvent('pkmkedawung:update-available', {
                detail: { version, timestamp: new Date() }
            }));
        }

        showConsoleBanner(version) {
            const banner = `
%c
╔═══════════════════════════════════════╗
║        🚀 PEMBARUAN TERSEDIA!         ║
║    PKMKedawung v${version.padEnd(6)}                 ║
╠═══════════════════════════════════════╣
║ • Klik notifikasi untuk detail        ║
║ • Atau kunjungi repo GitHub           ║
║ • Gunakan pkmCheckUpdate() untuk cek  ║
╚═══════════════════════════════════════╝
            `;
            console.log(banner, 'background: linear-gradient(90deg, #667eea 0%, #764ba2 100%); color: white; font-family: monospace; padding: 10px; border-radius: 5px;');
        }

        on(event, callback) {
            this.updateCallbacks.push({ event, callback });
        }

        triggerCallbacks(event, data) {
            this.updateCallbacks
                .filter(cb => cb.event === event)
                .forEach(cb => cb.callback(data));
        }
    }

    // ========== MANUAL CONTROL ==========
    function setupManualControls() {
        // Fungsi global untuk manual check
        window.pkmCheckUpdate = async function(force = true) {
            Logger.info('Manual check dipanggil', { force });
            const updateManager = window.PKMManager;
            
            if (!updateManager) {
                Logger.error('UpdateManager belum diinisialisasi');
                return;
            }
            
            const hasUpdate = await updateManager.checkForUpdates(force);
            
            if (!hasUpdate && force) {
                // Tampilkan status current
                const lastCheck = updateManager.lastCheckTime;
                const lastNotified = GM_getValue("lastNotifiedVersion", "0");
                
                console.group('%c📊 Status Update PKMKedawung', 'color: #3498db; font-weight: bold');
                console.log(`%c⏱️  Terakhir dicek: ${lastCheck ? lastCheck.toLocaleTimeString() : 'Belum pernah'}`, 'color: #7f8c8d');
                console.log(`%c📦 Versi loader: ${CONFIG.LOADER_VERSION}`, 'color: #2ecc71');
                console.log(`%c🔔 Versi terakhir diberitahu: ${lastNotified}`, 'color: #9b59b6');
                console.log(`%c🐛 Debug mode: ${CONFIG.DEBUG_MODE}`, 'color: #e67e22');
                console.groupEnd();
            }
            
            return hasUpdate;
        };
        
        // Toggle debug mode
        window.pkmToggleDebug = function() {
            CONFIG.DEBUG_MODE = !CONFIG.DEBUG_MODE;
            const status = CONFIG.DEBUG_MODE ? 'AKTIF' : 'NONAKTIF';
            Logger.success(`Debug mode ${status}`);
            return CONFIG.DEBUG_MODE;
        };
        
        // Reset update history
        window.pkmResetUpdate = function() {
            GM_setValue("lastNotifiedVersion", "0");
            GM_setValue("lastUpdateTime", null);
            Logger.success('History update telah direset');
            return true;
        };
        
        // Info singkat
        window.pkmInfo = function() {
            return {
                loaderVersion: CONFIG.LOADER_VERSION,
                lastNotified: GM_getValue("lastNotifiedVersion", "0"),
                lastUpdate: GM_getValue("lastUpdateTime", null),
                debugMode: CONFIG.DEBUG_MODE,
                testMode: CONFIG.TEST_MODE,
                repoUrl: CONFIG.REPO_URL
            };
        };
    }

    // ========== INITIALIZATION ==========
    async function initialize() {
        Logger.info(`Loader PKMKedawung v${CONFIG.LOADER_VERSION} diinisialisasi`);
        
        // Setup manager
        const updateManager = new UpdateManager();
        window.PKMManager = updateManager;
        
        // Setup manual controls
        setupManualControls();
        
        // Event listeners untuk modul
        updateManager.on('update', (manifest) => {
            Logger.debug('Callback update dipanggil', manifest);
        });
        
        updateManager.on('latest', (manifest) => {
            Logger.debug('Callback latest version dipanggil', manifest);
        });
        
        // Setup periodic checking
        const interval = CONFIG.TEST_MODE ? 30000 : CONFIG.CHECK_INTERVAL;
        setInterval(() => updateManager.checkForUpdates(), interval);
        
        // Initial check dengan delay
        setTimeout(() => updateManager.checkForUpdates(), 3000);
        
        // Tampilkan helper message
        console.log(`%c💡 PKMKedawung Loader siap!`, 'color: #2ecc71; font-weight: bold');
        console.log(`%cGunakan pkmCheckUpdate() untuk cek manual`, 'color: #3498db');
        console.log(`%cGunakan pkmToggleDebug() untuk debug mode`, 'color: #f39c12');
        console.log(`%cPengecekan otomatis setiap ${interval/60000} menit`, 'color: #7f8c8d');
    }

    // ========== STARTUP ==========
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        setTimeout(initialize, 100);
    }

})();
