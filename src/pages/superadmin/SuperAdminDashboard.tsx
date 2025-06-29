import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Building2, 
  Users, 
  MapPin, 
  BarChart3, 
  Settings, 
  TrendingUp,
  Store,
  UserCheck,
  Activity
} from 'lucide-react';
import { useFranchise } from '../../contexts/FranchiseContext';
import { useAuth } from '../../contexts/AuthContext';

const SuperAdminDashboard: React.FC = () => {
  const { franchise, loading } = useFranchise();
  const { currentUser } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const quickActions = [
    {
      title: 'Manage Franchise',
      description: franchise ? 'Update franchise settings and details' : 'Create your franchise',
      icon: Building2,
      href: '/superadmin/franchise',
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      title: 'System Settings',
      description: 'Configure global system settings',
      icon: Settings,
      href: '/superadmin/settings',
      color: 'bg-gray-500 hover:bg-gray-600'
    },
    {
      title: 'Global Analytics',
      description: 'View comprehensive system analytics',
      icon: BarChart3,
      href: '/superadmin/analytics',
      color: 'bg-green-500 hover:bg-green-600'
    }
  ];

  const franchiseActions = franchise ? [
    {
      title: 'Franchise Users',
      description: 'Manage all users in the franchise',
      icon: Users,
      href: '/franchise/users',
      color: 'bg-purple-500 hover:bg-purple-600'
    },
    {
      title: 'Locations',
      description: 'Manage franchise locations',
      icon: MapPin,
      href: '/franchise/locations',
      color: 'bg-orange-500 hover:bg-orange-600'
    },
    {
      title: 'Franchise Settings',
      description: 'Configure franchise-specific settings',
      icon: Store,
      href: '/franchise/settings',
      color: 'bg-indigo-500 hover:bg-indigo-600'
    }
  ] : [];

  const stats = [
    {
      title: 'Franchise Status',
      value: franchise ? 'Active' : 'Not Created',
      icon: Building2,
      color: franchise ? 'text-green-600' : 'text-red-600',
      bgColor: franchise ? 'bg-green-100' : 'bg-red-100'
    },
    {
      title: 'System Status',
      value: 'Online',
      icon: Activity,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      title: 'User Role',
      value: 'Super Admin',
      icon: UserCheck,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Super Admin Dashboard</h1>
            <p className="text-gray-600 mt-1">
              Welcome back, {currentUser?.name || currentUser?.email}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-8 w-8 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">System Management</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quickActions.map((action, index) => (
            <Link
              key={index}
              to={action.href}
              className={`${action.color} text-white p-6 rounded-lg transition-colors duration-200 block`}
            >
              <action.icon className="h-8 w-8 mb-3" />
              <h3 className="text-lg font-semibold mb-2">{action.title}</h3>
              <p className="text-sm opacity-90">{action.description}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Franchise Management */}
      {franchise && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Franchise Management</h2>
            <div className="text-sm text-gray-600">
              Franchise: <span className="font-medium">{franchise.name}</span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {franchiseActions.map((action, index) => (
              <Link
                key={index}
                to={action.href}
                className={`${action.color} text-white p-6 rounded-lg transition-colors duration-200 block`}
              >
                <action.icon className="h-8 w-8 mb-3" />
                <h3 className="text-lg font-semibold mb-2">{action.title}</h3>
                <p className="text-sm opacity-90">{action.description}</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* No Franchise Notice */}
      {!franchise && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-center">
            <Building2 className="h-8 w-8 text-yellow-600 mr-3" />
            <div>
              <h3 className="text-lg font-semibold text-yellow-800">No Franchise Created</h3>
              <p className="text-yellow-700 mt-1">
                You need to create a franchise to start managing the system. Click on "Manage Franchise" to get started.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminDashboard;