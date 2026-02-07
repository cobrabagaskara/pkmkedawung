# 🏥 PKM Kedawung Screening Modular

Sistem otomasi skrining kesehatan modular untuk Puskesmas Kedawung menggunakan Tampermonkey.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Status](https://img.shields.io/badge/status-Development-yellow)

## 📋 Deskripsi

Sistem modular untuk otomasi 22+ skrining kesehatan di Puskesmas Kedawung dengan fitur:
- ✅ 22+ Modul Skrining Kesehatan
- ✅ Conditional Templates (berdasarkan usia/gender)
- ✅ Validasi Otomatis
- ✅ Theme Switcher (Light/Dark/Blue/Green)
- ✅ Analytics Dashboard
- ✅ Modular Architecture (mudah dikembangkan)

## 🎯 Fitur Utama

### Skrining Kesehatan
- **Kesehatan Umum**: Faktor Risiko, Diabetes Melitus, Hipertensi, dll
- **Lansia (≥60)**: SKILAS, GDS-4, AD-8 INA, MNA, Gigi Lansia
- **Jiwa & Mental**: PHQ-4, SRQ-29, SDQ, GDS-4, AD-8 INA
- **Ibu & Anak**: Layak Hamil, WAST, Kanker Serviks, Empedu Bayi
- **Khusus**: Kanker Paru, Kanker Kolorektal, Obesitas, PPOK, TBC

### Utilities
- Theme Switcher (☀️→🌙→🔵→🟢)
- Data Reader
- Export Tools
- Analytics Dashboard

## 🚀 Instalasi Client

### Prerequisites
- Browser: Chrome, Firefox, atau Edge
- Extension: Tampermonkey (install dari [tampermonkey.net](https://www.tampermonkey.net/))

### Langkah Instalasi
1. Install Tampermonkey extension
2. Buka file `client/loader.js`
3. Klik "Install" di Tampermonkey
4. Refresh halaman EPUSKESMAS
5. Tombol 🏥 PKM Screening akan muncul di pojok kanan bawah

## 🛠️ Development Setup

### Prerequisites
- Node.js (untuk build tools)
- Git
- Web browser dengan Tampermonkey

### Clone Repository
```bash
git clone https://github.com/cobrabagaskara/pkmkedawung.git
cd pkmkedawung
