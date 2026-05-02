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
INTERNAL_GATEWAY_KEY=ALIT123
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
GOOGLE_CALLBACK_URL=http://localhost:3001/auth/google/callback
NODE_ENV=development
```

**services/fields-service/.env**
```env
PORT=3002
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=fields_slot_db
AUTH_SERVICE_URL=http://localhost:3001
JWT_ACCESS_SECRET="Alit"
```

**services/booking-payment-service/.env**
```env
APP_NAME=Bookingpayment
APP_ENV=local
APP_KEY=                    # diisi setelah php artisan key:generate
APP_DEBUG=true
APP_TIMEZONE=Asia/Jakarta
APP_URL=http://localhost:3003

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=booking_db
DB_USERNAME=root
DB_PASSWORD=

USER_SERVICE_URL=http://localhost:3001/api
FIELD_SERVICE_URL=http://localhost:3002/api

JWT_SECRET="Alit"
INTERNAL_GATEWAY_KEY=ALIT123
```

Lalu generate app key untuk Laravel:
```bash
cd services/booking-payment-service
php artisan key:generate
```

---

## Migrate, Seed & Jalankan

Semua perintah dijalankan dari folder `gateway`.

```bash
npm run migrate   # migrate semua database
npm run seed      # seed semua database
npm run setup     # migrate + seed sekaligus
npm run dev       # jalankan semua service
```

| Service | Port |
|---|---|
| API Gateway | 3000 |
| Auth Service | 3001 |
| Fields Service | 3002 |
| Booking & Payment Service | 3003 |

---

## Catatan Penting

- `JWT_ACCESS_SECRET` dan `JWT_REFRESH_SECRET` harus **sama** di gateway, auth-service, dan fields-service
- `JWT_SECRET` di booking-payment-service harus bernilai **sama** dengan `JWT_ACCESS_SECRET` di service lain
- `INTERNAL_GATEWAY_KEY` harus **sama** di gateway dan booking-payment-service (case-sensitive: `ALIT123`)
- `DB_NAME` fields-service adalah `fields_slot_db`, bukan `fields_db`
- `AUTH_SERVICE_URL` di fields-service wajib diisi agar enrich owner name berjalan
- Pastikan MySQL sudah berjalan sebelum menjalankan migrate

---

## Peta Endpoint API

Base URL: `http://localhost:3000`

> 🔒 = membutuhkan `Authorization: Bearer <access_token>` di header

---

### Auth Service

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| `POST` | `/api/auth/register` | Daftar akun baru (`role`: `user` atau `owner`) |
| `POST` | `/api/auth/login` | Login — response menyertakan `accessToken` |
| `POST` | `/api/auth/logout` | Logout sesi aktif |
| `POST` | `/api/auth/refresh` | Perbarui access token |
| `GET`  | `/api/oauth/google` | Redirect ke Google OAuth |
| `GET`  | `/api/oauth/google/failure` | Callback OAuth ketika login Google gagal |

### User Service

| Method | Endpoint | Akses | Deskripsi |
|--------|----------|-------|-----------|
| `GET`    | `/api/user/:user_id` | 🔒 Semua role | Ambil data user |
| `PATCH`  | `/api/user/:user_id` | 🔒 Semua role | Update data user |
| `DELETE` | `/api/user/:user_id` | 🔒 Semua role | Hapus akun user |

### Field Service

| Method | Endpoint | Akses | Deskripsi |
|--------|----------|-------|-----------|
| `GET`    | `/api/fields` | 🔒 Semua role | List semua lapangan |
| `GET`    | `/api/fields/:field_id` | 🔒 Semua role | Detail satu lapangan |
| `POST`   | `/api/fields` | 🔒 Owner | Buat lapangan baru |
| `PATCH`  | `/api/fields/:field_id` | 🔒 Owner | Update lapangan |
| `DELETE` | `/api/fields/:field_id` | 🔒 Owner | Hapus lapangan |

### Slot Service

| Method | Endpoint | Akses | Deskripsi |
|--------|----------|-------|-----------|
| `GET`   | `/api/slots` | 🔒 Semua role | Semua slot (filter & pagination) |
| `GET`   | `/api/fields/:field_id/slots` | 🔒 Semua role | Slot milik lapangan tertentu |
| `GET`   | `/api/slots/:slot_id` | 🔒 Semua role | Detail satu slot |
| `POST`  | `/api/fields/:field_id/slots` | 🔒 Owner | Buat slot baru |
| `PATCH` | `/api/slots/:slot_id` | 🔒 Owner | Update slot |
| `PATCH` | `/api/slots/:slot_id/status` | Internal | Update status slot |
| `DELETE`| `/api/slots/:slot_id` | 🔒 Owner | Hapus slot |

### Booking Service

| Method | Endpoint | Akses | Deskripsi |
|--------|----------|-------|-----------|
| `GET`  | `/api/bookings/me` | 🔒 User | Booking milik user login |
| `GET`  | `/api/bookings` | 🔒 Owner/Admin | Semua booking |
| `GET`  | `/api/bookings/:booking_id` | 🔒 Semua role | Detail booking |
| `POST` | `/api/bookings` | 🔒 User | Buat booking baru |
| `PUT`  | `/api/bookings/:booking_id/cancel` | 🔒 User/Admin | Batalkan booking |
| `PUT`  | `/api/bookings/:booking_id/confirm` | 🔒 Owner | Konfirmasi booking selesai |
| `PUT`  | `/api/bookings/expire` | 🔒 Admin | Expire booking kadaluarsa |

### Payment Service

| Method | Endpoint | Akses | Deskripsi |
|--------|----------|-------|-----------|
| `POST` | `/api/payments` | 🔒 User | Upload bukti pembayaran |
| `GET`  | `/api/payments/:booking_id` | 🔒 Semua role | Riwayat pembayaran |
| `PUT`  | `/api/payments/:payment_id/verify` | 🔒 Owner/Admin | Verifikasi pembayaran |
| `PUT`  | `/api/payments/:payment_id/reject` | 🔒 Owner/Admin | Tolak pembayaran |

### Dashboard Service

| Method | Endpoint | Akses | Deskripsi |
|--------|----------|-------|-----------|
| `GET` | `/api/dashboard/today` | 🔒 Owner/Admin | Booking hari ini |
| `GET` | `/api/dashboard/revenue` | 🔒 Owner/Admin | Laporan pendapatan |
| `GET` | `/api/dashboard/pending` | 🔒 Owner/Admin | Pembayaran pending verifikasi |

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

---

## Hasil Testing Endpoint (Postman)

> Semua screenshot ada di folder `postman/screenshots/`.

---

### Auth Service

#### POST /api/auth/register — sebagai user
![POST register (user)](postman/screenshots/auth-service/POST%20register%20(user).png)

#### POST /api/auth/register — sebagai owner
![POST register (owner)](postman/screenshots/auth-service/POST%20register%20(owner).png)

#### POST /api/auth/login
![POST login](postman/screenshots/auth-service/POST%20login.png)

#### POST /api/auth/logout
![POST logout](postman/screenshots/auth-service/POST%20logout.png)

#### POST /api/auth/refresh
![POST refreshToken](postman/screenshots/auth-service/POST%20refreshToken.png)

#### GET /api/oauth/google
![GET loginGoogle](postman/screenshots/auth-service/GET%20loginGoogle.png)

#### GET /api/oauth/google/failure
![GET loginGoogle failed](postman/screenshots/auth-service/GET%20loginGoogle%20failed.png)

---

### User Service

#### GET /api/user/:user_id
![GET userById](postman/screenshots/user-service/GET%20userById.png)

#### PATCH /api/user/:user_id
![PATCH updateUser](postman/screenshots/user-service/PATCH%20updateUser.png)

#### DELETE /api/user/:user_id
![DELETE user](postman/screenshots/user-service/DELETE%20user.png)

---

### Field Service

#### GET /api/fields — sebagai owner (hanya lapangan miliknya)
![GET allField (owner)](postman/screenshots/field-service/GET%20allField%20(owner).png)

#### GET /api/fields — sebagai user (semua lapangan)
![GET allFields (user)](postman/screenshots/field-service/GET%20allFields%20(user).png)

#### GET /api/fields/:field_id
![GET fieldById](postman/screenshots/field-service/GET%20fieldById.png)

#### POST /api/fields — sebagai owner
![POST field (owner)](postman/screenshots/field-service/POST%20field%20(owner).png)

#### PATCH /api/fields/:field_id — sebagai owner
![PATCH updateField (owner)](postman/screenshots/field-service/PATCH%20updateField%20(owner).png)

---

### Slot Service

#### GET /api/slots
![GET allSlots](postman/screenshots/slot-service/GET%20allSlots.png)

#### GET /api/slots — dengan pagination
![GET allSlots pagination](postman/screenshots/slot-service/GET%20allSlots%20(pagination).png)

#### GET /api/slots — dengan pagination + filter
![GET allSlots pagination + filter](postman/screenshots/slot-service/GET%20allSlots%20(pagination%20+%20filter).png)

#### GET /api/fields/:field_id/slots
![GET slotsByField](postman/screenshots/slot-service/GET%20slotsByField.png)

#### GET /api/slots/:slot_id
![GET slotById](postman/screenshots/slot-service/GET%20slotById.png)

#### POST /api/fields/:field_id/slots — owner pemilik lapangan ✅
![POST createSlot (owner)](postman/screenshots/slot-service/POST%20createSlot%20(owner).png)

#### POST /api/fields/:field_id/slots — owner lain, bukan pemilik ❌ 403
![POST createSlot (wrongOwner)](postman/screenshots/slot-service/POST%20createSlot%20(wrongOwner).png)

#### PATCH /api/slots/:slot_id — owner pemilik lapangan ✅
![PATCH updateSlot](postman/screenshots/slot-service/PATCH%20updateSlot.png)

#### PATCH /api/slots/:slot_id — owner lain, bukan pemilik ❌ 403
![PATCH updateSlot (wrongOwner)](postman/screenshots/slot-service/PATCH%20updateSlot%20(wrongOwner).png)

#### PATCH /api/slots/:slot_id/status — internal dari booking service
![PATCH updateSlot (internal)](postman/screenshots/slot-service/PATCH%20updateSlot%20(internal).png)

#### DELETE /api/slots/:slot_id — owner pemilik lapangan ✅
![DELETE deleteSlot (owner)](postman/screenshots/slot-service/DELETE%20deleteSlot%20(owner).png)

#### DELETE /api/slots/:slot_id — owner lain, bukan pemilik ❌ 403
![DELETE deleteSlot (wrongOwner)](postman/screenshots/slot-service/DELETE%20deleteSlot%20(wrongOwner).png)

---

### Booking Service

#### POST /api/bookings — sebagai user
![POST createBooking (user)](postman/screenshots/booking-service/POST%20createBooking%20(user).png)

#### GET /api/bookings — sebagai owner
![GET allBookings (owner)](postman/screenshots/booking-service/GET%20allBookings%20(owner).png)

#### GET /api/bookings/:booking_id
![GET bookingById](postman/screenshots/booking-service/GET%20bookingById.png)

#### PUT /api/bookings/:booking_id/cancel — dicoba oleh owner ❌ 403
![PUT cancelBooking failedOwner](postman/screenshots/booking-service/PUT%20cancelBooking%20(user)%20failedOwner.png)

#### PUT /api/bookings/:booking_id/confirm — sebagai owner ✅
![PUT confirmBookingAsDone (owner)](postman/screenshots/booking-service/PUT%20confirmBookingAsDone%20(owner).png)

#### PUT /api/bookings/:booking_id/confirm — gagal validasi ❌
![PUT confirmBookingAsDone (owner) failed](postman/screenshots/booking-service/PUT%20confirmBookingAsDone%20(owner)%20failed.png)

---

### Payment Service

#### POST /api/payments — upload bukti DP
![POST paymentProof (user)](postman/screenshots/payment-service/POST%20paymentProof%20(user).png)

#### PUT /api/payments — upload pelunasan
![PUT paymentSettled (user)](postman/screenshots/payment-service/PUT%20paymentSettled%20(user).png)

#### PUT /api/payments/:payment_id/verify — verifikasi DP
![PUT verifyPayment (owner)](postman/screenshots/payment-service/PUT%20verifyPayment%20(owner).png)

#### PUT /api/payments/:payment_id/verify — verifikasi pelunasan
![PUT verifyPaymentSettle](postman/screenshots/payment-service/PUT%20verifyPaymentSettle.png)

---

### Dashboard Service

#### GET /api/dashboard/today — sebagai owner
![GET todayDashboard (owner)](postman/screenshots/dashboard-service/GET%20todayDashboard%20(owner).png)

#### GET /api/dashboard/revenue — sebagai owner
![GET revenue (owner)](postman/screenshots/dashboard-service/GET%20revenue%20(owner).png)