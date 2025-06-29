import React, { useState, useMemo } from 'react';
import { Search, ToggleLeft, ToggleRight } from 'lucide-react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { useProducts } from '../../contexts/ProductContext';
import { useCategories } from '../../contexts/CategoryContext';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { useSales } from '../../contexts/SalesContext';
import ProductGrid from '../../components/pos/ProductGrid';
import Cart from '../../components/pos/Cart';
import Input from '../../components/ui/Input';
import ErrorAlert from '../../components/ui/ErrorAlert';
import CheckoutModal from '../../components/pos/CheckoutModal';
import ReceiptModal from '../../components/pos/ReceiptModal';
import { Sale, Receipt } from '../../types';

const POSPage: React.FC = () => {
  const { products, loading, error } = useProducts();
  const { categories } = useCategories();
  const { items, subtotal, cgst, sgst, total, clearCart } = useCart();
  const { currentUser } = useAuth();
  const { addSale } = useSales();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [showOutOfStock, setShowOutOfStock] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [currentReceipt, setCurrentReceipt] = useState<Receipt | null>(null);
  
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = !selectedCategory || product.categoryId === selectedCategory;
      const matchesStock = showOutOfStock || product.quantity > 0;
      return matchesSearch && matchesCategory && matchesStock;
    });
  }, [products, searchTerm, selectedCategory, showOutOfStock]);

  const handleCheckout = () => {
    if (items.length > 0) {
      setShowCheckout(true);
    }
  };

  const handleConfirmCheckout = async (paymentMethod: Sale['paymentMethod']) => {
    if (!currentUser) return;

    try {
      const saleData: Omit<Sale, 'id' | 'createdAt' | 'invoiceNumber'> = {
        items: [...items],
        subtotal,
        cgst,
        sgst,
        total,
        paymentMethod,
        createdBy: currentUser.uid,
        locationId: currentUser.locationId
      };

      const newSale = await addSale(saleData);

      const receipt: Receipt = {
        sale: newSale,
        businessName: 'Millet Home Foods',
        businessAddress: '123 Food Street, Bangalore, Karnataka 560001',
        gstNumber: 'GSTIN29ABCDE1234F1Z5',
        contactNumber: '+91 80 1234 5678',
        email: 'contact@millethomefoods.com'
      };

      setCurrentReceipt(receipt);
      setShowCheckout(false);
      setShowReceipt(true);
      clearCart();
    } catch (error) {
      console.error('Failed to process sale:', error);
    }
  };

  // Check if cart has items to determine layout
  const hasCartItems = items.length > 0;

  return (
    <DashboardLayout title="Point of Sale">
      <div className={`flex flex-col gap-4 lg:gap-6 h-auto lg:h-[calc(100vh-8rem)] ${hasCartItems ? 'lg:flex-row' : ''}`}>
        {/* Products Section */}
        <div className={`flex flex-col min-h-0 ${hasCartItems ? 'flex-1' : 'w-full'}`}>
          {error && <ErrorAlert message={error} />}
          
          <div className="mb-4 lg:mb-6 space-y-4">
            <Input
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={<Search size={18} className="text-gray-500" />}
            />
            
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 sm:items-center">
              {/* Categories */}
              <div className="flex gap-2 overflow-x-auto pb-2 flex-1">
                <button
                  onClick={() => setSelectedCategory('')}
                  className={`
                    px-3 py-2 rounded-full text-sm font-medium whitespace-nowrap flex-shrink-0
                    transition-all duration-200
                    ${!selectedCategory
                      ? 'bg-green-100 text-green-800 transform scale-105'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }
                  `}
                >
                  All Categories
                </button>
                {categories.map(category => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`
                      px-3 py-2 rounded-full text-sm font-medium whitespace-nowrap flex-shrink-0
                      transition-all duration-200
                      ${selectedCategory === category.id
                        ? 'bg-green-100 text-green-800 transform scale-105'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }
                    `}
                  >
                    {category.name}
                  </button>
                ))}
              </div>

              {/* Out of Stock Toggle */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-sm text-gray-600 whitespace-nowrap">Show out of stock:</span>
                <button
                  onClick={() => setShowOutOfStock(!showOutOfStock)}
                  className="flex items-center transition-colors duration-200"
                >
                  {showOutOfStock ? (
                    <ToggleRight className="h-6 w-6 text-green-500" />
                  ) : (
                    <ToggleLeft className="h-6 w-6 text-gray-400" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <p className="text-lg mb-2">No products found</p>
                {!showOutOfStock && (
                  <p className="text-sm">Try enabling "Show out of stock" to see more products</p>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto">
              <ProductGrid
                products={filteredProducts}
                category={selectedCategory}
              />
            </div>
          )}
        </div>

        {/* Cart Section - Only show when there are items */}
        {hasCartItems && (
          <div className="w-full lg:w-96 bg-white rounded-lg shadow-lg p-4 lg:p-6 order-first lg:order-last">
            <h2 className="text-lg font-semibold mb-4">Current Sale</h2>
            <div className="h-auto lg:h-full">
              <Cart onCheckout={handleCheckout} />
            </div>
          </div>
        )}

        {/* Empty Cart Message - Show when no items and on mobile */}
        {!hasCartItems && (
          <div className="lg:hidden bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="text-gray-400 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <p className="text-gray-500">Add items to start a sale</p>
          </div>
        )}
      </div>

      {/* Checkout Modal */}
      {showCheckout && (
        <CheckoutModal
          subtotal={subtotal}
          cgst={cgst}
          sgst={sgst}
          total={total}
          onConfirm={handleConfirmCheckout}
          onCancel={() => setShowCheckout(false)}
        />
      )}

      {/* Receipt Modal */}
      {showReceipt && currentReceipt && (
        <ReceiptModal
          receipt={currentReceipt}
          onClose={() => setShowReceipt(false)}
          onPrint={() => {}} // Print function is now handled internally
        />
      )}
    </DashboardLayout>
  );
};

export default POSPage;