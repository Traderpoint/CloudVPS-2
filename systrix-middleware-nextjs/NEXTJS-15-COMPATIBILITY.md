# Next.js 15+ Kompatibilita - Session Management

## 🚀 Co bylo upraveno

Všechny stránky s NextAuth session managementem byly upraveny pro plnou kompatibilitu s Next.js 15+ a Turbopackem.

### ✅ Upravené stránky:

1. `pages/auth-test.js`
2. `pages/cart.js`
3. `pages/client-area.js`
4. `pages/dashboard.js`
5. `pages/middleware-oauth-tests.js`
6. `pages/oauth-success.js`
7. `pages/register.js`
8. `pages/test-google-nextauth.js`

## 🔧 Nová utilita

### `lib/getServerSessionProps.js`

Společná utilita pro server-side session loading:

```javascript
import { getServerSession } from 'next-auth';
import { authOptions } from '../pages/api/auth/[...nextauth]';

export async function getServerSessionProps(context) {
  const session = await getServerSession(context.req, context.res, authOptions);
  return { props: { serverSession: session } };
}

// Varianta s automatickým přesměrováním pro chráněné stránky
export async function getServerSessionPropsWithRedirect(context, redirectTo = '/login') {
  const session = await getServerSession(context.req, context.res, authOptions);

  if (!session) {
    return {
      redirect: {
        destination: redirectTo,
        permanent: false
      }
    };
  }

  return { props: { serverSession: session } };
}
```

## 📝 Vzor použití

### Před úpravou:
```javascript
import { useSession } from 'next-auth/react';

export default function MyPage() {
  const { data: session } = useSession();
  // Může způsobit "Cannot destructure property 'data' of undefined"
  
  return <div>{session?.user?.email}</div>;
}
```

### Po úpravě:
```javascript
import { useSession } from 'next-auth/react';
import { getServerSessionProps } from '../lib/getServerSessionProps';

export default function MyPage({ serverSession }) {
  const { data: clientSession } = useSession();
  const session = clientSession ?? serverSession;
  
  return <div>{session?.user?.email}</div>;
}

// jednoduché volání
export const getServerSideProps = getServerSessionProps;
```

## ✅ Výhody

1. **Žádné build chyby** - eliminuje "Cannot destructure property 'data' of undefined"
2. **Žádný loading stav** - session se načítá už na serveru
3. **Okamžité zobrazení** - uživatel vidí data ihned
4. **Plná kompatibilita** - funguje s Next.js 15+ i Turbopackem
5. **DRY princip** - žádné duplikace kódu

## 🔒 Pro chráněné stránky

Pokud chcete automatické přesměrování nepřihlášených uživatelů:

```javascript
import { getServerSessionPropsWithRedirect } from '../lib/getServerSessionProps';

// Přesměruje na /login pokud není přihlášen
export const getServerSideProps = getServerSessionPropsWithRedirect;

// Nebo vlastní cíl
export const getServerSideProps = (context) => 
  getServerSessionPropsWithRedirect(context, '/auth');
```

## 🧪 Testování

Všechny upravené stránky nyní:
- ✅ Fungují bez chyb v Next.js 15+
- ✅ Podporují Turbopack
- ✅ Nemají loading stavy pro session
- ✅ Zobrazují data okamžitě
- ✅ Jsou kompatibilní se starými verzemi Next.js

## 📚 Další informace

- [Next.js 15 Release Notes](https://nextjs.org/blog/next-15)
- [NextAuth.js Server-side Usage](https://next-auth.js.org/getting-started/example#server-side)
- [getServerSession Documentation](https://next-auth.js.org/configuration/nextjs#getserversession)
