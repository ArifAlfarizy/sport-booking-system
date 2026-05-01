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

## Migrate Semua Database Sekaligus

Dari folder `gateway`, jalankan:

```bash
cd gateway
npm run migrate
```

Script ini otomatis membuat database dan tabel untuk semua service sekaligus.

---

## Menjalankan Semua Service Sekaligus

Dari folder `gateway`, jalankan:

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