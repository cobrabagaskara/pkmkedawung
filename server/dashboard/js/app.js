/* =============================================================================
   PKM Kedawung Screening Dashboard - Main Application
   ============================================================================= */

class PKMDashboard {
  constructor() {
    this.categories = [];
    this.modules = [];
    this.filteredModules = [];
    this.activeModules = [];
    this.enabledUtilities = [];
    this.currentTheme = 'light';
    this.init();
  }

  async init() {
    console.log('🏥 Initializing PKM Dashboard...');
    
    // Get status from parent (loader)
    this.requestStatusFromParent();
    
    // Load data
    await this.loadData();
    
    // Render UI
    this.renderUI();
    
    // Setup event listeners
    this.setupEventListeners();
    
    // Restore saved theme
    this.restoreTheme();
    
    console.log('✅ PKM Dashboard initialized!');
  }

  requestStatusFromParent() {
    // Request current status from loader
    window.parent.postMessage({
      action: 'get_status'
    }, '*');
    
    // Listen for response
    window.addEventListener('message', (event) => {
      // Accept messages from parent only
      if (event.source !== window.parent) return;
      
      if (event.data.action === 'status_response') {
        this.activeModules = event.data.activeModules || [];
        this.enabledUtilities = event.data.enabledUtilities || [];
        this.renderCategories(); // Re-render to show status
      }
    });
  }

  async loadData() {
    try {
      // Load categories
      const categoriesResponse = await fetch('../config/categories.json');
      const categoriesData = await categoriesResponse.json();
      this.categories = categoriesData.categories;
      
      // Load modules
      const modulesResponse = await fetch('../config/modules.json');
      const modulesData = await modulesResponse.json();
      this.modules = modulesData.modules;
      this.filteredModules = [...this.modules];
      
      // Update stats
      this.updateStats();
      
      console.log(`📋 Loaded ${this.categories.length} categories`);
      console.log(`📦 Loaded ${this.modules.length} modules`);
      
    } catch (error) {
      console.error('❌ Failed to load data:', error);
      this.showError('Gagal memuat data. Silakan refresh halaman.');
    }
  }

  renderUI() {
    // Render categories
    this.renderCategories();
    
    // Render category filter options
    this.renderCategoryFilter();
  }

  renderCategories() {
    const container = document.getElementById('categories-container');
    
    if (!container) {
      console.error('Container #categories-container not found');
      return;
    }
    
    if (this.categories.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📋</div>
          <h3>Tidak ada kategori</h3>
          <p>Belum ada data kategori yang tersedia</p>
        </div>
      `;
      return;
    }
    
    // Group modules by category
    const modulesByCategory = this.categories.reduce((acc, category) => {
      acc[category.id] = this.filteredModules.filter(
        module => module.category === category.id
      );
      return acc;
    }, {});
    
    // Render categories
    const categoriesHTML = this.categories
      .sort((a, b) => a.order - b.order)
      .map(category => {
        const categoryModules = modulesByCategory[category.id] || [];
        return this.renderCategory(category, categoryModules);
      })
      .join('');
    
    container.innerHTML = categoriesHTML;
  }

  renderCategory(category, modules) {
    const hasModules = modules.length > 0;
    
    return `
      <div class="category-card category-${category.id}" data-category="${category.id}">
        <div class="category-header" onclick="window.dashboard.toggleCategory('${category.id}')">
          <span class="category-icon">${category.icon}</span>
          <span class="category-name">${category.name}</span>
          <span class="category-count">${modules.length} modul</span>
          <span class="toggle-icon">▼</span>
        </div>
        <div class="category-modules" id="modules-${category.id}">
          ${hasModules 
            ? modules.map(module => this.renderModule(module)).join('')
            : `<div class="empty-state">
                 <p style="padding: 20px; text-align: center; color: var(--text-secondary);">
                   Tidak ada modul dalam kategori ini
                 </p>
               </div>`
          }
        </div>
      </div>
    `;
  }

  renderModule(module) {
    // Check if module is active
    const isActive = this.activeModules.includes(module.id);
    const isEnabled = this.enabledUtilities.includes(module.id);
    
    // Determine button text & style
    let buttonText = 'Jalankan';
    let buttonClass = 'btn-run';
    let buttonDisabled = false;
    let statusBadge = '';
    
    if (module.type === 'screening') {
      // Screening modules
      if (isActive) {
        buttonText = '✅ Aktif';
        buttonClass = 'btn-success';
        buttonDisabled = true;
        statusBadge = '<span class="badge badge-auto">Auto</span>';
      }
    } else if (module.type === 'utility') {
      // Utility modules
      if (isEnabled) {
        buttonText = '🔌 ON';
        buttonClass = 'btn-success';
      } else {
        buttonText = '🔌 OFF';
        buttonClass = 'btn-secondary';
      }
      statusBadge = '<span class="badge badge-manual">Manual</span>';
    }
    
    // Show URL patterns
    const urlBadge = module.match && module.match.length > 0 
      ? `<div class="module-url">${this.renderUrlBadge(module.match)}</div>`
      : '';
    
    return `
      <div class="module-item" data-module="${module.id}">
        <div class="module-info">
          <div class="module-header">
            <span class="module-name">${module.name}</span>
            ${statusBadge}
          </div>
          <span class="module-desc">${module.description}</span>
          ${urlBadge}
        </div>
        <button class="${buttonClass}" 
                ${buttonDisabled ? 'disabled' : ''}
                onclick="window.dashboard.toggleModule('${module.id}')">
          ${buttonText}
        </button>
      </div>
    `;
  }

  renderUrlBadge(urlPatterns) {
    if (!urlPatterns || urlPatterns.length === 0) return '';
    
    return urlPatterns.map(pattern => `
      <span class="url-badge" title="${pattern}">
        ${this.simplifyUrl(pattern)}
      </span>
    `).join('');
  }

  simplifyUrl(url) {
    // Simplify URL for display
    // Example: "https://e-puskesmas.cirebonkab.go.id/skrining/*" 
    // -> "/skrining/*"
    try {
      const urlObj = new URL(url.replace(/\*/g, ''));
      return url.replace(urlObj.origin, '');
    } catch {
      return url;
    }
  }

  renderCategoryFilter() {
    const filterSelect = document.getElementById('category-filter');
    
    if (!filterSelect) return;
    
    const optionsHTML = this.categories
      .sort((a, b) => a.order - b.order)
      .map(category => `
        <option value="${category.id}">${category.name}</option>
      `)
      .join('');
    
    filterSelect.innerHTML = `
      <option value="all">Semua Kategori</option>
      ${optionsHTML}
    `;
  }

  updateStats() {
    const totalModules = document.getElementById('total-modules');
    const totalCategories = document.getElementById('total-categories');
    const lastUpdate = document.getElementById('last-update');
    
    if (totalModules) totalModules.textContent = this.modules.length;
    if (totalCategories) totalCategories.textContent = this.categories.length;
    if (lastUpdate) {
      const now = new Date();
      lastUpdate.textContent = now.toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  }

  setupEventListeners() {
    // Close button
    const closeButton = document.querySelector('.btn-primary[onclick*="close"]');
    if (closeButton) {
      closeButton.addEventListener('click', () => {
        window.parent.postMessage('close', '*');
      });
    }
    
    // Theme switcher buttons
    document.querySelectorAll('.theme-button').forEach(button => {
      button.addEventListener('click', (e) => {
        const theme = button.getAttribute('data-theme');
        this.setTheme(theme);
      });
    });
  }

  toggleCategory(categoryId) {
    const categoryEl = document.querySelector(`[data-category="${categoryId}"]`);
    const modulesEl = categoryEl.querySelector('.category-modules');
    const toggleIcon = categoryEl.querySelector('.toggle-icon');
    
    if (!modulesEl) return;
    
    const isExpanded = modulesEl.classList.contains('expanded');
    
    modulesEl.classList.toggle('expanded', !isExpanded);
    toggleIcon.style.transform = isExpanded ? 'rotate(0deg)' : 'rotate(180deg)';
    
    // Save state
    this.saveCategoryState(categoryId, !isExpanded);
  }

  toggleModule(moduleId) {
    const module = this.modules.find(m => m.id === moduleId);
    
    if (!module) {
      this.showError(`Modul ${moduleId} tidak ditemukan`);
      return;
    }
    
    if (module.type === 'screening') {
      // Screening: manual run (override auto-run)
      this.showWarning('Modul screening sudah auto-run. Manual run akan override.');
      this.runModule(moduleId);
    } else if (module.type === 'utility') {
      // Utility: toggle ON/OFF
      const currentlyEnabled = this.enabledUtilities.includes(moduleId);
      const newEnabled = !currentlyEnabled;
      
      // Send message to parent (loader)
      window.parent.postMessage({
        action: 'toggle_utility',
        moduleId: moduleId,
        enabled: newEnabled
      }, '*');
      
      // Update local state
      if (newEnabled) {
        this.enabledUtilities.push(moduleId);
      } else {
        this.enabledUtilities = this.enabledUtilities.filter(id => id !== moduleId);
      }
      
      // Re-render
      this.renderCategories();
      
      this.showSuccess(`${module.name} ${newEnabled ? 'diaktifkan' : 'dinonaktifkan'}`);
    }
  }

  runModule(moduleId) {
    const module = this.modules.find(m => m.id === moduleId);
    
    if (!module) {
      this.showError(`Modul ${moduleId} tidak ditemukan`);
      return;
    }
    
    this.showSuccess(`Menjalankan modul: ${module.name}`);
    
    // Send message to parent (Tampermonkey loader)
    window.parent.postMessage({
      action: 'run_module',
      moduleId: moduleId
    }, '*');
    
    // Track analytics
    console.log(`▶️ Running module: ${moduleId}`);
  }

  filterModules(query) {
    if (!query || query.trim() === '') {
      this.filteredModules = [...this.modules];
    } else {
      const searchTerm = query.toLowerCase();
      this.filteredModules = this.modules.filter(module => 
        module.name.toLowerCase().includes(searchTerm) ||
        module.description.toLowerCase().includes(searchTerm)
      );
    }
    
    this.renderCategories();
  }

  filterByCategory(categoryId) {
    if (categoryId === 'all') {
      this.filteredModules = [...this.modules];
    } else {
      this.filteredModules = this.modules.filter(
        module => module.category === categoryId
      );
    }
    
    this.renderCategories();
  }

  setTheme(theme) {
    // Remove active class from all buttons
    document.querySelectorAll('.theme-button').forEach(btn => {
      btn.classList.remove('active');
    });
    
    // Add active class to selected button
    const activeButton = document.querySelector(`.theme-button[data-theme="${theme}"]`);
    if (activeButton) {
      activeButton.classList.add('active');
    }
    
    // Apply theme to body
    document.body.className = `theme-${theme}`;
    
    // Save to localStorage
    localStorage.setItem('pkm_theme', theme);
    this.currentTheme = theme;
    
    this.showSuccess(`Theme diubah ke: ${theme}`);
  }

  restoreTheme() {
    const savedTheme = localStorage.getItem('pkm_theme') || 'light';
    this.setTheme(savedTheme);
  }

  saveCategoryState(categoryId, isExpanded) {
    const states = JSON.parse(localStorage.getItem('pkm_category_states') || '{}');
    states[categoryId] = isExpanded;
    localStorage.setItem('pkm_category_states', JSON.stringify(states));
  }

  restoreCategoryStates() {
    const states = JSON.parse(localStorage.getItem('pkm_category_states') || '{}');
    
    Object.entries(states).forEach(([categoryId, isExpanded]) => {
      const modulesEl = document.getElementById(`modules-${categoryId}`);
      if (modulesEl && isExpanded) {
        modulesEl.classList.add('expanded');
      }
    });
  }

  showSuccess(message) {
    this.showToast(message, 'success', '✅');
  }

  showError(message) {
    this.showToast(message, 'error', '❌');
  }

  showWarning(message) {
    this.showToast(message, 'warning', '⚠️');
  }

  showToast(message, type = 'info', icon = 'ℹ️') {
    // Create toast container if not exists
    let toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.className = 'toast-container';
      document.body.appendChild(toastContainer);
    }
    
    // Create toast
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <span class="toast-icon">${icon}</span>
      <span class="toast-message">${message}</span>
    `;
    
    toastContainer.appendChild(toast);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(400px)';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
}

// Initialize dashboard when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.dashboard = new PKMDashboard();
  
  // Expose methods to global scope for onclick handlers
  window.filterModules = (query) => {
    if (window.dashboard) {
      window.dashboard.filterModules(query);
    }
  };
  
  window.filterByCategory = (categoryId) => {
    if (window.dashboard) {
      window.dashboard.filterByCategory(categoryId);
    }
  };
  
  window.toggleCategory = (categoryId) => {
    if (window.dashboard) {
      window.dashboard.toggleCategory(categoryId);
    }
  };
  
  window.toggleModule = (moduleId) => {
    if (window.dashboard) {
      window.dashboard.toggleModule(moduleId);
    }
  };
  
  window.runModule = (moduleId) => {
    if (window.dashboard) {
      window.dashboard.runModule(moduleId);
    }
  };
});
