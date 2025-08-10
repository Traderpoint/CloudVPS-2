import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useCart } from '../contexts/CartContext';

export default function VPS3CartSidebar() {
  const { items, itemCount, removeItem, updateQuantity, clearCart, affiliateId, affiliateCode } = useCart();
  const [isVisible, setIsVisible] = useState(false);
  const [justAdded, setJustAdded] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('12');
  const [selectedOS, setSelectedOS] = useState('linux');

  // Animace při změně košíku
  useEffect(() => {
    if (items.length > 0) {
      setIsVisible(true);
      // Najdi nově přidanou položku
      const newItem = items[items.length - 1];
      setJustAdded(newItem.id);

      // Zruš animaci po 2 sekundách
      const timer = setTimeout(() => {
        setJustAdded(null);
      }, 2000);

      return () => clearTimeout(timer);
    } else {
      // Košík je prázdný
      setIsVisible(false);
      setJustAdded(null);
    }
  }, [items]);

  // Načti nastavení z sessionStorage
  useEffect(() => {
    const savedSettings = sessionStorage.getItem('cartSettings');
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings);
        if (settings.selectedPeriod) setSelectedPeriod(settings.selectedPeriod);
        if (settings.selectedOS) setSelectedOS(settings.selectedOS);
      } catch (error) {
        console.warn('Failed to parse cart settings:', error);
      }
    }
  }, []);

  // Uložit nastavení do sessionStorage při změně
  useEffect(() => {
    const settings = {
      selectedPeriod,
      selectedOS,
      selectedApps: []
    };
    sessionStorage.setItem('cartSettings', JSON.stringify(settings));
  }, [selectedPeriod, selectedOS]);

  const periods = [
    { value: '1', label: '1 měsíc', discount: 0 },
    { value: '3', label: '3 měsíce', discount: 0 },
    { value: '6', label: '6 měsíců', discount: 5 },
    { value: '12', label: '1 rok', discount: 10 },
    { value: '24', label: '2 roky', discount: 15 },
    { value: '36', label: '3 roky', discount: 20 }
  ];

  const calculateMonthlyPrice = (item) => {
    const basePrice = parseFloat(item.price.replace(/[^\d]/g, ''));
    return basePrice;
  };

  const calculateItemMonthlyTotal = (item) => {
    return calculateMonthlyPrice(item) * item.quantity;
  };

  const calculateItemPeriodTotal = (item) => {
    const monthlyTotal = calculateItemMonthlyTotal(item);
    const months = parseInt(selectedPeriod);
    const periodTotal = monthlyTotal * months;

    // Apply discount
    const period = periods.find(p => p.value === selectedPeriod);
    const discount = period ? period.discount : 0;
    const discountAmount = (periodTotal * discount) / 100;

    return periodTotal - discountAmount;
  };

  const getCartMonthlyTotal = () => {
    return items.reduce((total, item) => total + calculateItemMonthlyTotal(item), 0);
  };

  const getCartPeriodTotal = () => {
    return items.reduce((total, item) => total + calculateItemPeriodTotal(item), 0);
  };

  return (
    <div className="sticky top-4">
      <div className="bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 rounded-3xl border border-purple-500/30 overflow-hidden shadow-2xl shadow-purple-500/20 backdrop-blur-sm">
        {/* Futuristic Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <svg width="100%" height="100%" viewBox="0 0 400 400">
            <defs>
              <pattern id="vps3Pattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                <circle cx="20" cy="20" r="2" fill="#A855F7"/>
                <circle cx="0" cy="0" r="1" fill="#06B6D4"/>
                <circle cx="40" cy="40" r="1" fill="#06B6D4"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#vps3Pattern)"/>
          </svg>
        </div>

        {/* Header - Futuristic Style */}
        <div className="relative bg-gradient-to-r from-purple-600/50 to-indigo-600/50 backdrop-blur-sm border-b border-purple-500/30 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500/30 to-cyan-500/30 rounded-2xl flex items-center justify-center border border-purple-400/50">
                  <svg className="w-6 h-6 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m0 0L17 18M9.5 18h7m0 0a2 2 0 11-4 0 2 2 0 014 0zm-7 0a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                {itemCount > 0 && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-cyan-400 to-purple-400 rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold text-white">{itemCount}</span>
                  </div>
                )}
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">VPS3 Košík</h3>
                <div className="flex items-center space-x-2 mt-1">
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                  <span className="text-xs text-purple-300 font-medium">
                    {itemCount > 0 ? `${itemCount} ${itemCount === 1 ? 'server' : 'servery'}` : 'Prázdný'}
                  </span>
                </div>
              </div>
            </div>
            {items.length > 0 && (
              <button
                onClick={clearCart}
                className="group relative overflow-hidden bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300 px-4 py-2 rounded-xl transition-all border border-red-500/30 hover:border-red-400/50"
                title="Vymazat košík"
              >
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  <span className="text-xs font-medium">Reset</span>
                </div>
              </button>
            )}
          </div>
        </div>

        {/* Cart Content */}
        <div className="relative p-6">
          {items.length === 0 ? (
            <div className="text-center py-16">
              <div className="relative mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-500/20 to-cyan-500/20 rounded-3xl flex items-center justify-center mx-auto border border-purple-500/30 backdrop-blur-sm">
                  <svg className="w-10 h-10 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m0 0h8m-8 0a2 2 0 100 4 2 2 0 000-4zm8 0a2 2 0 100 4 2 2 0 000-4z" />
                  </svg>
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-purple-400/20 to-cyan-400/20 rounded-3xl blur-xl"></div>
              </div>
              <h4 className="font-bold text-white mb-3">Košík je prázdný</h4>
              <p className="text-purple-300 text-sm font-light">Vyberte VPS3 plán a začněte budovat svou infrastrukturu</p>
              <div className="mt-4 flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                <span className="text-xs text-gray-400">Čekám na výběr...</span>
              </div>
            </div>
          ) : (
            <>
              {/* Cart Items - Futuristic Style */}
              <div className="space-y-4 mb-6">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className={`relative group transition-all duration-500 ${
                      justAdded === item.id 
                        ? 'ring-2 ring-purple-400/50 scale-105' 
                        : ''
                    }`}
                  >
                    {/* Holographic Card Effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-cyan-500/10 to-purple-500/10 rounded-2xl blur-sm"></div>
                    
                    <div className="relative bg-gray-800/60 backdrop-blur-sm rounded-2xl p-5 border border-purple-500/30 hover:border-purple-400/50 transition-all">
                      {/* Remove button - Futuristic */}
                      <button
                        onClick={() => removeItem(item.id)}
                        className="absolute top-3 right-3 w-8 h-8 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all border border-red-500/30 hover:border-red-400/50"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>

                      <div className="pr-10">
                        <div className="flex items-center space-x-3 mb-4">
                          <div className="w-8 h-8 bg-gradient-to-br from-purple-500/30 to-cyan-500/30 rounded-xl flex items-center justify-center border border-purple-400/50">
                            <svg className="w-4 h-4 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                            </svg>
                          </div>
                          <h4 className="font-bold text-white text-sm">{item.name}</h4>
                        </div>

                        {/* Holographic Specs Display */}
                        <div className="grid grid-cols-3 gap-3 mb-4">
                          <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-lg blur-sm"></div>
                            <div className="relative text-center p-3 bg-gray-800/50 rounded-lg border border-cyan-500/30">
                              <div className="flex items-center justify-center mb-1">
                                <svg className="w-3 h-3 text-cyan-400 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                                </svg>
                                <div className="text-xs text-cyan-400 font-medium">CPU</div>
                              </div>
                              <div className="text-xs text-white font-bold">{item.cpu}</div>
                            </div>
                          </div>
                          <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-lg blur-sm"></div>
                            <div className="relative text-center p-3 bg-gray-800/50 rounded-lg border border-green-500/30">
                              <div className="flex items-center justify-center mb-1">
                                <svg className="w-3 h-3 text-green-400 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <rect x="5" y="7" width="14" height="10" rx="1" strokeWidth={1.5}/>
                                  <rect x="7" y="9" width="2" height="6" fill="currentColor" opacity="0.8"/>
                                  <rect x="10" y="9" width="2" height="6" fill="currentColor" opacity="0.6"/>
                                  <rect x="13" y="9" width="2" height="6" fill="currentColor" opacity="0.9"/>
                                  <rect x="16" y="9" width="2" height="6" fill="currentColor" opacity="0.7"/>
                                  <line x1="6" y1="5" x2="7" y2="5" strokeWidth={2} strokeLinecap="round"/>
                                  <line x1="9" y1="5" x2="10" y2="5" strokeWidth={2} strokeLinecap="round"/>
                                  <line x1="12" y1="5" x2="13" y2="5" strokeWidth={2} strokeLinecap="round"/>
                                  <line x1="15" y1="5" x2="16" y2="5" strokeWidth={2} strokeLinecap="round"/>
                                  <line x1="18" y1="5" x2="19" y2="5" strokeWidth={2} strokeLinecap="round"/>
                                </svg>
                                <div className="text-xs text-green-400 font-medium">RAM</div>
                              </div>
                              <div className="text-xs text-white font-bold">{item.ram}</div>
                            </div>
                          </div>
                          <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-violet-500/20 rounded-lg blur-sm"></div>
                            <div className="relative text-center p-3 bg-gray-800/50 rounded-lg border border-purple-500/30">
                              <div className="flex items-center justify-center mb-1">
                                <svg className="w-3 h-3 text-purple-400 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                                </svg>
                                <div className="text-xs text-purple-400 font-medium">DISK</div>
                              </div>
                              <div className="text-xs text-white font-bold">{item.storage}</div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          {/* Quantum Quantity Controls */}
                          <div className="flex items-center space-x-3">
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="w-8 h-8 rounded-xl bg-gradient-to-r from-purple-600/50 to-indigo-600/50 border border-purple-500/50 flex items-center justify-center hover:from-purple-500/50 hover:to-indigo-500/50 transition-all disabled:opacity-30 disabled:cursor-not-allowed backdrop-blur-sm"
                              disabled={item.quantity <= 1}
                            >
                              <svg className="w-3 h-3 text-purple-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                              </svg>
                            </button>
                            <div className="w-10 h-8 bg-gray-800/50 rounded-xl border border-purple-500/30 flex items-center justify-center backdrop-blur-sm">
                              <span className="text-white font-bold text-sm">{item.quantity}</span>
                            </div>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="w-8 h-8 rounded-xl bg-gradient-to-r from-purple-600/50 to-indigo-600/50 border border-purple-500/50 flex items-center justify-center hover:from-purple-500/50 hover:to-indigo-500/50 transition-all backdrop-blur-sm"
                            >
                              <svg className="w-3 h-3 text-purple-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                              </svg>
                            </button>
                          </div>

                          {/* Holographic Price Display */}
                          <div className="text-right">
                            <div className="relative">
                              <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/20 to-purple-400/20 rounded-lg blur-sm"></div>
                              <div className="relative bg-gray-800/50 px-3 py-2 rounded-lg border border-cyan-500/30">
                                <div className="font-bold text-cyan-400 text-sm">
                                  {Math.round(calculateItemPeriodTotal(item))} Kč
                                </div>
                                <div className="text-xs text-purple-300 font-light">
                                  {Math.round(calculateItemMonthlyTotal(item))} Kč/měs
                                </div>
                              </div>
                            </div>
                            {item.quantity > 1 && (
                              <div className="text-xs text-gray-400 font-light mt-1">
                                {Math.round(calculateMonthlyPrice(item))} Kč/měs × {item.quantity}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Affiliate Quantum Info */}
              {(affiliateId || affiliateCode) && (
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-cyan-500/20 rounded-2xl blur-sm"></div>
                  <div className="relative bg-gray-800/60 backdrop-blur-sm border border-green-500/30 rounded-2xl p-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-green-500/30 to-cyan-500/30 rounded-xl flex items-center justify-center border border-green-400/50">
                        <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-sm font-bold text-green-400">Partnerské sledování aktivní</div>
                        {affiliateCode && (
                          <div className="text-xs text-green-500 font-mono">Kód: {affiliateCode}</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Quantum Total Display */}
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-cyan-500/20 to-purple-500/20 rounded-2xl blur-sm"></div>
                <div className="relative bg-gray-800/60 backdrop-blur-sm rounded-2xl p-5 border border-purple-500/30">
                  <div className="text-center mb-4">
                    <div className="flex items-center justify-center space-x-2 mb-2">
                      <div className="w-3 h-3 bg-purple-400 rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium text-purple-300">Celková částka</span>
                      <div className="w-3 h-3 bg-cyan-400 rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>
                    </div>
                    <div className="text-3xl font-bold text-transparent bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text mb-1">
                      {Math.round(getCartPeriodTotal())} Kč
                    </div>
                    <div className="text-sm text-gray-400 font-light">
                      za {periods.find(p => p.value === selectedPeriod)?.label}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div className="text-center p-2 bg-cyan-500/10 rounded-lg border border-cyan-500/20">
                      <div className="text-cyan-400 font-medium">Měsíčně</div>
                      <div className="text-white font-bold">{Math.round(getCartMonthlyTotal())} Kč</div>
                    </div>
                    <div className="text-center p-2 bg-purple-500/10 rounded-lg border border-purple-500/20">
                      <div className="text-purple-400 font-medium">Servery</div>
                      <div className="text-white font-bold">{itemCount}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quantum Action Buttons */}
              <div className="space-y-4">
                <Link
                  href="/cart"
                  className="relative group block w-full overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-cyan-600 to-purple-600 rounded-2xl blur-sm group-hover:blur-md transition-all"></div>
                  <div className="relative bg-gradient-to-r from-purple-600/90 to-cyan-600/90 backdrop-blur-sm text-white py-4 px-6 rounded-2xl font-bold text-center hover:from-purple-500/90 hover:to-cyan-500/90 transition-all border border-purple-400/50 hover:border-purple-300/50">
                    <div className="flex items-center justify-center space-x-3">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                      <span>Pokračovat k objednávce</span>
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    </div>
                  </div>
                </Link>

                <button
                  onClick={() => {
                    console.log('🗑️ VPS3CartSidebar: Clear cart button clicked');
                    clearCart('manual');
                  }}
                  className="w-full bg-gray-700/50 backdrop-blur-sm text-gray-300 py-3 px-6 rounded-2xl hover:bg-gray-600/50 transition-all font-medium text-sm border border-gray-600/50 hover:border-gray-500/50"
                >
                  <div className="flex items-center justify-center space-x-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span>Vyprázdnit košík</span>
                  </div>
                </button>
              </div>

              {/* Quantum Features */}
              <div className="relative mt-6">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl blur-sm"></div>
                <div className="relative bg-gray-800/60 backdrop-blur-sm rounded-2xl p-4 border border-blue-500/30">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500/30 to-purple-500/30 rounded-xl flex items-center justify-center border border-blue-400/50">
                      <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <span className="font-bold text-blue-400 text-sm">Quantum výhody</span>
                  </div>
                  <ul className="space-y-2 text-xs">
                    {[
                      { text: 'Kvantová aktivace do 24h', color: 'cyan' },
                      { text: 'Neural podpora 24/7', color: 'green' },
                      { text: 'Holografická záruka 30 dní', color: 'purple' },
                      { text: 'Teleportace dat zdarma', color: 'orange' }
                    ].map((feature, index) => (
                      <li key={index} className="flex items-center space-x-3">
                        <div className={`w-2 h-2 bg-${feature.color}-400 rounded-full animate-pulse`} style={{animationDelay: `${index * 0.2}s`}}></div>
                        <span className="text-gray-300 font-light">{feature.text}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
