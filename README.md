# Viking Ölüdeniz — Bilet Takip Sistemi

Tekne turları için bilet satış, acenta yönetimi ve finansal raporlama uygulaması.

## Tech Stack

- **Backend:** Node.js + Express.js + PostgreSQL
- **Frontend:** React (Vite) + TanStack Table + TanStack Query

## Kurulum

### Gereksinimler

- Node.js 18+
- PostgreSQL 14+

### 1. Veritabanı

PostgreSQL'de veritabanı oluşturun:

```bash
createdb viking_bilet
```

### 2. Backend

```bash
cd viking-app/backend
cp .env.example .env
# .env dosyasında DB_* ve JWT_SECRET değerlerini doldurun

npm install
npm run db:init
node scripts/create-admin.js admin admin@example.com GucluSifre123
npm run dev
```

API `http://localhost:3000` adresinde çalışır.

### Sağlık kontrolü

```bash
curl http://localhost:3000/api/health
```

## API Endpoint'leri

| Grup | Endpoint | Açıklama |
|------|----------|----------|
| Auth | `POST /api/auth/login` | Giriş |
| Auth | `POST /api/auth/logout` | Çıkış |
| Auth | `POST /api/auth/refresh` | Token yenileme |
| Auth | `GET /api/auth/me` | Mevcut kullanıcı |
| Biletler | `GET/POST/PUT/DELETE /api/biletler` | CRUD |
| Biletler | `GET /api/biletler/export` | Excel export |
| Biletler | `POST /api/biletler/import` | Excel import (admin) |
| Raporlar | `GET /api/raporlar/ozet` | Dashboard özeti |
| Raporlar | `GET /api/raporlar/acentalar` | Acenta bakiyeleri |
| Raporlar | `GET /api/raporlar/gunluk\|aylik\|yillik` | Dönem raporları |
| Tahsilat | `GET/POST/DELETE /api/tahsilat` | Tahsilat kayıtları |
| Users | `GET/POST/PUT/DELETE /api/users` | Kullanıcı yönetimi (admin) |

## Roller

| Rol | Yetkiler |
|-----|----------|
| `viewer` | Sadece görüntüleme |
| `editor` | Bilet ekle/düzenle, tahsilat yönetimi |
| `admin` | Tüm yetkiler + kullanıcı yönetimi + Excel import |

### 3. Frontend

```bash
cd viking-app/frontend
npm install
npm run dev
```

Frontend `http://localhost:5173` adresinde çalışır (API proxy ile backend'e bağlanır).

## Geliştirme Sırası

1. ✅ Backend: DB init + auth routes
2. ✅ Backend: biletler CRUD routes
3. ✅ Frontend: Login + auth store + axios interceptor
4. ✅ Frontend: AppShell + routing
5. ✅ Frontend: BiletlerPage (tablo, filtreler, form)
6. ✅ Raporlar, Acentalar, Dashboard
7. ✅ Excel import/export UI
8. ✅ Kullanıcı yönetimi sayfası
9. ✅ Bilet tablosu: kolon gizleme, resize, gelişmiş inline edit
10. ✅ PM2 + Nginx deploy örneği (`deploy/nginx.conf.example`)
