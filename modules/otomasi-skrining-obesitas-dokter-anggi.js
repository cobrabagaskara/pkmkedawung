// ==UserScript==
// @name         Otomasi Skrining Obesitas - Dokter Anggi
// @namespace    https://cirebon.epuskesmas.id
// @version      1.0
// @description  Otomasi pengisian form skrining obesitas - Data terbaru dari recording
// @author       You
// @match        https://cirebon.epuskesmas.id/skriningobesitas/create/*
// @grant        GM_notification
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';

    // =====================================
    // DATA SKRINING (Dari recording terbaru)
    // =====================================
    const screeningData = {
        "metadata": {
            "url": "https://cirebon.epuskesmas.id/skriningobesitas/",
            "skrining": "Obesitas",
            "judul": "Skrining Obesitas",
            "recordedAt": "2026-01-28T07:12:03.946Z",
            "totalActions": 7
        },
        "actions": [
            {
                "type": "setRadio",
                "name": "makan_manis",
                "value": "Tidak",
                "time": "2026-01-28T07:11:06.720Z"
            },
            {
                "type": "setRadio",
                "name": "aktifitas_fisik",
                "value": "Tidak",
                "time": "2026-01-28T07:11:08.186Z"
            },
            {
                "type": "setRadio",
                "name": "istirahat_cukup",
                "value": "Ya",
                "time": "2026-01-28T07:11:09.097Z"
            },
            {
                "type": "setRadio",
                "name": "risiko_merokok",
                "value": "Tidak",
                "time": "2026-01-28T07:11:27.032Z"
            },
            {
                "type": "setRadio",
                "name": "keluarga_alkohol_merokok",
                "value": "Tidak",
                "time": "2026-01-28T07:11:27.928Z"
            },
            {
                "type": "setRadio",
                "name": "obat_steroid",
                "value": "Tidak",
                "time": "2026-01-28T07:11:32.899Z"
            },
            {
                "type": "setValue",
                "name": "kategori_status_gizi",
                "value": "Gizi Baik",
                "time": "2026-01-28T07:11:56.461Z"
            }
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
        console.log(`${prefix} [${now()}] ${message}`);
    }

    // =====================================
    // WAIT FOR ELEMENT
    // =====================================
    function waitForElement(selector, timeout = CONFIG.MAX_WAIT_TIME) {
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
            // Cari radio button dengan case-insensitive matching
            const radios = document.querySelectorAll(`input[type="radio"][name="${name}"]`);

            if (radios.length === 0) {
                log(`Radio [${name}] tidak ditemukan`, 'warning');
                return false;
            }

            let radio = null;
            for (const r of radios) {
                if (r.value.trim().toLowerCase() === value.trim().toLowerCase()) {
                    radio = r;
                    break;
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
    // SET INPUT/SELECT VALUE
    // =====================================
    async function setValue(name, value) {
        try {
            // Cek apakah element adalah select atau input
            const select = document.querySelector(`select[name="${name}"]`);
            const input = document.querySelector(`input[name="${name}"], textarea[name="${name}"]`);

            let element = select || input;

            if (!element) {
                log(`Element [${name}] tidak ditemukan`, 'warning');
                return false;
            }

            // Scroll ke element
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            await new Promise(resolve => setTimeout(resolve, CONFIG.SCROLL_DELAY));

            // Set value berdasarkan tipe element
            if (element.tagName === 'SELECT') {
                // Handle dropdown
                for (const option of element.options) {
                    if (option.value === value ||
                        option.value.trim() === value.trim() ||
                        option.textContent.trim().toLowerCase() === value.trim().toLowerCase()) {
                        element.value = option.value;
                        break;
                    }
                }
            } else {
                // Handle input/textarea
                element.value = value;
            }

            // Trigger events
            ['input', 'change'].forEach(eventType => {
                element.dispatchEvent(new Event(eventType, { bubbles: true }));
            });

            log(`${element.tagName === 'SELECT' ? 'Select' : 'Input'} [${name}] = [${value}]`, 'success');
            return true;
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
                const select = document.querySelector(`select[name="${item.name}"]`);
                const input = document.querySelector(`input[name="${item.name}"], textarea[name="${item.name}"]`);
                const element = select || input;

                if (element) {
                    if (element.tagName === 'SELECT') {
                        if (element.value === item.value) {
                            found = true;
                        }
                    } else {
                        if (element.value === item.value) {
                            found = true;
                        }
                    }
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
        log('🚀 === MEMULAI OTOMASI SKRINING OBESITAS ===', 'info');
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
        log(`📊 Terisi: ${validation.filled}/${validation.total} fields terisi`, 'info');
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
    // SHOW NOTIFICATION
    // =====================================
    function showNotification(success, fail, validation) {
        const message = `✅ Otomasi Selesai!\n\n` +
                       `✓ Berhasil: ${success}\n` +
                       `✗ Gagal: ${fail}\n` +
                       `📊 Terisi: ${validation.filled}/${validation.total}\n\n` +
                       `Silakan periksa form sebelum submit.`;

        if (typeof GM_notification !== 'undefined') {
            GM_notification({
                title: '✅ Otomasi Skrining Obesitas Selesai',
                text: message,
                timeout: 8000,
                onclick: () => {
                    console.log('User clicked notification');
                }
            });
        } else {
            alert(message);
        }
    }

    // =====================================
    // ADD BUTTON
    // =====================================
    function addButton() {
        // Hapus button lama jika ada
        const oldBtn = document.getElementById('tampermonkey-otomasi-btn');
        if (oldBtn) oldBtn.remove();

        const button = document.createElement('button');
        button.id = 'tampermonkey-otomasi-btn';
        button.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px;">
                <span>⚖️</span>
                <div style="text-align: left;">
                    <div style="font-weight: bold; font-size: 14px;">Jalankan Otomasi</div>
                    <div style="font-size: 11px; opacity: 0.9;">Skrining Obesitas</div>
                </div>
            </div>
        `;

        Object.assign(button.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: '999999',
            padding: '14px 20px',
            background: 'linear-gradient(135deg, #ffd89b 0%, #19547b 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            cursor: 'pointer',
            fontFamily: 'Arial, sans-serif',
            fontSize: '14px',
            boxShadow: '0 6px 20px rgba(255, 216, 155, 0.4)',
            transition: 'all 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
        });

        button.onmouseover = () => {
            button.style.transform = 'translateY(-3px) scale(1.02)';
            button.style.boxShadow = '0 8px 25px rgba(255, 216, 155, 0.6)';
        };

        button.onmouseout = () => {
            button.style.transform = 'translateY(0) scale(1)';
            button.style.boxShadow = '0 6px 20px rgba(255, 216, 155, 0.4)';
        };

        button.onclick = async () => {
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
                                <span>⚖️</span>
                                <div style="text-align: left;">
                                    <div style="font-weight: bold; font-size: 14px;">Jalankan Otomasi</div>
                                    <div style="font-size: 11px; opacity: 0.9;">Skrining Obesitas</div>
                                </div>
                            </div>
                        `;
                        button.style.background = 'linear-gradient(135deg, #ffd89b 0%, #19547b 100%)';
                    }, 3000);
                }, 500);
            }
        };

        document.body.appendChild(button);
        log('🔘 Tombol otomasi berhasil ditambahkan', 'success');
    }

    // =====================================
    // AUTO-RUN (Optional)
    // =====================================
    function autoRunIfNeeded() {
        // Uncomment jika ingin auto-run
        /*
        const autoRunUrls = [
            '/skriningobesitas/create/'
        ];

        autoRunUrls.forEach(pattern => {
            if (window.location.pathname.includes(pattern)) {
                log('🤖 Auto-running otomasi dalam 3 detik...', 'info');
                setTimeout(() => {
                    runAutomation();
                }, 3000);
            }
        });
        */
    }

    // =====================================
    // INITIALIZATION
    // =====================================
    log('Intialized Tampermonkey - Otomasi Skrining Obesitas v1.0', 'info');
    log(`📄 Data source: ${screeningData.metadata.judul}`, 'info');
    log(`📅 Recorded at: ${screeningData.metadata.recordedAt}`, 'info');
    log(`📊 Total actions: ${screeningData.metadata.totalActions}`, 'info');

    // Tambahkan tombol setelah halaman siap
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', addButton);
    } else {
        addButton();
    }

    // Cek untuk auto-run
    autoRunIfNeeded();

})();