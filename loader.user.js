// ==UserScript==
// @name         PKMKedawung - Modular System Loader
// @namespace    https://github.com/cobrabagaskara/pkmkedawung
// @version      3.0.0
// @description  Sistem modular loader untuk semua script di folder modules
// @author       cobrabagaskara
// @match        *://*/*
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_xmlhttpRequest
// @grant        GM_notification
// @grant        GM_registerMenuCommand
// @grant        GM_addStyle
// @connect      raw.githubusercontent.com
// @updateURL    https://raw.githubusercontent.com/cobrabagaskara/pkmkedawung/main/loader.user.js
// @downloadURL  https://raw.githubusercontent.com/cobrabagaskara/pkmkedawung/main/loader.user.js
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';
    
    // ==================== KONFIGURASI ====================
    const CONFIG = {
        REPO_RAW: 'https://raw.githubusercontent.com/cobrabagaskara/pkmkedawung/main',
        REPO_PAGE: 'https://github.com/cobrabagaskara/pkmkedawung',
        MANIFEST_URL: 'https://raw.githubusercontent.com/cobrabagaskara/pkmkedawung/main/manifest.json',
        MODULES_CONFIG_URL: 'https://raw.githubusercontent.com/cobrabagaskara/pkmkedawung/main/modules/modules.json',
        LOADER_VERSION: '3.0.0',
        CACHE_DURATION: 10 * 60 * 1000, // 10 menit
        UPDATE_CHECK_INTERVAL: 15 * 60 * 1000 // 15 menit
    };
    
    // ==================== MODULE LOADER CORE ====================
    class PKMModularLoader {
        constructor() {
            this.manifest = null;
            this.modulesConfig = {};
            this.activeModules = new Map();
            this.enabledModules = JSON.parse(GM_getValue('enabled_modules', '{}'));
            this.initStyles();
        }
        
        async initialize() {
            this.log('🚀 PKMKedawung Modular Loader v' + CONFIG.LOADER_VERSION, 'loader');
            
            // 1. Load konfigurasi
            await this.loadConfigurations();
            
            // 2. Cek update
            await this.checkForUpdates();
            
            // 3. Setup UI Dashboard
            this.setupDashboard();
            
            // 4. Register menu commands
            this.registerMenuCommands();
            
            // 5. Load modules yang aktif
            await this.loadActiveModules();
            
            // 6. Setup periodic checks
            this.setupPeriodicChecks();
        }
        
        async loadConfigurations() {
            try {
                // Load manifest
                const manifestText = await this.fetch(CONFIG.MANIFEST_URL);
                this.manifest = JSON.parse(manifestText);
                
                // Load modules config
                const modulesText = await this.fetch(CONFIG.MODULES_CONFIG_URL);
                this.modulesConfig = JSON.parse(modulesText);
                
                this.log(`📦 Loaded ${Object.keys(this.modulesConfig.modules).length} modules`, 'config');
            } catch (error) {
                this.log(`❌ Gagal load konfigurasi: ${error.message}`, 'error');
                // Fallback config
                this.modulesConfig = {
                    modules: {
                        'test-module': {
                            name: 'Test Module',
                            description: 'Module testing',
                            version: '1.0.0',
                            author: 'cobrabagaskara',
                            match: ['*://*/*']
                        }
                    }
                };
            }
        }
        
        async checkForUpdates() {
            try {
                const lastVersion = GM_getValue('last_notified_version', '0');
                const currentVersion = this.manifest?.version || CONFIG.LOADER_VERSION;
                
                if (this.compareVersions(currentVersion, lastVersion) > 0) {
                    this.showUpdateNotification(currentVersion);
                    GM_setValue('last_notified_version', currentVersion);
                    GM_setValue('last_update_check', new Date().toISOString());
                }
            } catch (error) {
                this.log(`❌ Update check gagal: ${error.message}`, 'error');
            }
        }
        
        async loadActiveModules() {
            const modules = this.modulesConfig.modules || {};
            
            for (const [moduleId, moduleConfig] of Object.entries(modules)) {
                // Cek apakah module di-enable
                const isEnabled = this.enabledModules[moduleId] !== false; // Default true
                
                if (isEnabled && this.shouldLoadModule(moduleConfig)) {
                    await this.loadModule(moduleId, moduleConfig);
                }
            }
        }
        
        shouldLoadModule(moduleConfig) {
            const currentUrl = window.location.href;
            const matches = moduleConfig.match || ['*://*/*'];
            
            return matches.some(pattern => {
                if (pattern === '*://*/*') return true;
                
                const regexPattern = pattern
                    .replace(/\*/g, '.*')
                    .replace(/\//g, '\\/');
                const regex = new RegExp(`^${regexPattern}$`);
                
                return regex.test(currentUrl);
            });
        }
        
        async loadModule(moduleId, moduleConfig) {
            try {
                const moduleURL = `${CONFIG.REPO_RAW}/modules/${moduleId}.js`;
                const moduleCode = await this.fetch(moduleURL);
                
                // Execute module dengan context yang aman
                this.executeModule(moduleId, moduleConfig, moduleCode);
                
                this.activeModules.set(moduleId, {
                    config: moduleConfig,
                    loadedAt: new Date(),
                    element: null
                });
                
                this.log(`✅ Module loaded: ${moduleConfig.name}`, 'module');
                
            } catch (error) {
                this.log(`❌ Gagal load module ${moduleId}: ${error.message}`, 'error');
            }
        }
        
        executeModule(moduleId, moduleConfig, code) {
            // Buat script element
            const script = document.createElement('script');
            script.id = `pkm-module-${moduleId}`;
            script.type = 'text/javascript';
            
            // Siapkan execution context
            const wrappedCode = `
            (function() {
                // Module configuration
                const moduleConfig = ${JSON.stringify(moduleConfig)};
                const moduleId = '${moduleId}';
                const loaderVersion = '${CONFIG.LOADER_VERSION}';
                
                // Module API
                const PKM = {
                    config: moduleConfig,
                    id: moduleId,
                    version: moduleConfig.version,
                    log: function(message, type = 'info') {
                        const prefix = \`[\${moduleConfig.name}]\`;
                        const styles = {
                            info: 'color: #3498db',
                            success: 'color: #2ecc71',
                            warn: 'color: #f39c12',
                            error: 'color: #e74c3c'
                        };
                        console.log(\`%c\${prefix} \${message}\`, styles[type] || styles.info);
                    },
                    
                    // Storage API
                    storage: {
                        get: function(key) {
                            try {
                                const fullKey = \`pkm_\${moduleId}_\${key}\`;
                                const value = localStorage.getItem(fullKey);
                                return value ? JSON.parse(value) : null;
                            } catch (e) {
                                return null;
                            }
                        },
                        set: function(key, value) {
                            try {
                                const fullKey = \`pkm_\${moduleId}_\${key}\`;
                                localStorage.setItem(fullKey, JSON.stringify(value));
                                return true;
                            } catch (e) {
                                return false;
                            }
                        }
                    },
                    
                    // Utility functions
                    utils: {
                        waitForElement: function(selector, timeout = 10000) {
                            return new Promise((resolve, reject) => {
                                const element = document.querySelector(selector);
                                if (element) {
                                    resolve(element);
                                    return;
                                }
                                
                                const observer = new MutationObserver(() => {
                                    const element = document.querySelector(selector);
                                    if (element) {
                                        observer.disconnect();
                                        resolve(element);
                                    }
                                });
                                
                                observer.observe(document.body, {
                                    childList: true,
                                    subtree: true
                                });
                                
                                setTimeout(() => {
                                    observer.disconnect();
                                    reject(new Error('Element not found'));
                                }, timeout);
                            });
                        }
                    }
                };
                
                // Ekspos PKM ke window untuk module
                window.PKM = PKM;
                window.PKM_Modules = window.PKM_Modules || {};
                window.PKM_Modules[moduleId] = PKM;
                
                // MODULE CODE START
                ${code}
                // MODULE CODE END
                
                // Cleanup
                window.PKM = null;
                
                // Dispatch event
                document.dispatchEvent(new CustomEvent('pkm:module-loaded', {
                    detail: { moduleId, moduleConfig }
                }));
                
            })();
            `;
            
            script.textContent = wrappedCode;
            document.head.appendChild(script);
        }
        
        showUpdateNotification(version) {
            if (typeof GM_notification === 'function') {
                GM_notification({
                    title: '🔄 PKMKedawung Update Tersedia',
                    text: `Versi ${version} sudah rilis!\nKlik untuk melihat perubahan.`,
                    timeout: 10000,
                    onclick: () => {
                        window.open(CONFIG.REPO_PAGE + '/releases', '_blank');
                    }
                });
            }
            
            // Juga tampilkan di console
            console.log('%c🔄 PEMBARUAN TERSEDIA!', 'background: linear-gradient(90deg, #667eea, #764ba2); color: white; padding: 10px; border-radius: 5px; font-weight: bold;');
            console.log(`%cVersi ${version} dari PKMKedawung sudah tersedia!`, 'color: #3498db; font-weight: bold;');
            console.log(`%cKunjungi: ${CONFIG.REPO_PAGE}`, 'color: #7f8c8d;');
        }
        
        setupDashboard() {
            // Buat floating button
            const dashboardBtn = document.createElement('div');
            dashboardBtn.id = 'pkm-dashboard-btn';
            dashboardBtn.innerHTML = '🔧';
            dashboardBtn.title = 'PKMKedawung Dashboard';
            
            Object.assign(dashboardBtn.style, {
                position: 'fixed',
                bottom: '20px',
                right: '20px',
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                backgroundColor: '#667eea',
                color: 'white',
                fontSize: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                zIndex: '999999',
                boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
                transition: 'all 0.3s ease'
            });
            
            dashboardBtn.addEventListener('mouseenter', () => {
                dashboardBtn.style.transform = 'scale(1.1)';
                dashboardBtn.style.backgroundColor = '#764ba2';
            });
            
            dashboardBtn.addEventListener('mouseleave', () => {
                dashboardBtn.style.transform = 'scale(1)';
                dashboardBtn.style.backgroundColor = '#667eea';
            });
            
            dashboardBtn.addEventListener('click', () => this.showDashboard());
            
            document.body.appendChild(dashboardBtn);
        }
        
        showDashboard() {
            // Hapus dashboard lama jika ada
            const oldDashboard = document.getElementById('pkm-dashboard');
            if (oldDashboard) oldDashboard.remove();
            
            // Buat dashboard
            const dashboard = document.createElement('div');
            dashboard.id = 'pkm-dashboard';
            
            // Generate modules list HTML
            let modulesHTML = '';
            const modules = this.modulesConfig.modules || {};
            
            for (const [moduleId, moduleConfig] of Object.entries(modules)) {
                const isEnabled = this.enabledModules[moduleId] !== false;
                const isLoaded = this.activeModules.has(moduleId);
                
                modulesHTML += `
                <div class="pkm-module-card ${isEnabled ? 'enabled' : 'disabled'}">
                    <div class="module-header">
                        <h3>${moduleConfig.name}</h3>
                        <span class="module-version">v${moduleConfig.version}</span>
                    </div>
                    <p class="module-desc">${moduleConfig.description || 'No description'}</p>
                    <div class="module-meta">
                        <span>👤 ${moduleConfig.author}</span>
                        <span>📁 ${moduleId}.js</span>
                        <span>${isLoaded ? '✅ Loaded' : '⏸️ Not loaded'}</span>
                    </div>
                    <div class="module-actions">
                        <label class="toggle-switch">
                            <input type="checkbox" ${isEnabled ? 'checked' : ''} 
                                   data-module="${moduleId}" class="module-toggle">
                            <span class="toggle-slider"></span>
                        </label>
                        <button class="btn-reload" data-module="${moduleId}">🔄 Reload</button>
                    </div>
                </div>
                `;
            }
            
            dashboard.innerHTML = `
            <div class="pkm-dashboard-container">
                <div class="dashboard-header">
                    <h2>🔧 PKMKedawung Dashboard</h2>
                    <button class="btn-close">×</button>
                </div>
                
                <div class="dashboard-info">
                    <div class="info-card">
                        <h3>Loader Info</h3>
                        <p>Version: v${CONFIG.LOADER_VERSION}</p>
                        <p>Active Modules: ${this.activeModules.size}</p>
                        <p>Total Modules: ${Object.keys(modules).length}</p>
                    </div>
                    <div class="info-card">
                        <h3>Actions</h3>
                        <button class="btn-action" id="pkm-reload-all">🔄 Reload All Modules</button>
                        <button class="btn-action" id="pkm-check-updates">🔍 Check Updates</button>
                        <button class="btn-action" id="pkm-open-repo">📂 Open Repository</button>
                    </div>
                </div>
                
                <div class="modules-section">
                    <h3>📁 Modules Management</h3>
                    <div class="modules-grid">
                        ${modulesHTML || '<p class="no-modules">No modules found</p>'}
                    </div>
                </div>
                
                <div class="dashboard-footer">
                    <p>PKMKedawung Modular System • <a href="${CONFIG.REPO_PAGE}" target="_blank">GitHub Repository</a></p>
                </div>
            </div>
            `;
            
            document.body.appendChild(dashboard);
            
            // Add event listeners
            dashboard.querySelector('.btn-close').addEventListener('click', () => {
                dashboard.remove();
            });
            
            // Toggle switches
            dashboard.querySelectorAll('.module-toggle').forEach(toggle => {
                toggle.addEventListener('change', (e) => {
                    const moduleId = e.target.dataset.module;
                    this.toggleModule(moduleId, e.target.checked);
                });
            });
            
            // Reload buttons
            dashboard.querySelectorAll('.btn-reload').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const moduleId = e.target.dataset.module;
                    this.reloadModule(moduleId);
                });
            });
            
            // Action buttons
            document.getElementById('pkm-reload-all').addEventListener('click', () => {
                this.reloadAllModules();
            });
            
            document.getElementById('pkm-check-updates').addEventListener('click', () => {
                this.checkForUpdates();
                this.log('Manual update check triggered', 'info');
            });
            
            document.getElementById('pkm-open-repo').addEventListener('click', () => {
                window.open(CONFIG.REPO_PAGE, '_blank');
            });
            
            // Close on ESC
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') dashboard.remove();
            });
        }
        
        toggleModule(moduleId, enable) {
            this.enabledModules[moduleId] = enable;
            GM_setValue('enabled_modules', JSON.stringify(this.enabledModules));
            
            if (enable) {
                const moduleConfig = this.modulesConfig.modules[moduleId];
                if (moduleConfig && this.shouldLoadModule(moduleConfig)) {
                    this.loadModule(moduleId, moduleConfig);
                }
            } else {
                // Unload module
                const script = document.getElementById(`pkm-module-${moduleId}`);
                if (script) script.remove();
                this.activeModules.delete(moduleId);
            }
            
            this.log(`Module ${moduleId} ${enable ? 'enabled' : 'disabled'}`, 'config');
        }
        
        async reloadModule(moduleId) {
            // Unload dulu
            const script = document.getElementById(`pkm-module-${moduleId}`);
            if (script) script.remove();
            this.activeModules.delete(moduleId);
            
            // Load ulang
            const moduleConfig = this.modulesConfig.modules[moduleId];
            if (moduleConfig && this.enabledModules[moduleId] !== false) {
                await this.loadModule(moduleId, moduleConfig);
                this.log(`Module ${moduleId} reloaded`, 'module');
            }
        }
        
        async reloadAllModules() {
            this.log('Reloading all modules...', 'loader');
            
            // Unload semua
            this.activeModules.forEach((_, moduleId) => {
                const script = document.getElementById(`pkm-module-${moduleId}`);
                if (script) script.remove();
            });
            this.activeModules.clear();
            
            // Load ulang
            await this.loadActiveModules();
            
            this.log('All modules reloaded', 'loader');
        }
        
        registerMenuCommands() {
            if (typeof GM_registerMenuCommand === 'function') {
                GM_registerMenuCommand('📊 Show Dashboard', () => this.showDashboard(), 'D');
                GM_registerMenuCommand('🔄 Reload All Modules', () => this.reloadAllModules(), 'R');
                GM_registerMenuCommand('🔍 Check Updates', () => this.checkForUpdates(), 'U');
                GM_registerMenuCommand('📂 Open Repository', () => window.open(CONFIG.REPO_PAGE, '_blank'), 'G');
            }
        }
        
        setupPeriodicChecks() {
            // Cek update setiap interval
            setInterval(() => this.checkForUpdates(), CONFIG.UPDATE_CHECK_INTERVAL);
            
            // Clear cache setelah duration
            setInterval(() => {
                GM_setValue('modules_cache', '');
                GM_setValue('modules_timestamp', '');
            }, CONFIG.CACHE_DURATION);
        }
        
        async fetch(url) {
            return new Promise((resolve, reject) => {
                GM_xmlhttpRequest({
                    method: 'GET',
                    url: url,
                    timeout: 15000,
                    onload: function(response) {
                        if (response.status === 200) {
                            resolve(response.responseText);
                        } else {
                            reject(new Error(`HTTP ${response.status}`));
                        }
                    },
                    onerror: reject,
                    ontimeout: () => reject(new Error('Request timeout'))
                });
            });
        }
        
        compareVersions(a, b) {
            const aParts = a.split('.').map(Number);
            const bParts = b.split('.').map(Number);
            
            for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
                const aVal = aParts[i] || 0;
                const bVal = bParts[i] || 0;
                if (aVal !== bVal) return aVal - bVal;
            }
            return 0;
        }
        
        log(message, type = 'info') {
            const styles = {
                loader: 'color: #667eea; font-weight: bold',
                config: 'color: #3498db',
                module: 'color: #2ecc71',
                error: 'color: #e74c3c',
                info: 'color: #7f8c8d'
            };
            
            const prefix = type === 'loader' ? '🚀 PKMKedawung' : '📦 PKM';
            console.log(`%c${prefix}: ${message}`, styles[type] || styles.info);
        }
        
        initStyles() {
            const css = `
            /* PKMKedawung Dashboard Styles */
            #pkm-dashboard {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.7);
                z-index: 1000000;
                display: flex;
                justify-content: center;
                align-items: center;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            }
            
            .pkm-dashboard-container {
                background: white;
                width: 90%;
                max-width: 1000px;
                max-height: 90vh;
                border-radius: 12px;
                box-shadow: 0 10px 40px rgba(0,0,0,0.3);
                overflow: hidden;
                display: flex;
                flex-direction: column;
            }
            
            .dashboard-header {
                background: linear-gradient(90deg, #667eea, #764ba2);
                color: white;
                padding: 20px;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .dashboard-header h2 {
                margin: 0;
                font-size: 1.5em;
            }
            
            .btn-close {
                background: none;
                border: none;
                color: white;
                font-size: 28px;
                cursor: pointer;
                padding: 0;
                width: 30px;
                height: 30px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
                transition: background 0.3s;
            }
            
            .btn-close:hover {
                background: rgba(255,255,255,0.2);
            }
            
            .dashboard-info {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 20px;
                padding: 20px;
                border-bottom: 1px solid #eee;
            }
            
            .info-card {
                background: #f8f9fa;
                padding: 15px;
                border-radius: 8px;
                border-left: 4px solid #667eea;
            }
            
            .info-card h3 {
                margin-top: 0;
                color: #333;
            }
            
            .btn-action {
                display: block;
                width: 100%;
                margin: 5px 0;
                padding: 10px;
                background: #667eea;
                color: white;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                font-size: 14px;
                transition: background 0.3s;
            }
            
            .btn-action:hover {
                background: #764ba2;
            }
            
            .modules-section {
                padding: 20px;
                overflow-y: auto;
                flex-grow: 1;
            }
            
            .modules-section h3 {
                margin-top: 0;
                color: #333;
            }
            
            .modules-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                gap: 15px;
            }
            
            .pkm-module-card {
                background: white;
                border: 1px solid #e0e0e0;
                border-radius: 8px;
                padding: 15px;
                transition: all 0.3s;
            }
            
            .pkm-module-card.enabled {
                border-left: 4px solid #2ecc71;
            }
            
            .pkm-module-card.disabled {
                border-left: 4px solid #e74c3c;
                opacity: 0.7;
            }
            
            .module-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 10px;
            }
            
            .module-header h3 {
                margin: 0;
                font-size: 16px;
                color: #333;
            }
            
            .module-version {
                background: #f1f1f1;
                padding: 2px 8px;
                border-radius: 10px;
                font-size: 12px;
                color: #666;
            }
            
            .module-desc {
                color: #666;
                font-size: 14px;
                margin: 10px 0;
                line-height: 1.4;
            }
            
            .module-meta {
                display: flex;
                justify-content: space-between;
                font-size: 12px;
                color: #888;
                margin: 10px 0;
            }
            
            .module-actions {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-top: 10px;
            }
            
            .toggle-switch {
                position: relative;
                display: inline-block;
                width: 50px;
                height: 24px;
            }
            
            .toggle-switch input {
                opacity: 0;
                width: 0;
                height: 0;
            }
            
            .toggle-slider {
                position: absolute;
                cursor: pointer;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background-color: #ccc;
                transition: .4s;
                border-radius: 24px;
            }
            
            .toggle-slider:before {
                position: absolute;
                content: "";
                height: 16px;
                width: 16px;
                left: 4px;
                bottom: 4px;
                background-color: white;
                transition: .4s;
                border-radius: 50%;
            }
            
            input:checked + .toggle-slider {
                background-color: #2ecc71;
            }
            
            input:checked + .toggle-slider:before {
                transform: translateX(26px);
            }
            
            .btn-reload {
                background: #3498db;
                color: white;
                border: none;
                padding: 5px 10px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 12px;
                transition: background 0.3s;
            }
            
            .btn-reload:hover {
                background: #2980b9;
            }
            
            .dashboard-footer {
                padding: 15px 20px;
                background: #f8f9fa;
                text-align: center;
                color: #666;
                font-size: 14px;
                border-top: 1px solid #eee;
            }
            
            .dashboard-footer a {
                color: #667eea;
                text-decoration: none;
            }
            
            .dashboard-footer a:hover {
                text-decoration: underline;
            }
            
            .no-modules {
                grid-column: 1 / -1;
                text-align: center;
                color: #666;
                padding: 40px;
            }
            `;
            
            GM_addStyle(css);
        }
    }
    
    // ==================== INITIALIZATION ====================
    // Tunggu DOM siap
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.PKMLoader = new PKMModularLoader();
            window.PKMLoader.initialize();
        });
    } else {
        window.PKMLoader = new PKMModularLoader();
        window.PKMLoader.initialize();
    }
    
})();
