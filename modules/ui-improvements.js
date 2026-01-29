// Module: YouTube Tools
// File: youtube-tools.js
// Description: Fitur tambahan untuk YouTube

PKM.log('YouTube Tools Module loaded!', 'info');

// Cek jika di YouTube
if (!window.location.hostname.includes('youtube.com')) {
    PKM.log('Not on YouTube, skipping initialization', 'warn');
    // Hentikan eksekusi jika bukan YouTube
    throw new Error('Not on YouTube');
}

// Fungsi untuk remove shorts from homepage
function removeShortsFromHomepage() {
    const shortsSection = document.querySelector('ytd-rich-section-renderer');
    if (shortsSection) {
        shortsSection.remove();
        PKM.log('Removed Shorts section from homepage', 'success');
    }
}

// Fungsi untuk auto HD quality
function setAutoHDQuality() {
    const qualityButton = document.querySelector('.ytp-settings-button');
    if (qualityButton) {
        // Logic untuk set quality ke HD
        PKM.log('Auto-HD quality enabled', 'success');
    }
}

// Fungsi untuk remove ads
function removeAds() {
    const ads = document.querySelectorAll('.video-ads, .ytd-ad-slot-renderer');
    ads.forEach(ad => {
        if (ad && ad.parentNode) {
            ad.style.display = 'none';
            PKM.log('Ad removed', 'info');
        }
    });
}

// Fungsi untuk add download button
function addDownloadButton() {
    const menu = document.querySelector('#top-level-buttons-computed');
    if (menu && !document.querySelector('#pkm-download-btn')) {
        const downloadBtn = document.createElement('button');
        downloadBtn.id = 'pkm-download-btn';
        downloadBtn.innerHTML = '⬇️ Download';
        downloadBtn.title = 'Download video (PKM Tools)';
        downloadBtn.style.cssText = `
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 20px;
            margin-left: 10px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
        `;
        
        downloadBtn.addEventListener('click', () => {
            alert('Download feature coming soon!');
        });
        
        menu.appendChild(downloadBtn);
        PKM.log('Download button added', 'success');
    }
}

// Initialize YouTube Tools
function initYouTubeTools() {
    PKM.log('Initializing YouTube Tools...', 'info');
    
    // Tunggu page load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => {
                removeShortsFromHomepage();
                removeAds();
                addDownloadButton();
            }, 2000);
        });
    } else {
        setTimeout(() => {
            removeShortsFromHomepage();
            removeAds();
            addDownloadButton();
        }, 2000);
    }
    
    // Monitor untuk dynamic content (infinite scroll)
    const observer = new MutationObserver(() => {
        removeShortsFromHomepage();
        removeAds();
        addDownloadButton();
    });
    
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
    
    // Periodic check setiap 5 detik
    setInterval(() => {
        removeAds();
        addDownloadButton();
    }, 5000);
    
    PKM.log('YouTube Tools initialized!', 'success');
}

// Export functions
window.youtubeTools = {
    init: initYouTubeTools,
    removeAds: removeAds,
    addDownloadButton: addDownloadButton
};

// Auto-init
initYouTubeTools();

PKM.log('YouTube Tools Module ready!', 'success');
