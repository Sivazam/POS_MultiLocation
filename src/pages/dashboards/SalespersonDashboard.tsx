import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Search, ArrowUpCircle, ClipboardList, RefreshCcw } from 'lucide-react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { useAuth } from '../../contexts/AuthContext';
import { useProducts } from '../../contexts/ProductContext';
import { useCategories } from '../../contexts/CategoryContext';
import { useSales } from '../../contexts/SalesContext';
import { useReturns } from '../../contexts/ReturnContext';
import { useFeatures } from '../../hooks/useFeatures';
import Input from '../../components/ui/Input';
import { format, startOfDay, endOfDay } from 'date-fns';

const SalespersonDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const { products } = useProducts();
  const { categories } = useCategories();
  const { sales } = useSales();
  const { returns } = useReturns();
  const { features } = useFeatures();
  const [searchTerm, setSearchTerm] = useState('');
  
  // Get today's sales and returns for the current user
  const today = useMemo(() => {
    const start = startOfDay(new Date());
    const end = endOfDay(new Date());
    return { start, end };
  }, []);

  // Get today's sales
  const todaysSales = useMemo(() => {
    const filtered = sales.filter(sale => {
      const saleDate = sale.createdAt;
      const isToday = saleDate >= today.start && saleDate <= today.end;
      const isCurrentUser = sale.createdBy === currentUser?.uid;
      return isCurrentUser && isToday;
    });
    return filtered;
  }, [sales, currentUser, today]);

  // Get today's returns - only if returns feature is enabled
  const todaysReturns = useMemo(() => {
    if (!features.canProcessReturns()) return [];
    
    // Get all sale IDs for current user
    const userSaleIds = sales
      .filter(sale => sale.createdBy === currentUser?.uid)
      .map(sale => sale.id);
    
    const filtered = returns.filter(ret => {
      const returnDate = ret.createdAt;
      const isToday = returnDate >= today.start && returnDate <= today.end;
      const isSalesReturn = ret.type === 'sale';
      const isUserReturn = userSaleIds.includes(ret.referenceId);
      
      return isToday && isSalesReturn && isUserReturn;
    });
    
    return filtered;
  }, [returns, currentUser, today, sales, features]);

  // Calculate net sales (sales - returns)
  const netSales = useMemo(() => {
    const totalSales = todaysSales.reduce((sum, sale) => sum + sale.total, 0);
    const totalReturns = features.canProcessReturns() 
      ? todaysReturns.reduce((sum, ret) => sum + ret.total, 0)
      : 0;
    return totalSales - totalReturns;
  }, [todaysSales, todaysReturns, features]);

  // Calculate net items sold
  const netItemsSold = useMemo(() => {
    const itemsSold = todaysSales.reduce((sum, sale) => 
      sum + sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0);
    const itemsReturned = features.canProcessReturns()
      ? todaysReturns.reduce((sum, ret) =>
          sum + ret.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0)
      : 0;
    return itemsSold - itemsReturned;
  }, [todaysSales, todaysReturns, features]);

  // Get recent activity including both sales and returns (if enabled)
  const recentActivity = useMemo(() => {
    // Get user's sale IDs for return matching
    const userSaleIds = sales
      .filter(sale => sale.createdBy === currentUser?.uid)
      .map(sale => sale.id);

    const allActivity = [
      ...todaysSales.map(sale => ({
        id: sale.id,
        type: 'sale' as const,
        time: sale.createdAt,
        total: sale.total,
        itemCount: sale.items.reduce((sum, item) => sum + item.quantity, 0),
        paymentMethod: sale.paymentMethod,
        invoiceNumber: sale.invoiceNumber
      })),
      // Only include returns if the feature is enabled
      ...(features.canProcessReturns() ? returns.filter(ret => {
        const returnDate = ret.createdAt;
        const isToday = returnDate >= today.start && returnDate <= today.end;
        const isSalesReturn = ret.type === 'sale';
        const isUserReturn = userSaleIds.includes(ret.referenceId);
        return isToday && isSalesReturn && isUserReturn;
      }).map(ret => ({
        id: ret.id,
        type: 'return' as const,
        time: ret.createdAt,
        total: ret.total,
        itemCount: ret.items.reduce((sum, item) => sum + item.quantity, 0),
        refundMethod: ret.refundMethod,
        referenceId: ret.referenceId
      })) : [])
    ].sort((a, b) => b.time.getTime() - a.time.getTime())
    .slice(0, 10);

    return allActivity;
  }, [todaysSales, returns, currentUser, today, sales, features]);

  // Filter products based on search
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    categories.find(cat => cat.id === product.categoryId)?.name.toLowerCase().includes(searchTerm.toLowerCase())
  ).slice(0, 5);

  return (
    <DashboardLayout title="Salesperson Dashboard">
      <div className="space-y-4 sm:space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <div className="flex items-center">
              <div className="p-2 sm:p-3 bg-green-100 rounded-full">
                <ShoppingCart className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
              </div>
              <div className="ml-3 sm:ml-4 min-w-0">
                <h3 className="text-sm sm:text-lg font-medium text-gray-900 truncate">
                  Today's {features.canProcessReturns() ? 'Net' : 'Total'} Sales
                </h3>
                <p className="text-lg sm:text-2xl font-semibold text-green-600 truncate">₹{netSales.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <div className="flex items-center">
              <div className="p-2 sm:p-3 bg-blue-100 rounded-full">
                <ClipboardList className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
              </div>
              <div className="ml-3 sm:ml-4 min-w-0">
                <h3 className="text-sm sm:text-lg font-medium text-gray-900 truncate">Orders Today</h3>
                <p className="text-lg sm:text-2xl font-semibold text-blue-600">
                  {todaysSales.length}
                </p>
              </div>
            </div>
          </div>

          {/* Only show returns card if returns feature is enabled */}
          {features.canProcessReturns() && (
            <div className="bg-white rounded-lg shadow p-4 sm:p-6">
              <div className="flex items-center">
                <div className="p-2 sm:p-3 bg-red-100 rounded-full">
                  <RefreshCcw className="h-5 w-5 sm:h-6 sm:w-6 text-red-600" />
                </div>
                <div className="ml-3 sm:ml-4 min-w-0">
                  <h3 className="text-sm sm:text-lg font-medium text-gray-900 truncate">Returns Today</h3>
                  <p className="text-lg sm:text-2xl font-semibold text-red-600">
                    {todaysReturns.length}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <div className="flex items-center">
              <div className="p-2 sm:p-3 bg-purple-100 rounded-full">
                <ArrowUpCircle className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
              </div>
              <div className="ml-3 sm:ml-4 min-w-0">
                <h3 className="text-sm sm:text-lg font-medium text-gray-900 truncate">
                  {features.canProcessReturns() ? 'Net' : 'Total'} Items Sold
                </h3>
                <p className="text-lg sm:text-2xl font-semibold text-purple-600">{netItemsSold}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className={`grid grid-cols-1 ${features.canProcessReturns() ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-4 sm:gap-6`}>
          <Link 
            to="/sales/pos"
            className="bg-green-50 rounded-lg shadow p-4 sm:p-6 hover:bg-green-100 transition-colors duration-200"
          >
            <div className="flex items-center">
              <div className="p-2 sm:p-3 bg-green-100 rounded-full">
                <ShoppingCart className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
              </div>
              <div className="ml-3 sm:ml-4 min-w-0">
                <h3 className="text-lg sm:text-xl font-medium text-gray-900 truncate">Point of Sale</h3>
                <p className="text-sm sm:text-base text-gray-600 mt-1">Process new sales and transactions</p>
              </div>
            </div>
          </Link>

          <Link 
            to="/sales/orders"
            className="bg-blue-50 rounded-lg shadow p-4 sm:p-6 hover:bg-blue-100 transition-colors duration-200"
          >
            <div className="flex items-center">
              <div className="p-2 sm:p-3 bg-blue-100 rounded-full">
                <ClipboardList className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
              </div>
              <div className="ml-3 sm:ml-4 min-w-0">
                <h3 className="text-lg sm:text-xl font-medium text-gray-900 truncate">Recent Orders</h3>
                <p className="text-sm sm:text-base text-gray-600 mt-1">View and manage your orders</p>
              </div>
            </div>
          </Link>

          {/* Only show returns action if returns feature is enabled */}
          {features.canProcessReturns() && (
            <Link 
              to="/sales/returns"
              className="bg-red-50 rounded-lg shadow p-4 sm:p-6 hover:bg-red-100 transition-colors duration-200"
            >
              <div className="flex items-center">
                <div className="p-2 sm:p-3 bg-red-100 rounded-full">
                  <RefreshCcw className="h-6 w-6 sm:h-8 sm:w-8 text-red-600" />
                </div>
                <div className="ml-3 sm:ml-4 min-w-0">
                  <h3 className="text-lg sm:text-xl font-medium text-gray-900 truncate">Returns</h3>
                  <p className="text-sm sm:text-base text-gray-600 mt-1">Process returns and refunds</p>
                </div>
              </div>
            </Link>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-medium text-gray-900 mb-4">Recent Activity</h2>
          {recentActivity.length > 0 ? (
            <div className="space-y-4">
              {recentActivity.map(activity => (
                <div key={activity.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                  <div className="flex items-center min-w-0">
                    <div className={`p-2 rounded-full mr-3 flex-shrink-0 ${
                      activity.type === 'sale' ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      {activity.type === 'sale' ? (
                        <ShoppingCart className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
                      ) : (
                        <RefreshCcw className="h-3 w-3 sm:h-4 sm:w-4 text-red-600" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                        {activity.type === 'sale' ? (
                          <>Sale #{activity.invoiceNumber}</>
                        ) : (
                          <>Return for Sale #{activity.referenceId.slice(0, 8)}</>
                        )}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-500">
                        {activity.itemCount} items - {format(activity.time, 'HH:mm')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={`text-xs sm:text-sm font-medium ${
                      activity.type === 'sale' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {activity.type === 'sale' ? '+' : '-'}₹{activity.total.toFixed(2)}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-500">
                      {activity.type === 'sale' 
                        ? activity.paymentMethod.toUpperCase() 
                        : `${activity.refundMethod?.toUpperCase() || 'CASH'} REFUND`
                      }
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4 text-sm sm:text-base">No activity recorded today</p>
          )}
        </div>

        {/* Product Lookup */}
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-medium text-gray-900 mb-4">Quick Product Lookup</h2>
          <div className="space-y-4">
            <Input
              placeholder="Search products by name or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={<Search size={18} className="text-gray-500" />}
            />

            {searchTerm && (
              <div className="mt-4">
                {filteredProducts.length > 0 ? (
                  <div className="divide-y divide-gray-200">
                    {filteredProducts.map(product => (
                      <div key={product.id} className="py-4 flex items-center">
                        {product.imageUrl ? (
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg object-cover flex-shrink-0"
                            onError={(e) => {
                              e.currentTarget.src = 'https://via.placeholder.com/48?text=No+Image';
                            }}
                          />
                        ) : (
                          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <span className="text-xs text-gray-400">No img</span>
                          </div>
                        )}
                        <div className="ml-3 sm:ml-4 flex-1 min-w-0">
                          <h3 className="text-xs sm:text-sm font-medium text-gray-900 truncate">{product.name}</h3>
                          <p className="text-xs sm:text-sm text-gray-500 truncate">
                            {categories.find(cat => cat.id === product.categoryId)?.name}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-xs sm:text-sm font-medium text-gray-900">₹{product.price.toFixed(2)}</p>
                          <p className={`text-xs sm:text-sm ${
                            product.quantity <= 10 ? 'text-red-600 font-medium' : 'text-gray-500'
                          }`}>
                            {product.quantity} in stock
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4 text-sm sm:text-base">No products found</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SalespersonDashboard;