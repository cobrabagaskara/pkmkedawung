// Module: PKM Tampermonkey to Module Converter
// File: modules/converter-tool.js
// Description: Konversi otomatis script Tampermonkey ke format module PKM

PKM.log('Module Converter Tool loaded', 'info');

// ==================== CONFIGURATION ====================
const CONVERTER_CONFIG = {
    VERSION: '1.0.0',
    MAX_FILE_SIZE: 1024 * 1024, // 1MB
    ALLOWED_TYPES: ['.js', '.user.js'],
    DEFAULT_MATCH: ['*://*/*'],
    TEMPLATE: {
        header: `// Module: {name}
// Converted by PKM Kedawung Converter v{converterVersion}
// Original: {originalName} v{originalVersion}
// Converted on: {date}

PKM.log('{name} loaded', 'info');

// MODULE CODE START`,
        footer: `// MODULE CODE END

// Auto-initialization
function initModule() {
    // Module initialization logic
    PKM.log('{name} initialized', 'success');
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initModule);
} else {
    setTimeout(initModule, 100);
}

PKM.log('{name} ready', 'success');`
    }
};

// ==================== STATE MANAGEMENT ====================
const ConverterState = {
    currentFile: null,
    metadata: null,
    convertedCode: null,
    jsonEntry: null,
    isProcessing: false
};

// ==================== UI ELEMENTS ====================
let converterModal = null;
let currentStep = 1;

// ==================== MAIN FUNCTIONS ====================

// Initialize converter
function initConverter() {
    PKM.log('Initializing Converter Tool v' + CONVERTER_CONFIG.VERSION, 'info');
    
    // Add converter button to page
    addConverterButton();
    
    // Listen for pkm:dashboard-open event to add converter tab
    document.addEventListener('pkm:dashboard-open', addConverterToDashboard);
    
    PKM.log('Converter Tool ready', 'success');
}

// Add converter floating button
function addConverterButton() {
    // Remove existing button if any
    const existingBtn = document.getElementById('pkm-converter-floating-btn');
    if (existingBtn) existingBtn.remove();
    
    const button = document.createElement('button');
    button.id = 'pkm-converter-floating-btn';
    button.innerHTML = '🔄';
    button.title = 'Konverter Tampermonkey → Module';
    
    Object.assign(button.style, {
        position: 'fixed',
        bottom: '140px',
        right: '20px',
        width: '50px',
        height: '50px',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        color: 'white',
        border: 'none',
        fontSize: '22px',
        cursor: 'pointer',
        zIndex: '99997',
        boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
        transition: 'all 0.3s ease',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    });
    
    button.addEventListener('mouseenter', () => {
        button.style.transform = 'scale(1.1) rotate(15deg)';
        button.style.boxShadow = '0 6px 20px rgba(245, 87, 108, 0.4)';
    });
    
    button.addEventListener('mouseleave', () => {
        button.style.transform = 'scale(1) rotate(0)';
        button.style.boxShadow = '0 4px 15px rgba(0,0,0,0.2)';
    });
    
    button.addEventListener('click', showConverterModal);
    
    document.body.appendChild(button);
    PKM.log('Converter button added', 'info');
}

// Add converter tab to dashboard
function addConverterToDashboard() {
    // This will be called when dashboard opens
    setTimeout(() => {
        const dashboard = document.querySelector('.pkm-dashboard-container');
        if (dashboard && !document.getElementById('pkm-converter-tab')) {
            addConverterTab(dashboard);
        }
    }, 500);
}

// Show converter modal
function showConverterModal() {
    createConverterModal();
    showStep(1);
}

// Create converter modal UI
function createConverterModal() {
    // Remove existing modal
    if (converterModal) {
        converterModal.remove();
    }
    
    converterModal = document.createElement('div');
    converterModal.id = 'pkm-converter-modal';
    converterModal.innerHTML = `
    <div class="converter-modal-overlay" id="converterOverlay">
        <div class="converter-modal-container">
            <div class="converter-modal-header">
                <h2>
                    <i class="fas fa-exchange-alt"></i>
                    <span>Konverter Tampermonkey → Module</span>
                </h2>
                <button class="converter-modal-close" id="converterCloseBtn">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <div class="converter-modal-body">
                <!-- Step 1: Upload -->
                <div class="converter-step step-1" data-step="1">
                    <div class="step-header">
                        <div class="step-number">1</div>
                        <h3>Upload File Tampermonkey</h3>
                    </div>
                    
                    <div class="step-content">
                        <div class="upload-container" id="uploadContainer">
                            <div class="upload-area" id="uploadArea">
                                <div class="upload-icon">
                                    <i class="fas fa-cloud-upload-alt"></i>
                                </div>
                                <h4>Drop file di sini atau klik untuk upload</h4>
                                <p class="upload-subtitle">File .user.js dari export Tampermonkey</p>
                                <p class="upload-hint">Maksimal 1MB • Format: .js atau .user.js</p>
                                <input type="file" id="fileUploadInput" accept=".js,.user.js" hidden>
                                <button class="btn btn-primary" id="selectFileBtn">
                                    <i class="fas fa-folder-open"></i> Pilih File
                                </button>
                            </div>
                            
                            <div class="file-preview" id="filePreview" style="display: none;">
                                <div class="file-info">
                                    <div class="file-icon">
                                        <i class="fas fa-file-code"></i>
                                    </div>
                                    <div class="file-details">
                                        <h4 id="fileName">File Name</h4>
                                        <p class="file-meta">
                                            <span id="fileSize">0 KB</span>
                                            • 
                                            <span id="fileType">.js</span>
                                        </p>
                                    </div>
                                    <button class="btn btn-danger btn-sm" id="removeFileBtn">
                                        <i class="fas fa-times"></i>
                                    </button>
                                </div>
                                <button class="btn btn-success btn-block" id="processFileBtn">
                                    <i class="fas fa-cogs"></i> Proses Konversi
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Step 2: Preview & Edit -->
                <div class="converter-step step-2" data-step="2" style="display: none;">
                    <div class="step-header">
                        <div class="step-number">2</div>
                        <h3>Preview & Edit Metadata</h3>
                    </div>
                    
                    <div class="step-content">
                        <div class="metadata-editor">
                            <div class="form-group">
                                <label for="moduleName">
                                    <i class="fas fa-tag"></i> Nama Module
                                </label>
                                <input type="text" id="moduleName" class="form-control" 
                                       placeholder="Contoh: otomasi-skrining">
                                <small class="form-text">Nama file tanpa ekstensi .js</small>
                            </div>
                            
                            <div class="form-group">
                                <label for="moduleDisplayName">
                                    <i class="fas fa-heading"></i> Display Name
                                </label>
                                <input type="text" id="moduleDisplayName" class="form-control" 
                                       placeholder="Contoh: Otomasi Skrining">
                            </div>
                            
                            <div class="form-group">
                                <label for="moduleDescription">
                                    <i class="fas fa-align-left"></i> Deskripsi
                                </label>
                                <textarea id="moduleDescription" class="form-control" rows="2"
                                          placeholder="Deskripsi fungsi module"></textarea>
                            </div>
                            
                            <div class="form-group">
                                <label for="moduleVersion">
                                    <i class="fas fa-code-branch"></i> Versi
                                </label>
                                <input type="text" id="moduleVersion" class="form-control" 
                                       value="1.0.0" placeholder="1.0.0">
                            </div>
                            
                            <div class="form-group">
                                <label for="moduleAuthor">
                                    <i class="fas fa-user"></i> Author
                                </label>
                                <input type="text" id="moduleAuthor" class="form-control" 
                                       placeholder="Nama developer">
                            </div>
                            
                            <div class="form-group">
                                <label for="moduleMatch">
                                    <i class="fas fa-globe"></i> Match Patterns
                                </label>
                                <div class="match-patterns" id="matchPatternsContainer">
                                    <!-- Match patterns akan diisi secara dinamis -->
                                </div>
                                <button class="btn btn-outline btn-sm" id="addMatchPatternBtn">
                                    <i class="fas fa-plus"></i> Tambah Pattern
                                </button>
                            </div>
                            
                            <div class="form-group">
                                <label>
                                    <i class="fas fa-code"></i> Preview Kode
                                </label>
                                <div class="code-preview-container">
                                    <pre><code id="codePreview">// Kode akan muncul di sini...</code></pre>
                                </div>
                            </div>
                        </div>
                        
                        <div class="step-actions">
                            <button class="btn btn-secondary" id="backToStep1Btn">
                                <i class="fas fa-arrow-left"></i> Kembali
                            </button>
                            <button class="btn btn-primary" id="generateModuleBtn">
                                <i class="fas fa-file-export"></i> Generate Module
                            </button>
                        </div>
                    </div>
                </div>
                
                <!-- Step 3: Results -->
                <div class="converter-step step-3" data-step="3" style="display: none;">
                    <div class="step-header">
                        <div class="step-number">3</div>
                        <h3>Download Hasil Konversi</h3>
                    </div>
                    
                    <div class="step-content">
                        <div class="success-message">
                            <div class="success-icon">
                                <i class="fas fa-check-circle"></i>
                            </div>
                            <h4>Konversi Berhasil!</h4>
                            <p>Module telah siap untuk digunakan.</p>
                        </div>
                        
                        <div class="results-container">
                            <div class="result-card">
                                <div class="result-header">
                                    <i class="fas fa-file-code"></i>
                                    <h5>File Module (.js)</h5>
                                </div>
                                <div class="result-body">
                                    <div class="code-snippet" id="moduleCodeResult">
                                        // Module code akan muncul di sini
                                    </div>
                                    <button class="btn btn-success btn-block" id="downloadModuleBtn">
                                        <i class="fas fa-download"></i> Download module.js
                                    </button>
                                </div>
                            </div>
                            
                            <div class="result-card">
                                <div class="result-header">
                                    <i class="fas fa-file-alt"></i>
                                    <h5>Entry untuk modules.json</h5>
                                </div>
                                <div class="result-body">
                                    <div class="code-snippet" id="jsonEntryResult">
                                        // JSON entry akan muncul di sini
                                    </div>
                                    <div class="result-actions">
                                        <button class="btn btn-info" id="copyJsonBtn">
                                            <i class="far fa-copy"></i> Copy JSON
                                        </button>
                                        <button class="btn btn-success" id="downloadJsonBtn">
                                            <i class="fas fa-download"></i> Download
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="usage-instructions">
                            <h5><i class="fas fa-info-circle"></i> Cara Menggunakan:</h5>
                            <ol>
                                <li><strong>Download file module.js</strong> dan upload ke folder <code>modules/</code> di repository GitHub</li>
                                <li><strong>Copy entry JSON</strong> di atas dan paste ke file <code>modules/modules.json</code></li>
                                <li><strong>Commit perubahan</strong> di GitHub → Module otomatis tersedia untuk semua user!</li>
                                <li>User dapat toggle module via dashboard PKM Kedawung</li>
                            </ol>
                        </div>
                        
                        <div class="step-actions">
                            <button class="btn btn-secondary" id="newConversionBtn">
                                <i class="fas fa-redo"></i> Konversi File Lain
                            </button>
                            <button class="btn btn-primary" id="closeConverterBtn">
                                <i class="fas fa-check"></i> Selesai
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="converter-modal-footer">
                <div class="progress-indicator">
                    <div class="progress-step ${currentStep >= 1 ? 'active' : ''}" data-step="1">
                        <div class="step-dot"></div>
                        <span class="step-label">Upload</span>
                    </div>
                    <div class="progress-line"></div>
                    <div class="progress-step ${currentStep >= 2 ? 'active' : ''}" data-step="2">
                        <div class="step-dot"></div>
                        <span class="step-label">Edit</span>
                    </div>
                    <div class="progress-line"></div>
                    <div class="progress-step ${currentStep >= 3 ? 'active' : ''}" data-step="3">
                        <div class="step-dot"></div>
                        <span class="step-label">Download</span>
                    </div>
                </div>
                <div class="converter-version">
                    PKM Converter v${CONVERTER_CONFIG.VERSION}
                </div>
            </div>
        </div>
    </div>
    `;
    
    document.body.appendChild(converterModal);
    injectConverterStyles();
    setupConverterEvents();
    
    PKM.log('Converter modal created', 'info');
}

// Inject CSS styles for converter
function injectConverterStyles() {
    const styles = `
    /* Converter Modal Styles */
    #pkm-converter-modal {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    
    .converter-modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.75);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000000;
        backdrop-filter: blur(5px);
        animation: fadeIn 0.3s ease;
    }
    
    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
    
    .converter-modal-container {
        background: white;
        border-radius: 16px;
        width: 90%;
        max-width: 900px;
        max-height: 90vh;
        overflow: hidden;
        box-shadow: 0 25px 50px rgba(0,0,0,0.3);
        animation: slideUp 0.4s ease;
    }
    
    @keyframes slideUp {
        from { transform: translateY(30px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
    }
    
    .converter-modal-header {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 20px 30px;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    
    .converter-modal-header h2 {
        margin: 0;
        font-size: 1.5em;
        display: flex;
        align-items: center;
        gap: 12px;
    }
    
    .converter-modal-close {
        background: rgba(255,255,255,0.2);
        border: none;
        color: white;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
        transition: all 0.3s ease;
    }
    
    .converter-modal-close:hover {
        background: rgba(255,255,255,0.3);
        transform: rotate(90deg);
    }
    
    .converter-modal-body {
        padding: 30px;
        overflow-y: auto;
        max-height: 65vh;
    }
    
    .converter-step {
        animation: fadeInUp 0.4s ease;
    }
    
    @keyframes fadeInUp {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
    }
    
    .step-header {
        display: flex;
        align-items: center;
        gap: 15px;
        margin-bottom: 25px;
    }
    
    .step-number {
        width: 36px;
        height: 36px;
        background: linear-gradient(135deg, #667eea, #764ba2);
        color: white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        font-size: 18px;
    }
    
    .step-header h3 {
        margin: 0;
        color: #2c3e50;
        font-size: 1.3em;
    }
    
    /* Upload Area */
    .upload-container {
        margin: 20px 0;
    }
    
    .upload-area {
        border: 3px dashed #667eea;
        border-radius: 12px;
        padding: 50px 30px;
        text-align: center;
        background: #f8f9ff;
        transition: all 0.3s ease;
        cursor: pointer;
    }
    
    .upload-area:hover {
        background: #f0f2ff;
        border-color: #764ba2;
        transform: translateY(-2px);
    }
    
    .upload-area.dragover {
        background: #e8f4ff;
        border-color: #3498db;
        transform: scale(1.02);
    }
    
    .upload-icon {
        font-size: 48px;
        color: #667eea;
        margin-bottom: 20px;
    }
    
    .upload-area h4 {
        margin: 0 0 10px 0;
        color: #2c3e50;
        font-size: 1.2em;
    }
    
    .upload-subtitle {
        color: #666;
        margin-bottom: 5px;
    }
    
    .upload-hint {
        color: #999;
        font-size: 0.9em;
        margin-top: 15px;
    }
    
    /* File Preview */
    .file-preview {
        margin-top: 30px;
        animation: fadeIn 0.5s ease;
    }
    
    .file-info {
        background: #f8f9fa;
        border-radius: 10px;
        padding: 20px;
        display: flex;
        align-items: center;
        gap: 15px;
        margin-bottom: 20px;
        border-left: 4px solid #3498db;
    }
    
    .file-icon {
        font-size: 32px;
        color: #667eea;
    }
    
    .file-details h4 {
        margin: 0 0 5px 0;
        color: #2c3e50;
    }
    
    .file-meta {
        color: #666;
        font-size: 0.9em;
        margin: 0;
    }
    
    /* Form Styles */
    .form-group {
        margin-bottom: 20px;
    }
    
    .form-group label {
        display: flex;
        align-items: center;
        gap: 8px;
        font-weight: 600;
        color: #2c3e50;
        margin-bottom: 8px;
    }
    
    .form-control {
        width: 100%;
        padding: 12px 15px;
        border: 2px solid #e0e0e0;
        border-radius: 8px;
        font-size: 14px;
        transition: all 0.3s ease;
    }
    
    .form-control:focus {
        outline: none;
        border-color: #667eea;
        box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }
    
    .form-text {
        display: block;
        margin-top: 5px;
        color: #666;
        font-size: 0.85em;
    }
    
    /* Match Patterns */
    .match-patterns {
        display: flex;
        flex-direction: column;
        gap: 10px;
        margin-bottom: 10px;
    }
    
    .match-pattern {
        display: flex;
        gap: 10px;
    }
    
    .match-pattern input {
        flex: 1;
    }
    
    .match-pattern button {
        background: #e74c3c;
        color: white;
        border: none;
        width: 40px;
        border-radius: 6px;
        cursor: pointer;
        transition: background 0.3s;
    }
    
    .match-pattern button:hover {
        background: #c0392b;
    }
    
    /* Code Preview */
    .code-preview-container {
        background: #2c3e50;
        border-radius: 8px;
        overflow: hidden;
        margin-top: 10px;
    }
    
    .code-preview-container pre {
        margin: 0;
        padding: 15px;
        max-height: 200px;
        overflow-y: auto;
    }
    
    .code-preview-container code {
        color: #ecf0f1;
        font-family: 'Courier New', monospace;
        font-size: 12px;
        line-height: 1.5;
    }
    
    /* Buttons */
    .btn {
        padding: 12px 24px;
        border-radius: 8px;
        border: none;
        font-weight: 600;
        font-size: 14px;
        cursor: pointer;
        transition: all 0.3s ease;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
    }
    
    .btn-primary {
        background: linear-gradient(135deg, #667eea, #764ba2);
        color: white;
    }
    
    .btn-primary:hover {
        transform: translateY(-2px);
        box-shadow: 0 5px 15px rgba(102, 126, 234, 0.3);
    }
    
    .btn-success {
        background: linear-gradient(135deg, #2ecc71, #27ae60);
        color: white;
    }
    
    .btn-success:hover {
        background: linear-gradient(135deg, #27ae60, #219653);
        transform: translateY(-2px);
    }
    
    .btn-secondary {
        background: #95a5a6;
        color: white;
    }
    
    .btn-secondary:hover {
        background: #7f8c8d;
    }
    
    .btn-danger {
        background: #e74c3c;
        color: white;
    }
    
    .btn-danger:hover {
        background: #c0392b;
    }
    
    .btn-info {
        background: #3498db;
        color: white;
    }
    
    .btn-info:hover {
        background: #2980b9;
    }
    
    .btn-outline {
        background: transparent;
        border: 2px solid #667eea;
        color: #667eea;
    }
    
    .btn-outline:hover {
        background: rgba(102, 126, 234, 0.1);
    }
    
    .btn-sm {
        padding: 8px 16px;
        font-size: 13px;
    }
    
    .btn-block {
        display: block;
        width: 100%;
    }
    
    .step-actions {
        display: flex;
        justify-content: space-between;
        margin-top: 30px;
        padding-top: 20px;
        border-top: 1px solid #eee;
    }
    
    /* Results */
    .success-message {
        text-align: center;
        padding: 30px;
        background: linear-gradient(135deg, #f8fff8, #f0fff0);
        border-radius: 12px;
        margin-bottom: 30px;
        border: 2px solid #2ecc71;
    }
    
    .success-icon {
        font-size: 60px;
        color: #2ecc71;
        margin-bottom: 20px;
    }
    
    .success-message h4 {
        margin: 0 0 10px 0;
        color: #27ae60;
        font-size: 1.4em;
    }
    
    .results-container {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 20px;
        margin: 20px 0;
    }
    
    @media (max-width: 768px) {
        .results-container {
            grid-template-columns: 1fr;
        }
    }
    
    .result-card {
        background: #f8f9fa;
        border-radius: 12px;
        overflow: hidden;
        border: 1px solid #e0e0e0;
    }
    
    .result-header {
        background: linear-gradient(135deg, #667eea, #764ba2);
        color: white;
        padding: 15px 20px;
        display: flex;
        align-items: center;
        gap: 10px;
    }
    
    .result-header h5 {
        margin: 0;
        font-size: 1.1em;
    }
    
    .result-body {
        padding: 20px;
    }
    
    .code-snippet {
        background: #2c3e50;
        color: #ecf0f1;
        padding: 15px;
        border-radius: 8px;
        font-family: 'Courier New', monospace;
        font-size: 12px;
        max-height: 150px;
        overflow-y: auto;
        margin-bottom: 15px;
        white-space: pre-wrap;
        word-break: break-all;
    }
    
    .result-actions {
        display: flex;
        gap: 10px;
    }
    
    /* Instructions */
    .usage-instructions {
        background: #fff8e1;
        padding: 20px;
        border-radius: 8px;
        margin: 25px 0;
        border-left: 4px solid #f39c12;
    }
    
    .usage-instructions h5 {
        margin-top: 0;
        color: #d35400;
        display: flex;
        align-items: center;
        gap: 10px;
    }
    
    .usage-instructions ol {
        margin: 15px 0 0 0;
        padding-left: 20px;
    }
    
    .usage-instructions li {
        margin-bottom: 10px;
        line-height: 1.5;
    }
    
    /* Footer */
    .converter-modal-footer {
        padding: 20px 30px;
        background: #f8f9fa;
        border-top: 1px solid #eee;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    
    .progress-indicator {
        display: flex;
        align-items: center;
        gap: 5px;
    }
    
    .progress-step {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 5px;
    }
    
    .step-dot {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        background: #ddd;
        transition: all 0.3s ease;
    }
    
    .progress-step.active .step-dot {
        background: #667eea;
        transform: scale(1.3);
    }
    
    .step-label {
        font-size: 0.8em;
        color: #666;
        font-weight: 500;
    }
    
    .progress-line {
        width: 40px;
        height: 2px;
        background: #ddd;
    }
    
    .converter-version {
        color: #666;
        font-size: 0.9em;
        font-weight: 500;
    }
    `;
    
    const styleElement = document.createElement('style');
    styleElement.textContent = styles;
    document.head.appendChild(styleElement);
}

// Setup event listeners
function setupConverterEvents() {
    // Close button
    document.getElementById('converterCloseBtn').addEventListener('click', closeConverter);
    
    // Step 1: Upload
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileUploadInput');
    const selectFileBtn = document.getElementById('selectFileBtn');
    
    selectFileBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handleFileSelect);
    
    // Drag and drop
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });
    
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });
    
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        
        if (e.dataTransfer.files.length > 0) {
            handleFileSelect({ target: { files: e.dataTransfer.files } });
        }
    });
    
    // Step 1 buttons
    document.getElementById('removeFileBtn')?.addEventListener('click', resetFile);
    document.getElementById('processFileBtn')?.addEventListener('click', processFile);
    
    // Step 2 buttons
    document.getElementById('backToStep1Btn')?.addEventListener('click', () => showStep(1));
    document.getElementById('generateModuleBtn')?.addEventListener('click', generateModule);
    document.getElementById('addMatchPatternBtn')?.addEventListener('click', addMatchPattern);
    
    // Step 3 buttons
    document.getElementById('downloadModuleBtn')?.addEventListener('click', downloadModuleFile);
    document.getElementById('downloadJsonBtn')?.addEventListener('click', downloadJsonFile);
    document.getElementById('copyJsonBtn')?.addEventListener('click', copyJsonToClipboard);
    document.getElementById('newConversionBtn')?.addEventListener('click', startNewConversion);
    document.getElementById('closeConverterBtn')?.addEventListener('click', closeConverter);
    
    // Real-time preview updates
    const previewFields = ['moduleName', 'moduleDisplayName', 'moduleDescription', 
                          'moduleVersion', 'moduleAuthor'];
    previewFields.forEach(fieldId => {
        document.getElementById(fieldId)?.addEventListener('input', updatePreview);
    });
}

// ==================== CONVERSION LOGIC ====================

// Handle file selection
function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Validate file
    if (!CONVERTER_CONFIG.ALLOWED_TYPES.some(type => file.name.endsWith(type))) {
        alert('❌ Format file tidak didukung. Harap upload file .js atau .user.js');
        return;
    }
    
    if (file.size > CONVERTER_CONFIG.MAX_FILE_SIZE) {
        alert(`❌ File terlalu besar (${(file.size / 1024).toFixed(1)}KB). Maksimal 1MB`);
        return;
    }
    
    // Read file
    const reader = new FileReader();
    reader.onload = function(e) {
        ConverterState.currentFile = {
            name: file.name,
            size: (file.size / 1024).toFixed(1),
            content: e.target.result,
            lastModified: file.lastModified
        };
        
        // Show file preview
        showFilePreview();
        
        // Extract metadata
        extractMetadata();
        
        PKM.log(`File loaded: ${file.name} (${ConverterState.currentFile.size}KB)`, 'info');
    };
    
    reader.onerror = function() {
        alert('❌ Gagal membaca file');
        PKM.log('File read error', 'error');
    };
    
    reader.readAsText(file);
}

// Show file preview
function showFilePreview() {
    const uploadArea = document.getElementById('uploadArea');
    const filePreview = document.getElementById('filePreview');
    
    document.getElementById('fileName').textContent = ConverterState.currentFile.name;
    document.getElementById('fileSize').textContent = ConverterState.currentFile.size + ' KB';
    document.getElementById('fileType').textContent = ConverterState.currentFile.name.split('.').pop();
    
    uploadArea.style.display = 'none';
    filePreview.style.display = 'block';
}

// Reset file
function resetFile() {
    ConverterState.currentFile = null;
    
    const uploadArea = document.getElementById('uploadArea');
    const filePreview = document.getElementById('filePreview');
    const fileInput = document.getElementById('fileUploadInput');
    
    uploadArea.style.display = 'block';
    filePreview.style.display = 'none';
    fileInput.value = '';
    
    PKM.log('File reset', 'info');
}

// Extract metadata from Tampermonkey script
function extractMetadata() {
    if (!ConverterState.currentFile) return;
    
    const code = ConverterState.currentFile.content;
    const metadata = {
        originalName: 'Unnamed Script',
        originalVersion: '1.0.0',
        description: 'No description',
        author: 'Unknown',
        match: CONVERTER_CONFIG.DEFAULT_MATCH.slice()
    };
    
    // Extract @name
    const nameMatch = code.match(/@name\s+(.+)/i);
    if (nameMatch) metadata.originalName = nameMatch[1].trim();
    
    // Extract @version
    const versionMatch = code.match(/@version\s+(.+)/i);
    if (versionMatch) metadata.originalVersion = versionMatch[1].trim();
    
    // Extract @description
    const descMatch = code.match(/@description\s+(.+)/i);
    if (descMatch) metadata.description = descMatch[1].trim();
    
    // Extract @author
    const authorMatch = code.match(/@author\s+(.+)/i);
    if (authorMatch) metadata.author = authorMatch[1].trim();
    
    // Extract @match (multiple)
    const matchMatches = code.match(/@match\s+(.+)/gi);
    if (matchMatches) {
        metadata.match = matchMatches.map(m => 
            m.replace(/@match\s+/i, '').trim()
        );
    }
    
    ConverterState.metadata = metadata;
    
    // Populate form fields
    document.getElementById('moduleName').value = 
        metadata.originalName
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');
    
    document.getElementById('moduleDisplayName').value = metadata.originalName;
    document.getElementById('moduleDescription').value = metadata.description;
    document.getElementById('moduleVersion').value = metadata.originalVersion;
    document.getElementById('moduleAuthor').value = metadata.author;
    
    // Populate match patterns
    const container = document.getElementById('matchPatternsContainer');
    container.innerHTML = '';
    metadata.match.forEach(pattern => addMatchPatternToUI(pattern));
    
    // Move to step 2
    showStep(2);
    updatePreview();
}

// Add match pattern to UI
function addMatchPattern(pattern = '') {
    addMatchPatternToUI(pattern);
    updatePreview();
}

function addMatchPatternToUI(pattern) {
    const container = document.getElementById('matchPatternsContainer');
    const patternId = `match-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const patternDiv = document.createElement('div');
    patternDiv.className = 'match-pattern';
    patternDiv.innerHTML = `
        <input type="text" class="form-control" value="${pattern}" 
               placeholder="*://*.example.com/*" data-pattern-id="${patternId}"
               oninput="updatePreview()">
        <button type="button" class="remove-pattern-btn" onclick="removeMatchPattern('${patternId}')">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    container.appendChild(patternDiv);
    
    // Add event listener
    patternDiv.querySelector('input').addEventListener('input', updatePreview);
}

// Remove match pattern
function removeMatchPattern(patternId) {
    const input = document.querySelector(`input[data-pattern-id="${patternId}"]`);
    if (input && input.parentElement) {
        input.parentElement.remove();
        updatePreview();
    }
}

// Process file (convert)
function processFile() {
    if (!ConverterState.currentFile || ConverterState.isProcessing) return;
    
    ConverterState.isProcessing = true;
    PKM.log('Starting conversion process', 'info');
    
    // Move to step 2
    showStep(2);
}

// Generate module from current data
function generateModule() {
    if (!ConverterState.currentFile) return;
    
    PKM.log('Generating module files', 'info');
    
    // Get form values
    const moduleData = {
        name: document.getElementById('moduleName').value.trim(),
        displayName: document.getElementById('moduleDisplayName').value.trim(),
        description: document.getElementById('moduleDescription').value.trim(),
        version: document.getElementById('moduleVersion').value.trim(),
        author: document.getElementById('moduleAuthor').value.trim(),
        match: Array.from(document.querySelectorAll('#matchPatternsContainer input'))
                   .map(input => input.value.trim())
                   .filter(pattern => pattern.length > 0)
    };
    
    // Validate
    if (!moduleData.name) {
        alert('❌ Nama module tidak boleh kosong');
        return;
    }
    
    if (moduleData.match.length === 0) {
        moduleData.match = CONVERTER_CONFIG.DEFAULT_MATCH;
    }
    
    // Convert code
    const convertedCode = convertCode(ConverterState.currentFile.content, moduleData);
    const jsonEntry = generateJsonEntry(moduleData);
    
    // Save to state
    ConverterState.convertedCode = convertedCode;
    ConverterState.jsonEntry = jsonEntry;
    ConverterState.moduleData = moduleData;
    
    // Show results
    document.getElementById('moduleCodeResult').textContent = 
        convertedCode.substring(0, 500) + 
        (convertedCode.length > 500 ? '\n\n... [truncated for preview]' : '');
    
    document.getElementById('jsonEntryResult').textContent = jsonEntry;
    
    // Move to step 3
    showStep(3);
    
    PKM.log(`Module generated: ${moduleData.name} v${moduleData.version}`, 'success');
}

// Convert Tampermonkey code to module format
function convertCode(originalCode, moduleData) {
    let code = originalCode;
    
    // 1. Remove Tampermonkey header
    code = code.replace(/\/\/ ==UserScript==[\s\S]*?\/\/ ==\/UserScript==/g, '');
    
    // 2. Remove wrapper function
    code = code.replace(/\(\s*function\s*\(\s*\)\s*\{[\s\S]*?['"]use strict['"][\s\S]*?\}\s*\)\s*\(\s*\)\s*;?/g, '');
    code = code.replace(/\(\s*function\s*\(\s*\)\s*\{[\s\S]*?\}\s*\)\s*\(\s*\)\s*;?/g, '');
    
    // 3. Convert GM_* functions to PKM.*
    const replacements = [
        { pattern: /\bGM_getValue\b/g, replacement: 'PKM.storage.get' },
        { pattern: /\bGM_setValue\b/g, replacement: 'PKM.storage.set' },
        { pattern: /\bGM_deleteValue\b/g, replacement: 'PKM.storage.set' },
        { pattern: /\bGM_notification\b/g, replacement: '// PKM: GM_notification tidak tersedia di module' },
        { pattern: /\bGM_xmlhttpRequest\b/g, replacement: '// PKM: Gunakan fetch() API' },
        { pattern: /\bGM_addStyle\b/g, replacement: '// PKM: Gunakan inline style atau CSS file' },
        { pattern: /\bGM_registerMenuCommand\b/g, replacement: '// PKM: Gunakan dashboard untuk controls' }
    ];
    
    replacements.forEach(({ pattern, replacement }) => {
        code = code.replace(pattern, replacement);
    });
    
    // 4. Add module wrapper
    const templateVars = {
        name: moduleData.displayName,
        originalName: ConverterState.metadata?.originalName || moduleData.displayName,
        originalVersion: ConverterState.metadata?.originalVersion || moduleData.version,
        converterVersion: CONVERTER_CONFIG.VERSION,
        date: new Date().toISOString()
    };
    
    const header = CONVERTER_CONFIG.TEMPLATE.header.replace(
        /\{(\w+)\}/g, 
        (match, key) => templateVars[key] || match
    );
    
    const footer = CONVERTER_CONFIG.TEMPLATE.footer.replace(
        /\{(\w+)\}/g, 
        (match, key) => templateVars[key] || match
    );
    
    return `${header}\n${code.trim()}\n${footer}`;
}

// Generate JSON entry for modules.json
function generateJsonEntry(moduleData) {
    const entry = {
        [moduleData.name]: {
            name: moduleData.displayName,
            description: moduleData.description,
            version: moduleData.version,
            author: moduleData.author,
            match: moduleData.match
        }
    };
    
    return JSON.stringify(entry, null, 2);
}

// Update live preview
function updatePreview() {
    if (!ConverterState.currentFile) return;
    
    const moduleData = {
        name: document.getElementById('moduleName').value.trim() || 'module-name',
        displayName: document.getElementById('moduleDisplayName').value.trim() || 'Module Name',
        description: document.getElementById('moduleDescription').value.trim() || 'Module description',
        version: document.getElementById('moduleVersion').value.trim() || '1.0.0',
        author: document.getElementById('moduleAuthor').value.trim() || 'Author',
        match: Array.from(document.querySelectorAll('#matchPatternsContainer input'))
                   .map(input => input.value.trim())
                   .filter(pattern => pattern.length > 0)
    };
    
    if (moduleData.match.length === 0) {
        moduleData.match = CONVERTER_CONFIG.DEFAULT_MATCH;
    }
    
    const jsonPreview = generateJsonEntry(moduleData);
    const codePreview = convertCode(ConverterState.currentFile.content, moduleData);
    
    document.getElementById('jsonEntryResult').textContent = jsonPreview;
    document.getElementById('codePreview').textContent = 
        codePreview.substring(0, 300) + 
        (codePreview.length > 300 ? '\n\n... [preview truncated]' : '');
}

// ==================== DOWNLOAD FUNCTIONS ====================

// Download module file
function downloadModuleFile() {
    if (!ConverterState.convertedCode) {
        alert('❌ Tidak ada module yang tersedia untuk di-download');
        return;
    }
    
    const blob = new Blob([ConverterState.convertedCode], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    
    const filename = ConverterState.moduleData.name + '.js';
    a.href = url;
    a.download = filename;
    
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    PKM.log(`Module downloaded: ${filename}`, 'success');
    alert(`✅ Module berhasil di-download: ${filename}`);
}

// Download JSON file
function downloadJsonFile() {
    if (!ConverterState.jsonEntry) {
        alert('❌ Tidak ada JSON entry yang tersedia');
        return;
    }
    
    const blob = new Blob([ConverterState.jsonEntry], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    
    const filename = ConverterState.moduleData.name + '-entry.json';
    a.href = url;
    a.download = filename;
    
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    PKM.log(`JSON entry downloaded: ${filename}`, 'success');
}

// Copy JSON to clipboard
function copyJsonToClipboard() {
    if (!ConverterState.jsonEntry) {
        alert('❌ Tidak ada JSON entry untuk disalin');
        return;
    }
    
    navigator.clipboard.writeText(ConverterState.jsonEntry)
        .then(() => {
            alert('✅ JSON entry berhasil disalin ke clipboard!');
            PKM.log('JSON entry copied to clipboard', 'success');
        })
        .catch(err => {
            console.error('Copy failed:', err);
            alert('❌ Gagal menyalin ke clipboard');
            PKM.log('Clipboard copy failed', 'error');
        });
}

// ==================== UI FUNCTIONS ====================

// Show specific step
function showStep(step) {
    currentStep = step;
    
    // Hide all steps
    document.querySelectorAll('.converter-step').forEach(el => {
        el.style.display = 'none';
    });
    
    // Show current step
    const currentStepEl = document.querySelector(`.step-${step}`);
    if (currentStepEl) {
        currentStepEl.style.display = 'block';
    }
    
    // Update progress indicator
    document.querySelectorAll('.progress-step').forEach((stepEl, index) => {
        if (index + 1 <= step) {
            stepEl.classList.add('active');
        } else {
            stepEl.classList.remove('active');
        }
    });
    
    PKM.log(`Converter step ${step} shown`, 'info');
}

// Start new conversion
function startNewConversion() {
    ConverterState.currentFile = null;
    ConverterState.metadata = null;
    ConverterState.convertedCode = null;
    ConverterState.jsonEntry = null;
    ConverterState.isProcessing = false;
    
    // Reset form
    document.getElementById('fileUploadInput').value = '';
    document.getElementById('uploadArea').style.display = 'block';
    document.getElementById('filePreview').style.display = 'none';
    
    showStep(1);
    PKM.log('New conversion started', 'info');
}

// Close converter
function closeConverter() {
    if (converterModal) {
        converterModal.remove();
        converterModal = null;
    }
    PKM.log('Converter closed', 'info');
}

// ==================== INITIALIZATION ====================

// Initialize converter on module load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initConverter);
} else {
    // Small delay to ensure PKM is available
    setTimeout(initConverter, 300);
}

PKM.log('Module Converter Tool initialized successfully', 'success');
