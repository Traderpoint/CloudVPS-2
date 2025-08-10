import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
  Server, CreditCard, FileText, MessageSquare, User, Settings,
  TrendingUp, TrendingDown, Activity, Calendar, DollarSign,
  CheckCircle, AlertCircle, Clock, Zap, Shield, Globe
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import ServiceManagement from '../components/ServiceManagement';
import ClientDashboardStats from '../components/ClientDashboardStats';
import ClientQuickActions from '../components/ClientQuickActions';
import ClientRecentActivity from '../components/ClientRecentActivity';
import ClientProfileCard from '../components/ClientProfileCard';
import AuthDebug from '../components/AuthDebug';
import { getServerSessionProps } from '../lib/getServerSessionProps';

export default function ClientArea({ serverSession }) {
  const router = useRouter();
  const { data: clientSession, status: sessionStatus } = useSession();
  const session = clientSession ?? serverSession;
  const { user: authUser, isAuthenticated, isLoading: authLoading } = useAuth();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [services, setServices] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedService, setSelectedService] = useState(null);
  const [stats, setStats] = useState({});
  const [clientId, setClientId] = useState(null);

  // Support both Google OAuth and email (credentials) login
  const currentUser = session?.user;
  const isUserLoggedIn = !!session;
  const isAuthLoading = sessionStatus === 'loading';

  // Determine login method for debugging
  const loginMethod = session?.user?.provider || 'unknown';
  console.log('🔍 Client-area login info:', {
    isUserLoggedIn,
    loginMethod,
    userEmail: currentUser?.email,
    sessionStatus
  });

  const handleLogout = async () => {
    sessionStorage.setItem('oauth-source', 'client-area');
    router.push('/api/auth/signout');
  };



  // Check authentication and redirect if not logged in
  useEffect(() => {
    if (sessionStatus !== 'loading' && !session) {
      console.log('❌ No session found, redirecting to register');
      router.push('/register');
      return;
    }
  }, [sessionStatus, session, router]);

  // Find client by email in HostBill and get client ID - ONLY for Google OAuth users
  useEffect(() => {
    if (session && session.user && session.user.email) {
      const findClientByEmail = async () => {
        try {
          console.log(`🔍 Finding client by Google email: ${session.user.email}`);

          // Call middleware to find client by email
          const middlewareUrl = process.env.NEXT_PUBLIC_MIDDLEWARE_URL || 'http://localhost:3005';
          const response = await fetch(`${middlewareUrl}/api/client/find-by-email?email=${encodeURIComponent(session.user.email)}`);

          if (response.ok) {
            const data = await response.json();
            if (data.success && data.client) {
              setClientId(data.client.id);
              setUser(data.client); // Set basic client data
              console.log(`✅ Client found by email: ID ${data.client.id}, Name: ${data.client.name}`);
            } else {
              console.warn('⚠️ Client not found by Google email:', session.user.email);
              // Allow login with just Google email - create basic user object
              const basicUser = {
                id: null,
                email: session.user.email,
                name: session.user.name,
                firstname: session.user.name?.split(' ')[0] || '',
                lastname: session.user.name?.split(' ').slice(1).join(' ') || '',
                companyname: '',
                status: 'Not in HostBill',
                isGoogleOnly: true
              };
              setUser(basicUser);
              setClientId(null);
              console.log('✅ Created basic user from Google OAuth:', basicUser);
            }
          } else {
            console.warn('⚠️ Failed to find client by email');
            // Allow login with just Google email - create basic user object
            const basicUser = {
              id: null,
              email: session.user.email,
              name: session.user.name,
              firstname: session.user.name?.split(' ')[0] || '',
              lastname: session.user.name?.split(' ').slice(1).join(' ') || '',
              companyname: '',
              status: 'Not in HostBill',
              isGoogleOnly: true
            };
            setUser(basicUser);
            setClientId(null);
            console.log('✅ Created basic user from Google OAuth (API error):', basicUser);
          }
        } catch (error) {
          console.error('❌ Error finding client by email:', error);
          // Allow login with just Google email - create basic user object
          const basicUser = {
            id: null,
            email: session.user.email,
            name: session.user.name,
            firstname: session.user.name?.split(' ')[0] || '',
            lastname: session.user.name?.split(' ').slice(1).join(' ') || '',
            companyname: '',
            status: 'Not in HostBill',
            isGoogleOnly: true
          };
          setUser(basicUser);
          setClientId(null);
          console.log('✅ Created basic user from Google OAuth (catch error):', basicUser);
        }
      };

      findClientByEmail();
    }
  }, [session]);

  // Load complete client data from HostBill middleware
  useEffect(() => {
    if (!clientId) return;

    const fetchCompleteClientData = async () => {
      try {
        setIsLoading(true);
        console.log(`🔍 Fetching complete client data for ID: ${clientId}`);

        // Call middleware to get all client data at once
        const middlewareUrl = process.env.NEXT_PUBLIC_MIDDLEWARE_URL || 'http://localhost:3005';
        const response = await fetch(`${middlewareUrl}/api/client/complete-data?client_id=${clientId}`);

        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            const { client, services, invoices, tickets, stats, errors } = result.data;

            // Set all data at once
            if (client) {
              setUser(client);
              console.log(`✅ Client profile loaded: ${client.name}`);
            }

            setServices(services || []);
            console.log(`✅ Services loaded: ${services?.length || 0} services`);

            setInvoices(invoices || []);
            console.log(`✅ Invoices loaded: ${invoices?.length || 0} invoices`);

            setTickets(tickets || []);
            console.log(`✅ Tickets loaded: ${tickets?.length || 0} tickets`);

            setStats(stats || {});
            console.log(`✅ Stats calculated:`, stats);

            if (errors && errors.length > 0) {
              console.warn('⚠️ Some data loading errors:', errors);
            }
          } else {
            console.error('❌ Failed to load complete client data:', result.error);
            // Use current user data as fallback
            setUser({
              name: currentUser.name || `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() || currentUser.email?.split('@')[0],
              email: currentUser.email,
              clientId: `CL${String(clientId).padStart(6, '0')}`
            });
          }
        } else {
          console.error('❌ Failed to fetch complete client data');
          // Use current user data as fallback
          setUser({
            name: currentUser.name || `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() || currentUser.email?.split('@')[0],
            email: currentUser.email,
            clientId: `CL${String(clientId).padStart(6, '0')}`
          });
        }

      } catch (error) {
        console.error('❌ Error fetching complete client data:', error);
        // Use current user data as fallback
        setUser({
          name: currentUser.name || `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() || currentUser.email?.split('@')[0],
          email: currentUser.email,
          clientId: `CL${String(clientId).padStart(6, '0')}`
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchCompleteClientData();
  }, [clientId]);

  // Stats are now calculated in middleware, no need for local calculation

  // Function to download invoice PDF
  const downloadInvoicePDF = async (invoiceId) => {
    try {
      console.log(`🔍 Downloading PDF for invoice ${invoiceId}`);

      const middlewareUrl = process.env.NEXT_PUBLIC_MIDDLEWARE_URL || 'http://localhost:3005';
      const response = await fetch(`${middlewareUrl}/api/client/invoice-pdf?invoice_id=${invoiceId}`);

      if (response.ok) {
        const contentType = response.headers.get('content-type');

        if (contentType && contentType.includes('application/pdf')) {
          // It's a PDF file
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `invoice-${invoiceId}.pdf`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
          console.log(`✅ PDF downloaded successfully for invoice ${invoiceId}`);
        } else {
          // It's a JSON response (error or not available)
          const data = await response.json();
          console.warn(`⚠️ PDF not available for invoice ${invoiceId}:`, data.message);
          alert(`PDF není k dispozici: ${data.message || 'Neznámá chyba'}`);
        }
      } else {
        const errorData = await response.json();
        console.error(`❌ Failed to download PDF for invoice ${invoiceId}:`, errorData);
        alert(`Chyba při stahování PDF: ${errorData.message || errorData.error || 'Neznámá chyba'}`);
      }
    } catch (error) {
      console.error(`❌ Error downloading PDF for invoice ${invoiceId}:`, error);
      alert(`Chyba při stahování PDF: ${error.message}`);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100 border-green-200';
      case 'suspended': return 'text-red-600 bg-red-100 border-red-200';
      case 'pending': return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'paid': return 'text-green-600 bg-green-100 border-green-200';
      case 'unpaid': return 'text-red-600 bg-red-100 border-red-200';
      case 'open': return 'text-blue-600 bg-blue-100 border-blue-200';
      case 'closed': return 'text-gray-600 bg-gray-100 border-gray-200';
      default: return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4" />;
      case 'suspended': return <AlertCircle className="h-4 w-4" />;
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'Paid': return <CheckCircle className="h-4 w-4" />;
      case 'Unpaid': return <AlertCircle className="h-4 w-4" />;
      case 'Overdue': return <AlertCircle className="h-4 w-4" />;
      case 'open': return <MessageSquare className="h-4 w-4" />;
      case 'closed': return <CheckCircle className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const tabs = [
    { id: 'dashboard', name: 'Přehled', icon: Activity },
    { id: 'services', name: 'Služby', icon: Server },
    { id: 'invoices', name: 'Faktury', icon: FileText },
    { id: 'tickets', name: 'Podpora', icon: MessageSquare },
    { id: 'profile', name: 'Profil', icon: User },
    { id: 'billing', name: 'Platby', icon: CreditCard }
  ];

  if (sessionStatus === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto mb-6"></div>
          <p className="text-gray-700 text-lg font-medium">
            {sessionStatus === 'loading' ? 'Ověřování přihlášení...' : 'Načítání klientské sekce...'}
          </p>
          <p className="text-gray-500 text-sm mt-2">
            {sessionStatus === 'loading' ? 'Kontrolujeme vaše přihlášení' : 'Připojujeme se k systému HostBill přes middleware'}
          </p>
          {sessionStatus === 'loading' && (
            <div className="mt-4 text-xs text-gray-400">
              Podporujeme Google OAuth i email přihlášení
            </div>
          )}
        </div>
      </div>
    );
  }

  // Show error if no user data at all (shouldn't happen now)
  if (!user && session && session.user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Účet nenalezen</h1>
          <p className="text-gray-700 mb-2">
            Váš email <strong>{session.user.email}</strong> nebyl nalezen v systému HostBill.
          </p>
          <p className="text-gray-600 text-sm mb-6">
            Pro přístup do klientské sekce musíte mít aktivní účet registrovaný pod tímto emailem.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => router.push('/register')}
              className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Dokončit registraci
            </button>
            <button
              onClick={() =>  handleLogout()}
              className="w-full bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Odhlásit se
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <AuthDebug />
      {/* Modern Header */}
      <div className="bg-white shadow-lg border-b border-gray-200">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Klientská sekce
                </h1>
                <p className="text-gray-600 font-medium">Vítejte zpět, {user?.name}</p>
              </div>
            </div>
            <div className="flex items-center space-x-6">
              <div className="text-right">
                <p className="text-sm text-gray-500">
                  {user?.isGoogleOnly ? 'Status' : 'Klient ID'}
                </p>
                <p className="font-mono text-sm font-bold text-gray-900">
                  {user?.isGoogleOnly ? 'Pouze Google účet' : (user?.id || 'N/A')}
                </p>
                <p className="text-xs text-gray-400">
                  Přihlášen přes {loginMethod === 'google' ? 'Google OAuth' : 'Email'}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-3 rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Odhlásit se
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Google-only user info */}
        {user?.isGoogleOnly && (
          <div className="mb-8 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-2xl p-6">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-yellow-800 mb-2">
                  Vítejte v klientské sekci!
                </h3>
                <p className="text-yellow-700 mb-3">
                  Jste přihlášeni pouze přes Google OAuth. Pro plný přístup k funkcím (služby, faktury, tikety)
                  je potřeba mít účet registrovaný v našem systému HostBill.
                </p>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => router.push('/register')}
                    className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors text-sm font-medium"
                  >
                    Dokončit registraci
                  </button>
                  <a
                    href="mailto:support@example.com"
                    className="bg-white text-yellow-700 border border-yellow-300 px-4 py-2 rounded-lg hover:bg-yellow-50 transition-colors text-sm font-medium"
                  >
                    Kontaktovat podporu
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Modern Sidebar */}
          <div className="lg:w-1/4">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
              <div className="p-6 bg-gradient-to-r from-blue-500 to-indigo-600">
                <h3 className="font-bold text-white text-lg flex items-center">
                  <Globe className="h-5 w-5 mr-2" />
                  Navigace
                </h3>
              </div>
              <nav className="p-4">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full text-left px-4 py-3 rounded-xl mb-2 flex items-center space-x-3 transition-all duration-200 transform hover:scale-105 ${
                        activeTab === tab.id
                          ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold shadow-lg'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span>{tab.name}</span>
                    </button>
                  );
                })}
              </nav>

              {/* Client Profile Card */}
              <div className="p-4">
                <ClientProfileCard user={user} />
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:w-3/4">
            {activeTab === 'dashboard' && (
              <div className="space-y-8">
                {/* Modern Stats Grid */}
                <ClientDashboardStats stats={stats} />

                {/* Quick Actions */}
                <ClientQuickActions onTabChange={setActiveTab} />

                {/* Recent Activity */}
                <ClientRecentActivity />
              </div>
            )}

            {activeTab === 'services' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-2xl font-bold text-gray-900 flex items-center">
                    <Server className="h-7 w-7 mr-3 text-blue-500" />
                    Moje služby
                  </h3>
                  <button className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-3 rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105">
                    Objednat novou službu
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {services.map((service) => (
                    <div key={service.id} className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
                      <div className={`p-4 ${service.status === 'active' ? 'bg-gradient-to-r from-green-500 to-emerald-600' :
                                                service.status === 'suspended' ? 'bg-gradient-to-r from-red-500 to-red-600' :
                                                'bg-gradient-to-r from-yellow-500 to-orange-600'}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <Server className="h-6 w-6 text-white" />
                            <div>
                              <h4 className="text-lg font-bold text-white">{service.name}</h4>
                              <p className="text-sm text-white opacity-90">{service.type}</p>
                            </div>
                          </div>
                          <div className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center space-x-1 ${
                            service.status === 'active' ? 'bg-white bg-opacity-20 text-white' :
                            'bg-white bg-opacity-20 text-white'
                          }`}>
                            {getStatusIcon(service.status)}
                            <span>{service.status === 'active' ? 'Aktivní' :
                                   service.status === 'suspended' ? 'Pozastaveno' : 'Čekající'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="p-6">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Doména:</span>
                            <span className="text-sm font-medium text-gray-900">{service.domain}</span>
                          </div>

                          {service.cpu && (
                            <div className="grid grid-cols-3 gap-4 text-center">
                              <div className="p-3 bg-blue-50 rounded-xl">
                                <p className="text-xs text-gray-600">CPU</p>
                                <p className="text-sm font-bold text-blue-600">{service.cpu}</p>
                              </div>
                              <div className="p-3 bg-green-50 rounded-xl">
                                <p className="text-xs text-gray-600">RAM</p>
                                <p className="text-sm font-bold text-green-600">{service.ram}</p>
                              </div>
                              <div className="p-3 bg-purple-50 rounded-xl">
                                <p className="text-xs text-gray-600">Storage</p>
                                <p className="text-sm font-bold text-purple-600">{service.storage}</p>
                              </div>
                            </div>
                          )}

                          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                            <div>
                              <p className="text-sm text-gray-600">Další platba</p>
                              <p className="text-sm font-medium text-gray-900">{service.nextDue}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-gray-600">Cena</p>
                              <p className="text-lg font-bold text-gray-900">{service.price}</p>
                            </div>
                          </div>

                          <div className="flex space-x-3 pt-4">
                            <button
                              onClick={() => setSelectedService(service)}
                              className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-2 px-4 rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 text-sm font-medium"
                            >
                              Spravovat
                            </button>
                            <button className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-xl hover:bg-gray-200 transition-all duration-200 text-sm font-medium">
                              Detail
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'invoices' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-2xl font-bold text-gray-900 flex items-center">
                    <FileText className="h-7 w-7 mr-3 text-blue-500" />
                    Faktury
                  </h3>
                  <div className="flex space-x-3">
                    <button className="bg-gray-100 text-gray-700 px-4 py-2 rounded-xl hover:bg-gray-200 transition-all duration-200">
                      Filtrovat
                    </button>
                    <button className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-200 shadow-lg">
                      Exportovat
                    </button>
                  </div>
                </div>

                {/* Invoice Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4">
                    <div className="flex items-center">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <FileText className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-gray-600">Celkem</p>
                        <p className="text-xl font-bold text-gray-900">{invoices.length}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4">
                    <div className="flex items-center">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-gray-600">Zaplaceno</p>
                        <p className="text-xl font-bold text-green-600">{invoices.filter(i => i.status === 'Paid').length}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4">
                    <div className="flex items-center">
                      <div className="p-2 bg-yellow-100 rounded-lg">
                        <Clock className="h-5 w-5 text-yellow-600" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-gray-600">Nezaplaceno</p>
                        <p className="text-xl font-bold text-yellow-600">{invoices.filter(i => i.status === 'Unpaid').length}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4">
                    <div className="flex items-center">
                      <div className="p-2 bg-red-100 rounded-lg">
                        <AlertCircle className="h-5 w-5 text-red-600" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-gray-600">Po splatnosti</p>
                        <p className="text-xl font-bold text-red-600">{invoices.filter(i => i.status === 'Overdue').length}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Invoices Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {invoices.map((invoice) => (
                    <div key={invoice.id} className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden hover:shadow-2xl transition-all duration-300">
                      <div className={`p-4 ${
                        invoice.status === 'Paid' ? 'bg-gradient-to-r from-green-500 to-emerald-600' :
                        invoice.status === 'Overdue' ? 'bg-gradient-to-r from-red-500 to-red-600' :
                        'bg-gradient-to-r from-yellow-500 to-orange-600'
                      }`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <FileText className="h-6 w-6 text-white" />
                            <div>
                              <h4 className="text-lg font-bold text-white">#{invoice.number || invoice.id}</h4>
                              <p className="text-sm text-white opacity-90">{invoice.datecreated}</p>
                            </div>
                          </div>
                          <div className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center space-x-1 bg-white bg-opacity-20 text-white`}>
                            {getStatusIcon(invoice.status)}
                            <span>
                              {invoice.status === 'Paid' ? 'Zaplaceno' :
                               invoice.status === 'Overdue' ? 'Po splatnosti' : 'Nezaplaceno'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="p-6">
                        <div className="space-y-4">
                          <div>
                            <p className="text-sm text-gray-600">Faktura</p>
                            <p className="text-sm font-medium text-gray-900">#{invoice.number || invoice.id}</p>
                          </div>

                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-gray-600">Částka</p>
                              <p className="text-2xl font-bold text-gray-900">{invoice.total} CZK</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-gray-600">Splatnost</p>
                              <p className="text-sm font-medium text-gray-900">{invoice.duedate || 'N/A'}</p>
                            </div>
                          </div>

                          <div className="flex space-x-3 pt-4 border-t border-gray-200">
                            <button
                              onClick={() => downloadInvoicePDF(invoice.id)}
                              className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-xl hover:bg-gray-200 transition-all duration-200 text-sm font-medium"
                            >
                              Stáhnout PDF
                            </button>
                            {invoice.status !== 'Paid' && (
                              <button className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white py-2 px-4 rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-200 text-sm font-medium">
                                Zaplatit
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'tickets' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-2xl font-bold text-gray-900 flex items-center">
                    <MessageSquare className="h-7 w-7 mr-3 text-blue-500" />
                    Podpora
                  </h3>
                  <button className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-3 rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105">
                    Nový tiket
                  </button>
                </div>

                {/* Ticket Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4">
                    <div className="flex items-center">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <MessageSquare className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-gray-600">Celkem</p>
                        <p className="text-xl font-bold text-gray-900">{tickets.length}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4">
                    <div className="flex items-center">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-gray-600">Otevřené</p>
                        <p className="text-xl font-bold text-green-600">{tickets.filter(t => t.status === 'open').length}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4">
                    <div className="flex items-center">
                      <div className="p-2 bg-yellow-100 rounded-lg">
                        <Clock className="h-5 w-5 text-yellow-600" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-gray-600">Čeká odpověď</p>
                        <p className="text-xl font-bold text-yellow-600">{tickets.filter(t => t.status === 'waiting_reply').length}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4">
                    <div className="flex items-center">
                      <div className="p-2 bg-gray-100 rounded-lg">
                        <CheckCircle className="h-5 w-5 text-gray-600" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-gray-600">Uzavřené</p>
                        <p className="text-xl font-bold text-gray-600">{tickets.filter(t => t.status === 'closed').length}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tickets List */}
                <div className="space-y-4">
                  {tickets.map((ticket) => (
                    <div key={ticket.id} className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden hover:shadow-2xl transition-all duration-300">
                      <div className={`p-4 ${
                        ticket.status === 'open' ? 'bg-gradient-to-r from-blue-500 to-indigo-600' :
                        ticket.status === 'closed' ? 'bg-gradient-to-r from-gray-500 to-gray-600' :
                        'bg-gradient-to-r from-yellow-500 to-orange-600'
                      }`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <MessageSquare className="h-6 w-6 text-white" />
                            <div>
                              <h4 className="text-lg font-bold text-white">{ticket.id}</h4>
                              <p className="text-sm text-white opacity-90">{ticket.created}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              ticket.priority === 'high' ? 'bg-red-500 text-white' :
                              ticket.priority === 'medium' ? 'bg-yellow-500 text-white' :
                              'bg-green-500 text-white'
                            }`}>
                              {ticket.priority === 'high' ? 'Vysoká' :
                               ticket.priority === 'medium' ? 'Střední' : 'Nízká'}
                            </div>
                            <div className="px-3 py-1 rounded-full text-xs font-semibold bg-white bg-opacity-20 text-white flex items-center space-x-1">
                              {getStatusIcon(ticket.status)}
                              <span>
                                {ticket.status === 'open' ? 'Otevřený' :
                                 ticket.status === 'closed' ? 'Uzavřený' : 'Čeká odpověď'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="p-6">
                        <div className="space-y-4">
                          <div>
                            <h5 className="text-lg font-semibold text-gray-900 mb-2">{ticket.subject}</h5>
                            <div className="flex items-center space-x-4 text-sm text-gray-600">
                              <span>Oddělení: {ticket.department || 'Technická podpora'}</span>
                              <span>•</span>
                              <span>Přiřazeno: {ticket.assignedTo || 'Nepřiřazeno'}</span>
                              {ticket.serviceName && (
                                <>
                                  <span>•</span>
                                  <span>Služba: {ticket.serviceName}</span>
                                </>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-gray-600">Poslední odpověď</p>
                              <p className="text-sm font-medium text-gray-900">{ticket.lastReply}</p>
                            </div>
                            <button className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-2 px-6 rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 text-sm font-medium">
                              Zobrazit detail
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'profile' && (
              <div className="space-y-6">
                <h3 className="text-2xl font-bold text-gray-900 flex items-center">
                  <User className="h-7 w-7 mr-3 text-blue-500" />
                  Profil
                </h3>

                <div className="bg-white rounded-2xl shadow-xl border border-gray-200">
                  <div className="p-6 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-t-2xl">
                    <div className="flex items-center space-x-4">
                      <div className="p-4 bg-white bg-opacity-20 rounded-2xl">
                        <User className="h-8 w-8 text-white" />
                      </div>
                      <div>
                        <h4 className="text-xl font-bold text-white">{user?.name}</h4>
                        <p className="text-blue-100">{user?.email}</p>
                        <p className="text-blue-100 text-sm">Klient ID: {user?.clientId}</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-8">
                    <form className="space-y-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-3">
                            Jméno a příjmení
                          </label>
                          <input
                            type="text"
                            defaultValue={user?.name}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-3">
                            Email
                          </label>
                          <input
                            type="email"
                            defaultValue={user?.email}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-3">
                            Telefon
                          </label>
                          <input
                            type="tel"
                            defaultValue={user?.phone}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-3">
                            Společnost
                          </label>
                          <input
                            type="text"
                            defaultValue={user?.company}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                          Adresa
                        </label>
                        <textarea
                          rows={4}
                          defaultValue={user?.address}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                        />
                      </div>
                      <div className="flex justify-end space-x-4">
                        <button
                          type="button"
                          className="bg-gray-100 text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-200 transition-all duration-200 font-medium"
                        >
                          Zrušit
                        </button>
                        <button
                          type="submit"
                          className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-8 py-3 rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 font-medium"
                        >
                          Uložit změny
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'billing' && (
              <div className="space-y-6">
                <h3 className="text-2xl font-bold text-gray-900 flex items-center">
                  <CreditCard className="h-7 w-7 mr-3 text-blue-500" />
                  Platby a fakturace
                </h3>

                {/* Payment Methods */}
                <div className="bg-white rounded-2xl shadow-xl border border-gray-200">
                  <div className="p-6 bg-gradient-to-r from-green-500 to-emerald-600 rounded-t-2xl">
                    <h4 className="text-xl font-bold text-white flex items-center">
                      <CreditCard className="h-6 w-6 mr-2" />
                      Platební metody
                    </h4>
                  </div>
                  <div className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-6 border-2 border-gray-200 rounded-2xl hover:border-blue-300 transition-all duration-200">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-8 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-lg">
                            <span className="text-white text-xs font-bold">VISA</span>
                          </div>
                          <div>
                            <p className="text-lg font-semibold text-gray-900">**** **** **** 1234</p>
                            <p className="text-sm text-gray-500">Vyprší 12/25 • Výchozí metoda</p>
                          </div>
                        </div>
                        <div className="flex space-x-3">
                          <button className="bg-blue-100 text-blue-700 px-4 py-2 rounded-xl hover:bg-blue-200 transition-all duration-200 text-sm font-medium">
                            Upravit
                          </button>
                          <button className="bg-red-100 text-red-700 px-4 py-2 rounded-xl hover:bg-red-200 transition-all duration-200 text-sm font-medium">
                            Smazat
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-6 border-2 border-gray-200 rounded-2xl hover:border-blue-300 transition-all duration-200">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-8 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg flex items-center justify-center shadow-lg">
                            <span className="text-white text-xs font-bold">MC</span>
                          </div>
                          <div>
                            <p className="text-lg font-semibold text-gray-900">**** **** **** 5678</p>
                            <p className="text-sm text-gray-500">Vyprší 08/26</p>
                          </div>
                        </div>
                        <div className="flex space-x-3">
                          <button className="bg-blue-100 text-blue-700 px-4 py-2 rounded-xl hover:bg-blue-200 transition-all duration-200 text-sm font-medium">
                            Upravit
                          </button>
                          <button className="bg-red-100 text-red-700 px-4 py-2 rounded-xl hover:bg-red-200 transition-all duration-200 text-sm font-medium">
                            Smazat
                          </button>
                        </div>
                      </div>

                      <button className="w-full p-6 border-2 border-dashed border-gray-300 rounded-2xl text-gray-600 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200 group">
                        <div className="flex items-center justify-center space-x-2">
                          <div className="p-2 bg-gray-100 group-hover:bg-blue-100 rounded-xl transition-all duration-200">
                            <CreditCard className="h-5 w-5" />
                          </div>
                          <span className="font-medium">Přidat novou platební metodu</span>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Auto-renewal Settings */}
                <div className="bg-white rounded-2xl shadow-xl border border-gray-200">
                  <div className="p-6 bg-gradient-to-r from-purple-500 to-pink-600 rounded-t-2xl">
                    <h4 className="text-xl font-bold text-white flex items-center">
                      <Settings className="h-6 w-6 mr-2" />
                      Automatické platby
                    </h4>
                  </div>
                  <div className="p-6">
                    <div className="space-y-6">
                      <div className="flex items-center justify-between p-6 bg-gray-50 rounded-2xl">
                        <div>
                          <p className="text-lg font-semibold text-gray-900">Automatické obnovení služeb</p>
                          <p className="text-sm text-gray-600 mt-1">Služby budou automaticky obnoveny před vypršením</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" defaultChecked />
                          <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-blue-500 peer-checked:to-indigo-600"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between p-6 bg-gray-50 rounded-2xl">
                        <div>
                          <p className="text-lg font-semibold text-gray-900">Emailové upozornění na platby</p>
                          <p className="text-sm text-gray-600 mt-1">Dostávat upozornění 7 dní před splatností</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" defaultChecked />
                          <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-blue-500 peer-checked:to-indigo-600"></div>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Billing Summary */}
                <div className="bg-white rounded-2xl shadow-xl border border-gray-200">
                  <div className="p-6 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-t-2xl">
                    <h4 className="text-xl font-bold text-white flex items-center">
                      <DollarSign className="h-6 w-6 mr-2" />
                      Přehled plateb
                    </h4>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="text-center p-6 bg-green-50 rounded-2xl border border-green-200">
                        <div className="p-3 bg-green-500 rounded-2xl w-fit mx-auto mb-3">
                          <CheckCircle className="h-6 w-6 text-white" />
                        </div>
                        <p className="text-2xl font-bold text-green-600">{stats.totalSpent} Kč</p>
                        <p className="text-sm text-green-700 font-medium">Celkem zaplaceno</p>
                      </div>
                      <div className="text-center p-6 bg-blue-50 rounded-2xl border border-blue-200">
                        <div className="p-3 bg-blue-500 rounded-2xl w-fit mx-auto mb-3">
                          <Calendar className="h-6 w-6 text-white" />
                        </div>
                        <p className="text-2xl font-bold text-blue-600">{services.length}</p>
                        <p className="text-sm text-blue-700 font-medium">Aktivní služby</p>
                      </div>
                      <div className="text-center p-6 bg-yellow-50 rounded-2xl border border-yellow-200">
                        <div className="p-3 bg-yellow-500 rounded-2xl w-fit mx-auto mb-3">
                          <Clock className="h-6 w-6 text-white" />
                        </div>
                        <p className="text-2xl font-bold text-yellow-600">{stats.unpaidInvoices}</p>
                        <p className="text-sm text-yellow-700 font-medium">Nezaplacené faktury</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Service Management Modal */}
      {selectedService && (
        <ServiceManagement
          service={selectedService}
          onClose={() => setSelectedService(null)}
        />
      )}
    </div>
  );
}

// jednoduché volání
export const getServerSideProps = getServerSessionProps;
