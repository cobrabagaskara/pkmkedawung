// ==UserScript==
// @name         PKM Kedawung Screening Modular
// @namespace    https://github.com/cobrabagaskara/pkmkedawung
// @version      1.0.0
// @description  Sistem otomasi skrining kesehatan modular untuk Puskesmas Kedawung
// @author       Bagas Kurniawan
// @match        https://e-puskesmas.cirebonkab.go.id/*
// @match        http://e-puskesmas.cirebonkab.go.id/*
// @grant        GM_xmlhttpRequest
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// @grant        GM_listValues
// @grant        GM_addStyle
// @connect      raw.githubusercontent.com
// @require      https://code.jquery.com/jquery-3.6.0.min.js
// @updateURL    https://raw.githubusercontent.com/cobrabagaskara/pkmkedawung/main/client/loader.js
// @downloadURL  https://raw.githubusercontent.com/cobrabagaskara/pkmkedawung/main/client/loader.js
// ==/UserScript==

(function() {
  'use strict';
  
  // ==================== CONFIGURATION ====================
  const CONFIG = {
    REPO_URL: 'https://raw.githubusercontent.com/cobrabagaskara/pkmkedawung/main',
    MANIFEST_URL: 'https://raw.githubusercontent.com/cobrabagaskara/pkmkedawung/main/server/config/modules.json',
    SERVER_URL: 'https://cobrabagaskara.github.io/pkmkedawung/',
    CACHE_VERSION: '1.0.0',
    DEBUG: true
  };
  
  // ==================== LOGGER ====================
  const Logger = {
    log: (...args) => CONFIG.DEBUG && console.log('🏥[PKM]', ...args),
    warn: (...args) => console.warn('🏥[PKM]', ...args),
    error: (...args) => console.error('🏥[PKM]', ...args),
    success: (...args) => console.log('✅[PKM]', ...args)
  };
  
  // ==================== PKM LOADER ====================
  class PKMLoader {
    constructor() {
      this.modules = new Map();
      this.manifest = null;
      this.isInitialized = false;
      this.uiButton = null;
    }
    
    async init() {
      Logger.log('Initializing PKM Loader v' + CONFIG.CACHE_VERSION);
      
      // Load manifest
      await this.loadManifest();
      
      // Inject UI
      this.injectUI();
      
      // Setup auto-update
      this.setupAutoUpdate();
      
      this.isInitialized = true;
      Logger.success('PKM Loader initialized successfully!');
    }
    
    async loadManifest() {
      try {
        Logger.log('Loading manifest from:', CONFIG.MANIFEST_URL);
        
        const response = await fetch(CONFIG.MANIFEST_URL);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        
        this.manifest = await response.json();
        Logger.success(`Loaded ${this.manifest.modules.length} modules`);
        
        // Cache manifest
        localStorage.setItem('pkm_manifest', JSON.stringify(this.manifest));
        localStorage.setItem('pkm_manifest_version', CONFIG.CACHE_VERSION);
        
      } catch (error) {
        Logger.error('Failed to load manifest:', error);
        
        // Try cached manifest
        const cached = localStorage.getItem('pkm_manifest');
        if (cached) {
          this.manifest = JSON.parse(cached);
          Logger.log('Using cached manifest');
        } else {
          Logger.error('No cached manifest available');
        }
      }
    }
    
    injectUI() {
      // Create button
      this.uiButton = document.createElement('button');
      this.uiButton.textContent = '🏥 PKM Screening';
      this.uiButton.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 99999;
        padding: 12px 24px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border: none;
        border-radius: 12px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        box-shadow: 0 8px 16px rgba(102, 126, 234, 0.4);
        transition: all 0.3s ease;
      `;
      
      this.uiButton.addEventListener('mouseenter', () => {
        this.uiButton.style.transform = 'translateY(-2px)';
        this.uiButton.style.boxShadow = '0 12px 20px rgba(102, 126, 234, 0.6)';
      });
      
      this.uiButton.addEventListener('mouseleave', () => {
        this.uiButton.style.transform = 'translateY(0)';
        this.uiButton.style.boxShadow = '0 8px 16px rgba(102, 126, 234, 0.4)';
      });
      
      this.uiButton.addEventListener('click', () => this.openDashboard());
      
      document.body.appendChild(this.uiButton);
      
      Logger.success('UI button injected');
    }
    
    openDashboard() {
      // Create modal overlay
      const overlay = document.createElement('div');
      overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        z-index: 999999;
        display: flex;
        align-items: center;
        justify-content: center;
        backdrop-filter: blur(5px);
      `;
      
      // Create iframe container
      const iframeContainer = document.createElement('div');
      iframeContainer.style.cssText = `
        width: 95%;
        height: 90%;
        background: white;
        border-radius: 20px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        overflow: hidden;
        position: relative;
      `;
      
      // Create iframe
      const iframe = document.createElement('iframe');
      iframe.src = CONFIG.SERVER_URL + 'server/dashboard/';
      iframe.style.cssText = `
        width: 100%;
        height: 100%;
        border: none;
      `;
      
      iframeContainer.appendChild(iframe);
      overlay.appendChild(iframeContainer);
      
      // Close on click outside
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          overlay.remove();
        }
      });
      
      // Close on Escape key
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          overlay.remove();
        }
      }, { once: true });
      
      document.body.appendChild(overlay);
      
      Logger.log('Dashboard opened');
    }
    
    setupAutoUpdate() {
      // Check for updates every hour
      setInterval(async () => {
        try {
          const response = await fetch(CONFIG.MANIFEST_URL + '?_=' + Date.now());
          const manifest = await response.json();
          
          if (manifest.version !== CONFIG.CACHE_VERSION) {
            Logger.warn('New version available:', manifest.version);
            // Reload page to get updates
            location.reload();
          }
        } catch (error) {
          Logger.error('Update check failed:', error);
        }
      }, 3600000); // 1 hour
    }
  }
  
  // ==================== INITIALIZE ====================
  function initialize() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        window.pkmLoader = new PKMLoader();
        window.pkmLoader.init();
      });
    } else {
      window.pkmLoader = new PKMLoader();
      window.pkmLoader.init();
    }
  }
  
  // Start initialization
  initialize();
  
})();
