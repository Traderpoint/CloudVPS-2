import { useState, useEffect } from 'react';
import { PRODUCTS, ADDONS, PRODUCT_DEFINITIONS, ADDON_DEFINITIONS, getProductById, getAvailableAddonsForProduct } from '../lib/hostbill-config.js';

export default function ProductSelector({ onOrderCreate, affiliateId = null }) {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedAddons, setSelectedAddons] = useState([]);
  const [configOptions, setConfigOptions] = useState({});
  const [cycle, setCycle] = useState('m'); // monthly by default
  const [loading, setLoading] = useState(false);
  const [orderResult, setOrderResult] = useState(null);

  // Handle product selection onClick
  const handleProductSelect = (productId) => {
    console.log('🛍️ Product selected:', productId);
    const product = getProductById(productId);
    setSelectedProduct(product);
    setSelectedAddons([]); // Reset addons when product changes
    setConfigOptions({}); // Reset config when product changes
    setOrderResult(null); // Reset previous order result
  };

  // Handle addon selection onClick
  const handleAddonToggle = (addonId) => {
    console.log('🔧 Addon toggled:', addonId);
    setSelectedAddons(prev => {
      const exists = prev.find(addon => addon.id === addonId);
      if (exists) {
        // Remove addon
        return prev.filter(addon => addon.id !== addonId);
      } else {
        // Add addon
        return [...prev, { id: addonId, quantity: 1 }];
      }
    });
  };

  // Handle configuration option change
  const handleConfigChange = (optionType, value) => {
    console.log('⚙️ Config changed:', optionType, value);
    setConfigOptions(prev => ({
      ...prev,
      [optionType]: value
    }));
  };

  // ...další logika a renderování komponenty...
  return (
    <div>
      {/* Zde bude UI pro výběr produktu, addonů a konfigurace */}
      <p>ProductSelector komponenta – UI je třeba doplnit podle potřeb projektu.</p>
    </div>
  );
}
