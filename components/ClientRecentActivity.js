import { 
  Activity, CheckCircle, MessageSquare, Server 
} from 'lucide-react';

const ClientRecentActivity = () => {
  const activities = [
    {
      id: 1,
      type: 'payment',
      title: 'Faktura INV-2024-001 byla zaplacena',
      description: '249 Kč • VPS Start',
      time: 'před 2 dny',
      icon: CheckCircle,
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      iconBg: 'bg-green-500'
    },
    {
      id: 2,
      type: 'ticket',
      title: 'Nový tiket TIC-001 byl vytvořen',
      description: 'Problém s emailem',
      time: 'před 3 dny',
      icon: MessageSquare,
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      iconBg: 'bg-blue-500'
    },
    {
      id: 3,
      type: 'service',
      title: 'Služba VPS Pro byla aktivována',
      description: 'server2.systrix.cz',
      time: 'před 5 dny',
      icon: Server,
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-200',
      iconBg: 'bg-indigo-500'
    }
  ];

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-xl font-bold text-gray-900 flex items-center">
          <Activity className="h-6 w-6 mr-2 text-blue-500" />
          Nedávná aktivita
        </h3>
      </div>
      <div className="p-6">
        <div className="space-y-4">
          {activities.map((activity) => {
            const Icon = activity.icon;
            return (
              <div 
                key={activity.id}
                className={`flex items-center space-x-4 p-4 ${activity.bgColor} rounded-xl border ${activity.borderColor}`}
              >
                <div className={`p-2 ${activity.iconBg} rounded-full`}>
                  <Icon className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1">
                  <span className="text-sm font-medium text-gray-900">{activity.title}</span>
                  <p className="text-xs text-gray-500">{activity.description}</p>
                </div>
                <span className="text-xs text-gray-400 font-medium">{activity.time}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ClientRecentActivity;
