# UTS PPLOS B — 2410511098 M. Arif Alfarizy

## Struktur Project

```
gateway/                     → API Gateway (Node.js) — port 3000
services/
├── auth-service/            → Auth Service (Node.js) — port 3001
├── fields-service/          → Fields & Slots Service (Node.js) — port 3002
└── booking-payment-service/ → Booking & Payment Service (Laravel) — port 3003
```

---

## Prasyarat

- Node.js
- PHP & Composer
- MySQL

---

## Instalasi

### 1. Clone repository

```bash
git clone <url-repo>
cd <nama-folder>
```

### 2. Install dependencies semua service

```bash
# Gateway
cd gateway && npm install

# Auth Service
cd ../services/auth-service && npm install

# Fields Service
cd ../fields-service && npm install

# Booking & Payment Service
cd ../booking-payment-service && composer install
```

### 3. Isi file `.env` masing-masing service

**gateway/.env**
```env
JWT_ACCESS_SECRET="Alit"
JWT_REFRESH_SECRET="Reja"
INTERNAL_GATEWAY_KEY=Alit123
```

**services/auth-service/.env**
```env
PORT=3001
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=auth_db
JWT_ACCESS_SECRET="Alit"
JWT_REFRESH_SECRET="Reja"
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:3001/api/auth/google/callback
NODE_ENV=development
```

**services/fields-service/.env**
```env
PORT=3002
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=fields_db
JWT_ACCESS_SECRET="Alit"
```

**services/booking-payment-service/.env**
```env
APP_KEY=
DB_CONNECTION=mysql
DB_HOST=localhost
DB_PORT=3306
DB_DATABASE=booking_db
DB_USERNAME=root
DB_PASSWORD=
INTERNAL_GATEWAY_KEY=Alit123
```

Lalu generate app key untuk Laravel:
```bash
cd services/booking-payment-service
php artisan key:generate
```

---

## Migrate, Seed & Jalankan

Semua perintah dijalankan dari folder `gateway`.

### Migrate semua database

```bash
npm run migrate
```

Membuat database dan tabel untuk semua service sekaligus.

### Seed semua database

```bash
npm run seed
```

Mengisi data awal untuk semua service sekaligus.

### Migrate + Seed sekaligus

```bash
npm run setup
```

Menjalankan migrate lalu seed secara otomatis.

### Jalankan semua service

```bash
npm run dev
```

Semua service akan berjalan bersamaan:

| Service | Port |
|---|---|
| API Gateway | 3000 |
| Auth Service | 3001 |
| Fields Service | 3002 |
| Booking & Payment Service | 3003 |

---

## Catatan Penting

- `JWT_ACCESS_SECRET` dan `JWT_REFRESH_SECRET` harus **sama** di semua service
- `INTERNAL_GATEWAY_KEY` harus **sama** di gateway dan booking-payment-service
- Pastikan MySQL sudah berjalan sebelum menjalankan migrate

---

## Peta Endpoint API

Base URL: `http://localhost:3000`

> 🔒 = membutuhkan `Authorization: Bearer <access_token>` di header

---

### Auth Service — `services/auth-service` (port 3001)

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| `POST` | `/api/auth/register` | Daftar akun baru (role: `user` atau `owner`) |
| `POST` | `/api/auth/login` | Login — response menyertakan `accessToken` |
| `POST` | `/api/auth/logout` | Logout sesi aktif |
| `POST` | `/api/auth/refresh` | Perbarui access token menggunakan refresh token |
| `GET`  | `/api/oauth/google` | Redirect ke Google OAuth (buka di browser) |
| `GET`  | `/api/oauth/google/failure` | Callback OAuth ketika login Google gagal |

**Contoh body register:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "user"
}
```

---

### User Service — `services/auth-service` (port 3001)

| Method | Endpoint | Akses | Deskripsi |
|--------|----------|-------|-----------|
| `GET`    | `/api/user/:user_id` | 🔒 Semua role | Ambil data user berdasarkan ID |
| `PATCH`  | `/api/user/:user_id` | 🔒 Semua role | Update data user (misal: `name`) |
| `DELETE` | `/api/user/:user_id` | 🔒 Semua role | Hapus akun user |

---

### Field Service — `services/fields-service` (port 3002)

| Method | Endpoint | Akses | Deskripsi |
|--------|----------|-------|-----------|
| `GET`    | `/api/fields` | 🔒 Semua role | List semua lapangan |
| `GET`    | `/api/fields/:field_id` | 🔒 Semua role | Detail satu lapangan |
| `POST`   | `/api/fields` | 🔒 Owner | Buat lapangan baru |
| `PATCH`  | `/api/fields/:field_id` | 🔒 Owner | Update data lapangan |
| `DELETE` | `/api/fields/:field_id` | 🔒 Owner | Hapus lapangan |

**Contoh body create field:**
```json
{
  "name": "Lapangan Futsal A",
  "type": "futsal",
  "address": "Jl. Sudirman No. 10",
  "city": "Jakarta",
  "status": "active"
}
```

---

### Slot Service — `services/fields-service` (port 3002)

| Method | Endpoint | Akses | Deskripsi |
|--------|----------|-------|-----------|
| `GET`   | `/api/slots` | 🔒 Semua role | Semua slot dengan filter & pagination (lihat detail di bawah) |
| `GET`   | `/api/fields/:field_id/slots` | 🔒 Semua role | Slot milik lapangan tertentu |
| `GET`   | `/api/slots/:slot_id` | 🔒 Semua role | Detail satu slot |
| `POST`  | `/api/fields/:field_id/slots` | 🔒 Owner | Buat slot baru |
| `PATCH` | `/api/slots/:slot_id` | 🔒 Owner | Update slot (harga, status) |
| `PATCH` | `/api/slots/:slot_id/status` | Internal | Update status slot (dipanggil dari booking service) |
| `DELETE`| `/api/slots/:slot_id` | 🔒 Owner | Hapus slot |

**Query params `GET /api/slots` — filter & pagination:**

| Param | Tipe | Deskripsi |
|-------|------|-----------|
| `day` | string | Filter hari: `monday`, `tuesday`, `wednesday`, `thursday`, `friday`, `saturday`, `sunday` |
| `status` | string | Filter status slot: `available` atau `booked` |
| `city` | string | Filter berdasarkan kota lapangan |
| `type` | string | Filter berdasarkan tipe lapangan (misal: `futsal`, `badminton`) |
| `field_id` | string | Filter berdasarkan lapangan tertentu |
| `minPrice` | number | Harga minimum slot |
| `maxPrice` | number | Harga maksimum slot |
| `page` | number | Halaman (default: `1`) |
| `limit` | number | Jumlah item per halaman (default: `10`, maks: `100`) |

**Contoh response `GET /api/slots`:**
```json
{
  "success": true,
  "meta": {
    "total": 42,
    "page": 1,
    "limit": 10,
    "totalPages": 5,
    "hasNextPage": true,
    "hasPrevPage": false
  },
  "data": [ ... ]
}
```

**Query params `GET /api/fields/:field_id/slots`:**

| Param | Tipe | Deskripsi |
|-------|------|-----------|
| `day` | string | Filter hari |
| `status` | string | Filter status: `available` atau `booked` |

**Contoh body create slot:**
```json
{
  "day": "monday",
  "start_time": "08:00",
  "end_time": "09:00",
  "price": 150000,
  "dp_percent": 50,
  "status": "available"
}
```

---

### Booking Service — `services/booking-payment-service` (port 3003)

| Method | Endpoint | Akses | Deskripsi |
|--------|----------|-------|-----------|
| `GET`  | `/api/bookings/me` | 🔒 User | Booking milik user yang sedang login |
| `GET`  | `/api/bookings` | 🔒 Owner/Admin | Semua booking (bisa difilter) |
| `GET`  | `/api/bookings/:booking_id` | 🔒 Semua role | Detail satu booking |
| `POST` | `/api/bookings` | 🔒 User | Buat booking baru |
| `PUT`  | `/api/bookings/:booking_id/cancel` | 🔒 User/Admin | Batalkan booking |
| `PUT`  | `/api/bookings/:booking_id/confirm` | 🔒 Owner | Konfirmasi booking sebagai selesai |
| `PUT`  | `/api/bookings/expire` | 🔒 Admin | Expire semua booking yang melewati batas waktu |

**Query params `GET /api/bookings/me`:**

| Param | Nilai | Deskripsi |
|-------|-------|-----------|
| `status` | `pending_dp`, `dp_paid`, `paid`, `cancelled`, `done` | Filter status booking |

**Query params `GET /api/bookings`:**

| Param | Deskripsi |
|-------|-----------|
| `status` | Filter status booking |
| `field_id` | Filter berdasarkan lapangan |
| `date` | Filter berdasarkan tanggal main (format: `YYYY-MM-DD`) |

**Contoh body create booking:**
```json
{
  "slot_id": "{{slot_id}}",
  "field_id": "{{field_id}}",
  "play_date": "2026-05-05",
  "notes": "Please prepare the field"
}
```

---

### Payment Service — `services/booking-payment-service` (port 3003)

| Method | Endpoint | Akses | Deskripsi |
|--------|----------|-------|-----------|
| `POST` | `/api/payments` | 🔒 User | Upload bukti pembayaran (DP atau pelunasan) |
| `GET`  | `/api/payments/:booking_id` | 🔒 Semua role | Riwayat pembayaran per booking |
| `PUT`  | `/api/payments/:payment_id/verify` | 🔒 Owner/Admin | Verifikasi pembayaran |
| `PUT`  | `/api/payments/:payment_id/reject` | 🔒 Owner/Admin | Tolak pembayaran |

**Contoh body upload DP:**
```json
{
  "booking_id": "{{booking_id}}",
  "type": "dp",
  "amount": 75000,
  "method": "transfer",
  "proof_url": "https://storage.example.com/proof/bukti_transfer.jpg"
}
```

**Contoh body upload pelunasan:**
```json
{
  "booking_id": "{{booking_id}}",
  "type": "settlement",
  "amount": 75000,
  "method": "transfer",
  "proof_url": "https://storage.example.com/proof/settlement.jpg"
}
```

**Contoh body tolak pembayaran:**
```json
{
  "reject_note": "Bukti transfer tidak jelas, mohon upload ulang"
}
```

---

### Dashboard Service — `services/booking-payment-service` (port 3003)

| Method | Endpoint | Akses | Deskripsi |
|--------|----------|-------|-----------|
| `GET` | `/api/dashboard/today` | 🔒 Owner/Admin | Daftar booking hari ini |
| `GET` | `/api/dashboard/revenue` | 🔒 Owner/Admin | Laporan pendapatan berdasarkan rentang tanggal |
| `GET` | `/api/dashboard/pending` | 🔒 Owner/Admin | Daftar pembayaran yang menunggu verifikasi |

**Query params `GET /api/dashboard/revenue`:**

| Param | Tipe | Deskripsi |
|-------|------|-----------|
| `from` | string | Tanggal mulai (format: `YYYY-MM-DD`) |
| `to` | string | Tanggal akhir (format: `YYYY-MM-DD`) |
| `field_id` | string | Opsional — filter berdasarkan lapangan tertentu |

---

## Alur Penggunaan Tipikal

```
1. Register         POST /api/auth/register
2. Login            POST /api/auth/login           → simpan access_token
3. Lihat lapangan   GET  /api/fields
4. Lihat slot       GET  /api/slots?day=monday&status=available
5. Buat booking     POST /api/bookings
6. Upload DP        POST /api/payments              { type: "dp" }
7. Owner verifikasi PUT  /api/payments/:id/verify
8. Upload pelunasan POST /api/payments              { type: "settlement" }
9. Owner verifikasi PUT  /api/payments/:id/verify
10. Owner konfirmasi PUT /api/bookings/:id/confirm
```