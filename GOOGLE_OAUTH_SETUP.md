# Google OAuth Setup pro CloudVPS

## Nastavení Google OAuth pro registraci

### 1. Vytvoření Google Cloud Project

1. Jděte na [Google Cloud Console](https://console.cloud.google.com/)
2. Vytvořte nový projekt nebo vyberte existující
3. Povolte Google+ API a Google Identity API

### 2. Konfigurace OAuth 2.0

1. V Google Cloud Console jděte na "APIs & Services" > "Credentials"
2. Klikněte na "Create Credentials" > "OAuth 2.0 Client IDs"
3. Vyberte "Web application"
4. Přidejte tyto Authorized JavaScript origins:
   - `http://localhost:3000`
   - `https://yourdomain.com` (pro produkci)
5. Přidejte tyto Authorized redirect URIs:
   - `http://localhost:3000/register`
   - `http://localhost:3000/login`
   - `https://yourdomain.com/register` (pro produkci)
   - `https://yourdomain.com/login` (pro produkci)

### 3. Aktualizace .env.local

Zkopírujte Client ID z Google Cloud Console a aktualizujte `.env.local`:

```env
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_actual_google_client_id_here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
```

### 4. Testování

1. Spusťte aplikaci: `npm run dev`
2. Jděte na `http://localhost:3000/register`
3. Klikněte na "Continue with Google"
4. Mělo by se zobrazit Google OAuth popup

### 5. Produkční nasazení

Pro produkci:
1. Přidejte produkční domény do Google Cloud Console
2. Aktualizujte environment variables na produkčním serveru
3. Ujistěte se, že HTTPS je povoleno

### Poznámky

- Google OAuth vyžaduje HTTPS pro produkci
- Pro localhost je HTTP v pořádku
- Client ID může být veřejný, ale Client Secret musí zůstat tajný
- Registrační data se ukládají do sessionStorage a předávají na billing stránku
