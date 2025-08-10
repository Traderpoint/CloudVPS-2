import { useSession } from 'next-auth/react';
import { useAuth } from '../contexts/AuthContext';
import { useState } from 'react';

export default function AuthDebug() {
  const { data: session, status: sessionStatus } = useSession();
  const { user: authUser, isAuthenticated, isLoading: authLoading } = useAuth();
  const [showDebug, setShowDebug] = useState(true);

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const currentUser = session?.user || authUser;
  const isUserLoggedIn = !!session || isAuthenticated;
  const isAuthLoading = authLoading || sessionStatus === 'loading';

  return (
    <div style={{
      display: showDebug ? 'block' : 'none',
      position: 'fixed',
      top: '10px',
      right: '10px',
      backgroundColor: '#f0f0f0',
      border: '1px solid #ccc',
      borderRadius: '8px',
      padding: '10px',
      fontSize: '12px',
      fontFamily: 'monospace',
      zIndex: 9999,
      maxWidth: '300px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
    }}>
      <div className="flex justify-between items-center">

      <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#333' }}>
        🔍 Auth Debug
      </div>

      <button className='text-sm px-3 py-1 bg-red-600 text-white rounded hover:bg-gray-700 transition-colors' onClick={() => setShowDebug(false)}>
        X
      </button>
      </div>
      
      <div style={{ marginBottom: '6px' }}>
        <strong>Status:</strong> {isUserLoggedIn ? '✅ Logged In' : '❌ Not Logged In'}
      </div>
      
      <div style={{ marginBottom: '6px' }}>
        <strong>Loading:</strong> {isAuthLoading ? '⏳ Loading' : '✅ Ready'}
      </div>
      
      <div style={{ marginBottom: '6px' }}>
        <strong>NextAuth:</strong> {session ? '✅ Active' : '❌ None'}
      </div>
      
      <div style={{ marginBottom: '6px' }}>
        <strong>AuthContext:</strong> {authUser ? '✅ Active' : '❌ None'}
      </div>
      
      {currentUser && (
        <div style={{ marginTop: '8px', padding: '6px', backgroundColor: '#e8f5e8', borderRadius: '4px' }}>
          <div style={{ fontWeight: 'bold', color: '#2e7d32' }}>Current User:</div>
          <div><strong>Name:</strong> {currentUser.name || 'N/A'}</div>
          <div><strong>Email:</strong> {currentUser.email || 'N/A'}</div>
          <div><strong>ID:</strong> {currentUser.id || currentUser.sub || 'N/A'}</div>
          {session && (
            <div><strong>Provider:</strong> Google OAuth</div>
          )}
          {authUser && (
            <div><strong>Provider:</strong> {authUser.provider || 'Email'}</div>
          )}
        </div>
      )}
      
      <div style={{ marginTop: '8px', fontSize: '10px', color: '#666' }}>
        SessionStatus: {sessionStatus} | AuthLoading: {authLoading.toString()}
      </div>
    </div>
  );
}
