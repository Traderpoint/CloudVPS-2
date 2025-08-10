// Client utilities for handling client identification and data

/**
 * Get client ID from various sources
 * @param {Object} authUser - Authenticated user from AuthContext
 * @param {Object} query - Next.js router query parameters
 * @returns {string|null} - Client ID or null if not found
 */
export function getClientId(authUser, query = {}) {
  // Priority order:
  // 1. Query parameter (for testing)
  // 2. Authenticated user ID
  // 3. Session storage fallback
  
  if (query.client_id) {
    console.log(`🔍 Using client_id from query: ${query.client_id}`);
    return query.client_id;
  }
  
  if (authUser && authUser.id) {
    console.log(`🔍 Using client_id from auth user: ${authUser.id}`);
    return authUser.id;
  }
  
  // Fallback to session storage
  try {
    if (typeof window !== 'undefined') {
      const registrationData = sessionStorage.getItem('registrationData');
      if (registrationData) {
        const userData = JSON.parse(registrationData);
        if (userData.id) {
          console.log(`🔍 Using client_id from session: ${userData.id}`);
          return userData.id;
        }
      }
    }
  } catch (error) {
    console.error('❌ Error reading client ID from session:', error);
  }
  
  console.warn('⚠️ No client ID found');
  return null;
}

/**
 * Format client ID for display
 * @param {string|number} clientId - Raw client ID
 * @returns {string} - Formatted client ID (e.g., "CL001234")
 */
export function formatClientId(clientId) {
  if (!clientId) return 'N/A';
  return `CL${String(clientId).padStart(6, '0')}`;
}

/**
 * Check if user is authenticated and has valid client ID
 * @param {Object} authUser - Authenticated user from AuthContext
 * @param {boolean} isAuthenticated - Authentication status
 * @returns {Object} - Validation result
 */
export function validateClientAccess(authUser, isAuthenticated) {
  if (!isAuthenticated) {
    return {
      valid: false,
      error: 'User not authenticated',
      redirectTo: '/register'
    };
  }
  
  const clientId = getClientId(authUser);
  if (!clientId) {
    return {
      valid: false,
      error: 'Client ID not found',
      redirectTo: '/register'
    };
  }
  
  return {
    valid: true,
    clientId: clientId
  };
}

/**
 * Build API URL with client ID parameter
 * @param {string} endpoint - API endpoint path
 * @param {string} clientId - Client ID
 * @param {Object} params - Additional query parameters
 * @returns {string} - Complete API URL
 */
export function buildClientApiUrl(endpoint, clientId, params = {}) {
  if (!clientId) {
    throw new Error('Client ID is required for API calls');
  }
  
  const url = new URL(endpoint, window.location.origin);
  url.searchParams.append('client_id', clientId);
  
  // Add additional parameters
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      url.searchParams.append(key, value);
    }
  });
  
  return url.toString();
}

/**
 * Fetch client data with error handling
 * @param {string} endpoint - API endpoint
 * @param {string} clientId - Client ID
 * @param {Object} options - Fetch options
 * @returns {Promise<Object>} - API response
 */
export async function fetchClientData(endpoint, clientId, options = {}) {
  try {
    const url = buildClientApiUrl(endpoint, clientId);
    console.log(`🔍 Fetching client data: ${url}`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'API request failed');
    }
    
    console.log(`✅ Client data loaded: ${endpoint}`);
    return data;
    
  } catch (error) {
    console.error(`❌ Error fetching client data from ${endpoint}:`, error);
    throw error;
  }
}

/**
 * Load all client data in parallel
 * @param {string} clientId - Client ID
 * @returns {Promise<Object>} - All client data
 */
export async function loadAllClientData(clientId) {
  try {
    console.log(`🔍 Loading all client data for ID: ${clientId}`);
    
    const [profile, services, invoices, tickets] = await Promise.allSettled([
      fetchClientData('/api/client/profile', clientId),
      fetchClientData('/api/client/services', clientId),
      fetchClientData('/api/client/invoices', clientId),
      fetchClientData('/api/client/tickets', clientId)
    ]);
    
    return {
      profile: profile.status === 'fulfilled' ? profile.value : null,
      services: services.status === 'fulfilled' ? services.value : null,
      invoices: invoices.status === 'fulfilled' ? invoices.value : null,
      tickets: tickets.status === 'fulfilled' ? tickets.value : null,
      errors: {
        profile: profile.status === 'rejected' ? profile.reason.message : null,
        services: services.status === 'rejected' ? services.reason.message : null,
        invoices: invoices.status === 'rejected' ? invoices.reason.message : null,
        tickets: tickets.status === 'rejected' ? tickets.reason.message : null
      }
    };
    
  } catch (error) {
    console.error('❌ Error loading all client data:', error);
    throw error;
  }
}
