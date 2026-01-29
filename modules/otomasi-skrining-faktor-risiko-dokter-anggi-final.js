// Module: Otomasi Skrining Faktor Risiko
// File: modules/otomasi-skrining-faktor-risiko.js
// Deskripsi: Otomasi pengisian form skrining faktor risiko

PKM.log('Otomasi Skrining Faktor Risiko Module loaded', 'info');

// =====================================
// DATA SKRINING (Dari recording terbaru)
// =====================================
const screeningData = {
    metadata: {
        url: "https://cirebon.epuskesmas.id/skriningfaktorrisiko/create/93481",
        skrining: "93481",
        judul: "Skrining Faktor Risiko",
        recordedAt: "2026-01-26T16:05:59.510Z",
        totalActions: 20
    },
    actions: [
        { type: "setRadio", name: "69", value: "215" },
        { type: "setRadio", name: "72", value: "217" },
        { type: "setRadio", name: "75", value: "220" },
        { type: "setRadio", name: "76", value: "222" },
        { type: "setValue", name: "77", value: "1" },
        { type: "setValue", name: "78", value: "60" }, // Value terakhir setelah correction
        { type: "setRadio", name: "19", value: "113" },
        { type: "setRadio", name: "21", value: "119" },
        { type: "setRadio", name: "23", value: "125" },
        { type: "setRadio", name: "25", value: "131" },
        { type: "setRadio", name: "27", value: "137" },
        { type: "setRadio", name: "29", value: "143" },
        { type: "setRadio", name: "31", value: "151" },
        { type: "setRadio", name: "33", value: "157" },
        { type: "setRadio", name: "37", value: "163" },
        { type: "setRadio", name: "41", value: "165" }, // ⚠️ Berubah dari 167
        { type: "setRadio", name: "43", value: "169" }, // ⚠️ Berubah dari 171
        { type: "setRadio", name: "45", value: "173" },
        { type: "setRadio", name: "47", value: "177" }
    ]
};

// =====================================
// CONFIG
// =====================================
const CONFIG = {
    DELAY_BETWEEN_FIELDS: 250,   // Delay antar field (ms)
    SCROLL_DELAY: 100,           // Delay setelah scroll (ms)
    MAX_WAIT_TIME: 5000          // Max wait untuk element (ms)
};

// =====================================
// HELPERS
// =====================================
const now = () => new Date().toISOString();

function log(message, type = 'info') {
    const prefix = {
        info: 'ℹ️',
        success: '✅',
        warning: '⚠️',
        error: '❌',
        progress: '📝'
    }[type] || 'ℹ️';
    
    // Gunakan PKM.log untuk logging terstruktur
    PKM.log(`[${type.toUpperCase()}] ${message}`, type);
    console.log(`${prefix} [${now()}] ${message}`);
}

// =====================================
// WAIT FOR ELEMENT (Pakai PKM.utils jika ada)
// =====================================
async function waitForElement(selector, timeout = CONFIG.MAX_WAIT_TIME) {
    // Coba pakai PKM.utils jika tersedia
    if (PKM.utils && typeof PKM.utils.waitForElement === 'function') {
        try {
            return await PKM.utils.waitForElement(selector, timeout);
        } catch (error) {
            // Fallback ke implementasi sendiri
        }
    }
    
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

        observer.observe(document.body, { childList: true, subtree: true });

        setTimeout(() => {
            observer.disconnect();
            reject(new Error(`Timeout: ${selector} tidak ditemukan`));
        }, timeout);
    });
}

// =====================================
// SET RADIO BUTTON
// =====================================
async function setRadio(name, value) {
    try {
        // Cari radio button
        let radio = document.querySelector(`input[type="radio"][name="${name}"][value="${value}"]`);

        if (!radio) {
            // Cari alternatif
            const radios = document.querySelectorAll(`input[type="radio"][name="${name}"]`);
            if (radios.length > 0) {
                radio = Array.from(radios).find(r =>
                    r.value === value ||
                    r.value.trim() === value.trim()
                );
            }
        }

        if (radio) {
            // Scroll ke element
            radio.scrollIntoView({ behavior: 'smooth', block: 'center' });
            await new Promise(resolve => setTimeout(resolve, CONFIG.SCROLL_DELAY));

            // Set checked
            radio.checked = true;

            // Trigger events
            ['click', 'change', 'input'].forEach(eventType => {
                radio.dispatchEvent(new Event(eventType, { bubbles: true }));
            });

            log(`Radio [${name}] = [${value}]`, 'success');
            return true;
        } else {
            log(`Radio [${name}] dengan value [${value}] tidak ditemukan`, 'warning');
            return false;
        }
    } catch (error) {
        log(`Error setting radio [${name}]: ${error.message}`, 'error');
        return false;
    }
}

// =====================================
// SET INPUT/TEXTAREA VALUE
// =====================================
async function setValue(name, value) {
    try {
        // Cari input field
        let input = document.querySelector(`input[name="${name}"], textarea[name="${name}"]`);

        if (!input) {
            // Cari alternatif
            const inputs = document.querySelectorAll('input, textarea');
            input = Array.from(inputs).find(el =>
                el.name === name ||
                el.id === name
            );
        }

        if (input) {
            // Scroll ke element
            input.scrollIntoView({ behavior: 'smooth', block: 'center' });
            await new Promise(resolve => setTimeout(resolve, CONFIG.SCROLL_DELAY));

            // Set value
            input.value = value;

            // Trigger events
            ['input', 'change'].forEach(eventType => {
                input.dispatchEvent(new Event(eventType, { bubbles: true }));
            });

            log(`Input [${name}] = [${value}]`, 'success');
            return true;
        } else {
            log(`Input [${name}] tidak ditemukan`, 'warning');
            return false;
        }
    } catch (error) {
        log(`Error setting value [${name}]: ${error.message}`, 'error');
        return false;
    }
}

// =====================================
// VALIDASI FORM SEBELUM SUBMIT
// =====================================
function validateForm() {
    const results = {
        total: screeningData.actions.length,
        filled: 0,
        missing: []
    };

    screeningData.actions.forEach(item => {
        let found = false;

        if (item.type === "setRadio") {
            const radio = document.querySelector(`input[type="radio"][name="${item.name}"][value="${item.value}"]`);
            if (radio && radio.checked) {
                found = true;
            }
        } else if (item.type === "setValue") {
            const input = document.querySelector(`input[name="${item.name}"], textarea[name="${item.name}"]`);
            if (input && input.value === item.value) {
                found = true;
            }
        }

        if (found) {
            results.filled++;
        } else {
            results.missing.push(item.name);
        }
    });

    return results;
}

// =====================================
// MAIN AUTOMATION FUNCTION
// =====================================
async function runAutomation() {
    log('🚀 === MEMULAI OTOMASI SKRINING ===', 'info');
    log(`📄 Form: ${screeningData.metadata.judul}`, 'info');
    log(`📊 Total fields: ${screeningData.actions.length}`, 'info');

    let successCount = 0;
    let failCount = 0;
    const failedFields = [];

    // Proses setiap field
    for (let i = 0; i < screeningData.actions.length; i++) {
        const item = screeningData.actions[i];
        const progress = Math.round(((i + 1) / screeningData.actions.length) * 100);

        log(`Progress: ${progress}% - [${i + 1}/${screeningData.actions.length}] ${item.type} (${item.name})`, 'progress');

        let success = false;

        try {
            if (item.type === "setRadio") {
                success = await setRadio(item.name, item.value);
            } else if (item.type === "setValue") {
                success = await setValue(item.name, item.value);
            }

            // Delay antar field
            await new Promise(resolve => setTimeout(resolve, CONFIG.DELAY_BETWEEN_FIELDS));

        } catch (error) {
            log(`Error processing field ${item.name}: ${error.message}`, 'error');
            success = false;
        }

        if (success) {
            successCount++;
        } else {
            failCount++;
            failedFields.push({ name: item.name, type: item.type });
        }
    }

    // Validasi hasil
    const validation = validateForm();

    // Tampilkan hasil
    console.log('\n' + '='.repeat(60));
    log(`OTOMASI SELESAI!`, 'success');
    console.log('='.repeat(60));
    log(`✓ Berhasil diisi: ${successCount}`, 'success');
    log(`✗ Gagal diisi: ${failCount}`, 'error');
    log(`✓ Validasi form: ${validation.filled}/${validation.total} fields terisi`, 'info');
    console.log('='.repeat(60));

    if (failedFields.length > 0) {
        log(`\n⚠️ Field yang gagal:`, 'warning');
        failedFields.forEach(field => {
            console.log(`   - ${field.name} (${field.type})`);
        });
    }

    if (validation.missing.length > 0) {
        log(`\n⚠️ Field yang belum terisi (validasi):`, 'warning');
        validation.missing.forEach(name => {
            console.log(`   - ${name}`);
        });
    }

    // Tampilkan notifikasi
    showNotification(successCount, failCount, validation);

    return { successCount, failCount, validation };
}

// =====================================
// SHOW NOTIFICATION (Modified for module system)
// =====================================
function showNotification(success, fail, validation) {
    const message = `✅ Otomasi Selesai!\n\n` +
                   `✓ Berhasil: ${success}\n` +
                   `✗ Gagal: ${fail}\n` +
                   `📊 Terisi: ${validation.filled}/${validation.total}\n\n` +
                   `Silakan periksa form sebelum submit.`;

    // Module system tidak memiliki GM_notification, pakai alert
    alert(message);
    
    // Bisa juga pakai console notification
    console.log(`%c📢 ${message.replace(/\n/g, ' ')}`, 'background: #4CAF50; color: white; padding: 10px; border-radius: 5px;');
}

// =====================================
// ADD BUTTON (FIXED VERSION)
// =====================================
function addButton() {
    // Hapus button lama jika ada
    const oldBtn = document.getElementById('pkm-otomasi-btn');
    if (oldBtn) oldBtn.remove();

    const button = document.createElement('button');
    button.id = 'pkm-otomasi-btn';
    button.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px;">
            <span>🚀</span>
            <div style="text-align: left;">
                <div style="font-weight: bold; font-size: 14px;">Jalankan Otomasi</div>
                <div style="font-size: 11px; opacity: 0.9;">Skrining Faktor Risiko</div>
            </div>
        </div>
    `;

    Object.assign(button.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: '999999',
        padding: '14px 20px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        border: 'none',
        borderRadius: '12px',
        cursor: 'pointer',
        fontFamily: 'Arial, sans-serif',
        fontSize: '14px',
        boxShadow: '0 6px 20px rgba(102, 126, 234, 0.4)',
        transition: 'all 0.3s ease',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
    });

    button.addEventListener('mouseover', () => {
        button.style.transform = 'translateY(-3px) scale(1.02)';
        button.style.boxShadow = '0 8px 25px rgba(102, 126, 234, 0.6)';
    });

    button.addEventListener('mouseout', () => {
        button.style.transform = 'translateY(0) scale(1)';
        button.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.4)';
    });

    button.addEventListener('click', async () => {
        if (button.disabled) return;

        // Disable button saat processing
        button.disabled = true;
        button.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px;">
                <span>⏳</span>
                <div style="text-align: left;">
                    <div style="font-weight: bold; font-size: 14px;">Processing...</div>
                    <div style="font-size: 11px; opacity: 0.9;">Mohon tunggu</div>
                </div>
            </div>
        `;
        button.style.background = '#6c757d';
        button.style.cursor = 'wait';
        button.style.transform = 'scale(0.98)';

        try {
            await runAutomation();
        } catch (error) {
            log(`Error during automation: ${error.message}`, 'error');
            alert(`❌ Terjadi error:\n${error.message}`);
        } finally {
            // Re-enable button
            setTimeout(() => {
                button.disabled = false;
                button.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span>✅</span>
                        <div style="text-align: left;">
                            <div style="font-weight: bold; font-size: 14px;">Selesai!</div>
                            <div style="font-size: 11px; opacity: 0.9;">Klik untuk Ulangi</div>
                        </div>
                    </div>
                `;
                button.style.background = 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)';
                button.style.cursor = 'pointer';
                button.style.transform = 'scale(1)';

                // Reset setelah 3 detik
                setTimeout(() => {
                    button.innerHTML = `
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <span>🚀</span>
                            <div style="text-align: left;">
                                <div style="font-weight: bold; font-size: 14px;">Jalankan Otomasi</div>
                                <div style="font-size: 11px; opacity: 0.9;">Skrining Faktor Risiko</div>
                            </div>
                        </div>
                    `;
                    button.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
                }, 3000);
            }, 500);
        }
    });

    document.body.appendChild(button);
    log('🔘 Tombol otomasi berhasil ditambahkan', 'success');
    return button;
}

// =====================================
// INITIALIZATION (FIXED for module system)
// =====================================
async function initializeModule() {
    log('Initializing Otomasi Skrining Faktor Risiko Module v3.0', 'info');
    log(`📄 Data source: ${screeningData.metadata.judul}`, 'info');
    log(`📅 Recorded at: ${screeningData.metadata.recordedAt}`, 'info');
    log(`📊 Total actions: ${screeningData.metadata.totalActions}`, 'info');
    
    // Tunggu sampai DOM benar-benar siap
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            // Tambah delay kecil untuk memastikan semua element sudah render
            setTimeout(() => {
                addButton();
            }, 100);
        });
    } else {
        // Jika DOM sudah siap, tunggu sedikit lalu tambah button
        setTimeout(() => {
            addButton();
        }, 500);
    }
    
    // Juga setup MutationObserver untuk dynamic content
    const observer = new MutationObserver((mutations) => {
        // Cek jika button hilang (misal karena page refresh partial)
        if (!document.getElementById('pkm-otomasi-btn')) {
            addButton();
        }
    });
    
    observer.observe(document.body, { childList: true, subtree: true });
    
    // Simpan observer untuk nanti di-cleanup
    window._pkmOtomasiObserver = observer;
    
    log('Module initialization complete', 'success');
}

// =====================================
// EKSPOS FUNGSI KE WINDOW (optional)
// =====================================
window.runSkriningOtomasi = runAutomation;
window.addSkriningButton = addButton;
window.getSkriningData = () => screeningData;

// =====================================
// AUTO-INITIALIZE
// =====================================
// Tunggu sedikit sebelum initialize
setTimeout(() => {
    initializeModule();
}, 100);

PKM.log('Otomasi Skrining Faktor Risiko Module ready', 'success');
