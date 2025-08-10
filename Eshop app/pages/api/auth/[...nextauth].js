import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'

export default NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          // Ověř přihlašovací údaje přes HostBill API
          const response = await fetch(`${process.env.HOSTBILL_API_URL}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
              api_id: process.env.HOSTBILL_API_ID,
              api_key: process.env.HOSTBILL_API_KEY,
              call: 'authClient',
              email: credentials.email,
              password: credentials.password
            }),
          })

          const data = await response.json()

          if (data.success && data.result.authenticated) {
            return {
              id: data.result.client_id,
              email: credentials.email,
              name: `${data.result.firstname} ${data.result.lastname}`,
              clientId: data.result.client_id
            }
          }
          return null
        } catch (error) {
          console.error('Auth error:', error)
          return null
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, account, profile, user }) {
      if (account && user) {
        // Pro credentials provider
        if (account.provider === 'credentials') {
          token.id = user.id
          token.email = user.email
          token.name = user.name
          token.clientId = user.clientId
          token.provider = 'credentials'
        }
        // Pro Google provider
        else if (account.provider === 'google' && profile) {
          token.id = profile.sub
          token.email = profile.email
          token.name = profile.name
          token.picture = profile.picture
          token.provider = 'google'
        }
      }
      return token
    },
    async session({ session, token }) {
      session.user.id = token.id
      session.user.email = token.email
      session.user.name = token.name
      session.user.image = token.picture
      session.user.clientId = token.clientId
      session.user.provider = token.provider
      return session
    }
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
})
