import React, { createContext, useContext, useReducer, useEffect, useState } from 'react';
import { extractAffiliateParams, storeAffiliateData, getStoredAffiliateData } from '../utils/affiliate';

// Cart actions
const CART_ACTIONS = {
  ADD_ITEM: 'ADD_ITEM',
  REMOVE_ITEM: 'REMOVE_ITEM',
  UPDATE_QUANTITY: 'UPDATE_QUANTITY',
  CLEAR_CART: 'CLEAR_CART',
  SET_AFFILIATE: 'SET_AFFILIATE',
  LOAD_CART: 'LOAD_CART'
};

// Initial state
const initialState = {
  items: [],
  total: 0,
  totalWithVAT: 0,
  vatAmount: 0,
  vatRate: 0.21,
  itemCount: 0,
  affiliateId: null,
  affiliateCode: null
};

// Cart reducer
function cartReducer(state, action) {
  switch (action.type) {
    case CART_ACTIONS.ADD_ITEM: {
      const existingItem = state.items.find(item => item.id === action.payload.id);
      
      if (existingItem) {
        // Update quantity if item already exists
        const updatedItems = state.items.map(item =>
          item.id === action.payload.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
        return {
          ...state,
          items: updatedItems,
          ...calculateTotals(updatedItems)
        };
      } else {
        // Add new item
        const newItems = [...state.items, { ...action.payload, quantity: 1 }];
        return {
          ...state,
          items: newItems,
          ...calculateTotals(newItems)
        };
      }
    }

    case CART_ACTIONS.REMOVE_ITEM: {
      const newItems = state.items.filter(item => item.id !== action.payload);
      return {
        ...state,
        items: newItems,
        ...calculateTotals(newItems)
      };
    }

    case CART_ACTIONS.UPDATE_QUANTITY: {
      const { id, quantity } = action.payload;
      if (quantity <= 0) {
        // Remove item if quantity is 0 or less
        const newItems = state.items.filter(item => item.id !== id);
        return {
          ...state,
          items: newItems,
          ...calculateTotals(newItems)
        };
      }

      const updatedItems = state.items.map(item =>
        item.id === id ? { ...item, quantity } : item
      );
      return {
        ...state,
        items: updatedItems,
        ...calculateTotals(updatedItems)
      };
    }

    case CART_ACTIONS.CLEAR_CART:
      console.log('🗑️ CartReducer: CLEAR_CART action executed - clearing', state.items?.length || 0, 'items');
      return {
        ...initialState,
        affiliateId: state.affiliateId,
        affiliateCode: state.affiliateCode
      };

    case CART_ACTIONS.SET_AFFILIATE:
      return {
        ...state,
        affiliateId: action.payload.id,
        affiliateCode: action.payload.code
      };

    case CART_ACTIONS.LOAD_CART:
      return {
        ...action.payload,
        ...calculateTotals(action.payload.items || [])
      };

    default:
      return state;
  }
}

// Helper function to calculate totals
function calculateTotals(items) {
  const VAT_RATE = 0.21; // 21% DPH

  const itemCount = items.reduce((total, item) => total + item.quantity, 0);

  // Calculate total without VAT
  const totalWithoutVAT = items.reduce((total, item) => {
    const price = parseFloat(item.price.replace(/[^\d]/g, ''));
    return total + (price * item.quantity);
  }, 0);

  // Calculate VAT amount
  const vatAmount = Math.round(totalWithoutVAT * VAT_RATE);

  // Calculate total with VAT
  const totalWithVAT = totalWithoutVAT + vatAmount;

  return {
    itemCount,
    total: totalWithoutVAT,           // Keep original total for backward compatibility
    totalWithVAT: totalWithVAT,       // New total with VAT
    vatAmount: vatAmount,             // VAT amount
    vatRate: VAT_RATE                 // VAT rate for display
  };
}

// Create context
const CartContext = createContext();

// Cart provider component
export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(cartReducer, initialState);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    // Ochrana proti vícenásobné inicializaci
    if (isInitialized) {
      console.log('🛒 CartContext: Already initialized, skipping cart load');
      return;
    }

    console.log('🛒 CartContext: useEffect triggered - loading cart from localStorage');

    const savedCart = localStorage.getItem('cart');
    console.log('🛒 CartContext: Raw localStorage cart data:', savedCart);

    // Debug: Check current URL and OAuth source
    const currentUrl = window.location.href;
    const oauthSource = sessionStorage.getItem('oauth-source');
    console.log('🛒 CartContext: Context info:', {
      currentUrl,
      oauthSource,
      hasLocalStorageCart: !!savedCart,
      localStorageLength: savedCart?.length || 0
    });

    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        console.log('🛒 CartContext: Successfully parsed cart data:', {
          itemCount: parsedCart.items?.length || 0,
          items: parsedCart.items?.map(item => ({ id: item.id, name: item.name, quantity: item.quantity })) || [],
          total: parsedCart.total,
          affiliateId: parsedCart.affiliateId,
          fullParsedCart: parsedCart
        });

        // Ověř, že parsedCart má validní strukturu
        if (parsedCart && typeof parsedCart === 'object') {
          dispatch({ type: CART_ACTIONS.LOAD_CART, payload: parsedCart });
          console.log('✅ CartContext: Cart loaded successfully');
        } else {
          console.error('❌ CartContext: Invalid cart structure:', parsedCart);
        }
      } catch (error) {
        console.error('❌ Error parsing cart from localStorage:', error);
        console.error('❌ Raw cart data that failed to parse:', savedCart);
      }
    } else {
      console.log('🛒 CartContext: No saved cart found in localStorage');
    }

    // Check for affiliate parameters in URL
    const affiliateParams = extractAffiliateParams(window.location.href);

    if (affiliateParams.id || affiliateParams.code) {
      // Store affiliate data for future use
      storeAffiliateData(affiliateParams);

      dispatch({
        type: CART_ACTIONS.SET_AFFILIATE,
        payload: affiliateParams
      });
    } else {
      // Check for stored affiliate data
      const storedAffiliate = getStoredAffiliateData();
      if (storedAffiliate) {
        dispatch({
          type: CART_ACTIONS.SET_AFFILIATE,
          payload: storedAffiliate
        });
      }
    }

    // Označ jako inicializované
    setIsInitialized(true);
    console.log('🛒 CartContext: Initialization completed');
  }, [isInitialized]);

  // Save cart to localStorage whenever state changes
  useEffect(() => {
    // Neukládej během inicializace
    if (!isInitialized) {
      console.log('🛒 CartContext: Skipping save during initialization');
      return;
    }

    console.log('🛒 CartContext: Saving cart to localStorage:', {
      itemCount: state.items?.length || 0,
      items: state.items?.map(item => ({ id: item.id, name: item.name, quantity: item.quantity })) || [],
      total: state.total,
      affiliateId: state.affiliateId,
      fullState: state
    });

    try {
      const cartData = JSON.stringify(state);
      localStorage.setItem('cart', cartData);
      console.log('✅ CartContext: Cart saved successfully to localStorage');

      // Ověř, že se data skutečně uložila
      const verification = localStorage.getItem('cart');
      if (verification !== cartData) {
        console.error('❌ CartContext: Cart save verification failed!');
      }
    } catch (error) {
      console.error('❌ CartContext: Error saving cart to localStorage:', error);
    }
  }, [state, isInitialized]);

  // Cart actions
  const addItem = (item) => {
    dispatch({ type: CART_ACTIONS.ADD_ITEM, payload: item });
  };

  const removeItem = (itemId) => {
    dispatch({ type: CART_ACTIONS.REMOVE_ITEM, payload: itemId });
  };

  const updateQuantity = (itemId, quantity) => {
    dispatch({ type: CART_ACTIONS.UPDATE_QUANTITY, payload: { id: itemId, quantity } });
  };

  const clearCart = (reason = 'manual') => {
    console.log('🗑️ CartContext: Clearing cart - reason:', reason);
    console.log('🗑️ CartContext: Called from:', new Error().stack?.split('\n')[2]?.trim());
    console.log('🗑️ CartContext: Current cart state before clear:', {
      itemCount: state.items?.length || 0,
      items: state.items?.map(item => ({ id: item.id, name: item.name })) || []
    });

    // Pouze smaž košík pokud je důvod validní
    if (reason === 'order_success' || reason === 'manual' || reason === 'payment_success') {
      dispatch({ type: CART_ACTIONS.CLEAR_CART });
    } else {
      console.log('⚠️ CartContext: Cart clear blocked - invalid reason:', reason);
    }
  };

  const setAffiliate = (affiliateId, affiliateCode) => {
    dispatch({
      type: CART_ACTIONS.SET_AFFILIATE,
      payload: { id: affiliateId, code: affiliateCode }
    });
  };

  const getTotalPrice = () => {
    return state.total;
  };

  const getTotalPriceWithVAT = () => {
    return state.totalWithVAT;
  };

  const getVATAmount = () => {
    return state.vatAmount;
  };

  const getVATRate = () => {
    return state.vatRate;
  };

  const updateItemPeriod = (itemId, period) => {
    // For now, just update the item with the new period
    // In a real implementation, this might recalculate pricing
    const updatedItems = state.items.map(item =>
      item.id === itemId ? { ...item, period } : item
    );
    dispatch({ type: CART_ACTIONS.LOAD_CART, payload: { ...state, items: updatedItems } });
  };

  const value = {
    ...state,
    addItem,
    removeItem,
    updateQuantity,
    updateItemPeriod,
    clearCart,
    setAffiliate,
    getTotalPrice,
    getTotalPriceWithVAT,
    getVATAmount,
    getVATRate
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

// Custom hook to use cart context
export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

export default CartContext;
