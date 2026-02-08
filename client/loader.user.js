// ==UserScript==
// @name         PKM Kedawung Screening Modular
// @namespace    https://github.com/cobrabagaskara/pkmkedawung
// @version      1.0.0
// @description  Sistem otomasi skrining kesehatan modular untuk Puskesmas Kedawung
// @author       Bagas Kurniawan
// @match        https://e-puskesmas.cirebonkab.go.id/*
// @match        http://e-puskesmas.cirebonkab.go.id/*
// @match        https://cirebon.epuskesmas.id/*
// @match        http://cirebon.epuskesmas.id/*
// @grant        GM_xmlhttpRequest
// @grant        GM_getValue
// @grant        GM_setValue
// @connect      raw.githubusercontent.com
// @connect      github.com
// @connect      githubusercontent.com
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
      this.manifest = null;
      this.activeModules = new Map(); // Modules yang sedang running
      this.enabledUtilities = new Set(); // Utilities yang di-enable manual
      this.isInitialized = false;
    }
    
    async init() {
      Logger.log('Initializing PKM Loader v' + CONFIG.CACHE_VERSION);
      
      // Load manifest
      await this.loadManifest();
      
      // Auto-run screening modules
      await this.autoRunScreeningModules();
      
      // Inject UI button
      this.injectUI();
      
      // Setup message listener for manual commands
      this.setupMessageListener();
      
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
    
    async autoRunScreeningModules() {
      if (!this.manifest || !this.manifest.modules) {
        Logger.warn('No manifest available for auto-run');
        return;
      }
      
      Logger.log('Auto-running screening modules...');
      
      const screeningModules = this.manifest.modules.filter(
        module => module.type === 'screening' && module.autoRun === true
      );
      
      // Filter modules yang URL-nya match
      const applicableModules = screeningModules.filter(module => 
        this.isUrlMatch(module.match)
      );
      
      Logger.log(`Found ${applicableModules.length} applicable modules for current URL: ${window.location.href}`);
      
      for (const moduleInfo of applicableModules) {
        try {
          await this.loadAndRunModule(moduleInfo.id);
        } catch (error) {
          Logger.error(`Failed to auto-run module ${moduleInfo.id}:`, error);
        }
      }
      
      Logger.success(`Auto-run completed for ${applicableModules.length} screening modules`);
    }
    
    isUrlMatch(urlPatterns) {
      const currentUrl = window.location.href;
      
      if (!urlPatterns || urlPatterns.length === 0) {
        // No URL pattern = match all
        return true;
      }
      
      for (const pattern of urlPatterns) {
        // Convert wildcard pattern to regex
        const regexPattern = this.patternToRegex(pattern);
        
        if (regexPattern.test(currentUrl)) {
          Logger.log(`✅ URL match: ${currentUrl} matches ${pattern}`);
          return true;
        }
      }
      
      Logger.warn(`❌ No URL match for: ${currentUrl}`);
      return false;
    }
    
    patternToRegex(pattern) {
      // Remove whitespace (handle typo like "create/  *")
      let cleanPattern = pattern.trim().replace(/\s+/g, '');
      
      // Escape special regex characters
      let regex = cleanPattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      
      // Replace wildcard * with .*
      regex = regex.replace(/\\\*/g, '.*');
      
      // Add anchors
      regex = `^${regex}$`;
      
      return new RegExp(regex);
    }
    
    async loadAndRunModule(moduleId) {
      const moduleInfo = this.manifest.modules.find(m => m.id === moduleId);
      if (!moduleInfo) {
        throw new Error(`Module ${moduleId} not found`);
      }
      
      // Check if already running
      if (this.activeModules.has(moduleId)) {
        Logger.log(`Module ${moduleId} already running, skipping`);
        return;
      }
      
      // Build module URL
      const moduleUrl = `${CONFIG.REPO_URL}/${moduleInfo.file}`;
      
      Logger.log(`📥 Loading module: ${moduleId} from ${moduleUrl}`);
      
      try {
        // Load module script
        const response = await fetch(moduleUrl);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        
        const moduleCode = await response.text();
        
        // Execute module
        const moduleFunc = new Function(moduleCode)();
        const moduleInstance = new moduleFunc();
        
        // Run module
        await moduleInstance.init();
        await moduleInstance.run();
        
        // Track active module
        this.activeModules.set(moduleId, {
          instance: moduleInstance,
          info: moduleInfo,
          startedAt: Date.now()
        });
        
        Logger.success(`✅ Module ${moduleId} running`);
        
        // Track analytics
        this.trackAnalytics(moduleId, 'auto_run');
        
      } catch (error) {
        Logger.error(`❌ Failed to load/run module ${moduleId}:`, error);
        throw error;
      }
    }
    
    async toggleUtility(moduleId, enabled) {
      const moduleInfo = this.manifest.modules.find(
        m => m.id === moduleId && m.type === 'utility'
      );
      
      if (!moduleInfo) {
        Logger.error(`Utility ${moduleId} not found or not a utility`);
        return;
      }
      
      if (enabled) {
        // Enable utility
        if (!this.enabledUtilities.has(moduleId)) {
          await this.loadAndRunModule(moduleId);
          this.enabledUtilities.add(moduleId);
          Logger.success(`Utility ${moduleId} enabled`);
        }
      } else {
        // Disable utility
        if (this.enabledUtilities.has(moduleId)) {
          const module = this.activeModules.get(moduleId);
          if (module && module.instance.cleanup) {
            module.instance.cleanup();
          }
          this.activeModules.delete(moduleId);
          this.enabledUtilities.delete(moduleId);
          Logger.log(`Utility ${moduleId} disabled`);
        }
      }
      
      // Save state to localStorage
      localStorage.setItem(
        'pkm_enabled_utilities',
        JSON.stringify(Array.from(this.enabledUtilities))
      );
    }
    
    restoreEnabledUtilities() {
      const saved = localStorage.getItem('pkm_enabled_utilities');
      if (saved) {
        const utilities = JSON.parse(saved);
        utilities.forEach(async (utilityId) => {
          try {
            await this.toggleUtility(utilityId, true);
          } catch (error) {
            Logger.error(`Failed to restore utility ${utilityId}:`, error);
          }
        });
      }
    }
    
    injectUI() {
      // Create button
      const button = document.createElement('button');
      button.textContent = '🏥 PKM Screening';
      button.style.cssText = `
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
      
      button.addEventListener('mouseenter', () => {
        button.style.transform = 'translateY(-2px)';
        button.style.boxShadow = '0 12px 20px rgba(102, 126, 234, 0.6)';
      });
      
      button.addEventListener('mouseleave', () => {
        button.style.transform = 'translateY(0)';
        button.style.boxShadow = '0 8px 16px rgba(102, 126, 234, 0.4)';
      });
      
      button.addEventListener('click', () => this.openDashboard());
      
      document.body.appendChild(button);
      
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
      
      // Pass module status to iframe via URL params
      const activeModuleIds = Array.from(this.activeModules.keys());
      const enabledUtilityIds = Array.from(this.enabledUtilities);
      iframe.src += `?active=${encodeURIComponent(JSON.stringify(activeModuleIds))}&enabled=${encodeURIComponent(JSON.stringify(enabledUtilityIds))}`;
      
      iframeContainer.appendChild(iframe);
      overlay.appendChild(iframeContainer);
      
      // Close handlers
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          overlay.remove();
        }
      });
      
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          overlay.remove();
        }
      }, { once: true });
      
      // Message listener for close
      const closeHandler = (event) => {
        if (event.data === 'close') {
          overlay.remove();
          window.removeEventListener('message', closeHandler);
        }
      };
      
      window.addEventListener('message', closeHandler);
      
      document.body.appendChild(overlay);
      
      Logger.log('Dashboard opened');
    }
    
    setupMessageListener() {
      window.addEventListener('message', async (event) => {
        // Only accept messages from our iframe
        if (event.source !== window) return;
        
        const data = event.data;
        
        if (data.action === 'run_module') {
          // Manual run module
          try {
            await this.loadAndRunModule(data.moduleId);
          } catch (error) {
            Logger.error(`Manual run failed for ${data.moduleId}:`, error);
          }
        } else if (data.action === 'toggle_utility') {
          // Toggle utility ON/OFF
          try {
            await this.toggleUtility(data.moduleId, data.enabled);
          } catch (error) {
            Logger.error(`Toggle utility failed for ${data.moduleId}:`, error);
          }
        } else if (data.action === 'get_status') {
          // Return current status to dashboard
          event.source.postMessage({
            action: 'status_response',
            activeModules: Array.from(this.activeModules.keys()),
            enabledUtilities: Array.from(this.enabledUtilities)
          }, event.origin);
        }
      });
    }
    
    trackAnalytics(moduleId, action, data = null) {
      // Send analytics (future implementation)
      console.log(`📊 Analytics: ${moduleId} - ${action}`);
    }
  }
  
  // ==================== INITIALIZE ====================
  function initialize() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        window.pkmLoader = new PKMLoader();
        window.pkmLoader.init().then(() => {
          // Restore enabled utilities
          window.pkmLoader.restoreEnabledUtilities();
        });
      });
    } else {
      window.pkmLoader = new PKMLoader();
      window.pkmLoader.init().then(() => {
        window.pkmLoader.restoreEnabledUtilities();
      });
    }
  }
  
  // Start initialization
  initialize();
  
})();
