import { User, Mail, Phone, MapPin, Building, Calendar, CreditCard } from 'lucide-react';

const ClientProfileCard = ({ user }) => {
  if (!user) {
    return (
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  const profileItems = [
    {
      icon: User,
      label: 'Jméno',
      value: user.name || `${user.firstname} ${user.lastname}`,
      color: 'text-blue-600'
    },
    {
      icon: Mail,
      label: 'Email',
      value: user.email,
      color: 'text-green-600'
    },
    {
      icon: Phone,
      label: 'Telefon',
      value: user.phone || 'Nezadáno',
      color: 'text-purple-600'
    },
    {
      icon: Building,
      label: 'Firma',
      value: user.companyname || 'Fyzická osoba',
      color: 'text-orange-600'
    },
    {
      icon: MapPin,
      label: 'Adresa',
      value: user.address && user.city ? `${user.address}, ${user.city} ${user.postcode}` : 'Nezadáno',
      color: 'text-red-600'
    },
    {
      icon: Calendar,
      label: 'Registrace',
      value: user.datecreated ? new Date(user.datecreated).toLocaleDateString('cs-CZ') : 'Neznámo',
      color: 'text-indigo-600'
    }
  ];

  // Add balance info if available
  if (user.balance !== undefined || user.credit !== undefined) {
    profileItems.push({
      icon: CreditCard,
      label: 'Zůstatek',
      value: `${user.balance || 0} CZK (Kredit: ${user.credit || 0} CZK)`,
      color: 'text-emerald-600'
    });
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6">
      <div className="flex items-center mb-6">
        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
          <User className="w-6 h-6 text-white" />
        </div>
        <div className="ml-4">
          <h3 className="text-xl font-bold text-gray-900">Profil klienta</h3>
          <p className="text-sm text-gray-500">
            ID: {user.id} • Status: 
            <span className={`ml-1 px-2 py-1 rounded-full text-xs font-medium ${
              user.status === 'Active' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {user.status || 'Neznámý'}
            </span>
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {profileItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <div key={index} className="flex items-center p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
              <div className={`w-10 h-10 rounded-lg bg-white flex items-center justify-center ${item.color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-gray-500">{item.label}</p>
                <p className="text-sm text-gray-900 font-medium">{item.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Additional info from HostBill */}
      {user.group_name && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Skupina klienta:</span>
            <span className="font-medium text-gray-900">{user.group_name}</span>
          </div>
        </div>
      )}

      {user.affiliate && (
        <div className="mt-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Affiliate:</span>
            <span className="font-medium text-gray-900">{user.affiliate}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientProfileCard;
