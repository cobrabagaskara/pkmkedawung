// Module: PKM Tampermonkey Converter
// File: modules/converter-tool.js
// Description: Konverter script Tampermonkey ke format module PKM

PKM.log('Module Converter Tool loaded', 'info');

// Global state untuk converter
let currentFileData = null;
let conversionResult = null;

// Fungsi utama untuk init converter
function initConverterTool() {
    // Cek apakah kita di halaman yang tepat (bisa di mana saja, tapi lebih baik di internal page)
    if (window.location.href.includes('github.io') || window.location.href.includes('localhost')) {
        addConverterButton();
    } else {
        // Jika di website biasa, tambah button kecil
        addFloatingConverterButton();
    }
}

// Tambah button converter ke halaman
function addConverterButton() {
    const button = document.createElement('button');
    button.id = 'pkm-converter-btn';
    button.innerHTML = '🔧 Converter';
    button.title = 'Konverter Tampermonkey ke Module PKM';
    
    Object.assign(button.style, {
        position: 'fixed',
        bottom: '70px',
        right: '20px',
        width: '60px',
        height: '60px',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #667eea, #764ba2)',
        color: 'white',
        border: 'none',
        fontSize: '24px',
        cursor: 'pointer',
        zIndex: '99998',
        boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
        transition: 'all 0.3s ease'
    });
    
    button.addEventListener('mouseenter', () => {
        button.style.transform = 'scale(1.1)';
        button.style.boxShadow = '0 6px 20px rgba(0,0,0,0.3)';
    });
    
    button.addEventListener('mouseleave', () => {
        button.style.transform = 'scale(1)';
        button.style.boxShadow = '0 4px 15px rgba(0,0,0,0.2)';
    });
    
    button.addEventListener('click', showConverterModal);
    
    document.body.appendChild(button);
}

// Tambah floating button kecil untuk website biasa
function addFloatingConverterButton() {
    const button = document.createElement('button');
    button.id = 'pkm-converter-mini';
    button.innerHTML = '⚙️';
    button.title = 'Konverter Script';
    
    Object.assign(button.style, {
        position: 'fixed',
        bottom: '130px',
        right: '20px',
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #f093fb, #f5576c)',
        color: 'white',
        border: 'none',
        fontSize: '18px',
        cursor: 'pointer',
        zIndex: '99997',
        boxShadow: '0 3px 10px rgba(0,0,0,0.2)',
        transition: 'all 0.3s ease',
        opacity: '0.7'
    });
    
    button.addEventListener('mouseenter', () => {
        button.style.opacity = '1';
        button.style.transform = 'scale(1.1)';
    });
    
    button.addEventListener('mouseleave', () => {
        button.style.opacity = '0.7';
        button.style.transform = 'scale(1)';
    });
    
    button.addEventListener('click', showConverterModal);
    
    document.body.appendChild(button);
}

// Tampilkan modal converter
function showConverterModal() {
    // Hapus modal lama jika ada
    const oldModal = document.getElementById('pkm-converter-modal');
    if (oldModal) oldModal.remove();
    
    // Buat modal baru
    const modal = document.createElement('div');
    modal.id = 'pkm-converter-modal';
    
    modal.innerHTML = `
    <div class="pkm-converter-wrapper">
        <div class="converter-header">
            <h3><i class="fas fa-exchange-alt"></i> Konverter Tampermonkey → Module PKM</h3>
            <button class="converter-close">&times;</button>
        </div>
        
        <div class="converter-body">
            <!-- Step 1: Upload -->
            <div class="converter-step active" id="step1">
                <h4>📁 1. Upload File .user.js</h4>
                <div class="upload-area" id="uploadArea">
                    <div class="upload-icon">📤</div>
                    <p class="upload-text">Klik atau drop file .user.js di sini</p>
                    <input type="file" id="fileInput" accept=".js,.user.js" style="display: none;">
                    <p class="upload-hint">File dari export Tampermonkey</p>
                </div>
                
                <div class="file-info" id="fileInfo" style="display: none;">
                    <p><strong>📄 File:</strong> <span id="fileName"></span></p>
                    <p><strong>📏 Size:</strong> <span id="fileSize"></span> KB</p>
                    <button class="btn-remove" id="removeFile">Hapus File</button>
                </div>
            </div>
            
            <!-- Step 2: Preview -->
            <div class="converter-step" id="step2" style="display: none;">
                <h4>👁️ 2. Preview Hasil Konversi</h4>
                
                <div class="preview-section">
                    <h5>📋 Metadata:</h5>
                    <div class="metadata-grid" id="metadataGrid"></div>
                </div>
                
                <div class="preview-buttons">
                    <button class="btn-convert" id="btnConvert">
                        <i class="fas fa-magic"></i> Proses Konversi
                    </button>
                    <button class="btn-back" id="btnBackStep1">
                        <i class="fas fa-arrow-left"></i> Ganti File
                    </button>
                </div>
            </div>
            
            <!-- Step 3: Results -->
            <div class="converter-step" id="step3" style="display: none;">
                <h4>✅ 3. Hasil Konversi</h4>
                
                <div class="result-section">
                    <div class="result-box">
                        <h5><i class="fas fa-file-code"></i> File Module (.js)</h5>
                        <div class="code-display">
                            <pre><code id="moduleCode"></code></pre>
                        </div>
                        <button class="btn-download" id="downloadModule">
                            <i class="fas fa-download"></i> Download module.js
                        </button>
                    </div>
                    
                    <div class="result-box">
                        <h5><i class="fas fa-file-alt"></i> Entry modules.json</h5>
                        <div class="code-display">
                            <pre><code id="jsonEntry"></code></pre>
                        </div>
                        <div class="btn-group">
                            <button class="btn-copy" id="copyJson">
                                <i class="far fa-copy"></i> Copy
                            </button>
                            <button class="btn-download" id="downloadJson">
                                <i class="fas fa-download"></i> Download
                            </button>
                        </div>
                    </div>
                </div>
                
                <div class="instructions">
                    <h5><i class="fas fa-info-circle"></i> Cara Pakai:</h5>
                    <ol>
                        <li><strong>Download module.js</strong> dan upload ke folder <code>modules/</code> di GitHub</li>
                        <li><strong>Copy entry JSON</strong> dan paste ke file <code>modules/modules.json</code></li>
                        <li>Commit perubahan → Module siap digunakan!</li>
                    </ol>
                </div>
                
                <div class="final-actions">
                    <button class="btn-new" id="btnNewConversion">
                        <i class="fas fa-redo"></i> Konversi File Lain
                    </button>
                    <button class="btn-close-modal" id="btnCloseModal">
                        <i class="fas fa-times"></i> Tutup
                    </button>
                </div>
            </div>
        </div>
        
        <div class="converter-footer">
            <div class="progress-indicator">
                <span class="progress-dot active" data-step="1"></span>
                <span class="progress-line"></span>
                <span class="progress-dot" data-step="2"></span>
                <span class="progress-line"></span>
                <span class="progress-dot" data-step="3"></span>
            </div>
            <p class="converter-version">PKM Converter v1.0</p>
        </div>
    </div>
    `;
    
    document.body.appendChild(modal);
    setupConverterStyles();
    setupConverterEvents();
}

// Setup CSS untuk converter
function setupConverterStyles() {
    const styles = `
    #pkm-converter-modal {
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
    
    .pkm-converter-wrapper {
        background: white;
        width: 90%;
        max-width: 800px;
        max-height: 90vh;
        border-radius: 12px;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    }
    
    .converter-header {
        background: linear-gradient(135deg, #667eea, #764ba2);
        color: white;
        padding: 20px;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    
    .converter-header h3 {
        margin: 0;
        font-size: 1.3em;
        display: flex;
        align-items: center;
        gap: 10px;
    }
    
    .converter-close {
        background: rgba(255,255,255,0.2);
        border: none;
        color: white;
        font-size: 28px;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s;
    }
    
    .converter-close:hover {
        background: rgba(255,255,255,0.3);
        transform: rotate(90deg);
    }
    
    .converter-body {
        padding: 30px;
        overflow-y: auto;
        flex-grow: 1;
    }
    
    .converter-step {
        animation: fadeIn 0.3s ease;
    }
    
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
    }
    
    .converter-step h4 {
        margin-top: 0;
        color: #333;
        font-size: 1.2em;
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 20px;
    }
    
    .upload-area {
        border: 3px dashed #667eea;
        border-radius: 12px;
        padding: 40px 20px;
        text-align: center;
        cursor: pointer;
        transition: all 0.3s;
        background: #f8f9ff;
    }
    
    .upload-area:hover {
        background: #f0f2ff;
        border-color: #764ba2;
    }
    
    .upload-icon {
        font-size: 48px;
        margin-bottom: 15px;
        color: #667eea;
    }
    
    .upload-text {
        font-size: 1.1em;
        color: #333;
        margin-bottom: 10px;
        font-weight: 500;
    }
    
    .upload-hint {
        color: #666;
        font-size: 0.9em;
    }
    
    .file-info {
        margin-top: 20px;
        padding: 15px;
        background: #f0f7ff;
        border-radius: 8px;
        border-left: 4px solid #3498db;
    }
    
    .btn-remove {
        background: #e74c3c;
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 6px;
        cursor: pointer;
        margin-top: 10px;
        font-size: 0.9em;
        transition: background 0.3s;
    }
    
    .btn-remove:hover {
        background: #c0392b;
    }
    
    .metadata-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 15px;
        margin: 20px 0;
    }
    
    .metadata-item {
        background: #f8f9fa;
        padding: 15px;
        border-radius: 8px;
    }
    
    .metadata-label {
        font-weight: 600;
        color: #333;
        margin-bottom: 5px;
        font-size: 0.9em;
    }
    
    .metadata-value {
        color: #666;
        font-family: monospace;
        word-break: break-all;
    }
    
    .preview-buttons {
        display: flex;
        gap: 15px;
        margin-top: 30px;
    }
    
    .btn-convert, .btn-back, .btn-new, .btn-close-modal {
        padding: 12px 24px;
        border-radius: 8px;
        border: none;
        cursor: pointer;
        font-weight: 600;
        transition: all 0.3s;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        flex: 1;
    }
    
    .btn-convert {
        background: linear-gradient(135deg, #2ecc71, #27ae60);
        color: white;
    }
    
    .btn-convert:hover {
        transform: translateY(-2px);
        box-shadow: 0 5px 15px rgba(46, 204, 113, 0.3);
    }
    
    .btn-back {
        background: #95a5a6;
        color: white;
    }
    
    .btn-back:hover {
        background: #7f8c8d;
    }
    
    .btn-new {
        background: #3498db;
        color: white;
    }
    
    .btn-new:hover {
        background: #2980b9;
    }
    
    .btn-close-modal {
        background: #e74c3c;
        color: white;
    }
    
    .btn-close-modal:hover {
        background: #c0392b;
    }
    
    .result-section {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 20px;
        margin: 20px 0;
    }
    
    @media (max-width: 768px) {
        .result-section {
            grid-template-columns: 1fr;
        }
    }
    
    .result-box {
        background: #f8f9fa;
        padding: 20px;
        border-radius: 8px;
        border: 1px solid #e0e0e0;
    }
    
    .result-box h5 {
        margin-top: 0;
        color: #333;
        display: flex;
        align-items: center;
        gap: 10px;
    }
    
    .code-display {
        background: #2c3e50;
        color: #ecf0f1;
        padding: 15px;
        border-radius: 6px;
        margin: 15px 0;
        max-height: 200px;
        overflow-y: auto;
        font-family: 'Courier New', monospace;
        font-size: 0.9em;
    }
    
    .btn-download, .btn-copy {
        padding: 10px 20px;
        border-radius: 6px;
        border: none;
        cursor: pointer;
        font-weight: 600;
        transition: all 0.3s;
        display: inline-flex;
        align-items: center;
        gap: 8px;
        margin-right: 10px;
    }
    
    .btn-download {
        background: #3498db;
        color: white;
    }
    
    .btn-download:hover {
        background: #2980b9;
    }
    
    .btn-copy {
        background: #2ecc71;
        color: white;
    }
    
    .btn-copy:hover {
        background: #27ae60;
    }
    
    .btn-group {
        display: flex;
        gap: 10px;
        margin-top: 10px;
    }
    
    .instructions {
        background: #fff8e1;
        padding: 20px;
        border-radius: 8px;
        margin: 20px 0;
        border-left: 4px solid #f39c12;
    }
    
    .instructions ol {
        margin: 10px 0 0 0;
        padding-left: 20px;
    }
    
    .instructions li {
        margin-bottom: 8px;
        line-height: 1.5;
    }
    
    .final-actions {
        display: flex;
        gap: 15px;
        margin-top: 30px;
    }
    
    .converter-footer {
        padding: 15px 20px;
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
    
    .progress-dot {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        background: #ddd;
        transition: all 0.3s;
    }
    
    .progress-dot.active {
        background: #667eea;
        transform: scale(1.2);
    }
    
    .progress-line {
        width: 40px;
        height: 2px;
        background: #ddd;
    }
    
    .converter-version {
        color: #666;
        font-size: 0.9em;
    }
    `;
    
    const styleElement = document.createElement('style');
    styleElement.textContent = styles;
    document.head.appendChild(styleElement);
}

// Setup event listeners untuk converter
function setupConverterEvents() {
    // Close modal
    document.querySelector('.converter-close').addEventListener('click', () => {
        document.getElementById('pkm-converter-modal').remove();
    });
    
    // Upload area click
    document.getElementById('uploadArea').addEventListener('click', () => {
        document.getElementById('fileInput').click();
    });
    
    // File input change
    document.getElementById('fileInput').addEventListener('change', handleFileUpload);
    
    // Remove file button
    document.getElementById('removeFile')?.addEventListener('click', removeUploadedFile);
    
    // Back button step 2
    document.getElementById('btnBackStep1')?.addEventListener('click', () => {
        showStep(1);
    });
    
    // Convert button
    document.getElementById('btnConvert')?.addEventListener('click', processConversion);
    
    // Download buttons
    document.getElementById('downloadModule')?.addEventListener('click', downloadModuleFile);
    document.getElementById('downloadJson')?.addEventListener('click', downloadJsonFile);
    
    // Copy JSON button
    document.getElementById('copyJson')?.addEventListener('click', copyJsonToClipboard);
    
    // New conversion button
    document.getElementById('btnNewConversion')?.addEventListener('click', startNewConversion);
    
    // Close modal button
    document.getElementById('btnCloseModal')?.addEventListener('click', () => {
        document.getElementById('pkm-converter-modal').remove();
    });
}

// Handle file upload
function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (!file.name.endsWith('.js') && !file.name.endsWith('.user.js')) {
        alert('⚠️ Harap upload file JavaScript (.js atau .user.js)');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        currentFileData = {
            name: file.name.replace('.user.js', '').replace('.js', ''),
            content: e.target.result,
            size: (file.size / 1024).toFixed(2)
        };
        
        // Update UI
        document.getElementById('fileName').textContent = file.name;
        document.getElementById('fileSize').textContent = currentFileData.size;
        document.getElementById('fileInfo').style.display = 'block';
        
        // Extract metadata dan show step 2
        extractMetadata(currentFileData.content);
        showStep(2);
    };
    
    reader.readAsText(file);
}

// Remove uploaded file
function removeUploadedFile() {
    currentFileData = null;
    document.getElementById('fileInput').value = '';
    document.getElementById('fileInfo').style.display = 'none';
    showStep(1);
}

// Extract metadata dari header Tampermonkey
function extractMetadata(code) {
    const metadata = {
        name: 'Unnamed Module',
        version: '1.0.0',
        description: 'Converted from Tampermonkey script',
        author: 'Unknown',
        match: ['*://*/*']
    };
    
    // Parse @name
    const nameMatch = code.match(/@name\s+(.+)/i);
    if (nameMatch) metadata.name = nameMatch[1].trim();
    
    // Parse @version
    const versionMatch = code.match(/@version\s+(.+)/i);
    if (versionMatch) metadata.version = versionMatch[1].trim();
    
    // Parse @description
    const descMatch = code.match(/@description\s+(.+)/i);
    if (descMatch) metadata.description = descMatch[1].trim();
    
    // Parse @author
    const authorMatch = code.match(/@author\s+(.+)/i);
    if (authorMatch) metadata.author = authorMatch[1].trim();
    
    // Parse @match (bisa multiple)
    const matchMatches = code.match(/@match\s+(.+)/gi);
    if (matchMatches) {
        metadata.match = matchMatches.map(m => m.replace(/@match\s+/i, '').trim());
    }
    
    // Tampilkan metadata di UI
    displayMetadata(metadata);
    
    return metadata;
}

// Display metadata di UI
function displayMetadata(metadata) {
    const grid = document.getElementById('metadataGrid');
    grid.innerHTML = '';
    
    const items = [
        { label: 'Nama Module', value: metadata.name, icon: '📝' },
        { label: 'Versi', value: metadata.version, icon: '🏷️' },
        { label: 'Deskripsi', value: metadata.description, icon: '📋' },
        { label: 'Author', value: metadata.author, icon: '👤' },
        { label: 'Match Patterns', value: metadata.match.join('\n'), icon: '🌐' }
    ];
    
    items.forEach(item => {
        const div = document.createElement('div');
        div.className = 'metadata-item';
        div.innerHTML = `
            <div class="metadata-label">${item.icon} ${item.label}</div>
            <div class="metadata-value">${item.value}</div>
        `;
        grid.appendChild(div);
    });
}

// Proses konversi utama
function processConversion() {
    if (!currentFileData) {
        alert('⚠️ Tidak ada file yang diupload!');
        return;
    }
    
    const metadata = extractMetadata(currentFileData.content);
    const convertedCode = convertTampermonkeyToModule(currentFileData.content, metadata);
    const jsonEntry = generateJsonEntry(metadata);
    
    conversionResult = {
        moduleCode: convertedCode,
        jsonEntry: jsonEntry,
        metadata: metadata
    };
    
    // Tampilkan hasil
    document.getElementById('moduleCode').textContent = convertedCode;
    document.getElementById('jsonEntry').textContent = jsonEntry;
    
    // Pindah ke step 3
    showStep(3);
}

// Convert Tampermonkey script ke module format
function convertTampermonkeyToModule(code, metadata) {
    // Hapus header block
    let cleaned = code.replace(/\/\/ ==UserScript==[\s\S]*?\/\/ ==\/UserScript==/g, '');
    
    // Hapus wrapper function (function() { 'use strict'; ... })();
    cleaned = cleaned.replace(/\(\s*function\s*\(\s*\)\s*\{[\s\S]*?['"]use strict['"][\s\S]*?\}\s*\)\s*\(\s*\)\s*;?/g, '');
    
    // Hapus sisa wrapper jika ada
    cleaned = cleaned.replace(/\(\s*function\s*\(\s*\)\s*\{[\s\S]*?\}\s*\)\s*\(\s*\)\s*;?/g, '');
    
    // Konversi GM_ functions ke PKM.*
    const replacements = [
        { from: /\bGM_getValue\b/g, to: 'PKM.storage.get' },
        { from: /\bGM_setValue\b/g, to: 'PKM.storage.set' },
        { from: /\bGM_deleteValue\b/g, to: 'PKM.storage.set' }, // Set null untuk delete
        { from: /\bGM_notification\b/g, to: '// PKM: GM_notification tidak tersedia di module' },
        { from: /\bGM_xmlhttpRequest\b/g, to: '// PKM: Gunakan fetch() API' }
    ];
    
    replacements.forEach(rep => {
        cleaned = cleaned.replace(rep.from, rep.to);
    });
    
    // Tambahkan module wrapper
    const moduleCode = `// Module: ${metadata.name}
// Converted by PKM Kedawung Converter
// Original: ${metadata.name} v${metadata.version}

PKM.log('${metadata.name} loaded', 'info');

// MODULE CODE START
${cleaned.trim()}
// MODULE CODE END

// Auto-initialization
function initModule() {
    // Module initialization logic
    PKM.log('${metadata.name} initialized', 'success');
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initModule);
} else {
    setTimeout(initModule, 100);
}

PKM.log('${metadata.name} ready', 'success');`;
    
    return moduleCode;
}

// Generate JSON entry untuk modules.json
function generateJsonEntry(metadata) {
    const moduleId = metadata.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
    
    const entry = {
        [moduleId]: {
            name: metadata.name,
            description: metadata.description,
            version: metadata.version,
            author: metadata.author,
            match: metadata.match
        }
    };
    
    return JSON.stringify(entry, null, 2);
}

// Download module file
function downloadModuleFile() {
    if (!conversionResult) return;
    
    const blob = new Blob([conversionResult.moduleCode], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    
    const filename = conversionResult.metadata.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') + '.js';
    
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    PKM.log(`Module file downloaded: ${filename}`, 'success');
}

// Download JSON file
function downloadJsonFile() {
    if (!conversionResult) return;
    
    const blob = new Blob([conversionResult.jsonEntry], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    
    const moduleId = conversionResult.metadata.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
    
    a.href = url;
    a.download = `${moduleId}-entry.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    PKM.log(`JSON entry downloaded for module: ${moduleId}`, 'success');
}

// Copy JSON to clipboard
function copyJsonToClipboard() {
    if (!conversionResult) return;
    
    navigator.clipboard.writeText(conversionResult.jsonEntry).then(() => {
        alert('✅ Entry JSON berhasil disalin ke clipboard!');
    }).catch(err => {
        console.error('Failed to copy:', err);
        alert('❌ Gagal menyalin ke clipboard');
    });
}

// Start new conversion
function startNewConversion() {
    currentFileData = null;
    conversionResult = null;
    document.getElementById('fileInput').value = '';
    showStep(1);
}

// Show specific step
function showStep(stepNumber) {
    // Hide all steps
    document.querySelectorAll('.converter-step').forEach(step => {
        step.style.display = 'none';
    });
    
    // Show target step
    document.getElementById(`step${stepNumber}`).style.display = 'block';
    
    // Update progress dots
    document.querySelectorAll('.progress-dot').forEach((dot, index) => {
        if (index + 1 <= stepNumber) {
            dot.classList.add('active');
        } else {
            dot.classList.remove('active');
        }
    });
}

// Initialize converter tool
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initConverterTool);
} else {
    initConverterTool();
}

PKM.log('Module Converter Tool initialized', 'success');
