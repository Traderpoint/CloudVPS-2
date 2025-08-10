import { useSession, signIn, signOut } from 'next-auth/react';
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { getServerSessionProps } from '../lib/getServerSessionProps';

export default function AuthTest({ serverSession }) {
  const { data: clientSession, status } = useSession();
  const session = clientSession ?? serverSession;
  const router = useRouter();

  useEffect(() => {
    console.log('Auth Test - Session status:', status);
    console.log('Auth Test - Session data:', session);
  }, [session, status]);

  if (status === 'loading') {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h1>🔄 Loading...</h1>
        <p>Checking authentication status...</p>
      </div>
    );
  }

  if (session) {
    return (
      <div style={{ padding: '20px' }}>
        <h1>✅ Authenticated!</h1>
        <div style={{ backgroundColor: '#f0f8ff', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
          <h2>Session Data:</h2>
          <p><strong>Email:</strong> {session.user.email}</p>
          <p><strong>Name:</strong> {session.user.name}</p>
          <p><strong>ID:</strong> {session.user.id}</p>
          {session.user.image && (
            <div>
              <strong>Avatar:</strong>
              <img src={session.user.image} alt="Avatar" style={{ width: '40px', height: '40px', borderRadius: '50%', marginLeft: '10px' }} />
            </div>
          )}
        </div>
        
        <div style={{ marginBottom: '20px' }}>
          <button 
            onClick={() => router.push('/billing')}
            style={{ 
              backgroundColor: '#0070f3', 
              color: 'white', 
              padding: '10px 20px', 
              border: 'none', 
              borderRadius: '5px', 
              marginRight: '10px',
              cursor: 'pointer'
            }}
          >
            Go to Billing
          </button>
          
          <button 
            onClick={() => signOut()}
            style={{ 
              backgroundColor: '#dc2626', 
              color: 'white', 
              padding: '10px 20px', 
              border: 'none', 
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Sign Out
          </button>
        </div>

        <details style={{ marginTop: '20px' }}>
          <summary>Raw Session Data</summary>
          <pre style={{ backgroundColor: '#f5f5f5', padding: '10px', borderRadius: '5px', overflow: 'auto' }}>
            {JSON.stringify(session, null, 2)}
          </pre>
        </details>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h1>🔐 Not Authenticated</h1>
      <p>You are not signed in.</p>
      
      <button 
        onClick={() => signIn('google')}
        style={{ 
          backgroundColor: '#4285f4', 
          color: 'white', 
          padding: '12px 24px', 
          border: 'none', 
          borderRadius: '5px', 
          fontSize: '16px',
          cursor: 'pointer',
          marginTop: '20px'
        }}
      >
        Sign in with Google
      </button>
      
      <div style={{ marginTop: '20px' }}>
        <a href="/register" style={{ color: '#0070f3', textDecoration: 'underline' }}>
          Go to Register Page
        </a>
      </div>
    </div>
  );
}

// jednoduché volání
export const getServerSideProps = getServerSessionProps;
