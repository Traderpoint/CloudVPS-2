import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

// Auth context
const AuthContext = createContext();

// Initial state
const initialState = {
  user: null,
  isAuthenticated: false,
  isLoading: true
};

// Auth provider component
export function AuthProvider({ children }) {
  const [authState, setAuthState] = useState(initialState);
  const { data: session, status: sessionStatus } = useSession();

  // Check for existing session on mount and when NextAuth session changes
  useEffect(() => {
    checkExistingSession();
  }, [session, sessionStatus]);

  const checkExistingSession = () => {
    try {
      // First, check NextAuth session
      if (session && session.user) {
        console.log('🔍 AuthContext: NextAuth session found', session.user);
        setAuthState({
          user: {
            id: session.user.id || session.user.sub,
            email: session.user.email,
            firstName: session.user.given_name || session.user.name?.split(' ')[0] || '',
            lastName: session.user.family_name || session.user.name?.split(' ').slice(1).join(' ') || '',
            name: session.user.name || session.user.email?.split('@')[0],
            loginMethod: 'oauth',
            provider: session.user.provider || 'google',
            image: session.user.image
          },
          isAuthenticated: true,
          isLoading: false
        });
        return;
      }

      // If no NextAuth session, check sessionStorage for user data
      const registrationData = sessionStorage.getItem('registrationData');
      if (registrationData) {
        const userData = JSON.parse(registrationData);

        // Validate that the session is still valid (not too old)
        const loginTime = new Date(userData.loggedInAt || userData.registeredAt);
        const now = new Date();
        const hoursSinceLogin = (now - loginTime) / (1000 * 60 * 60);

        // Session expires after 24 hours
        if (hoursSinceLogin < 24) {
          console.log('🔍 AuthContext: SessionStorage session found', userData);
          setAuthState({
            user: {
              id: userData.id,
              email: userData.email,
              firstName: userData.firstName,
              lastName: userData.lastName,
              name: `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || userData.email?.split('@')[0],
              loginMethod: userData.loginMethod || 'email',
              provider: userData.provider || 'email'
            },
            isAuthenticated: true,
            isLoading: false
          });
          return;
        } else {
          // Session expired, clear it
          sessionStorage.removeItem('registrationData');
        }
      }
    } catch (error) {
      console.error('Error checking existing session:', error);
    }

    // No valid session found
    console.log('🔍 AuthContext: No valid session found');
    setAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false
    });
  };

  const login = (userData) => {
    try {
      // Store user data in sessionStorage
      sessionStorage.setItem('registrationData', JSON.stringify(userData));
      
      setAuthState({
        user: {
          id: userData.id,
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          name: `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || userData.email?.split('@')[0],
          loginMethod: userData.loginMethod || 'email',
          provider: userData.provider || 'email'
        },
        isAuthenticated: true,
        isLoading: false
      });
      
      console.log('✅ User logged in via AuthContext:', userData.email);
    } catch (error) {
      console.error('Error during login:', error);
    }
  };

  const logout = () => {
    try {
      // Clear sessionStorage
      sessionStorage.removeItem('registrationData');
      
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false
      });
      
      console.log('✅ User logged out via AuthContext');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const updateUser = (updatedUserData) => {
    try {
      const currentData = JSON.parse(sessionStorage.getItem('registrationData') || '{}');
      const newData = { ...currentData, ...updatedUserData };
      
      sessionStorage.setItem('registrationData', JSON.stringify(newData));
      
      setAuthState(prev => ({
        ...prev,
        user: {
          ...prev.user,
          ...updatedUserData
        }
      }));
      
      console.log('✅ User data updated via AuthContext');
    } catch (error) {
      console.error('Error updating user data:', error);
    }
  };

  const value = {
    ...authState,
    login,
    logout,
    updateUser,
    checkExistingSession
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Helper function to get user data from sessionStorage (for components that don't use context)
export function getUserFromStorage() {
  try {
    const registrationData = sessionStorage.getItem('registrationData');
    if (registrationData) {
      const userData = JSON.parse(registrationData);
      
      // Check if session is still valid
      const loginTime = new Date(userData.loggedInAt || userData.registeredAt);
      const now = new Date();
      const hoursSinceLogin = (now - loginTime) / (1000 * 60 * 60);
      
      if (hoursSinceLogin < 24) {
        return {
          id: userData.id,
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          name: `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || userData.email?.split('@')[0],
          loginMethod: userData.loginMethod || 'email',
          provider: userData.provider || 'email'
        };
      }
    }
  } catch (error) {
    console.error('Error getting user from storage:', error);
  }
  return null;
}
