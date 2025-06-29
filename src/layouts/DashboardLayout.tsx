import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Menu, 
  X, 
  LogOut, 
  LayoutDashboard, 
  ShoppingCart,
  Store,
  ClipboardList,
  ArrowUpCircle,
  Tags,
  Truck,
  Boxes,
  BarChart4,
  ChevronLeft,
  ChevronRight,
  Utensils,
  Users,
  MapPin,
  Settings
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useFeatures } from '../hooks/useFeatures';
import { useLocations } from '../contexts/LocationContext';
import LocationSelector from '../components/location/LocationSelector';

interface DashboardLayoutProps {
  children: React.ReactNode;
  title: string;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, title }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { currentUser, logout } = useAuth();
  const { features } = useFeatures();
  const { currentLocation, locations } = useLocations();
  const navigate = useNavigate();
  
  // Close sidebar when screen size changes
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setSidebarOpen(false);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed', error);
    }
  };

  const getNavLinks = () => {
    const superAdminLinks = [
      { name: 'Dashboard', href: '/superadmin', icon: <LayoutDashboard size={20} /> },
      { name: 'Locations', href: '/superadmin/locations', icon: <MapPin size={20} /> },
      { name: 'Categories', href: '/superadmin/categories', icon: <Tags size={20} /> },
      { name: 'Products', href: '/superadmin/products', icon: <Store size={20} /> },
      // Conditionally show vendor management
      ...(features.canManageVendors() ? [
        { name: 'Vendors', href: '/superadmin/vendors', icon: <Truck size={20} /> }
      ] : []),
      { name: 'Inventory', href: '/superadmin/inventory', icon: <Boxes size={20} /> },
      { name: 'Orders', href: '/superadmin/orders', icon: <ClipboardList size={20} /> },
      // Conditionally show user management
      ...(features.canManageUsers() ? [
        { name: 'Users', href: '/superadmin/users', icon: <Users size={20} /> }
      ] : []),
      // Conditionally show reports
      ...(features.canViewSalesReports() ? [
        { name: 'Reports', href: '/superadmin/reports', icon: <BarChart4 size={20} /> }
      ] : []),
      { name: 'Settings', href: '/superadmin/settings', icon: <Settings size={20} /> },
    ];

    const adminLinks = [
      { name: 'Dashboard', href: '/admin', icon: <LayoutDashboard size={20} /> },
      { name: 'Categories', href: '/admin/categories', icon: <Tags size={20} /> },
      { name: 'Products', href: '/admin/products', icon: <Store size={20} /> },
      // Conditionally show vendor management
      ...(features.canManageVendors() ? [
        { name: 'Vendors', href: '/admin/vendors', icon: <Truck size={20} /> }
      ] : []),
      { name: 'Inventory', href: '/admin/inventory', icon: <Boxes size={20} /> },
      { name: 'Orders', href: '/admin/orders', icon: <ClipboardList size={20} /> },
      // Conditionally show user management
      ...(features.canManageUsers() ? [
        { name: 'Users', href: '/admin/users', icon: <Users size={20} /> }
      ] : []),
      // Conditionally show reports
      ...(features.canViewSalesReports() ? [
        { name: 'Reports', href: '/admin/reports', icon: <BarChart4 size={20} /> }
      ] : []),
    ];

    const managerLinks = [
      { name: 'Dashboard', href: '/manager', icon: <LayoutDashboard size={20} /> },
      { name: 'Categories', href: '/manager/categories', icon: <Tags size={20} /> },
      { name: 'Products', href: '/manager/products', icon: <Store size={20} /> },
      // Conditionally show vendor management
      ...(features.canManageVendors() ? [
        { name: 'Vendors', href: '/manager/vendors', icon: <Truck size={20} /> }
      ] : []),
      { name: 'Inventory', href: '/manager/inventory', icon: <Boxes size={20} /> },
      { name: 'Orders', href: '/manager/orders', icon: <ClipboardList size={20} /> },
      // Conditionally show user management for managers
      ...(features.canManageUsers() ? [
        { name: 'Users', href: '/manager/users', icon: <Users size={20} /> }
      ] : []),
      // Conditionally show reports
      ...(features.canViewSalesReports() ? [
        { name: 'Reports', href: '/manager/reports', icon: <BarChart4 size={20} /> }
      ] : []),
    ];

    const salespersonLinks = [
      { name: 'POS', href: '/sales/pos', icon: <ShoppingCart size={20} /> },
      { name: 'Product Catalog', href: '/sales/catalog', icon: <Store size={20} /> },
      { name: 'Orders', href: '/sales/orders', icon: <ClipboardList size={20} /> },
      // Conditionally show returns
      ...(features.canProcessReturns() ? [
        { name: 'Returns', href: '/sales/returns', icon: <ArrowUpCircle size={20} /> }
      ] : []),
    ];

    if (!currentUser) return [];

    switch (currentUser.role) {
      case 'superadmin':
        return superAdminLinks;
      case 'admin':
        return adminLinks;
      case 'manager':
        return managerLinks;
      case 'salesperson':
        return salespersonLinks;
      default:
        return [];
    }
  };

  const navLinks = getNavLinks();

  const handleNavigation = (href: string) => {
    navigate(href);
    setSidebarOpen(false); // Always close mobile sidebar on navigation
  };

  // Check if user should see location selector
  // Only superadmin should see location selector
  const showLocationSelector = currentUser?.role === 'superadmin';

  // Get location name for display in header for non-superadmin users
  const getLocationDisplay = () => {
    if (!currentUser || currentUser.role === 'superadmin') return null;
    
    if (currentUser.locationId) {
      const userLocation = locations.find(loc => loc.id === currentUser.locationId);
      if (userLocation) {
        return (
          <div className="flex items-center text-sm text-gray-600">
            <MapPin size={16} className="mr-1" />
            <span>{userLocation.name}</span>
          </div>
        );
      }
    }
    
    return (
      <div className="flex items-center text-sm text-red-600">
        <MapPin size={16} className="mr-1" />
        <span>No location assigned</span>
      </div>
    );
  };

  return (
    <div className="h-screen flex overflow-hidden bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <div className="absolute inset-0 bg-gray-600 opacity-75 animate-fadeIn"></div>
        </div>
      )}

      {/* Mobile sidebar */}
      <div 
        className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-white transform transition-transform duration-300 ease-in-out md:hidden
          ${sidebarOpen ? 'translate-x-0 animate-slideInRight' : '-translate-x-full'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Mobile sidebar header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center">
              <Utensils size={24} className="text-green-700" />
              <span className="ml-2 text-lg font-bold text-green-700">ForkFlow</span>
            </div>
            <button
              className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 transition-colors duration-200"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          
          {/* Mobile navigation */}
          <div className="flex-1 overflow-y-auto py-4">
            <nav className="px-2 space-y-1">
              {navLinks.map((item) => (
                <button
                  key={item.name}
                  onClick={() => handleNavigation(item.href)}
                  className="w-full group flex items-center px-2 py-2 text-base font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors duration-200"
                >
                  <span className="mr-3 text-gray-500">{item.icon}</span>
                  {item.name}
                </button>
              ))}
            </nav>
          </div>
          
          {/* Mobile logout */}
          <div className="border-t border-gray-200 p-4">
            <button
              onClick={handleLogout}
              className="w-full flex items-center px-2 py-2 text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors duration-200"
            >
              <LogOut className="mr-3 h-5 w-5 text-gray-500" />
              Log out
            </button>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className={`hidden md:flex md:flex-shrink-0 transition-all duration-300 ease-in-out ${sidebarCollapsed ? 'w-16' : 'w-64'}`}>
        <div className="flex flex-col w-full">
          <div className="flex flex-col h-0 flex-1 border-r border-gray-200 bg-white">
            <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
              <div className="flex-shrink-0 flex items-center px-4">
                <Utensils size={24} className="text-green-700 flex-shrink-0" />
                {!sidebarCollapsed && (
                  <span className="ml-2 text-xl font-bold text-green-700 truncate">ForkFlow</span>
                )}
              </div>
              <nav className="mt-5 flex-1 px-2 bg-white space-y-1">
                {navLinks.map((item) => (
                  <button
                    key={item.name}
                    onClick={() => handleNavigation(item.href)}
                    className={`
                      w-full group flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all duration-200
                      ${sidebarCollapsed ? 'justify-center' : ''}
                    `}
                    title={sidebarCollapsed ? item.name : ''}
                  >
                    <span className={`text-gray-500 ${sidebarCollapsed ? 'mr-0' : 'mr-3'}`}>{item.icon}</span>
                    {!sidebarCollapsed && <span className="animate-fadeIn">{item.name}</span>}
                  </button>
                ))}
              </nav>
            </div>
            <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
              <button
                onClick={handleLogout}
                className={`
                  flex-shrink-0 group flex items-center text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors duration-200
                  ${sidebarCollapsed ? 'justify-center w-full' : ''}
                `}
                title={sidebarCollapsed ? 'Log out' : ''}
              >
                <LogOut className={`h-5 w-5 text-gray-500 ${sidebarCollapsed ? 'mr-0' : 'mr-3'}`} />
                {!sidebarCollapsed && <span>Log out</span>}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop toggle button */}
      <div className="hidden md:block fixed bottom-24 left-4 z-50">
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="bg-white rounded-lg p-2 hover:bg-gray-100 shadow-md transition-colors duration-200"
        >
          {sidebarCollapsed ? (
            <ChevronRight size={20} className="text-green-500" />
          ) : (
            <ChevronLeft size={20} className="text-red-500" />
          )}
        </button>
      </div>
      
      {/* Content area */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200 shadow-sm">
          {/* Mobile menu button */}
          <button
            className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 md:hidden transition-colors duration-200"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
          
          {/* Title */}
          <h1 className="text-lg md:text-2xl font-semibold text-gray-900 truncate flex-1 md:flex-none animate-fadeIn">
            {title}
          </h1>
          
          {/* Location display for non-superadmin users */}
          {!showLocationSelector && getLocationDisplay()}
          
          {/* Location Selector - Only show for superadmin */}
          {showLocationSelector && (
            <div className="flex items-center space-x-4">
              <LocationSelector />
            </div>
          )}
        </div>
        
        <main className="flex-1 relative z-0 overflow-y-auto focus:outline-none">
          <div className="py-4 md:py-6 animate-fadeIn">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;