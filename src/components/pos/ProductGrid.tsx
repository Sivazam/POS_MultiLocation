import React from 'react';
import { Product } from '../../types';
import { useCart } from '../../contexts/CartContext';
import { Plus, AlertCircle } from 'lucide-react';

interface ProductGridProps {
  products: Product[];
  category?: string;
}

const ProductGrid: React.FC<ProductGridProps> = ({ products, category }) => {
  const { addItem } = useCart();
  
  const filteredProducts = category
    ? products.filter(product => product.categoryId === category)
    : products;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4">
      {filteredProducts.map(product => (
        <button
          key={product.id}
          onClick={() => addItem(product)}
          disabled={product.quantity === 0}
          className={`
            relative p-3 sm:p-4 rounded-lg text-left transition-all h-full min-h-[180px] sm:min-h-[200px]
            ${product.quantity > 0
              ? 'bg-white hover:bg-gray-50 shadow-sm hover:shadow-md transform hover:-translate-y-1 border border-gray-200 hover:border-green-300'
              : 'bg-gray-100 cursor-not-allowed border border-gray-200'
            }
          `}
        >
          <div className="flex flex-col h-full">
            {product.imageUrl ? (
              <div className="aspect-square w-full mb-3 rounded-md overflow-hidden bg-gray-100">
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                  onError={(e) => {
                    e.currentTarget.src = 'https://via.placeholder.com/150?text=No+Image';
                  }}
                />
              </div>
            ) : (
              <div className="aspect-square w-full mb-3 rounded-md bg-gray-200 flex items-center justify-center">
                <span className="text-gray-400 text-xs sm:text-sm">No Image</span>
              </div>
            )}

            <div className="flex-1 flex flex-col">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-medium text-gray-900 leading-tight text-sm sm:text-base line-clamp-2 flex-1 pr-1">
                  {product.name}
                </h3>
                {product.quantity <= 10 && product.quantity > 0 && (
                  <AlertCircle size={14} className="text-amber-500 flex-shrink-0 ml-1" />
                )}
              </div>

              <div className="mt-auto">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-sm sm:text-base font-semibold text-gray-900">
                    ₹{product.price.toFixed(2)}
                  </p>
                  
                  {product.quantity > 0 && (
                    <div className="bg-green-100 rounded-full p-1.5 flex-shrink-0 transform transition-transform duration-200 hover:scale-110">
                      <Plus size={14} className="text-green-600" />
                    </div>
                  )}
                </div>
                
                <p className={`text-xs sm:text-sm font-medium ${
                  product.quantity > 10
                    ? 'text-green-600'
                    : product.quantity > 0
                    ? 'text-amber-600'
                    : 'text-red-600'
                }`}> 
                  {product.quantity === 0 ? (
                    'Out of stock'
                  ) : (
                    `${product.quantity} left`
                  )}
                </p>
              </div>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
};

export default ProductGrid;