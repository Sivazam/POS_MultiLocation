import React, { createContext, useContext, useState, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { CartItem, Product } from '../types';
import { useProducts } from './ProductContext';
import { useLocations } from './LocationContext';

interface CartContextType {
  items: CartItem[];
  addItem: (product: Product) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  subtotal: number;
  cgst: number;
  sgst: number;
  total: number;
}

const CartContext = createContext<CartContextType | null>(null);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const { products, updateProduct } = useProducts();
  const { currentLocation } = useLocations();
  const GST_RATE = 0.05; // 5% GST (2.5% CGST + 2.5% SGST)

  const addItem = async (product: Product) => {
    // Get the latest product data to ensure accurate quantity
    const currentProduct = products.find(p => p.id === product.id);
    if (!currentProduct || currentProduct.quantity <= 0) {
      return;
    }

    // Verify product belongs to current location
    if (currentLocation && currentProduct.locationId && currentProduct.locationId !== currentLocation.id) {
      console.error('Product does not belong to current location');
      return;
    }

    try {
      // Update product quantity first
      await updateProduct(currentProduct.id, {
        ...currentProduct,
        quantity: currentProduct.quantity - 1
      });

      // Then update cart
      setItems(currentItems => {
        const existingItem = currentItems.find(item => item.productId === product.id);
        
        if (existingItem) {
          return currentItems.map(item =>
            item.productId === product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          );
        }
        
        return [...currentItems, {
          id: uuidv4(),
          productId: product.id,
          name: product.name,
          price: product.price,
          quantity: 1
        }];
      });
    } catch (error) {
      console.error('Failed to update product quantity:', error);
    }
  };

  const removeItem = async (id: string) => {
    const item = items.find(i => i.id === id);
    if (!item) return;

    const product = products.find(p => p.id === item.productId);
    if (!product) return;

    try {
      // Update product quantity first
      await updateProduct(product.id, {
        ...product,
        quantity: product.quantity + item.quantity
      });

      // Then update cart
      setItems(currentItems => currentItems.filter(item => item.id !== id));
    } catch (error) {
      console.error('Failed to restore product quantity:', error);
    }
  };

  const updateQuantity = async (id: string, newQuantity: number) => {
    if (newQuantity < 1) return;

    const item = items.find(i => i.id === id);
    if (!item) return;

    const product = products.find(p => p.id === item.productId);
    if (!product) return;

    const quantityDiff = newQuantity - item.quantity;
    
    // Check if we have enough stock for the increase
    if (quantityDiff > 0 && product.quantity < quantityDiff) {
      return;
    }

    try {
      // Update product quantity first
      await updateProduct(product.id, {
        ...product,
        quantity: product.quantity - quantityDiff
      });

      // Then update cart
      setItems(currentItems =>
        currentItems.map(item =>
          item.id === id ? { ...item, quantity: newQuantity } : item
        )
      );
    } catch (error) {
      console.error('Failed to update product quantity:', error);
    }
  };

  const clearCart = () => {
    // Simply clear the cart without restoring quantities
    // since they were already deducted during the sale
    setItems([]);
  };

  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cgst = subtotal * (GST_RATE / 2); // 2.5% CGST
  const sgst = subtotal * (GST_RATE / 2); // 2.5% SGST
  const total = subtotal + cgst + sgst;

  const value: CartContextType = {
    items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    subtotal,
    cgst,
    sgst,
    total
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};