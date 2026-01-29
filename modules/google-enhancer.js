// Module: Google Enhancer
// File: google-enhancer.js
// Description: Perbaikan UI untuk Google Search

PKM.log('Google Enhancer Module loaded!', 'info');

// Cek jika di Google
if (!window.location.hostname.includes('google.com')) {
    PKM.log('Not on Google, skipping initialization', 'warn');
    // Hentikan eksekusi jika bukan Google
    throw new Error('Not on Google');
}

// Fungsi untuk dark mode toggle
function addDarkModeToggle() {
    if (document.querySelector('#pkm-dark-mode-toggle')) return;
    
    const toggle = document.createElement('button');
    toggle.id = 'pkm-dark-mode-toggle';
    toggle.innerHTML = '🌙';
    toggle.title = 'Toggle Dark Mode';
    toggle.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        width: 50px;
        height: 50px;
        background: linear-gradient(135deg, #667eea, #764ba2);
        color: white;
        border: none;
        border-radius: 50%;
        font-size: 24px;
        cursor: pointer;
        z-index: 99999;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        transition: all 0.3s ease;
    `;
    
    toggle.addEventListener('click', () => {
        const isDark = document.body.classList.toggle('pkm-dark-mode');
        toggle.innerHTML = isDark ? '☀️' : '🌙';
        
        // Simpan preference
        PKM.storage.set('dark_mode', isDark);
        
        // Terapkan dark mode styles
        if (isDark) {
            const darkStyle = document.createElement('style');
            darkStyle.id = 'pkm-dark-style';
            darkStyle.textContent = `
                body, #searchform, .RNNXgb {
                    background-color: #1a1a1a !important;
                    color: #e0e0e0 !important;
                }
                a, h3 {
                    color: #bb86fc !important;
                }
                .g {
                    background-color: #2d2d2d !important;
                    border-radius: 8px;
                    padding: 15px !important;
                }
            `;
            document.head.appendChild(darkStyle);
            PKM.log('Dark mode enabled', 'success');
        } else {
            const darkStyle = document.getElementById('pkm-dark-style');
            if (darkStyle) darkStyle.remove();
            PKM.log('Dark mode disabled', 'success');
        }
    });
    
    document.body.appendChild(toggle);
    
    // Load saved preference
    const savedDarkMode = PKM.storage.get('dark_mode');
    if (savedDarkMode) {
        setTimeout(() => toggle.click(), 500);
    }
    
    PKM.log('Dark mode toggle added', 'success');
}

// Fungsi untuk remove promoted ads
function removePromotedAds() {
    const ads = document.querySelectorAll('.uEierd, .commercial-unit, [data-text-ad]');
    ads.forEach(ad => {
        if (ad && ad.parentNode) {
            ad.style.display = 'none';
            PKM.log('Promoted ad removed', 'info');
        }
    });
}

// Fungsi untuk improve search result cards
function improveSearchResults() {
    const results = document.querySelectorAll('.g');
    results.forEach((result, index) => {
        // Tambah border dan shadow
        if (!result.style.boxShadow) {
            result.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
            result.style.borderRadius = '8px';
            result.style.padding = '15px';
            result.style.marginBottom = '20px';
            result.style.transition = 'transform 0.2s ease';
            
            // Hover effect
            result.addEventListener('mouseenter', () => {
                result.style.transform = 'translateY(-2px)';
                result.style.boxShadow = '0 4px 15px rgba(0,0,0,0.15)';
            });
            
            result.addEventListener('mouseleave', () => {
                result.style.transform = 'translateY(0)';
                result.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
            });
        }
    });
    
    if (results.length > 0) {
        PKM.log(`Improved ${results.length} search results`, 'success');
    }
}

// Fungsi untuk add quick tools bar
function addQuickToolsBar() {
    if (document.querySelector('#pkm-quick-tools')) return;
    
    const toolsBar = document.createElement('div');
    toolsBar.id = 'pkm-quick-tools';
    toolsBar.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(255,255,255,0.95);
        backdrop-filter: blur(10px);
        border-radius: 25px;
        padding: 10px 20px;
        display: flex;
        gap: 15px;
        box-shadow: 0 8px 25px rgba(0,0,0,0.2);
        z-index: 99998;
        border: 1px solid rgba(0,0,0,0.1);
    `;
    
    const tools = [
        { icon: '🔍', title: 'Focus Search', action: () => document.querySelector('input[name="q"]')?.focus() },
        { icon: '📋', title: 'Copy URL', action: () => navigator.clipboard.writeText(window.location.href) },
        { icon: '🎨', title: 'Themes', action: () => alert('Theme selector coming soon!') },
        { icon: '📊', title: 'Stats', action: () => alert(`${document.querySelectorAll('.g').length} results found`) }
    ];
    
    tools.forEach(tool => {
        const btn = document.createElement('button');
        btn.innerHTML = tool.icon;
        btn.title = tool.title;
        btn.style.cssText = `
            background: none;
            border: none;
            font-size: 20px;
            cursor: pointer;
            padding: 5px;
            border-radius: 50%;
            transition: all 0.2s ease;
        `;
        
        btn.addEventListener('mouseenter', () => {
            btn.style.background = 'rgba(102, 126, 234, 0.1)';
            btn.style.transform = 'scale(1.1)';
        });
        
        btn.addEventListener('mouseleave', () => {
            btn.style.background = 'none';
            btn.style.transform = 'scale(1)';
        });
        
        btn.addEventListener('click', tool.action);
        
        toolsBar.appendChild(btn);
    });
    
    document.body.appendChild(toolsBar);
    PKM.log('Quick tools bar added', 'success');
}

// Initialize Google Enhancer
function initGoogleEnhancer() {
    PKM.log('Initializing Google Enhancer...', 'info');
    
    // Tunggu page load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => {
                addDarkModeToggle();
                removePromotedAds();
                improveSearchResults();
                addQuickToolsBar();
            }, 1500);
        });
    } else {
        setTimeout(() => {
            addDarkModeToggle();
            removePromotedAds();
            improveSearchResults();
            addQuickToolsBar();
        }, 1500);
    }
    
    // Periodic check untuk dynamic content
    setInterval(() => {
        removePromotedAds();
        improveSearchResults();
    }, 3000);
    
    // Observer untuk infinite scroll
    const observer = new MutationObserver(() => {
        removePromotedAds();
        improveSearchResults();
    });
    
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
    
    PKM.log('Google Enhancer initialized!', 'success');
}

// Export functions
window.googleEnhancer = {
    init: initGoogleEnhancer,
    toggleDarkMode: () => document.querySelector('#pkm-dark-mode-toggle')?.click(),
    removeAds: removePromotedAds
};

// Auto-init
initGoogleEnhancer();

PKM.log('Google Enhancer Module ready!', 'success');
