// ==UserScript==
// @name         PKM Kedawung Loader
// @namespace    https://github.com/cobrabagaskara/pkmkedawung
// @version      1.0.3
// @description  Loader otomatis untuk semua script PKM Kedawung. Ubah di GitHub, update otomatis di semua komputer.
// @author       cobrabagaskara
// @match        *://*/*
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_addStyle
// @grant        GM_info
// @connect      raw.githubusercontent.com
// @connect      github.com
// @connect      githubusercontent.com
// @updateURL    https://raw.githubusercontent.com/cobrabagaskara/pkmkedawung/main/loader.user.js
// @downloadURL  https://raw.githubusercontent.com/cobrabagaskara/pkmkedawung/main/loader.user.js
// ==/UserScript==

(function() {
    'use strict';

    // ============================================
    // NOTIFICATION SYSTEM
    // ============================================
    class PKMNotification {
        static showUpdate(version) {
            // Cek apakah notifikasi sudah ada
            if (document.getElementById('pkm-update-notification')) {
                return;
            }

            const notification = document.createElement('div');
            notification.id = 'pkm-update-notification';
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 16px 24px;
                border-radius: 12px;
                box-shadow: 0 8px 24px rgba(102, 126, 234, 0.4);
                z-index: 99999;
                display: flex;
                flex-direction: column;
                gap: 10px;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                animation: pkmSlideIn 0.3s ease;
                max-width: 350px;
            `;

            notification.innerHTML = `
                <div style="display: flex; align-items: center; gap: 10px;">
                    <span style="font-size: 24px;">✨</span>
                    <strong style="font-size: 16px;">Update Tersedia!</strong>
                </div>
                <div style="font-size: 14px; opacity: 0.9;">
                    Versi baru PKM Kedawung: <strong>v${version}</strong>
                </div>
                <div style="display: flex; gap: 10px; margin-top: 8px;">
                    <button id="pkm-reload-btn" style="
                        background: white;
                        color: #667eea;
                        border: none;
                        padding: 8px 16px;
                        border-radius: 6px;
                        font-weight: 600;
                        cursor: pointer;
                        transition: all 0.2s;
                    ">🔄 Reload Sekarang</button>
                    <button id="pkm-dismiss-btn" style="
                        background: rgba(255,255,255,0.2);
                        color: white;
                        border: 1px solid rgba(255,255,255,0.3);
                        padding: 8px 16px;
                        border-radius: 6px;
                        font-weight: 600;
                        cursor: pointer;
                        transition: all 0.2s;
                    ">✕ Tutup</button>
                </div>
            `;

            // Add animation styles
            const style = document.createElement('style');
            style.textContent = `
                @keyframes pkmSlideIn {
                    from {
                        transform: translateX(400px);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                @keyframes pkmSlideOut {
                    from {
                        transform: translateX(0);
                        opacity: 1;
                    }
                    to {
                        transform: translateX(400px);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);

            document.body.appendChild(notification);

            // Button handlers
            document.getElementById('pkm-reload-btn').onclick = () => {
                notification.remove();
                location.reload();
            };

            document.getElementById('pkm-dismiss-btn').onclick = () => {
                notification.style.animation = 'pkmSlideOut 0.3s ease';
                setTimeout(() => notification.remove(), 300);
            };

            // Auto-remove after 30 seconds
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.style.animation = 'pkmSlideOut 0.3s ease';
                    setTimeout(() => notification.remove(), 300);
                }
            }, 30000);
        }
    }

    // ============================================
    // CONFIGURATION
    // ============================================
    const CONFIG = {
        repoBase: 'https://raw.githubusercontent.com/cobrabagaskara/pkmkedawung/main',
        manifestFile: 'manifest.json',
        cacheEnabled: true,
        debug: true,
        checkInterval: 3600000 // 1 jam
    };

    // ============================================
    // CORE LOADER CLASS
    // ============================================
    class PKMLoader {
        constructor() {
            this.loadedModules = new Set();
            this.manifest = null;
            this.version = GM_info.script.version;
        }

        // Log dengan prefix
        log(...args) {
            if (CONFIG.debug) {
                console.log('[PKM-Loader]', ...args);
            }
        }

        error(...args) {
            console.error('[PKM-Loader]', ...args);
        }

        // Fetch file dari GitHub
        async fetchFile(path) {
            return new Promise((resolve, reject) => {
                GM_xmlhttpRequest({
                    method: 'GET',
                    url: `${CONFIG.repoBase}/${path}`,
                    headers: {
                        'Cache-Control': 'no-cache'
                    },
                    onload: (response) => {
                        if (response.status === 200) {
                            resolve(response.responseText);
                        } else {
                            reject(new Error(`HTTP ${response.status}: ${path}`));
                        }
                    },
                    onerror: (error) => {
                        reject(error);
                    }
                });
            });
        }

        // Load manifest.json
        async loadManifest() {
            try {
                const manifestText = await this.fetchFile(CONFIG.manifestFile);
                this.manifest = JSON.parse(manifestText);
                this.log('Manifest loaded:', this.manifest.version);
                return this.manifest;
            } catch (error) {
                this.error('Failed to load manifest:', error);
                return null;
            }
        }

        // Cek apakah URL match dengan pattern
        urlMatches(pattern) {
            const url = window.location.href;
            
            // Special case: match all URLs
            if (pattern === '*://*/*') {
                return true;
            }
            
            // Convert wildcard pattern to regex
            const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
            const regexPattern = '^' + escaped.replace(/\\\*/g, '.*') + '$';
            
            try {
                const regex = new RegExp(regexPattern, 'i');
                return regex.test(url);
            } catch (e) {
                this.error('Invalid pattern:', pattern, e);
                return false;
            }
        }

        // Cek apakah modul harus dijalankan di halaman ini
        shouldRunModule(module) {
            // Jika disabled, skip
            if (module.enabled === false) {
                return false;
            }

            // Jika ada match patterns, cek apakah URL match
            if (module.match && module.match.length > 0) {
                return module.match.some(pattern => this.urlMatches(pattern));
            }

            // Jika tidak ada match, jalankan di semua halaman
            return true;
        }

        // Load dan eksekusi modul
        async loadModule(module) {
            const moduleId = module.id;

            // Cek apakah sudah loaded
            if (this.loadedModules.has(moduleId)) {
                this.log(`Module "${moduleId}" already loaded`);
                return;
            }

            // Cek apakah harus dijalankan
            if (!this.shouldRunModule(module)) {
                this.log(`Module "${moduleId}" skipped - URL not matched`);
                return;
            }

            try {
                this.log(`Loading module: ${module.name} (${moduleId})`);
                
                // Fetch module code
                const code = await this.fetchFile(module.file);
                
                // Eksekusi dalam scope terpisah
                this.executeModule(code, module);
                
                this.loadedModules.add(moduleId);
                this.log(`✓ Module "${moduleId}" loaded successfully`);
                
            } catch (error) {
                this.error(`Failed to load module "${moduleId}":`, error);
            }
        }

        // Eksekusi modul dengan aman
        executeModule(code, module) {
            try {
                // Wrap dalam IIFE untuk isolasi scope
                const wrappedCode = `
                    (function() {
                        'use strict';
                        
                        // Module metadata
                        const MODULE_INFO = ${JSON.stringify({
                            id: module.id,
                            name: module.name,
                            version: this.manifest?.version || '1.0.0'
                        })};
                        
                        // Utility functions
                        const PKM = {
                            log: (...args) => console.log('[PKM-' + MODULE_INFO.id + ']', ...args),
                            error: (...args) => console.error('[PKM-' + MODULE_INFO.id + ']', ...args),
                            info: (...args) => console.info('[PKM-' + MODULE_INFO.id + ']', ...args)
                        };
                        
                        ${code}
                    })();
                `;
                
                // eslint-disable-next-line no-new-func
                const moduleFn = new Function('window', 'document', 'console', wrappedCode);
                moduleFn(window, document, console);
                
            } catch (error) {
                this.error(`Error executing module "${module.id}":`, error);
            }
        }

        // Load semua modul dari manifest
        async loadAllModules() {
            if (!this.manifest) {
                await this.loadManifest();
            }

            if (!this.manifest || !this.manifest.modules) {
                this.error('No manifest or modules found');
                return;
            }

            this.log(`Loading ${this.manifest.modules.length} modules...`);

            // Load dependencies first
            if (this.manifest.dependencies) {
                for (const [depName, depPath] of Object.entries(this.manifest.dependencies)) {
                    try {
                        const depCode = await this.fetchFile(depPath);
                        // eslint-disable-next-line no-new-func
                        const depFn = new Function(depCode);
                        depFn();
                        this.log(`Loaded dependency: ${depName}`);
                    } catch (error) {
                        this.error(`Failed to load dependency ${depName}:`, error);
                    }
                }
            }

            // Load modules
            for (const module of this.manifest.modules) {
                await this.loadModule(module);
            }

            this.log(`✓ All modules loaded (${this.loadedModules.size}/${this.manifest.modules.length})`);
        }

        // Cek update dengan notifikasi
        async checkForUpdates() {
            try {
                const manifest = await this.loadManifest();
                if (manifest && manifest.version !== this.manifest?.version) {
                    this.log(`Update available: ${this.manifest?.version} → ${manifest.version}`);
                    
                    // Tampilkan notifikasi visual
                    PKMNotification.showUpdate(manifest.version);
                    
                    // Update local manifest
                    this.manifest = manifest;
                } else {
                    this.log('No updates available');
                }
            } catch (error) {
                this.error('Update check failed:', error);
            }
        }

        // Init loader
        async init() {
            this.log('PKM Kedawung Loader v' + this.version + ' initialized');
            this.log('Repository:', CONFIG.repoBase);
            
            // Load manifest dan modules
            await this.loadAllModules();
            
            // Setup periodic update check
            if (CONFIG.checkInterval > 0) {
                setInterval(() => {
                    this.checkForUpdates();
                }, CONFIG.checkInterval);
                
                // Check update pertama kali setelah 5 detik
                setTimeout(() => {
                    this.checkForUpdates();
                }, 5000);
            }
            
            // Expose untuk debugging
            window.PKM_LOADER = this;
        }
    }

    // ============================================
    // START LOADER
    // ============================================
    const loader = new PKMLoader();
    
    // Tunggu DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            loader.init();
        });
    } else {
        loader.init();
    }

})();