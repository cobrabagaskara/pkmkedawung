// modules/test-simple-fixed.js
// Test Module - Simple and Solid

console.log('🔧 Test Simple Fixed Module: Loading...');

// Simple function to add a button
function addTestButton() {
    console.log('🛠️ Test: Adding button...');
    
    // Remove old button if exists
    const oldBtn = document.getElementById('test-fixed-btn');
    if (oldBtn) oldBtn.remove();
    
    // Create button
    const btn = document.createElement('button');
    btn.id = 'test-fixed-btn';
    btn.textContent = '✅ TEST SOLID';
    btn.title = 'Test Button from Solid Module';
    
    // Style
    btn.style.cssText = `
        position: fixed;
        top: 50px;
        right: 20px;
        padding: 12px 20px;
        background: linear-gradient(135deg, #667eea, #764ba2);
        color: white;
        border: none;
        border-radius: 10px;
        font-weight: bold;
        cursor: pointer;
        z-index: 999999;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        transition: all 0.3s ease;
    `;
    
    // Hover effect
    btn.addEventListener('mouseenter', () => {
        btn.style.transform = 'translateY(-3px)';
        btn.style.boxShadow = '0 6px 20px rgba(0,0,0,0.3)';
    });
    
    btn.addEventListener('mouseleave', () => {
        btn.style.transform = 'translateY(0)';
        btn.style.boxShadow = '0 4px 15px rgba(0,0,0,0.2)';
    });
    
    // Click handler
    btn.addEventListener('click', () => {
        console.log('🎯 Test button clicked!');
        alert('✅ Test SOLID Button Works!\n\nModule system is functioning correctly.');
        
        // Visual feedback
        btn.textContent = '🎉 CLICKED!';
        btn.style.background = 'linear-gradient(135deg, #2ecc71, #27ae60)';
        
        setTimeout(() => {
            btn.textContent = '✅ TEST SOLID';
            btn.style.background = 'linear-gradient(135deg, #667eea, #764ba2)';
        }, 1000);
    });
    
    // Add to page
    document.body.appendChild(btn);
    console.log('✅ Test: Button added successfully');
}

// Check if PKM object exists
function checkPKMObject() {
    console.log('🔍 Checking PKM object...');
    
    if (typeof PKM !== 'undefined') {
        console.log('✅ PKM object exists:', {
            log: typeof PKM.log,
            storage: typeof PKM.storage,
            utils: typeof PKM.utils
        });
        
        // Use PKM.log if available
        if (typeof PKM.log === 'function') {
            PKM.log('Test module using PKM.log', 'info');
        }
    } else {
        console.log('⚠️ PKM object not found, using console.log');
    }
}

// Main initialization
function initModule() {
    console.log('🚀 Test Module: Initializing...');
    
    checkPKMObject();
    addTestButton();
    
    console.log('✅ Test Module: Initialized successfully');
}

// Expose functions for debugging
window.testAddButton = addTestButton;
window.testInitModule = initModule;
window.testCheckPKM = checkPKMObject;

// Auto-initialize with proper timing
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(initModule, 200);
    });
} else {
    setTimeout(initModule, 500);
}

console.log('✅ Test Simple Fixed Module: Loaded and ready');
