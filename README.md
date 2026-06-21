# Course Marketplace DApp

DApp marketplace jasa kursus online berbasis blockchain (simulasi ETH lokal via Hardhat),
dengan frontend Next.js dan koneksi MetaMask di browser.

## Struktur Project

```
course-marketplace-dapp/
├── backend/      -> Smart contract Solidity + Hardhat (simulasi network ETH)
├── konektor/     -> Library penghubung Web3 (MetaMask + ethers.js) yang dipakai frontend
└── antarmuka/    -> Frontend Next.js (UI marketplace kursus)
```

Alur kerja: `backend` men-deploy contract ke network simulasi Hardhat lalu menulis
alamat contract + ABI ke `konektor/contractConfig.json`. `antarmuka` mengimpor
`konektor` (sebagai local package) untuk berkomunikasi dengan contract lewat MetaMask.

---

## 1. Instalasi Prasyarat di Ubuntu

Buka terminal dan jalankan:

```bash
# Update sistem
sudo apt update && sudo apt upgrade -y

# Install curl & build tools
sudo apt install -y curl build-essential

# Install Node.js 20.x (LTS) via NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Cek versi (pastikan Node >= 18)
node -v
npm -v

# Install git (jika belum ada)
sudo apt install -y git
```

Install ekstensi **MetaMask** di browser (Chrome/Brave/Firefox) dari
https://metamask.io/download/ jika belum terpasang.

---

## 2. Menyiapkan Project

Jika kode ini berupa folder hasil ekstrak zip, masuk ke folder utama:

```bash
cd course-marketplace-dapp
```

### 2.1. Install dependencies backend (Hardhat)

```bash
cd backend
npm install
```

### 2.2. Install dependencies konektor

```bash
cd ../konektor
npm install
```

### 2.3. Install dependencies frontend (Next.js)

```bash
cd ../antarmuka
npm install
```

> Catatan: `antarmuka/package.json` memuat dependency `"konektor": "file:../konektor"`,
> sehingga `npm install` di atas otomatis membuat symlink ke folder `konektor`.

---

## 3. Menjalankan Blockchain Simulasi (Hardhat Local Node)

Buka **terminal pertama**, jalankan node Hardhat (simulasi blockchain ETH lokal):

```bash
cd backend
npx hardhat node
```

Terminal ini akan terus berjalan dan menampilkan daftar **20 akun test**
beserta **private key** dan saldo masing-masing **10000 ETH (simulasi)**.
Biarkan terminal ini tetap berjalan.

---

## 4. Compile & Deploy Smart Contract

Buka **terminal kedua**:

```bash
cd backend
npx hardhat compile
npm run deploy:local
```

Jika berhasil, akan muncul output seperti:

```
Deploying CourseMarketplace ke network: localhost
CourseMarketplace berhasil di-deploy di address: 0x5FbDB2315678afecb367f032d93F642f64180aa
Konfigurasi contract berhasil ditulis ke: .../konektor/contractConfig.json
```

Script deploy otomatis menulis address + ABI contract ke
`konektor/contractConfig.json`, jadi frontend langsung bisa memakainya tanpa
konfigurasi manual.

---

## 5. Konfigurasi MetaMask agar Terhubung ke Network Lokal

1. Buka MetaMask di browser.
2. Klik dropdown network (biasanya bertuliskan "Ethereum Mainnet") → **Add network** → **Add a network manually**.
3. Isi:
   - **Network name**: `Hardhat Local`
   - **New RPC URL**: `http://127.0.0.1:8545`
   - **Chain ID**: `31337`
   - **Currency symbol**: `ETH`
4. Simpan.

> Aplikasi frontend juga sudah diprogram untuk otomatis meminta MetaMask
> menambahkan/menukar ke network ini saat tombol "Hubungkan MetaMask" diklik.

### Import Akun Test (agar punya saldo ETH simulasi)

1. Di terminal pertama (`npx hardhat node`), copy salah satu **Private Key** akun test (akun #0 atau #1).
2. Di MetaMask: klik ikon akun → **Import account** → tempel private key tersebut.
3. Pastikan network MetaMask sudah dipilih ke `Hardhat Local`. Saldo 10000 ETH simulasi akan muncul.

⚠️ **Private key bawaan Hardhat ini publik dan hanya untuk testing lokal. Jangan pernah memakainya di network asli / mainnet.**

---

## 6. Menjalankan Frontend (Next.js)

Buka **terminal ketiga**:

```bash
cd antarmuka
npm run dev
```

Buka browser ke **http://localhost:3000**

---

## 7. Mencoba Aplikasi

1. Klik **Hubungkan MetaMask** di pojok kanan atas, lalu pilih akun test yang sudah diimport.
2. Buka menu **Buat Kursus** untuk menerbitkan kursus baru (isi judul, deskripsi, link materi, harga ETH). Konfirmasi transaksi di popup MetaMask.
3. Kembali ke halaman utama, kursus akan muncul dalam daftar (ledger). Coba beli dengan akun MetaMask **lain** (import akun test #1 sebagai "pembeli", karena instructor tidak bisa membeli kursusnya sendiri).
4. Buka menu **Kursus Saya** untuk melihat kursus yang dimiliki, kursus yang diterbitkan, serta menarik (withdraw) saldo hasil penjualan sebagai instructor.

---

## 8. Menjalankan Unit Test Smart Contract (opsional)

```bash
cd backend
npx hardhat test
```

---

## Arsitektur Data & Otentikasi (penting dipahami)

- **Tidak ada database.** Semua data kursus, rating, dan sertifikat disimpan langsung
  di *storage* smart contract `CourseMarketplace.sol`, di blockchain simulasi Hardhat.
  Tidak ada PostgreSQL/MongoDB/dsb — ini demo arsitektur Web3 murni.
- **Tidak ada login username/password.** Identitas pengguna = alamat wallet MetaMask
  yang sedang aktif ("Connect Wallet"). Private key test Hardhat yang Anda *import*
  ke MetaMask hanya untuk mensimulasikan akun bersaldo ETH testing, dan dipakai untuk
  menandatangani transaksi (signing), bukan sebagai kredensial login.

## Fitur

- Jelajahi, **cari**, **filter kategori**, dan **urutkan** (terbaru / harga / rating) kursus
- Upload **thumbnail** kursus (disimpan sebagai base64 langsung di blockchain, maks 250KB)
- Beli akses kursus dengan ETH simulasi
- **Rating** 1–5 bintang oleh pembeli (tercatat on-chain, satu rating per pembeli)
- **E-sertifikat** on-chain: pembeli yang sudah memiliki akses bisa menerbitkan sertifikat
  yang tersimpan permanen di contract, lengkap dengan halaman verifikasi (`/certificate/[id]`)
  dan opsi cetak ke PDF
- Panel earnings & withdraw untuk instructor

## Troubleshooting Khusus: Error "could not decode result data (BAD_DATA value=0x)"

Error ini berarti ethers.js memanggil contract di alamat yang **tidak punya kode** di
network yang sedang aktif. Penyebab paling umum & solusinya:

1. **Node Hardhat baru di-restart** → seluruh state blockchain ter-reset, tapi
   `contractConfig.json` masih menyimpan address contract lama.
   → Jalankan ulang: `cd backend && npm run deploy:local`, lalu refresh browser.
2. **MetaMask tidak berada di network "Hardhat Local"** (misal masih di Mainnet/Sepolia).
   → Pastikan dropdown network MetaMask menunjuk ke chain ID `31337`.

Versi terbaru kode ini sudah menambahkan validasi otomatis di `konektor/web3Connector.js`
yang akan menampilkan pesan error yang jelas (bukan error mentah ethers.js) jika dua hal
di atas terjadi.


|---|---|
| `MetaMask tidak ditemukan` | Pastikan ekstensi MetaMask terpasang & browser di-refresh |
| Transaksi gagal terus / nonce error | Di MetaMask: Settings → Advanced → "Clear activity tab data" (reset akun lokal) |
| Daftar kursus kosong setelah restart `hardhat node` | Node lokal di-reset setiap restart, jalankan ulang `npm run deploy:local` |
| Frontend error "Alamat contract belum tersedia" | Pastikan sudah menjalankan `npm run deploy:local` di folder backend |
| Error saat `npm install` di antarmuka terkait `konektor` | Pastikan folder `konektor` sudah di-`npm install` lebih dulu |

## Teknologi yang Digunakan

- **Solidity ^0.8.20** – bahasa smart contract
- **Hardhat** – environment simulasi blockchain ETH lokal + tooling compile/deploy/test
- **ethers.js v6** – library interaksi dengan smart contract dari JavaScript
- **Next.js 14 (Pages Router)** – framework frontend React
- **MetaMask** – wallet browser untuk signing transaksi
