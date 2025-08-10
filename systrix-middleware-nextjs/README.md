# Systrix Middleware (Next.js) - Full Featured

Complete HostBill API Gateway and Middleware with modern Next.js dashboard interface.

## 🚀 Features

### **Full Middleware Functionality:**
- **Real HostBill API integration** - Complete API client with all methods
- **Order processing** - Complete order workflow with affiliate support
- **Payment processing** - Full payment gateway integration
- **Product mapping** - Dynamic product mapping between Cloud VPS and HostBill
- **Affiliate management** - Complete affiliate tracking and commission system
- **Real-time monitoring** with auto-refresh every 30 seconds
- **Winston logging** - Comprehensive logging system

### **Modern Dashboard:**
- **Responsive design** matching Systrix Partners Portal
- **Component-based architecture** with React
- **API testing interface** for middleware endpoints
- **Technical dashboard** with system metrics
- **Product mapping visualization**
- **Quick actions** for common tasks

## 🛠️ Tech Stack

### **Backend (API Routes):**
- **Node.js** - Runtime environment
- **Express.js** - Web framework (for API routes)
- **Winston** - Logging system
- **Axios** - HTTP client for HostBill API
- **UUID** - Unique ID generation

### **Frontend (Dashboard):**
- **Next.js 14** - React framework with API routes
- **Tailwind CSS** - Utility-first CSS framework
- **React 18** - UI library
- **Lucide React** - Icon library

### **Integration:**
- **HostBill API** - Complete billing system integration
- **Product Mapping** - Dynamic product mapping system
- **Payment Gateways** - Multiple payment method support

## 📦 Installation

1. **Install dependencies:**
```bash
cd systrix-middleware-nextjs
npm install
```

2. **Set environment variables:**
Create `.env.local` file:
```env
HOSTBILL_API_URL=https://vps.kabel1it.cz/admin/api.php
HOSTBILL_API_ID=adcdebb0e3b6f583052d
HOSTBILL_API_KEY=b8f7a3e9c2d1f4e6a8b9c3d2e1f5a7b4
MIDDLEWARE_URL=http://localhost:3005
```

3. **Run development server:**
```bash
npm run dev
```

4. **Open dashboard:**
Navigate to http://localhost:3005

## 📁 Project Structure

```
systrix-middleware-nextjs/
├── components/           # React components
│   ├── Layout.js        # Main layout with sidebar
│   ├── MetricsCards.js  # Status metrics cards
│   ├── ProductMappingTable.js
│   ├── QuickActions.js
│   └── SystemInfo.js
├── pages/               # Next.js pages
│   ├── api/            # API routes
│   │   └── status.js   # Status endpoint
│   ├── index.js        # Dashboard page
│   ├── test.js         # API testing page
│   ├── tech-dashboard.js
│   └── _app.js         # App wrapper
├── styles/
│   └── globals.css     # Global styles
└── public/             # Static assets
```

## 🎨 Design System

### Colors (Tailwind CSS)
- **Primary:** Blue (blue-50 to blue-900)
- **Success:** Green (green-50 to green-900)  
- **Warning:** Yellow (yellow-50 to yellow-900)
- **Purple:** Purple (purple-50 to purple-900)

### Components
- **Cards:** White background, gray borders, subtle shadows
- **Buttons:** Primary (blue), Secondary (gray)
- **Status badges:** Colored backgrounds matching status
- **Tables:** Striped rows, hover effects

## 🔗 Navigation

- **Dashboard** (`/`) - Main monitoring interface
- **API Tests** (`/test`) - Test middleware endpoints
- **Tech Dashboard** (`/tech-dashboard`) - Advanced metrics
- **External Links:**
  - Test Portal (localhost:3000/test-portal)
  - Partners Portal (localhost:3006)

## 📊 Features

### Dashboard
- Server status monitoring
- Product mapping overview
- Configuration details
- API health checks
- Auto-refresh every 30 seconds

### API Tests
- Test middleware endpoints
- View response data
- Monitor response times
- Error handling

### Tech Dashboard
- System metrics (CPU, Memory, Disk, Network)
- Real-time logs
- API endpoint documentation
- Performance monitoring

## 🔧 Development

### Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Adding New Components
1. Create component in `components/` directory
2. Import and use in pages
3. Follow existing naming conventions
4. Use Tailwind CSS for styling

### Adding New Pages
1. Create file in `pages/` directory
2. Export default React component
3. Add to navigation in `Layout.js`
4. Include proper Head meta tags

## 🌐 API Integration

The dashboard connects to middleware APIs:
- `/api/status` - Get system status
- `/api/products` - Get product mappings
- `/api/orders` - Process orders
- `/api/health` - Health checks

## 📱 Responsive Design

- **Mobile:** Single column layout
- **Tablet:** Two column grid
- **Desktop:** Multi-column grid
- **Sidebar:** Collapsible on mobile

## 🔄 Auto-refresh

Dashboard automatically refreshes every 30 seconds:
- Fetches latest status data
- Updates metrics cards
- Maintains user session
- Shows last update time

## 🎯 Production Deployment

1. **Build application:**
```bash
npm run build
```

2. **Start production server:**
```bash
npm run start
```

3. **Environment variables:**
Set production values in deployment environment

## 🔗 Rychlé odkazy

### **Zobrazení všech odkazů:**
```bash
npm run links   # Zobrazí všechny dostupné endpointy
npm run info    # Alias pro links
```

### **Hlavní služby:**
- **Dashboard**: http://localhost:3005/ (přesměruje na Partners Portal style dashboard)
- **Partners Portal Dashboard**: http://localhost:3005/api/dashboard (čistý design podle Partners Portal)
- **CloudVPS App**: http://localhost:3000/
- **Partners Portal**: http://localhost:3006/

### **API Endpointy:**
- **Status**: http://localhost:3005/api/status
- **Products**: http://localhost:3005/api/products
- **Affiliates**: http://localhost:3005/api/affiliates
- **Statistics**: http://localhost:3005/api/stats
- **Logs**: http://localhost:3005/api/logs

### **💡 Tipy:**
1. **Dashboard je na root URL** (http://localhost:3005/) - přesměruje na Partners Portal style dashboard
2. **Partners Portal dashboard** (http://localhost:3005/api/dashboard) - čistý design podle Partners Portal
3. **Spusťte `npm run links`** pro zobrazení všech dostupných endpointů
4. **Všechny API endpointy vrací JSON** odpovědi
5. **Dashboard se automaticky obnovuje** každých 30 sekund
6. **Partners Portal design** - čisté barvy, Tailwind CSS styl, moderní karty

## 🧪 Testpotal - Kompletní testovací prostředí

**Middleware nyní obsahuje kompletní Testpotal přesunutý z CloudVPS!**

### 📍 Hlavní přístupové body:
- **🎛️ Dashboard**: http://localhost:3005/dashboard
- **🧪 Test Portal**: http://localhost:3005/test-portal
- **💳 Payment Gateway Test**: http://localhost:3005/test-payment-gateway
- **🔧 Payment Modules**: http://localhost:3005/middleware-payment-modules

### 🔗 Kategorie testů:

#### **Middleware Testy** (doporučené):
- Middleware Connection Test
- Middleware Affiliate Test
- Middleware Products (Affiliate/All)
- Middleware Order Test
- Payment Flow Test
- Real Payment Flow Test
- Payment Gateway Test
- Payment Modules Test
- OAuth Tests
- Capture Payment Test
- Invoice Payment Test

#### **Direct HostBill Testy**:
- Základní Affiliate Test
- Reálný Affiliate Test
- Direct HostBill Products
- Direct HostBill Order Test
- Direct Advanced Order Test
- Affiliate Scénáře
- Real Payment Methods Test
- HostBill Payment Modules
- Complete Order Workflow Test
- CloudVPS ↔ Middleware Integration Test

#### **Debug Nástroje**:
- Debug Affiliate Data
- Test HostBill API
- Všichni Affiliates

### 🎯 Jak používat Testpotal:

1. **Spusťte middleware**: `npm run dev` (port 3005)
2. **Otevřete Test Portal**: http://localhost:3005/test-portal
3. **Vyberte kategorii testů** podle potřeby
4. **Spusťte konkrétní test** a sledujte výsledky
5. **Použijte Dashboard** pro přehled: http://localhost:3005/dashboard

### ✅ Výhody centralizovaného Testpotal:
- **Jeden port** pro všechny testy (3005)
- **Kompletní testovací prostředí** v middleware
- **Přímý přístup** k middleware funkcím
- **Centralizované logování** a monitoring
- **Konzistentní prostředí** pro všechny testy

## 📝 License

Private - Systrix Partners Portal Integration
