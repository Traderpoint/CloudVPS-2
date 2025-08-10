# E-shop App

Kompletní e-shop aplikace vytvořená v Next.js s integrací HostBill API, Google OAuth a Pohoda synchronizací.

## Funkce

- 🛒 **Nákupní košík** - Správa produktů v košíku
- � **Registrace** - Vytvoření nového účtu přes email nebo Google OAuth
- �🔐 **Přihlášení** - Email/heslo nebo Google OAuth s NextAuth.js
- 🏢 **Firemní data** - Automatické načítání z ARES registru podle IČO
- 📧 **Email notifikace** - Automatické odesílání potvrzovacích emailů
- 🔄 **HostBill integrace** - Vytváření klientů a objednávek
- 📊 **Pohoda synchronizace** - Export objednávek do účetního systému

## Struktura projektu

```
Eshop app/
├── .env.local              # Environment variables
├── .gitignore              # Git ignore file
├── next.config.js          # Next.js configuration
├── package.json            # Dependencies
├── postcss.config.js       # PostCSS configuration
├── tailwind.config.js      # Tailwind CSS configuration
├── pages/
│   ├── _app.js             # App wrapper
│   ├── api/                # API routes
│   │   ├── create-hostbill-client.js
│   │   ├── create-hostbill-order.js
│   │   ├── login-hostbill.js
│   │   ├── register.js         # Email registrace
│   │   ├── send-hostbill-email.js
│   │   ├── sync-pohoda.js
│   │   └── verify-email.js
│   ├── cart.js             # Nákupní košík
│   ├── checkout.js         # Dokončení nákupu
│   ├── dashboard.js        # Uživatelský panel
│   ├── login.js            # Přihlášení
│   ├── register.js         # Registrace nového účtu
│   └── nextsteps.js        # Potvrzení aktivace
├── styles/
│   └── globals.css         # Global styles
└── public/
    └── default-avatar.png  # Default avatar image
```

## Instalace

1. Nainstalujte dependencies:
```bash
npm install
```

2. Nakonfigurujte environment variables v `.env.local`:
```env
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
NEXT_PUBLIC_HOSTBILL_URL=http://your-hostbill-url.com/admin/api.php
HOSTBILL_API_ID=YOUR_API_ID
HOSTBILL_API_KEY=YOUR_API_KEY
DATIVERY_API_KEY=YOUR_DATIVERY_API_KEY
DATIVERY_API_URL=https://api.dativery.com/v1
POHODA_DATA_FILE=StwPh_ICO_YYYY.mdb
POHODA_USERNAME=YOUR_POHODA_USERNAME
POHODA_PASSWORD=YOUR_POHODA_PASSWORD
```

## Spuštění

```bash
npm run dev
```

Aplikace bude dostupná na `http://localhost:3001`

## Workflow

1. **Registrace** (`/register`) - Vytvoření nového účtu přes email nebo Google OAuth
2. **Košík** (`/cart`) - Uživatel přidá produkty do košíku
3. **Přihlášení** (`/login`) - Přihlášení přes email/heslo nebo Google OAuth
4. **Checkout** (`/checkout`) - Zadání IČO a načtení firemních dat z ARES
5. **Vytvoření objednávky** - Automatické vytvoření klienta a objednávky v HostBill
6. **Synchronizace** - Export dat do Pohoda účetního systému
7. **Email potvrzení** - Odeslání potvrzovacího emailu novým uživatelům

## API Endpointy

- `POST /api/register` - Registrace nového uživatele
- `POST /api/create-hostbill-client` - Vytvoření klienta v HostBill
- `POST /api/create-hostbill-order` - Vytvoření objednávky v HostBill
- `POST /api/login-hostbill` - Přihlášení přes HostBill API
- `POST /api/send-hostbill-email` - Odeslání emailu přes HostBill
- `POST /api/sync-pohoda` - Synchronizace s Pohoda systémem
- `GET /api/verify-email` - Ověření emailové adresy
- `POST /api/auth/[...nextauth]` - NextAuth.js autentifikace

## Technologie

- **Next.js 14** - React framework
- **Tailwind CSS** - Styling
- **Google OAuth** - Autentifikace
- **HostBill API** - CRM/Billing systém
- **ARES API** - České obchodní registry
- **Dativery API** - Pohoda integrace
- **XMLBuilder2** - XML generování pro Pohoda export
