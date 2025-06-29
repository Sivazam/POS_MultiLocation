import React, { useState } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { useAuth } from '../../contexts/AuthContext';
import { useLocations } from '../../contexts/LocationContext';
import { useSales } from '../../contexts/SalesContext';
import { useProducts } from '../../contexts/ProductContext';
import { useReturns } from '../../contexts/ReturnContext';
import { useFeatures } from '../../hooks/useFeatures';
import { format } from 'date-fns';
import { 
  BarChart, 
  Package, 
  AlertCircle, 
  RefreshCcw, 
  ShoppingCart, 
  MapPin,
  Users,
  Store,
  TrendingUp,
  DollarSign
} from 'lucide-react';

const SuperAdminDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const { locations } = useLocations();
  const { sales } = useSales();
  const { products } = useProducts();
  const { returns } = useReturns();
  const { features } = useFeatures();
  
  // Calculate franchise-wide metrics
  const totalSales = sales.reduce((sum, sale) => sum + sale.total, 0);
  const totalReturns = features.canProcessReturns() 
    ? returns.filter(ret => ret.type === 'sale').reduce((sum, ret) => sum + ret.total, 0)
    : 0;
  const netSales = totalSales - totalReturns;
  
  const totalTransactions = sales.length;
  const totalSalesReturns = features.canProcessReturns() 
    ? returns.filter(ret => ret.type === 'sale').length 
    : 0;
  const netTransactions = totalTransactions - totalSalesReturns;
  
  const totalItemsSold = sales.reduce((sum, sale) => 
    sum + sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0);
  const totalItemsReturned = features.canProcessReturns()
    ? returns
        .filter(ret => ret.type === 'sale')
        .reduce((sum, ret) => 
          sum + ret.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0)
    : 0;
  const netItemsSold = totalItemsSold - totalItemsReturned;
  
  const lowStockItems = products.filter(product => product.quantity <= 10).length;
  const activeLocations = locations.filter(loc => loc.isActive).length;

  // Get recent activities across all locations
  const recentActivities = [
    ...sales.map(sale => ({
      type: 'sale',
      date: sale.createdAt,
      details: `Sale #${sale.invoiceNumber} - ${sale.items.length} items, Total: ₹${sale.total.toFixed(2)}`,
      locationId: sale.locationId,
    })),
    ...(features.canProcessReturns() ? returns.map(ret => ({
      type: 'return',
      date: ret.createdAt,
      details: `${ret.type === 'sale' ? 'Sales' : 'Purchase'} Return - ${ret.items.length} items, Total: ₹${ret.total.toFixed(2)}`,
      locationId: ret.locationId,
    })) : [])
  ]
  .sort((a, b) => b.date.getTime() - a.date.getTime())
  .slice(0, 15);

  const getLocationName = (locationId: string) => {
    return locations.find(loc => loc.id === locationId)?.storeName || 'Unknown Location';
  };
  
  return (
    <DashboardLayout title="Super Admin Dashboard">
      <div className="space-y-4 sm:space-y-6">
        {/* Franchise Overview */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">ForkFlow Franchise</h2>
              <p className="text-green-100 mt-1">Complete franchise management and oversight</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">{activeLocations}</div>
              <div className="text-green-100">Active Locations</div>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 sm:p-3 bg-green-100 rounded-lg">
                <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
              </div>
              <div className="ml-3 sm:ml-4 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-600">
                  {features.canProcessReturns() ? 'Net Revenue' : 'Total Revenue'}
                </p>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">
                  ₹{netSales.toFixed(2)}
                </h3>
                {features.canProcessReturns() && (
                  <p className="text-xs text-gray-500 mt-1 truncate">
                    Gross: ₹{totalSales.toFixed(2)} | Returns: ₹{totalReturns.toFixed(2)}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 sm:p-3 bg-blue-100 rounded-lg">
                <ShoppingCart className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
              </div>
              <div className="ml-3 sm:ml-4 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-600">
                  {features.canProcessReturns() ? 'Net Transactions' : 'Total Transactions'}
                </p>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
                  {netTransactions}
                </h3>
                {features.canProcessReturns() && (
                  <p className="text-xs text-gray-500 mt-1 truncate">
                    Sales: {totalTransactions} | Returns: {totalSalesReturns}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 sm:p-3 bg-purple-100 rounded-lg">
                <Package className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
              </div>
              <div className="ml-3 sm:ml-4 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-600">
                  {features.canProcessReturns() ? 'Net Items Sold' : 'Total Items Sold'}
                </p>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
                  {netItemsSold}
                </h3>
                {features.canProcessReturns() && (
                  <p className="text-xs text-gray-500 mt-1 truncate">
                    Sold: {totalItemsSold} | Returned: {totalItemsReturned}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 sm:p-3 bg-amber-100 rounded-lg">
                <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6 text-amber-600" />
              </div>
              <div className="ml-3 sm:ml-4 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-600">
                  Low Stock Items
                </p>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
                  {lowStockItems}
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Across all locations
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Locations Overview */}
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <MapPin className="h-5 w-5 mr-2 text-green-600" />
            Locations Overview
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {locations.map(location => {
              const locationSales = sales.filter(sale => sale.locationId === location.id);
              const locationRevenue = locationSales.reduce((sum, sale) => sum + sale.total, 0);
              const locationTransactions = locationSales.length;
              
              return (
                <div key={location.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900 truncate">{location.storeName}</h4>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      location.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {location.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="space-y-1 text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span>Revenue:</span>
                      <span className="font-medium">₹{locationRevenue.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Transactions:</span>
                      <span className="font-medium">{locationTransactions}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Activity Log */}
        <div className="bg-white shadow rounded-lg p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-medium text-gray-900 mb-4">Recent Activity Across All Locations</h2>
          <div className="flow-root">
            <ul className="-mb-8">
              {recentActivities.map((activity, idx) => (
                <li key={idx}>
                  <div className="relative pb-8">
                    {idx !== recentActivities.length - 1 && (
                      <span
                        className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                        aria-hidden="true"
                      />
                    )}
                    <div className="relative flex space-x-3">
                      <div>
                        <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${
                          activity.type === 'sale' 
                            ? 'bg-green-100' 
                            : 'bg-red-100'
                        }`}>
                          {activity.type === 'sale' ? (
                            <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                          ) : (
                            <RefreshCcw className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
                          )}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1 pt-1.5 flex flex-col sm:flex-row sm:justify-between space-y-1 sm:space-y-0 sm:space-x-4">
                        <div className="min-w-0">
                          <p className="text-xs sm:text-sm text-gray-500 truncate">{activity.details}</p>
                          <p className="text-xs text-gray-400">{getLocationName(activity.locationId)}</p>
                        </div>
                        <div className="text-right text-xs sm:text-sm whitespace-nowrap text-gray-500">
                          <span className="hidden sm:inline">{format(activity.date, 'MMM dd, HH:mm')}</span>
                          <span className="sm:hidden">{format(activity.date, 'HH:mm')}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SuperAdminDashboard;