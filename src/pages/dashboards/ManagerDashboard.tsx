import React from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { useAuth } from '../../contexts/AuthContext';
import { useProducts } from '../../contexts/ProductContext';
import { useSales } from '../../contexts/SalesContext';
import { useReturns } from '../../contexts/ReturnContext';
import { useStock } from '../../contexts/StockContext';
import { useFeatures } from '../../hooks/useFeatures';
import { format } from 'date-fns';
import { BarChart, Package, AlertCircle, RefreshCcw, ShoppingCart } from 'lucide-react';

const ManagerDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const { products } = useProducts();
  const { sales } = useSales();
  const { returns } = useReturns();
  const { stockUpdates } = useStock();
  const { features } = useFeatures();
  
  // Calculate sales metrics (with or without returns based on feature config)
  const totalSales = sales.reduce((sum, sale) => sum + sale.total, 0);
  const totalReturns = features.canProcessReturns() 
    ? returns.filter(ret => ret.type === 'sale').reduce((sum, ret) => sum + ret.total, 0)
    : 0;
  const netSales = totalSales - totalReturns;
  
  // Calculate transaction metrics
  const totalTransactions = sales.length;
  const totalSalesReturns = features.canProcessReturns() 
    ? returns.filter(ret => ret.type === 'sale').length 
    : 0;
  const netTransactions = totalTransactions - totalSalesReturns;
  
  // Calculate items sold metrics
  const totalItemsSold = sales.reduce((sum, sale) => 
    sum + sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0);
  const totalItemsReturned = features.canProcessReturns()
    ? returns
        .filter(ret => ret.type === 'sale')
        .reduce((sum, ret) => 
          sum + ret.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0)
    : 0;
  const netItemsSold = totalItemsSold - totalItemsReturned;
  
  // Count low stock items (less than or equal to 10)
  const lowStockItems = products.filter(product => product.quantity <= 10).length;

  // Get recent activities (conditionally include returns)
  const recentActivities = [
    ...sales.map(sale => ({
      type: 'sale',
      date: sale.createdAt,
      details: `Sale #${sale.invoiceNumber} - ${sale.items.length} items, Total: ₹${sale.total.toFixed(2)}`,
    })),
    // Only include returns if the feature is enabled
    ...(features.canProcessReturns() ? returns.map(ret => ({
      type: 'return',
      date: ret.createdAt,
      details: `${ret.type === 'sale' ? 'Sales' : 'Purchase'} Return - ${ret.items.length} items, Total: ₹${ret.total.toFixed(2)}`,
    })) : []),
    ...stockUpdates.map(update => ({
      type: 'stock',
      date: update.createdAt,
      details: `Stock ${update.quantity > 0 ? 'added' : 'reduced'} - ${Math.abs(update.quantity)} units`,
    }))
  ]
  .sort((a, b) => b.date.getTime() - a.date.getTime())
  .slice(0, 15);
  
  return (
    <DashboardLayout title="Manager Dashboard">
      <div className="space-y-6">
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Welcome, Manager</h2>
          <p className="text-gray-600 mb-4">
            You're logged in as a manager with access to inventory and sales management.
          </p>
          
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div className="bg-green-50 overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
                    <BarChart className="h-6 w-6 text-green-700" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {features.canProcessReturns() ? 'Net Sales' : 'Total Sales'}
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        ₹{netSales.toFixed(2)}
                      </div>
                    </dd>
                    {features.canProcessReturns() && (
                      <div className="text-xs text-gray-500 mt-1">
                        Sales: ₹{totalSales.toFixed(2)} | Returns: ₹{totalReturns.toFixed(2)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
                    <ShoppingCart className="h-6 w-6 text-blue-700" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {features.canProcessReturns() ? 'Net Transactions' : 'Total Transactions'}
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        {netTransactions}
                      </div>
                    </dd>
                    {features.canProcessReturns() && (
                      <div className="text-xs text-gray-500 mt-1">
                        Sales: {totalTransactions} | Returns: {totalSalesReturns}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-purple-50 overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-purple-100 rounded-md p-3">
                    <Package className="h-6 w-6 text-purple-700" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {features.canProcessReturns() ? 'Net Items Sold' : 'Total Items Sold'}
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        {netItemsSold}
                      </div>
                    </dd>
                    {features.canProcessReturns() && (
                      <div className="text-xs text-gray-500 mt-1">
                        Sold: {totalItemsSold} | Returned: {totalItemsReturned}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-amber-50 overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-amber-100 rounded-md p-3">
                    <AlertCircle className="h-6 w-6 text-amber-700" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Low Stock Items
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        {lowStockItems}
                      </div>
                    </dd>
                    <div className="text-xs text-gray-500 mt-1">
                      ≤ 10 units remaining
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Activity Log */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h2>
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
                            : activity.type === 'return'
                            ? 'bg-red-100'
                            : 'bg-blue-100'
                        }`}>
                          {activity.type === 'sale' ? (
                            <ShoppingCart className="h-5 w-5 text-green-600" />
                          ) : activity.type === 'return' ? (
                            <RefreshCcw className="h-5 w-5 text-red-600" />
                          ) : (
                            <Package className="h-5 w-5 text-blue-600" />
                          )}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                        <div>
                          <p className="text-sm text-gray-500">{activity.details}</p>
                        </div>
                        <div className="text-right text-sm whitespace-nowrap text-gray-500">
                          {format(activity.date, 'MMM dd, HH:mm')}
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

export default ManagerDashboard;