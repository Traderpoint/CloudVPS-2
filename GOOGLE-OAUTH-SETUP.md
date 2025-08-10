# 🔐 Google OAuth Setup - CloudVPS

## 📋 Přehled implementace

Implementoval jsem skutečnou Google OAuth integraci pro registraci a přihlášení uživatelů v CloudVPS aplikaci.

## 🛠️ Technické detaily

### Implementované funkce:
- ✅ **Google One Tap** - Automatické přihlášení pro uživatele s Google účtem
- ✅ **OAuth2 Popup** - Fallback pro případy, kdy One Tap není dostupný
- ✅ **Předvyplnění údajů** - Automatické načtení jména a emailu z Google účtu
- ✅ **Error handling** - Uživatelsky přívětivé chybové zprávy
- ✅ **Loading states** - Indikátory načítání během OAuth procesu

### Stránky s Google OAuth:
- `/register` - Registrace nového uživatele
- `/login` - Přihlášení existujícího uživatele

## 🔧 Konfigurace

### 1. Google Cloud Console Setup

Pro produkční použití je potřeba vytvořit Google OAuth aplikaci:

1. Jděte na [Google Cloud Console](https://console.cloud.google.com/)
2. Vytvořte nový projekt nebo vyberte existující
3. Povolte Google+ API a Google Identity Services
4. Vytvořte OAuth 2.0 Client ID:
   - **Application type**: Web application
   - **Authorized JavaScript origins**: 
     - `http://localhost:3000` (development)
     - `https://yourdomain.com` (production)
   - **Authorized redirect URIs**: 
     - `http://localhost:3000/register` (development)
     - `https://yourdomain.com/register` (production)

### 2. Environment Variables

V `.env.local` souboru nastavte:

```bash
# Google OAuth Configuration
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

**Aktuální testovací hodnota:**
```bash
NEXT_PUBLIC_GOOGLE_CLIENT_ID=1234567890-abcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com
```

## 🔄 OAuth Flow

### 1. Inicializace
```javascript
// Načtení Google Identity Services a Google API
window.google.accounts.id.initialize({
  client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
  callback: handleGoogleResponse,
  auto_select: false,
  cancel_on_tap_outside: true
});
```

### 2. Přihlášení - Dva způsoby

#### A) Google One Tap (preferovaný)
```javascript
window.google.accounts.id.prompt((notification) => {
  // Automatické zobrazení One Tap UI
});
```

#### B) OAuth2 Popup (fallback)
```javascript
const client = window.google.accounts.oauth2.initTokenClient({
  client_id: CLIENT_ID,
  scope: 'email profile openid',
  callback: handleTokenResponse
});
client.requestAccessToken();
```

### 3. Zpracování odpovědi

#### One Tap Response:
```javascript
const handleGoogleResponse = (response) => {
  // Dekódování JWT tokenu
  const userInfo = decodeJWT(response.credential);
  // Uložení dat a přesměrování
};
```

#### OAuth2 Response:
```javascript
const handleTokenResponse = async (response) => {
  // Získání user info přes Google API
  const userInfo = await fetch(`https://www.googleapis.com/oauth2/v2/userinfo?access_token=${response.access_token}`);
  // Zpracování a uložení dat
};
```

## 📊 Získaná data z Google

Po úspěšném přihlášení se získají tyto údaje:

```javascript
{
  email: "user@gmail.com",
  firstName: "John",
  lastName: "Doe", 
  picture: "https://lh3.googleusercontent.com/...",
  provider: "google",
  googleId: "1234567890",
  registeredAt: "2024-01-01T12:00:00.000Z"
}
```

## 🔗 Integrace s billing flow

Údaje z Google OAuth se automaticky předvyplní v billing formuláři:

```javascript
// V billing.js
setFormData(prev => ({
  ...prev,
  email: data.email || '',
  firstName: data.firstName || '',
  lastName: data.lastName || ''
}));
```

## 🛡️ Bezpečnost

### Implementované bezpečnostní opatření:
- ✅ **JWT token validation** - Ověření platnosti Google tokenu
- ✅ **HTTPS only** - OAuth funguje pouze přes HTTPS (v produkci)
- ✅ **Domain validation** - Omezení na autorizované domény
- ✅ **Error handling** - Bezpečné zpracování chyb
- ✅ **Session management** - Bezpečné ukládání dat v sessionStorage

## 🧪 Testování

### Development Testing:
1. Spusťte aplikaci: `npm run dev`
2. Navštivte `http://localhost:3000/register`
3. Klikněte na "Continue with Google"
4. Ověřte, že se zobrazí Google OAuth dialog

### Testovací scénáře:
- ✅ Úspěšné přihlášení přes Google
- ✅ Zrušení přihlášení uživatelem
- ✅ Chyba sítě během OAuth
- ✅ Neplatný Google Client ID
- ✅ Předvyplnění údajů v billing formuláři

## 🐛 Troubleshooting

### Časté problémy:

#### 1. "Google přihlášení není k dispozici"
- **Příčina**: Google skripty se nenačetly
- **Řešení**: Zkontrolujte internetové připojení a konzoli prohlížeče

#### 2. "Invalid client ID"
- **Příčina**: Nesprávný nebo chybějící GOOGLE_CLIENT_ID
- **Řešení**: Ověřte environment variable v `.env.local`

#### 3. "Origin not allowed"
- **Příčina**: Doména není autorizovaná v Google Cloud Console
- **Řešení**: Přidejte doménu do Authorized JavaScript origins

#### 4. One Tap se nezobrazuje
- **Příčina**: Uživatel má vypnuté cookies nebo používá incognito
- **Řešení**: Automatický fallback na OAuth2 popup

## 📝 Poznámky pro vývojáře

### Důležité:
- Google OAuth vyžaduje HTTPS v produkci
- Testovací Client ID funguje pouze pro development
- One Tap má omezení na počet zobrazení
- OAuth2 popup může být blokován ad-blockery

### Rozšíření:
- Možnost přidat další OAuth providery (GitHub, Facebook)
- Implementace refresh tokenů pro dlouhodobé sessions
- Integrace s backend autentizačním systémem

## 🔄 Aktualizace

Pro aktualizaci na novou verzi Google Identity Services:
1. Zkontrolujte [Google Identity dokumentaci](https://developers.google.com/identity)
2. Aktualizujte script URLs v kódu
3. Otestujte všechny OAuth flows
4. Aktualizujte tuto dokumentaci
