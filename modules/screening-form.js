// Module: Auto Fill Screening Form
// Match: *://*/skrining*, *://*/screening*

(function() {
    'use strict';

    PKM.info('Screening Form module initialized');

    // Tunggu DOM ready
    function whenReady(callback) {
        if (document.readyState !== 'loading') {
            callback();
        } else {
            document.addEventListener('DOMContentLoaded', callback);
        }
    }

    // Deteksi form screening
    function detectScreeningForm() {
        // Cari form dengan keyword "skrining" atau "screening"
        const forms = document.querySelectorAll('form');
        
        for (const form of forms) {
            const formText = form.textContent.toLowerCase();
            if (formText.includes('skrining') || formText.includes('screening')) {
                return form;
            }
        }
        
        return null;
    }

    // Buat tombol auto-fill
    function createAutoFillButton() {
        const button = document.createElement('button');
        button.textContent = '⚡ Auto Fill Data';
        button.style.cssText = `
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 12px 24px;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 16px;
            font-weight: 600;
            margin: 10px 0;
            box-shadow: 0 4px 6px rgba(102, 126, 234, 0.3);
            transition: all 0.3s ease;
        `;
        
        button.onmouseover = () => {
            button.style.transform = 'translateY(-2px)';
            button.style.boxShadow = '0 6px 12px rgba(102, 126, 234, 0.4)';
        };
        
        button.onmouseout = () => {
            button.style.transform = 'translateY(0)';
            button.style.boxShadow = '0 4px 6px rgba(102, 126, 234, 0.3)';
        };
        
        button.onclick = fillFormData;
        
        return button;
    }

    // Isi form otomatis
    function fillFormData() {
        PKM.info('Auto-filling form...');
        
        // Contoh data - bisa disesuaikan atau diambil dari database
        const sampleData = {
            nik: '3301234567890123',
            nama: 'Contoh Pasien',
            tanggal_lahir: '1990-01-01',
            jenis_kelamin: 'L',
            alamat: 'Jl. Contoh No. 123'
        };
        
        // Cari dan isi field-field
        Object.entries(sampleData).forEach(([field, value]) => {
            const input = document.querySelector(
                `[name="${field}"], #${field}, input[placeholder*="${field}"]`
            );
            
            if (input) {
                input.value = value;
                PKM.log(`Filled ${field}:`, value);
            }
        });
        
        PKM.info('✅ Form filled successfully!');
        
        // Show notification
        showNotification('Form berhasil diisi otomatis!');
    }

    // Tampilkan notifikasi
    function showNotification(message) {
        const notification = document.createElement('div');
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #d4edda;
            color: #155724;
            padding: 15px 25px;
            border-radius: 8px;
            border-left: 4px solid #28a745;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 9999;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        // Auto-remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
        
        // Add animation styles
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(400px); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(400px); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }

    // Initialize module
    whenReady(() => {
        const form = detectScreeningForm();
        
        if (form) {
            PKM.info('Screening form detected!');
            
            // Tambahkan tombol auto-fill
            const button = createAutoFillButton();
            form.insertBefore(button, form.firstChild);
            
        } else {
            PKM.log('No screening form found on this page');
        }
    });

})();