import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { getTestUsers } from "./test-register";

export default NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    CredentialsProvider({
      id: "credentials",
      name: "Email a heslo",
      credentials: {
        email: {
          label: "Email",
          type: "email",
          placeholder: "vas.email@example.com"
        },
        password: {
          label: "Heslo",
          type: "password"
        }
      },
      async authorize(credentials) {
        // Pro testovací účely - v produkci by zde byla validace proti databázi
        const testUsers = getTestUsers();

        if (credentials?.email && credentials?.password) {
          const user = testUsers.find(
            u => u.email === credentials.email && u.password === credentials.password
          );

          if (user) {
            // Úspěšné přihlášení
            return {
              id: user.id,
              email: user.email,
              name: user.name,
              image: user.image,
              provider: "credentials"
            };
          }
        }

        // Neúspěšné přihlášení
        return null;
      }
    })
  ],
  callbacks: {
    async jwt({ token, account, profile, user }) {
      // Uložíme data z provideru do tokenu
      if (account && user) {
        // Pro credentials provider
        if (account.provider === "credentials") {
          token.id = user.id;
          token.email = user.email;
          token.name = user.name;
          token.picture = user.image;
          token.provider = "credentials";
        }
        // Pro Google provider
        else if (account.provider === "google" && profile) {
          token.accessToken = account.access_token;
          token.id = profile.sub;
          token.email = profile.email;
          token.name = profile.name;
          token.picture = profile.picture;
          token.provider = "google";
        }
      }
      return token;
    },
    async session({ session, token }) {
      // Přeneseme informace do session pro frontend
      session.user.id = token.id;
      session.user.email = token.email;
      session.user.name = token.name;
      session.user.image = token.picture;
      session.user.provider = token.provider;
      session.accessToken = token.accessToken;
      return session;
    }
  },
  pages: {
    signIn: '/register', // Přesměrování na register stránku
    error: '/oauth-error', // Při chybě na error stránku
  },
  session: {
    strategy: 'jwt',
  },
  debug: process.env.NODE_ENV === 'development',
  logger: {
    error(code, metadata) {
      console.error('NextAuth Error:', code, metadata);
    },
    warn(code) {
      console.warn('NextAuth Warning:', code);
    },
    debug(code, metadata) {
      console.log('NextAuth Debug:', code, metadata);
    }
  }
});
