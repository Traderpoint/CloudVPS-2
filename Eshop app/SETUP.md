# Návod k nastavení E-shop App

## ✅ Projekt je připraven k použití!

Všechny API klíče byly překopírovány z Cloud VPS projektu a aplikace je plně funkční.

## 🚀 Rychlé spuštění

```bash
cd "Eshop app"
npm run dev
```

Aplikace bude dostupná na: **http://localhost:3001**

## 📋 Co je již nakonfigurováno

✅ **Dependencies nainstalované** - všechny potřebné balíčky
✅ **API klíče nakonfigurovány** - HostBill, Google OAuth, Google Maps
✅ **NextAuth.js nastaven** - pro Google OAuth i email/heslo přihlášení
✅ **Registrace implementována** - email registrace s HostBill integrací
✅ **Port nakonfigurován** - aplikace běží na portu 3001
✅ **Bezpečnostní aktualizace** - Next.js aktualizován na nejnovější verzi
✅ **Avatar obrázek** - SVG placeholder vytvořen

## 🔧 Aktuální konfigurace

### Google OAuth ✅ NAKONFIGUROVÁNO
- **Client ID**: `732263781401-1njht615drtghgkeago49csid213veq6.apps.googleusercontent.com`
- **Authorized origins**: `http://localhost:3001` (aktualizováno pro port 3001)
- **NextAuth.js**: Plně funkční Google OAuth přihlášení i registrace

### HostBill API ✅ NAKONFIGUROVÁNO
- **URL**: `https://vps.kabel1it.cz/admin/api.php`
- **API ID**: `adcdebb0e3b6f583052d`
- **API Key**: `341697c41aeb1c842f0d`
- **Funkce**: Vytváření klientů, objednávek, email notifikace

### Google Maps API ✅ NAKONFIGUROVÁNO
- **API Key**: `AIzaSyBOti4mM-6x9WDnZIjIeyb21L_Hw_KC_1o`
- **Funkce**: Připraveno pro budoucí rozšíření (adresní formuláře)

### Dativery/Pohoda ⚠️ VYŽADUJE KONFIGURACI
Pro plnou funkcionalitu synchronizace s Pohoda systémem je potřeba:
1. Zaregistrovat se na [Dativery](https://dativery.com/)
2. Získat API klíč a aktualizovat `DATIVERY_API_KEY`
3. Nastavit přístupové údaje k Pohoda databázi

## 🎯 Testování aplikace

1. **Hlavní stránka**: `http://localhost:3001`
2. **Registrace**: `http://localhost:3001/register`
3. **Přihlášení**: `http://localhost:3001/login`
4. **Košík**: `http://localhost:3001/cart`
5. **Test workflow**:
   - **Registrace**: Vytvořte nový účet přes email nebo Google
   - **Košík**: Přejděte na košík → Potvrdit nákup
   - **Přihlášení**: Přihlaste se (email/heslo nebo Google)
   - **Checkout**: Zadejte IČO: `25596641` (Microsoft s.r.o.)
   - **Dokončení**: Dokončete registraci a vytvoření objednávky

## 🚀 Produkční nasazení

### Vercel (doporučeno)
```bash
npm run build
vercel --prod
```

### Vlastní server
```bash
npm run build
npm start
```

## 📝 Poznámky

- ✅ Všechny API klíče jsou funkční a otestované
- ✅ Google OAuth je plně nakonfigurován
- ✅ HostBill API je připojen a funkční
- ⚠️ Pouze Pohoda synchronizace vyžaduje dodatečnou konfiguraci

## 🔧 Řešení problémů

### Aplikace se nespustí
```bash
# Zkuste reinstalaci dependencies
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Google OAuth chyby
- API klíče jsou již správně nakonfigurované
- Pokud máte problémy, zkontrolujte Google Cloud Console

### HostBill API chyby
- API credentials jsou funkční
- Zkontrolujte internetové připojení
- HostBill server: `https://vps.kabel1it.cz`

### ARES API nedostupné
- Zkuste jiné IČO: `25596641`, `27082440`, `45274649`
- ARES API může být občas nedostupné

## 🎉 Aplikace je připravena!

E-shop App je plně funkční s následujícími možnostmi:
- 📝 **Registrace** - Vytvoření nového účtu přes email nebo Google OAuth
- 🔐 **Přihlášení** - NextAuth.js s podporou email/heslo i Google OAuth
- 🛒 **Nákupní košík** - Správa produktů s výpočtem ceny
- 🏢 **ARES integrace** - Automatické načítání firemních dat podle IČO
- 📧 **Email notifikace** - Automatické potvrzovací emaily přes HostBill
- 🔄 **HostBill API** - Vytváření klientů a objednávek
- 📊 **Pohoda sync** - Připraveno pro synchronizaci s účetním systémem
- 🚀 **Port 3001** - Aplikace běží na dedikovaném portu
