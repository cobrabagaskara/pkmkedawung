// Module: Test Module
// File: test-module.js
// Description: Contoh module untuk testing sistem modular

PKM.log('Test Module di-load!', 'info');

// Contoh: Tambah tombol di halaman
if (document.body) {
    const testButton = document.createElement('button');
    testButton.textContent = '🔄 Test Module';
    testButton.style.cssText = `
        position: fixed;
        bottom: 80px;
        right: 20px;
        padding: 10px 15px;
        background: linear-gradient(90deg, #667eea, #764ba2);
        color: white;
        border: none;
        border-radius: 25px;
        cursor: pointer;
        font-size: 14px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        z-index: 99999;
    `;
    
    testButton.addEventListener('click', () => {
        PKM.log('Tombol test diklik!', 'success');
        alert('Test Module bekerja dengan baik!');
    });
    
    document.body.appendChild(testButton);
    PKM.log('Tombol test ditambahkan', 'success');
}

// Contoh: Simpan data ke storage
PKM.storage.set('last_visit', new Date().toISOString());
const lastVisit = PKM.storage.get('last_visit');
PKM.log(`Last visit: ${lastVisit}`, 'info');

// Contoh: Utility function
async function waitAndModify() {
    try {
        // Tunggu element tertentu muncul
        const header = await PKM.utils.waitForElement('h1, h2, h3', 5000);
        header.style.color = '#667eea';
        PKM.log('Header dimodifikasi', 'success');
    } catch (error) {
        PKM.log('Element tidak ditemukan', 'warn');
    }
}

// Jalankan setelah delay
setTimeout(waitAndModify, 2000);

// Module function yang bisa dipanggil dari luar
window.testModuleFunction = function() {
    return {
        message: 'Hello dari Test Module!',
        version: PKM.version,
        timestamp: new Date().toISOString()
    };
};

// Event listener untuk komunikasi antar module
document.addEventListener('pkm:module-loaded', (event) => {
    if (event.detail.moduleId !== PKM.id) {
        PKM.log(`Module lain di-load: ${event.detail.moduleId}`, 'info');
    }
});

// Export module info
PKM.log('Test Module siap digunakan!', 'success');
