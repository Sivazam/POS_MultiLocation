import React from 'react';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import Button from '../ui/Button';

interface CartProps {
  onCheckout: () => void;
}

const Cart: React.FC<CartProps> = ({ onCheckout }) => {
  const { items, removeItem, updateQuantity, subtotal, cgst, sgst, total } = useCart();

  if (items.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-4 sm:p-8 text-center">
        <div className="text-gray-400 mb-4">
          <svg className="w-12 h-12 sm:w-16 sm:h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
        </div>
        <p className="text-gray-500 text-sm sm:text-base">Cart is empty</p>
        <p className="text-xs sm:text-sm text-gray-400 mt-2">Add items to begin a new sale</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto max-h-64 lg:max-h-none">
        {items.map(item => (
          <div key={item.id} className="flex items-center py-3 sm:py-4 border-b">
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-gray-900 text-sm sm:text-base truncate">{item.name}</h4>
              <p className="text-xs sm:text-sm text-gray-500">₹{item.price.toFixed(2)} each</p>
            </div>
            
            <div className="flex items-center space-x-1 sm:space-x-2 ml-2">
              <button
                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                className="p-1 rounded-full hover:bg-gray-100 transition-colors duration-200"
              >
                <Minus size={14} />
              </button>
              
              <span className="w-6 sm:w-8 text-center text-sm">{item.quantity}</span>
              
              <button
                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                className="p-1 rounded-full hover:bg-gray-100 transition-colors duration-200"
              >
                <Plus size={14} />
              </button>
              
              <button
                onClick={() => removeItem(item.id)}
                className="p-1 rounded-full hover:bg-gray-100 text-red-500 ml-1 transition-colors duration-200"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
      
      <div className="border-t pt-3 sm:pt-4 space-y-2">
        <div className="flex justify-between text-xs sm:text-sm">
          <span>Subtotal</span>
          <span>₹{subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-xs sm:text-sm">
          <span>CGST (2.5%)</span>
          <span>₹{cgst.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-xs sm:text-sm">
          <span>SGST (2.5%)</span>
          <span>₹{sgst.toFixed(2)}</span>
        </div>
        <div className="flex justify-between font-semibold text-base sm:text-lg pt-2 border-t">
          <span>Total</span>
          <span>₹{total.toFixed(2)}</span>
        </div>
        
        <Button
          variant="primary"
          fullWidth
          size="lg"
          onClick={onCheckout}
          className="mt-3 sm:mt-4 transform transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98]"
        >
          <span className="hidden sm:inline">Checkout (₹{total.toFixed(2)})</span>
          <span className="sm:hidden">₹{total.toFixed(2)}</span>
        </Button>
      </div>
    </div>
  );
};

export default Cart;