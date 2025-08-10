import { 
  Server, FileText, MessageSquare, CreditCard, Zap 
} from 'lucide-react';

const ClientQuickActions = ({ onTabChange }) => {
  const actions = [
    {
      id: 'services',
      title: 'Spravovat služby',
      icon: Server,
      color: 'from-blue-500 to-indigo-600',
      hoverColor: 'hover:from-blue-600 hover:to-indigo-700'
    },
    {
      id: 'invoices',
      title: 'Zobrazit faktury',
      icon: FileText,
      color: 'from-green-500 to-emerald-600',
      hoverColor: 'hover:from-green-600 hover:to-emerald-700'
    },
    {
      id: 'tickets',
      title: 'Nový tiket',
      icon: MessageSquare,
      color: 'from-yellow-500 to-orange-600',
      hoverColor: 'hover:from-yellow-600 hover:to-orange-700'
    },
    {
      id: 'billing',
      title: 'Platební metody',
      icon: CreditCard,
      color: 'from-purple-500 to-pink-600',
      hoverColor: 'hover:from-purple-600 hover:to-pink-700'
    }
  ];

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
        <Zap className="h-6 w-6 mr-2 text-blue-500" />
        Rychlé akce
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <button 
              key={action.id}
              onClick={() => onTabChange(action.id)}
              className={`p-4 bg-gradient-to-r ${action.color} text-white rounded-xl ${action.hoverColor} transition-all duration-200 transform hover:scale-105 shadow-lg`}
            >
              <Icon className="h-6 w-6 mx-auto mb-2" />
              <span className="text-sm font-medium">{action.title}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ClientQuickActions;
