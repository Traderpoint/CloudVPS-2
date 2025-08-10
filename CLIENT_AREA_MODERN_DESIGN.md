# 🎨 Client Area - Moderní dlaždicový design

## 📋 Přehled

Klientská sekce byla kompletně přepracována s moderním dlaždicovým designem inspirovaným Partners portalem. Nový design kombinuje funkčnost s elegantním vzhledem a vynikající uživatelskou zkušeností.

## ✨ Klíčové funkce

### 🏠 Dashboard
- **Moderní statistické karty** s animacemi a hover efekty
- **Rychlé akce** pro nejčastější úkoly
- **Nedávná aktivita** s barevným kódováním
- **Gradient pozadí** pro vizuální přitažlivost

### 🖥️ Služby
- **Dlaždicový layout** místo tabulky
- **Detailní karty služeb** s technickými specifikacemi
- **Barevné indikátory stavu** (aktivní/pozastaveno/čekající)
- **Hover animace** a scale efekty

### 📄 Faktury
- **Statistické přehledy** na vrcholu stránky
- **Karty faktur** s barevným kódováním podle stavu
- **Filtrování a export** možnosti
- **Jasné rozlišení** zaplaceno/nezaplaceno/po splatnosti

### 🎫 Podpora (Tikety)
- **Přehledné karty tiketů** s prioritou a stavem
- **Statistiky podpory** (otevřené/uzavřené/čekající)
- **Barevné rozlišení** podle typu a priority
- **Detailní informace** o přiřazení a službách

### 👤 Profil
- **Elegantní header** s gradient pozadím
- **Strukturovaný formulář** s moderními input poli
- **Responzivní layout** pro všechna zařízení

### 💳 Platby a fakturace
- **Karty platebních metod** s vizuálními indikátory
- **Automatické platby** s toggle přepínači
- **Přehled plateb** se statistikami
- **Moderní toggle switches** pro nastavení

## 🎨 Design systém

### Barvy
- **Primární**: Blue-Indigo gradient (`from-blue-500 to-indigo-600`)
- **Sekundární**: Green-Emerald (`from-green-500 to-emerald-600`)
- **Varování**: Yellow-Orange (`from-yellow-500 to-orange-600`)
- **Chyba**: Red (`from-red-500 to-red-600`)
- **Neutrální**: Gray odstíny

### Komponenty
- **Rounded corners**: `rounded-2xl` pro karty
- **Shadows**: `shadow-xl` s hover `shadow-2xl`
- **Transitions**: `transition-all duration-300`
- **Hover effects**: `transform hover:scale-105`

### Ikony
- **Lucide React** ikony pro konzistentní vzhled
- **Velikosti**: `h-4 w-4` až `h-8 w-8`
- **Barevné varianty** podle kontextu

## 🔧 Technická implementace

### API Endpointy
```
/api/client/profile    - Profil klienta
/api/client/services   - Seznam služeb
/api/client/invoices   - Seznam faktur
/api/client/tickets    - Support tikety
```

### Komponenty
```
components/ClientDashboardStats.js    - Statistické karty
components/ClientQuickActions.js      - Rychlé akce
components/ClientRecentActivity.js    - Nedávná aktivita
```

### Stav aplikace
- **Mock data** s fallback na API
- **Reaktivní statistiky** počítané z dat
- **Loading states** s animacemi
- **Error handling** s graceful degradation

## 📱 Responzivní design

### Breakpointy
- **Mobile**: `grid-cols-1` - jednosloupec
- **Tablet**: `md:grid-cols-2` - dva sloupce
- **Desktop**: `lg:grid-cols-3` - tři sloupce

### Layout
- **Flexibilní sidebar** s kolapsováním na mobilu
- **Adaptivní karty** s automatickým přetokem
- **Touch-friendly** tlačítka a ovládací prvky

## 🚀 Výkonnost

### Optimalizace
- **Lazy loading** komponent
- **Memoizace** výpočtů statistik
- **Efektivní re-rendering** pouze při změnách dat
- **CSS transitions** místo JavaScript animací

### Načítání dat
- **Paralelní API volání** pro rychlejší načítání
- **Fallback na mock data** při nedostupnosti API
- **Graceful error handling** bez narušení UX

## 🎯 Uživatelská zkušenost

### Navigace
- **Intuitivní sidebar** s ikonami a popisky
- **Breadcrumbs** pro orientaci
- **Rychlé akce** pro časté úkoly

### Feedback
- **Hover states** pro interaktivní prvky
- **Loading indikátory** během načítání
- **Success/error messages** pro akce
- **Smooth transitions** mezi stavy

### Accessibility
- **Keyboard navigation** support
- **Screen reader** friendly
- **High contrast** režim ready
- **Focus indicators** pro všechny interaktivní prvky

## 🔄 Integrace s middleware

### Systrix Middleware NextJS (port 3005)
- **API proxy** pro HostBill komunikaci
- **Data transformation** a validace
- **Error handling** a logging
- **Authentication** middleware

### Data flow
```
Client Area (3000) → API Routes → Middleware (3005) → HostBill
```

## 🔐 Autentifikace a napojení na skutečného klienta

### Autentifikační systém
- **AuthContext** pro správu přihlášeného uživatele
- **Session storage** pro uchování dat mezi refreshi
- **Client ID** získáno z přihlášeného uživatele

### API endpointy pro klientská data

#### Frontend API (proxy)
```
/api/client/profile?client_id=123    - Profil klienta
/api/client/services?client_id=123   - Seznam služeb
/api/client/invoices?client_id=123   - Seznam faktur
/api/client/tickets?client_id=123    - Support tikety
```

#### Middleware API (skutečná data)
```
http://localhost:3005/api/client/profile?client_id=123
http://localhost:3005/api/client/services?client_id=123
http://localhost:3005/api/client/invoices?client_id=123
http://localhost:3005/api/client/tickets?client_id=123
```

### Tok dat pro přihlášeného klienta
1. **Přihlášení** → AuthContext uloží user.id
2. **Client Area** → Použije user.id jako client_id
3. **API volání** → Frontend API proxy s client_id
4. **Middleware** → Volá HostBill API s client_id
5. **Transformace** → Middleware formátuje data
6. **Zobrazení** → Client Area zobrazí skutečná data

### Testování s konkrétním klientem
- **Test stránka**: `/test-client-area`
- **Parametr**: `client_id` pro testování konkrétního klienta
- **Middleware**: Automaticky volá HostBill API
- **Fallback**: Graceful handling při nedostupnosti API

## 🎯 Integrace s Google OAuth a navigací

### Tlačítko "Klientská sekce" v navigaci
- **Pro přihlášené uživatele**: Prominentní modré tlačítko vedle uživatelského menu
- **Pro nepřihlášené uživatele**: Dropdown s možností přihlášení
- **Uživatelské menu**: Obsahuje odkaz na klientskou sekci v dropdown

### Navigační logika
```javascript
// Pro přihlášené uživatele
<Link href="/client-area" className="bg-gradient-to-r from-blue-500 to-indigo-600...">
  🖥️ Klientská sekce
</Link>

// Pro nepřihlášené uživatele
<button onClick="dropdown">🖥️ Klientská sekce ↓</button>
→ Dropdown s "Přihlásit se / Registrovat"
```

### Automatické přesměrování
- **Nepřihlášený uživatel** → `/client-area` → automatické přesměrování na `/register`
- **Přihlášený uživatel** → `/client-area` → načtení dat podle `user.id`
- **Chyba autentifikace** → zobrazení chybové zprávy a odkaz na přihlášení

### Podpora obou autentifikačních systémů
- **Google OAuth** (NextAuth) - `session.user`
- **Email registrace** (AuthContext) - `authUser`
- **Automatická detekce** - používá dostupný systém
- **Jednotné rozhraní** - stejné UI pro oba systémy

## 📈 Budoucí vylepšení

### Plánované funkce
- **Real-time notifikace** pro nové tikety/faktury
- **Dark mode** toggle
- **Pokročilé filtrování** a vyhledávání
- **Export do PDF/Excel**
- **Mobilní aplikace** PWA

### Technické vylepšení
- **TypeScript** migrace
- **Unit testy** pro komponenty
- **E2E testy** pro kritické flows
- **Performance monitoring**

## 🎉 Výsledek

Nová klientská sekce poskytuje:
- ✅ **Moderní a atraktivní design**
- ✅ **Vynikající uživatelskou zkušenost**
- ✅ **Responzivní layout pro všechna zařízení**
- ✅ **Rychlé načítání a smooth animace**
- ✅ **Intuitivní navigaci a ovládání**
- ✅ **Profesionální vzhled odpovídající brandingu**

Klientská sekce je nyní připravena pro produkční nasazení s možností snadného rozšíření o další funkce.
