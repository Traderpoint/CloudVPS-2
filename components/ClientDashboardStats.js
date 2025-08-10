import { 
  Server, FileText, MessageSquare, TrendingUp, 
  CheckCircle, AlertCircle 
} from 'lucide-react';

const ClientDashboardStats = ({ stats }) => {
  const statsCards = [
    {
      title: 'Aktivní služby',
      value: stats.activeServices || 0,
      total: stats.totalServices || 0,
      icon: Server,
      color: 'from-blue-500 to-indigo-600',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700',
      trend: {
        value: stats.totalServices || 0,
        positive: (stats.activeServices || 0) > 0,
        text: `z ${stats.totalServices || 0} celkem`
      }
    },
    {
      title: 'Zaplacené faktury',
      value: stats.paidInvoices || 0,
      total: stats.totalInvoices || 0,
      icon: FileText,
      color: 'from-green-500 to-emerald-600',
      bgColor: 'bg-green-50',
      textColor: 'text-green-700',
      trend: {
        value: stats.unpaidInvoices || 0,
        positive: (stats.unpaidInvoices || 0) === 0,
        text: (stats.unpaidInvoices || 0) > 0 ? `${stats.unpaidInvoices} nezaplacených` : 'Vše zaplaceno'
      }
    },
    {
      title: 'Otevřené tikety',
      value: stats.openTickets || 0,
      total: stats.totalTickets || 0,
      icon: MessageSquare,
      color: 'from-yellow-500 to-orange-600',
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-700',
      trend: {
        value: stats.closedTickets || 0,
        positive: (stats.openTickets || 0) === 0,
        text: (stats.openTickets || 0) > 0 ? 'Vyžaduje pozornost' : `${stats.closedTickets || 0} vyřešených`
      }
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {statsCards.map((card, index) => {
        const Icon = card.icon;
        const TrendIcon = card.trend.positive ? CheckCircle : AlertCircle;
        
        return (
          <div 
            key={index}
            className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">{card.title}</p>
                <p className="text-3xl font-bold text-gray-900">{card.value}</p>
                <div className="flex items-center mt-2">
                  <TrendIcon className={`h-4 w-4 mr-1 ${card.trend.positive ? 'text-green-500' : 'text-yellow-500'}`} />
                  <span className={`text-sm font-medium ${card.trend.positive ? 'text-green-600' : 'text-yellow-600'}`}>
                    {card.trend.value > 0 && '+'}
                    {card.trend.value > 0 ? `${card.trend.value}% ` : ''}
                    {card.trend.text}
                  </span>
                </div>
              </div>
              <div className={`p-4 bg-gradient-to-r ${card.color} rounded-2xl shadow-lg`}>
                <Icon className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ClientDashboardStats;
