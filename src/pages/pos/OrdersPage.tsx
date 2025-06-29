import React, { useState } from 'react';
import { format } from 'date-fns';
import { Search } from 'lucide-react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { useSales } from '../../contexts/SalesContext';
import { useAuth } from '../../contexts/AuthContext';
import Input from '../../components/ui/Input';
import ErrorAlert from '../../components/ui/ErrorAlert';
import ReceiptModal from '../../components/pos/ReceiptModal';
import { Receipt } from '../../types';

const OrdersPage: React.FC = () => {
  const { sales, loading, error } = useSales();
  const { currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [showReceipt, setShowReceipt] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);

  // Filter sales by current user and search term
  const filteredSales = sales.filter(sale => {
    const matchesUser = sale.createdBy === currentUser?.uid;
    const matchesSearch = sale.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.items.some(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesUser && matchesSearch;
  });

  const viewReceipt = (sale: any) => {
    const receipt: Receipt = {
      sale,
      businessName: 'Millet Home Foods',
      businessAddress: '123 Food Street, Bangalore, Karnataka 560001',
      gstNumber: 'GSTIN29ABCDE1234F1Z5',
      contactNumber: '+91 80 1234 5678',
      email: 'contact@millethomefoods.com'
    };
    setSelectedReceipt(receipt);
    setShowReceipt(true);
  };

  return (
    <DashboardLayout title="Orders History">
      <div className="space-y-6">
        {error && <ErrorAlert message={error} />}

        <div className="w-full sm:w-96">
          <Input
            placeholder="Search orders..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon={<Search size={18} className="text-gray-500" />}
          />
        </div>

        <div className="bg-white rounded-lg shadow">
          {loading ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              <p className="mt-2 text-gray-600">Loading orders...</p>
            </div>
          ) : filteredSales.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              {searchTerm ? 'No orders found matching your search.' : 'No orders yet.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Items
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payment
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredSales.map(sale => (
                    <tr key={sale.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {format(sale.createdAt, 'dd/MM/yyyy HH:mm')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {sale.id.slice(0, 8)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {sale.items.map((item, index) => (
                          <div key={item.id}>
                            {item.quantity}x {item.name}
                            {index < sale.items.length - 1 && ', '}
                          </div>
                        ))}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          sale.paymentMethod === 'cash'
                            ? 'bg-green-100 text-green-800'
                            : sale.paymentMethod === 'card'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}>
                          {sale.paymentMethod.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                        ₹{sale.total.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => viewReceipt(sale)}
                          className="text-green-600 hover:text-green-900"
                        >
                          View Receipt
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showReceipt && selectedReceipt && (
        <ReceiptModal
          receipt={selectedReceipt}
          onClose={() => {
            setShowReceipt(false);
            setSelectedReceipt(null);
          }}
          onPrint={() => {}} // Print function is now handled internally
        />
      )}
    </DashboardLayout>
  );
};

export default OrdersPage;