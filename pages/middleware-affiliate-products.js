import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

// HostBill API settings according to documentation
const SETTINGS_LABELS = [
  { id: 1, label: "Connect with app" },
  { id: 2, label: "Automation" },
  { id: 3, label: "Emails" },
  { id: 4, label: "Components" },
  { id: 5, label: "Other settings" },
  { id: 6, label: "Client functions" },
  { id: 7, label: "Price" }
];

export default function MiddlewareAffiliateProducts() {
  const router = useRouter();
  const [affiliateId, setAffiliateId] = useState('1');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [affiliates, setAffiliates] = useState([]);
  const [affiliatesLoading, setAffiliatesLoading] = useState(true);
  const [viewMode, setViewMode] = useState('affiliate'); // 'affiliate' or 'all'
  const [pricingData, setPricingData] = useState(null);
  const [pricingLoading, setPricingLoading] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState('5'); // VPS Start default
  const [editPricingData, setEditPricingData] = useState({
    m: { recurring: '', setup: '', discount: '0' },
    q: { recurring: '', setup: '', discount: '0' },
    s: { recurring: '', setup: '', discount: '5' },
    a: { recurring: '', setup: '', discount: '10' },
    b: { recurring: '', setup: '', discount: '15' },
    t: { recurring: '', setup: '', discount: '20' }
  });
  const [editPricingLoading, setEditPricingLoading] = useState(false);
  const [editPricingResult, setEditPricingResult] = useState(null);

  // Product Detail - View and Clone states
  const [allProducts, setAllProducts] = useState([]);
  const [fromProduct, setFromProduct] = useState('');
  const [toProduct, setToProduct] = useState('');
  const [cloneSettings, setCloneSettings] = useState([1, 2, 3, 4, 5, 6, 7]); // Default: All 7 settings selected (corrected according to HostBill API)
  const [cloneLoading, setCloneLoading] = useState(false);
  const [cloneResult, setCloneResult] = useState(null);
  const [fromDetail, setFromDetail] = useState(null);
  const [toDetail, setToDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Dual listbox states
  const [leftProducts, setLeftProducts] = useState([]);
  const [rightProducts, setRightProducts] = useState([]);
  const [selectedLeftProducts, setSelectedLeftProducts] = useState([]);
  const [selectedRightProducts, setSelectedRightProducts] = useState([]);

  // Create New Product states
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newProductName, setNewProductName] = useState('');

  // Delete Product states
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteResult, setDeleteResult] = useState(null);

  // Bulk operations states
  const [bulkViewDetails, setBulkViewDetails] = useState(null);
  const [bulkDeleteResult, setBulkDeleteResult] = useState(null);
  const [bulkCloneResult, setBulkCloneResult] = useState(null);

  // Detailed view state for View Detail 1st
  const [detailedViewProduct, setDetailedViewProduct] = useState(null);

  // Load all affiliates on component mount
  useEffect(() => {
    loadAllAffiliates();
  }, []);

  // Auto-load on page load if affiliate_id in URL
  useEffect(() => {
    const { affiliate_id } = router.query;
    if (affiliate_id) {
      setAffiliateId(affiliate_id);
      loadAffiliateProducts(affiliate_id);
    }
  }, [router.query]);

  // Reload products when view mode changes
  useEffect(() => {
    if (viewMode === 'all' || affiliateId) {
      loadAffiliateProducts();
    }
  }, [viewMode]);

  // Update allProducts when data changes
  useEffect(() => {
    loadAllProducts();
  }, [data]);

  const loadAllAffiliates = async () => {
    setAffiliatesLoading(true);
    try {
      console.log('🔍 Loading all affiliates via middleware...');
      const middlewareUrl = process.env.NEXT_PUBLIC_MIDDLEWARE_URL || 'http://localhost:3005';
      const response = await fetch(`${middlewareUrl}/api/affiliates`);
      const result = await response.json();

      if (result.success && result.affiliates) {
        setAffiliates(result.affiliates);
        console.log(`✅ Loaded ${result.affiliates.length} affiliates via middleware`);
      } else {
        console.error('❌ Failed to load affiliates via middleware:', result.error);
      }
    } catch (err) {
      console.error('❌ Error loading affiliates via middleware:', err);
    } finally {
      setAffiliatesLoading(false);
    }
  };

  const loadAffiliateProducts = async (affId = affiliateId) => {
    setLoading(true);
    setError(null);
    setData(null);

    try {
      const middlewareUrl = process.env.NEXT_PUBLIC_MIDDLEWARE_URL || 'http://localhost:3005';
      let url, logMessage;
      if (viewMode === 'all') {
        url = `${middlewareUrl}/api/affiliate/${affId}/products?mode=all`;
        logMessage = `🔍 Loading ALL products for affiliate ID: ${affId} via middleware`;
      } else {
        url = `${middlewareUrl}/api/affiliate/${affId}/products?mode=affiliate`;
        logMessage = `🔍 Loading APPLIED products for affiliate ID: ${affId} via middleware`;
      }

      console.log(logMessage);
      const response = await fetch(url);
      const result = await response.json();

      if (result.success) {
        setData(result);
        console.log('✅ Products loaded via middleware:', result);

        // Debug tags information
        if (result.products) {
          result.products.forEach(product => {
            if (product.tags && Object.keys(product.tags).length > 0) {
              console.log(`🏷️ Product ${product.id} (${product.name}) all tags:`, product.tags);

              // Filter and show only CPU, RAM, SSD tags
              const tagEntries = Object.entries(product.tags);
              const filteredTags = tagEntries.filter(([tagId, tagValue]) => {
                const value = tagValue.toUpperCase();
                return value.includes('CPU') || value.includes('RAM') || value.includes('SSD');
              });

              if (filteredTags.length > 0) {
                const filteredTagsObj = Object.fromEntries(filteredTags);
                console.log(`🔍 Product ${product.id} filtered tags (CPU/RAM/SSD):`, filteredTagsObj);
              } else {
                console.log(`⚠️ Product ${product.id} has no CPU/RAM/SSD tags`);
              }
            }
          });
        }
      } else {
        setError(result.error || 'Failed to load products');
        console.error('❌ Failed to load products via middleware:', result);
      }
    } catch (err) {
      setError(err.message);
      console.error('❌ Error loading products via middleware:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return price && parseFloat(price) > 0 ? `${price} CZK` : 'N/A';
  };

  const formatCommission = (commission) => {
    if (!commission || !commission.rate) return 'N/A';

    if (commission.type === 'Percent') {
      return `${commission.rate}%`;
    } else if (commission.type === 'Fixed') {
      return `${commission.rate} CZK`;
    }
    return commission.rate;
  };

  const loadProductPricing = async (productId = selectedProductId) => {
    setPricingLoading(true);
    setPricingData(null);
    setError(null);

    try {
      console.log(`🔍 Loading pricing for product ID: ${productId}, affiliate ID: ${affiliateId}`);
      const middlewareUrl = process.env.NEXT_PUBLIC_MIDDLEWARE_URL || 'http://localhost:3005';

      // Test different billing cycles
      const billingCycles = [
        { code: 'm', name: 'Monthly (1 month)', period: '1' },
        { code: 'q', name: 'Quarterly (3 months)', period: '3' },
        { code: 's', name: 'Semiannually (6 months)', period: '6' },
        { code: 'a', name: 'Annually (12 months)', period: '12' },
        { code: 'b', name: 'Biennially (24 months)', period: '24' },
        { code: 't', name: 'Triennially (36 months)', period: '36' }
      ];

      const pricingResults = [];

      for (const cycle of billingCycles) {
        try {
          console.log(`📊 Testing billing cycle: ${cycle.name} (${cycle.code}) for affiliate ${affiliateId}`);

          // Call HostBill API to get product pricing for specific cycle and affiliate
          const response = await fetch(`${middlewareUrl}/api/hostbill/product-pricing`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              product_id: productId,
              cycle: cycle.code,
              affiliate_id: affiliateId // Include affiliate ID for proper pricing
            })
          });

          const result = await response.json();

          pricingResults.push({
            cycle: cycle.code,
            cycleName: cycle.name,
            period: cycle.period,
            success: result.success,
            price: result.price || 0,
            setupFee: result.setupFee || 0,
            method: result.method || 'unknown',
            priceStatus: result.priceStatus || 'unknown',
            note: result.note || '',
            error: result.error,
            rawData: result
          });

          console.log(`📊 ${cycle.name}: ${result.success ? `${result.price || 0} CZK (${result.method})` : `Error: ${result.error}`}`);

        } catch (cycleError) {
          console.error(`❌ Error testing ${cycle.name}:`, cycleError);
          pricingResults.push({
            cycle: cycle.code,
            cycleName: cycle.name,
            period: cycle.period,
            success: false,
            price: 0,
            setupFee: 0,
            method: 'error',
            error: cycleError.message,
            rawData: null
          });
        }
      }

      setPricingData({
        productId: productId,
        affiliateId: affiliateId,
        results: pricingResults,
        timestamp: new Date().toISOString()
      });

      console.log('✅ Product pricing loaded for affiliate:', { affiliateId, productId, results: pricingResults });

    } catch (err) {
      setError(`Failed to load product pricing: ${err.message}`);
      console.error('❌ Error loading product pricing:', err);
    } finally {
      setPricingLoading(false);
    }
  };

  const updateProductPricing = async () => {
    setEditPricingLoading(true);
    setEditPricingResult(null);
    setError(null);

    try {
      console.log(`🔧 Updating pricing for product ID: ${selectedProductId}`);
      const middlewareUrl = process.env.NEXT_PUBLIC_MIDDLEWARE_URL || 'http://localhost:3005';

      // Prepare prices object - only include non-empty values
      const prices = {};
      const billingCycles = ['m', 'q', 's', 'a', 'b', 't'];

      for (const cycle of billingCycles) {
        const recurring = parseFloat(editPricingData[cycle].recurring);
        const setup = parseFloat(editPricingData[cycle].setup);

        if (!isNaN(recurring) || !isNaN(setup)) {
          prices[cycle] = {};

          if (!isNaN(recurring)) {
            prices[cycle].recurring = recurring;
          }

          if (!isNaN(setup)) {
            prices[cycle].setup = setup;
          }
        }
      }

      if (Object.keys(prices).length === 0) {
        setError('Please enter at least one price to update');
        return;
      }

      console.log('🔧 Updating prices:', prices);

      const response = await fetch(`${middlewareUrl}/api/hostbill/edit-product-pricing`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          product_id: selectedProductId,
          prices: prices,
          affiliate_id: affiliateId
        })
      });

      const result = await response.json();

      if (result.success) {
        setEditPricingResult(result);
        console.log('✅ Product pricing updated successfully:', result);

        // Clear form
        setEditPricingData({
          m: { recurring: '', setup: '', discount: '0' },
          q: { recurring: '', setup: '', discount: '0' },
          s: { recurring: '', setup: '', discount: '5' },
          a: { recurring: '', setup: '', discount: '10' },
          b: { recurring: '', setup: '', discount: '15' },
          t: { recurring: '', setup: '', discount: '20' }
        });

        // Reload pricing data to see changes
        setTimeout(() => {
          loadProductPricing(selectedProductId);
        }, 1000);

      } else {
        setError(result.error || 'Failed to update product pricing');
        console.error('❌ Failed to update product pricing:', result);
      }

    } catch (err) {
      setError(`Failed to update product pricing: ${err.message}`);
      console.error('❌ Error updating product pricing:', err);
    } finally {
      setEditPricingLoading(false);
    }
  };

  // Product Detail - View and Clone functions
  const loadAllProducts = async () => {
    // Use products from the main list instead of loading separately
    if (data && data.products && data.products.length > 0) {
      setAllProducts(data.products);
      initializeDualListbox(data.products); // Initialize dual listbox
    }
  };

  const handleCloneSettingsChange = (id) => {
    setCloneSettings((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAllSettings = () => {
    const allSettingIds = SETTINGS_LABELS.map(setting => setting.id);
    if (cloneSettings.length === allSettingIds.length) {
      // If all are selected, deselect all
      setCloneSettings([]);
    } else {
      // Select all
      setCloneSettings(allSettingIds);
    }
  };

  const loadProductDetail = async (productId, type) => {
    if (!productId) return;
    setLoadingDetail(true);

    try {
      console.log(`🔍 Loading product detail for ID: ${productId}, type: ${type}`);

      // Call middleware endpoint
      const middlewareUrl = process.env.NEXT_PUBLIC_MIDDLEWARE_URL || 'http://localhost:3005';
      const response = await fetch(`${middlewareUrl}/api/hostbill/product-detail?product_id=${productId}&affiliate_id=${affiliateId}`);
      const data = await response.json();

      console.log('📊 Product detail response:', data);

      if (data.success && data.product) {
        if (type === 'from') {
          setFromDetail(data.product);
          console.log('✅ From product detail loaded:', data.product.name);
        } else {
          setToDetail(data.product);
          console.log('✅ To product detail loaded:', data.product.name);
        }
      } else {
        console.error('❌ Failed to load product detail:', data.error);
        setError(`Failed to load product detail: ${data.error}`);
      }
    } catch (err) {
      console.error('❌ Error loading product detail:', err);
      setError(`Error loading product detail: ${err.message}`);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleClone = async (e) => {
    e.preventDefault();

    // Validation for existing product clone
    if (!isCreatingNew && (!fromProduct || !toProduct || cloneSettings.length === 0)) {
      setCloneResult({ success: false, error: 'Please select all required fields!' });
      return;
    }

    // Validation for new product creation
    if (isCreatingNew && (!fromProduct || !newProductName.trim() || cloneSettings.length === 0)) {
      setCloneResult({ success: false, error: 'Please select source product, enter new product name, and select settings!' });
      return;
    }

    setCloneLoading(true);
    setCloneResult(null);

    try {
      const middlewareUrl = process.env.NEXT_PUBLIC_MIDDLEWARE_URL || 'http://localhost:3005';

      if (isCreatingNew) {
        // Create new product and clone settings
        console.log('🔧 Starting new product creation and clone:', {
          sourceProductId: fromProduct,
          newProductName: newProductName.trim(),
          settings: cloneSettings,
          affiliateId: affiliateId
        });

        const response = await fetch(`${middlewareUrl}/api/hostbill/clone-new-product`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sourceProductId: fromProduct,
            newProductName: newProductName.trim(),
            settings: cloneSettings,
            affiliate_id: affiliateId
          }),
        });

        const data = await response.json();
        console.log('📊 Clone new product result:', data);
        setCloneResult(data);

        // Clear new product name and refresh products list on success
        if (data.success) {
          setNewProductName('');

          // Log what was actually cloned
          const isCompleteCopy = data.completeCopy;
          const clonedCount = data.clonedSettings ? data.clonedSettings.length : 0;

          console.log(`✅ New product created: ${isCompleteCopy ? 'Complete copy' : 'Partial copy'} (${clonedCount}/9 settings)`);
          console.log(`📋 Cloned settings: ${data.clonedSettings?.join(', ') || 'None'}`);

          // Log components warning if present
          if (data.componentsWarning) {
            console.log(`⚠️ Components Warning: ${data.componentsWarning.message}`);
            console.log(`🔧 Action Required: ${data.componentsWarning.action}`);
          }

          // Refresh products list after successful new product creation
          console.log('🔄 Refreshing products list after successful new product creation...');
          await loadAffiliateProducts();
        }

      } else {
        // Existing product clone
        console.log('🔧 Starting product clone:', {
          sourceProductId: fromProduct,
          targetProductId: toProduct,
          settings: cloneSettings,
          affiliateId: affiliateId
        });

        const response = await fetch(`${middlewareUrl}/api/hostbill/clone-product`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            targetProductId: toProduct,
            sourceProductId: fromProduct,
            settings: cloneSettings,
            affiliate_id: affiliateId
          }),
        });

        const data = await response.json();
        console.log('📊 Clone result:', data);
        setCloneResult(data);

        // Refresh products list after successful clone (in case any product data changed)
        if (data.success) {
          console.log('🔄 Refreshing products list after successful clone...');
          await loadAffiliateProducts();
        }
      }

    } catch (err) {
      console.error('❌ Clone error:', err);
      setCloneResult({ success: false, error: err.message });
    } finally {
      setCloneLoading(false);
    }
  };

  // Delete Product function
  const handleDeleteProduct = async (productId, productName) => {
    if (!productId) return;

    // Confirm deletion
    const confirmDelete = window.confirm(
      `Are you sure you want to DELETE product "${productName}" (ID: ${productId})?\n\n` +
      `⚠️ WARNING: This action cannot be undone!\n` +
      `This will permanently remove the product from HostBill.`
    );

    if (!confirmDelete) return;

    setDeleteLoading(true);
    setDeleteResult(null);

    try {
      console.log(`🗑️ Deleting product: ${productName} (ID: ${productId})`);

      // Call middleware endpoint
      const middlewareUrl = process.env.NEXT_PUBLIC_MIDDLEWARE_URL || 'http://localhost:3005';
      const response = await fetch(`${middlewareUrl}/api/hostbill/delete-product`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: productId,
          affiliate_id: affiliateId
        }),
      });

      const data = await response.json();
      console.log('📊 Delete result:', data);
      setDeleteResult(data);

      // If successful, clear the product detail and refresh products list
      if (data.success) {
        setFromDetail(null);
        setFromProduct('');

        // Refresh products list immediately
        console.log('🔄 Refreshing products list after successful deletion...');
        await loadAffiliateProducts();

        // Clear delete result after showing success message for a few seconds
        setTimeout(() => {
          setDeleteResult(null);
        }, 5000);
      }

    } catch (err) {
      console.error('❌ Delete error:', err);
      setDeleteResult({ success: false, error: err.message });
    } finally {
      setDeleteLoading(false);
    }
  };

  // Initialize dual listbox when products are loaded
  const initializeDualListbox = (products) => {
    setLeftProducts([...products]); // All products start on the left
    setRightProducts([]); // Right side starts empty
    setSelectedLeftProducts([]);
    setSelectedRightProducts([]);
  };

  // Move selected products from left to right
  const moveToRight = () => {
    const productsToMove = leftProducts.filter(product =>
      selectedLeftProducts.includes(product.id)
    );
    const remainingLeft = leftProducts.filter(product =>
      !selectedLeftProducts.includes(product.id)
    );

    setLeftProducts(remainingLeft);
    setRightProducts([...rightProducts, ...productsToMove]);
    setSelectedLeftProducts([]);
  };

  // Move selected products from right to left
  const moveToLeft = () => {
    const productsToMove = rightProducts.filter(product =>
      selectedRightProducts.includes(product.id)
    );
    const remainingRight = rightProducts.filter(product =>
      !selectedRightProducts.includes(product.id)
    );

    setRightProducts(remainingRight);
    setLeftProducts([...leftProducts, ...productsToMove]);
    setSelectedRightProducts([]);
  };

  // Move all products from left to right
  const moveAllToRight = () => {
    setRightProducts([...rightProducts, ...leftProducts]);
    setLeftProducts([]);
    setSelectedLeftProducts([]);
  };

  // Move all products from right to left
  const moveAllToLeft = () => {
    setLeftProducts([...leftProducts, ...rightProducts]);
    setRightProducts([]);
    setSelectedRightProducts([]);
  };

  // Helper function to load product detail data
  const loadProductDetailData = async (productId) => {
    try {
      const middlewareUrl = process.env.NEXT_PUBLIC_MIDDLEWARE_URL || 'http://localhost:3005';
      const response = await fetch(`${middlewareUrl}/api/hostbill/product-detail?product_id=${productId}&affiliate_id=${affiliateId}`);
      const data = await response.json();

      if (data.success) {
        return data.product;
      } else {
        console.error(`❌ Failed to load product ${productId}:`, data.error);
        return null;
      }
    } catch (error) {
      console.error(`❌ Error loading product ${productId}:`, error);
      return null;
    }
  };

  // Load product detail with HostBill API categories for View Detail 1st
  const loadProductDetailWithCategories = async (productId) => {
    if (!productId) return;

    setLoadingDetail(true);

    try {
      const productDetail = await loadProductDetailData(productId);

      if (productDetail) {
        setDetailedViewProduct(productDetail);
        console.log('📋 Product detail loaded for categorized view:', productDetail.name);
      } else {
        console.error('❌ Failed to load product detail for categorized view');
      }
    } catch (error) {
      console.error('❌ Error loading product detail with categories:', error);
    } finally {
      setLoadingDetail(false);
    }
  };

  // Bulk view selected products (up to 5)
  const handleBulkView = async () => {
    const productsToView = rightProducts.slice(0, 5); // Limit to 5 products
    const productDetails = [];

    setLoadingDetail(true);

    try {
      for (const product of productsToView) {
        const detail = await loadProductDetailData(product.id);
        if (detail) {
          productDetails.push(detail);
        }
      }

      setBulkViewDetails(productDetails);
    } catch (error) {
      console.error('❌ Bulk view error:', error);
    } finally {
      setLoadingDetail(false);
    }
  };

  // Bulk delete selected products
  const handleBulkDelete = async () => {
    if (rightProducts.length === 0) return;

    const confirmDelete = window.confirm(
      `Are you sure you want to DELETE ${rightProducts.length} selected products?\n\n` +
      `⚠️ WARNING: This action cannot be undone!\n` +
      `Products to delete:\n${rightProducts.map(p => `- ${p.name}`).join('\n')}`
    );

    if (!confirmDelete) return;

    setDeleteLoading(true);
    let deletedCount = 0;
    let failedCount = 0;

    try {
      for (const product of rightProducts) {
        try {
          const middlewareUrl = process.env.NEXT_PUBLIC_MIDDLEWARE_URL || 'http://localhost:3005';
          const response = await fetch(`${middlewareUrl}/api/hostbill/delete-product`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              productId: product.id,
              affiliate_id: affiliateId
            }),
          });

          const data = await response.json();
          if (data.success) {
            deletedCount++;
          } else {
            failedCount++;
            console.error(`❌ Failed to delete ${product.name}:`, data.error);
          }
        } catch (error) {
          failedCount++;
          console.error(`❌ Error deleting ${product.name}:`, error);
        }
      }

      // Clear selected products and refresh list
      setRightProducts([]);
      setSelectedRightProducts([]);

      // Show result
      setBulkDeleteResult({
        success: deletedCount > 0,
        deletedCount,
        failedCount,
        totalCount: rightProducts.length
      });

      // Refresh products list
      await loadAffiliateProducts();

    } catch (error) {
      console.error('❌ Bulk delete error:', error);
      setBulkDeleteResult({
        success: false,
        error: error.message
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  // Bulk clone selected products
  const handleBulkClone = async () => {
    if (rightProducts.length === 0) return;

    const confirmClone = window.confirm(
      `Clone ${rightProducts.length} selected products?\n\n` +
      `New products will be named: "Original Name - kopie"\n\n` +
      `Products to clone:\n${rightProducts.map(p => `- ${p.name} → ${p.name} - kopie`).join('\n')}`
    );

    if (!confirmClone) return;

    setCloneLoading(true);
    let clonedCount = 0;
    let failedCount = 0;
    const cloneResults = [];

    try {
      for (const product of rightProducts) {
        try {
          const newProductName = `${product.name} - kopie`;

          const middlewareUrl = process.env.NEXT_PUBLIC_MIDDLEWARE_URL || 'http://localhost:3005';
          const response = await fetch(`${middlewareUrl}/api/hostbill/clone-new-product`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sourceProductId: product.id,
              newProductName: newProductName,
              settings: cloneSettings, // Use current clone settings
              affiliate_id: affiliateId
            }),
          });

          const data = await response.json();
          if (data.success) {
            clonedCount++;
            cloneResults.push({
              success: true,
              source: product.name,
              target: data.newProduct.name,
              id: data.newProduct.id
            });
          } else {
            failedCount++;
            cloneResults.push({
              success: false,
              source: product.name,
              error: data.error
            });
            console.error(`❌ Failed to clone ${product.name}:`, data.error);
          }
        } catch (error) {
          failedCount++;
          cloneResults.push({
            success: false,
            source: product.name,
            error: error.message
          });
          console.error(`❌ Error cloning ${product.name}:`, error);
        }
      }

      // Show result
      setBulkCloneResult({
        success: clonedCount > 0,
        clonedCount,
        failedCount,
        totalCount: rightProducts.length,
        results: cloneResults
      });

      // Refresh products list
      await loadAffiliateProducts();

    } catch (error) {
      console.error('❌ Bulk clone error:', error);
      setBulkCloneResult({
        success: false,
        error: error.message
      });
    } finally {
      setCloneLoading(false);
    }
  };

  // Helper: render product detail with all SETTINGS_LABELS fields
  const renderProductDetail = (detail) => {
    if (!detail) return null;

    const prices = [
      ["Monthly", detail.m],
      ["Quarterly", detail.q],
      ["Semi-annually", detail.s],
      ["Annually", detail.a],
      ["Biennially", detail.b],
      ["Triennially", detail.t],
    ].filter(([, price]) => price !== undefined && price !== '0');

    return (
      <div style={{
        fontSize: "0.95em",
        background: "#f9f9fa",
        border: "1px solid #eee",
        borderRadius: 8,
        padding: 15,
        margin: "8px 0"
      }}>
        {/* Header with product name */}
        <div style={{ marginBottom: 10 }}>
          <strong style={{ fontSize: '1.1em', color: '#495057' }}>{detail.name}</strong>
        </div>

        {/* 1. General */}
        <div style={{ marginBottom: 8 }}>
          <strong style={{ color: '#007bff' }}>1. General:</strong>
          <div style={{ marginLeft: 15, marginTop: 4 }}>
            <div><b>ID:</b> {detail.id}</div>
            <div><b>Name:</b> {detail.name}</div>
            <div><b>Category:</b> {detail.category || 'N/A'}</div>
            <div><b>Type:</b> {detail.type || 'N/A'}</div>
            <div><b>Module:</b> {detail.module || 'N/A'}</div>
            <div><b>Visible:</b> {detail.visible ? 'Yes' : 'No'}</div>
            <div><b>Description:</b> {detail.description || <span style={{ color: "#bbb" }}>No description</span>}</div>
          </div>
        </div>

        {/* 2. Pricing */}
        {prices.length > 0 && (
          <div style={{ marginBottom: 8 }}>
            <strong style={{ color: '#28a745' }}>2. Pricing:</strong>
            <div style={{ marginLeft: 15, marginTop: 4 }}>
              {prices.map(([label, value]) => (
                <div key={label}><b>{label}:</b> {value} CZK</div>
              ))}
              <div><b>Setup Fees:</b></div>
              <div style={{ marginLeft: 15 }}>
                {detail.m_setup && <div>Monthly Setup: {detail.m_setup} CZK</div>}
                {detail.q_setup && <div>Quarterly Setup: {detail.q_setup} CZK</div>}
                {detail.a_setup && <div>Annual Setup: {detail.a_setup} CZK</div>}
              </div>
            </div>
          </div>
        )}

        {/* 3. Configuration */}
        <div style={{ marginBottom: 8 }}>
          <strong style={{ color: '#ffc107' }}>3. Configuration:</strong>
          <div style={{ marginLeft: 15, marginTop: 4 }}>
            <div><b>Stock:</b> {detail.stock || '0'}</div>
            <div><b>Quantity:</b> {detail.qty || 'Unlimited'}</div>
            <div><b>Weight:</b> {detail.weight || '0'}</div>
            <div><b>Tax Class:</b> {detail.tax_class || 'Default'}</div>
            {detail.server && (
              <div><b>Server:</b> {typeof detail.server === 'object' ? JSON.stringify(detail.server) : detail.server}</div>
            )}
          </div>
        </div>

        {/* 4. Components (Form fields) */}
        <div style={{ marginBottom: 8 }}>
          <strong style={{ color: '#17a2b8' }}>4. Components (Form fields):</strong>
          <div style={{ marginLeft: 15, marginTop: 4 }}>
            {detail.options && detail.options.length > 0 ? (
              <div>
                <b>Custom Fields:</b> {detail.options.length} fields
                <div style={{ fontSize: '0.9em', color: '#6c757d' }}>
                  {detail.options.slice(0, 3).map((option, idx) => (
                    <div key={idx}>• {option.name || option.label || `Field ${idx + 1}`}</div>
                  ))}
                  {detail.options.length > 3 && <div>... and {detail.options.length - 3} more</div>}
                </div>
              </div>
            ) : (
              <div style={{ color: '#6c757d' }}>No custom fields configured</div>
            )}
          </div>
        </div>

        {/* 5. Emails */}
        <div style={{ marginBottom: 8 }}>
          <strong style={{ color: '#6f42c1' }}>5. Emails:</strong>
          <div style={{ marginLeft: 15, marginTop: 4 }}>
            <div><b>Welcome Email:</b> {detail.welcome_email ? 'Enabled' : 'Disabled'}</div>
            <div><b>Email Template:</b> {detail.email_template || 'Default'}</div>
            {detail.emails && (
              <div style={{ color: '#6c757d', fontSize: '0.9em' }}>
                Email configuration available
              </div>
            )}
          </div>
        </div>

        {/* 6. Related products */}
        <div style={{ marginBottom: 8 }}>
          <strong style={{ color: '#e83e8c' }}>6. Related products:</strong>
          <div style={{ marginLeft: 15, marginTop: 4 }}>
            {detail.related_products && detail.related_products.length > 0 ? (
              <div>
                <b>Related Products:</b> {detail.related_products.length} products
                <div style={{ fontSize: '0.9em', color: '#6c757d' }}>
                  {detail.related_products.slice(0, 2).map((prod, idx) => (
                    <div key={idx}>• {prod.name || `Product ${prod.id}`}</div>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ color: '#6c757d' }}>No related products configured</div>
            )}
          </div>
        </div>

        {/* 7. Automation scripts */}
        <div style={{ marginBottom: 8 }}>
          <strong style={{ color: '#fd7e14' }}>7. Automation scripts:</strong>
          <div style={{ marginLeft: 15, marginTop: 4 }}>
            <div><b>Auto Setup:</b> {detail.auto_setup ? 'Enabled' : 'Disabled'}</div>
            <div><b>Provisioning:</b> {detail.provisioning_module || 'Manual'}</div>
            {detail.hooks && (
              <div style={{ color: '#6c757d', fontSize: '0.9em' }}>
                Automation hooks configured
              </div>
            )}
          </div>
        </div>

        {/* 8. Order process */}
        <div style={{ marginBottom: 8 }}>
          <strong style={{ color: '#20c997' }}>8. Order process:</strong>
          <div style={{ marginLeft: 15, marginTop: 4 }}>
            <div><b>Order Form:</b> {detail.order_form || 'Default'}</div>
            <div><b>Payment Required:</b> {detail.payment_required !== false ? 'Yes' : 'No'}</div>
            <div><b>Trial Period:</b> {detail.trial_period || 'None'}</div>
            <div><b>Setup Fee:</b> {detail.setup_fee || '0'} CZK</div>
          </div>
        </div>

        {/* 9. Domain settings */}
        <div style={{ marginBottom: 8 }}>
          <strong style={{ color: '#6610f2' }}>9. Domain settings:</strong>
          <div style={{ marginLeft: 15, marginTop: 4 }}>
            <div><b>Domain Required:</b> {detail.domain_required ? 'Yes' : 'No'}</div>
            <div><b>Subdomain:</b> {detail.subdomain || 'Not configured'}</div>
            <div><b>Domain Options:</b> {detail.domain_options || 'Default'}</div>
            {detail.tlds && (
              <div style={{ color: '#6c757d', fontSize: '0.9em' }}>
                TLD configuration available
              </div>
            )}
          </div>
        </div>


      </div>
    );
  };

  const calculatePricesFromMonthly = () => {
    const monthlyPrice = parseFloat(editPricingData.m.recurring);
    const monthlySetup = parseFloat(editPricingData.m.setup) || 0;

    if (isNaN(monthlyPrice) || monthlyPrice <= 0) {
      setError('Please enter a valid monthly recurring price first');
      return;
    }

    console.log(`📊 Calculating prices from monthly: ${monthlyPrice} CZK (pre-filling form only)`);

    // Calculate prices based on number of months with discount from UI fields
    const calculations = {
      q: { months: 3 },      // Quarterly
      s: { months: 6 },      // Semiannually
      a: { months: 12 },     // Annually
      b: { months: 24 },     // Biennially
      t: { months: 36 }      // Triennially
    };

    const newPricing = { ...editPricingData };

    // Keep monthly as is (preserve discount field)
    newPricing.m = {
      recurring: monthlyPrice.toString(),
      setup: monthlySetup.toString(),
      discount: editPricingData.m.discount
    };

    // Calculate other periods using discount from UI
    Object.entries(calculations).forEach(([cycle, calc]) => {
      const discountPercent = parseFloat(editPricingData[cycle].discount) || 0;
      const discountDecimal = discountPercent / 100;

      const totalMonthlyPrice = monthlyPrice * calc.months;
      const discountedPrice = totalMonthlyPrice * (1 - discountDecimal);
      const finalPrice = Math.round(discountedPrice);

      newPricing[cycle] = {
        recurring: finalPrice.toString(),
        setup: monthlySetup.toString(), // Same setup fee for all periods
        discount: editPricingData[cycle].discount // Preserve discount field
      };

      console.log(`📊 ${cycle.toUpperCase()}: ${calc.months} months × ${monthlyPrice} CZK = ${totalMonthlyPrice} CZK, discount ${discountPercent}% = ${finalPrice} CZK`);
    });

    setEditPricingData(newPricing);

    console.log('✅ Form pre-filled with calculated prices (not saved to database yet):', newPricing);
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <Head>
        <title>Middleware Affiliate Products Test - Cloud VPS</title>
      </Head>

      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={() => router.push('/test-portal')}
          style={{
            padding: '8px 16px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginBottom: '10px'
          }}
        >
          ← Back to Test Portal
        </button>
      </div>

      <h1>🎯 Middleware Affiliate Products Test</h1>
      <p>Test získání produktů s provizemi přes middleware na portu 3005</p>

      {/* Middleware Info */}
      <div style={{
        backgroundColor: '#e3f2fd',
        border: '1px solid #2196f3',
        borderRadius: '8px',
        padding: '15px',
        marginBottom: '20px'
      }}>
        <h4 style={{ margin: '0 0 10px 0', color: '#1976d2' }}>🔌 Middleware Information:</h4>
        <ul style={{ margin: 0, paddingLeft: '20px', color: '#1976d2' }}>
          <li><strong>Middleware URL:</strong> {process.env.NEXT_PUBLIC_MIDDLEWARE_URL || 'http://localhost:3005'}</li>
          <li><strong>Endpoints:</strong> /api/affiliates, /api/affiliate/{`{id}`}/products</li>
          <li><strong>Data Source:</strong> Middleware → HostBill API</li>
          <li><strong>Communication:</strong> EXCLUSIVELY via middleware (no fallback)</li>
        </ul>
      </div>



      {/* Quick Affiliate Links */}
      <div style={{
        marginBottom: '30px',
        padding: '20px',
        backgroundColor: '#e3f2fd',
        borderRadius: '8px',
        border: '1px solid #2196f3'
      }}>
        <h3 style={{ margin: '0 0 15px 0', color: '#1976d2' }}>🔗 Quick Affiliate Links</h3>
        {affiliatesLoading ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <span>⏳ Loading affiliates...</span>
          </div>
        ) : affiliates.length > 0 ? (
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {affiliates.map(affiliate => (
              <a
                key={affiliate.id}
                href={`/middleware-affiliate-products?affiliate_id=${affiliate.id}`}
                style={{
                  padding: '10px 16px',
                  backgroundColor: affiliateId === affiliate.id ? '#1976d2' : '#2196f3',
                  color: 'white',
                  textDecoration: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  border: affiliateId === affiliate.id ? '2px solid #0d47a1' : 'none',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => {
                  if (affiliateId !== affiliate.id) {
                    e.target.style.backgroundColor = '#1976d2';
                  }
                }}
                onMouseOut={(e) => {
                  if (affiliateId !== affiliate.id) {
                    e.target.style.backgroundColor = '#2196f3';
                  }
                }}
              >
                #{affiliate.id} - {affiliate.firstname} {affiliate.lastname}
                <div style={{ fontSize: '11px', opacity: '0.9' }}>
                  {affiliate.status} • Visits: {affiliate.visits || 0}
                </div>
              </a>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
            ⚠️ No affiliates found
          </div>
        )}
      </div>

      {/* Input Section */}
      <div style={{
        backgroundColor: '#f5f5f5',
        padding: '20px',
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <h3>🔧 Test Parameters</h3>

        {/* View Mode Selector */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '15px' }}>
          <label>
            <strong>View Mode:</strong>
            <select
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value)}
              style={{
                marginLeft: '10px',
                padding: '5px 10px',
                borderRadius: '4px',
                border: '1px solid #ccc',
                fontSize: '14px'
              }}
            >
              <option value="affiliate">Applied Affiliate Products (Middleware)</option>
              <option value="all">All Products (Middleware)</option>
            </select>
          </label>
        </div>

        {/* Affiliate ID Input - only show when affiliate mode */}
        {viewMode === 'affiliate' && (
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '15px' }}>
            <label>
              <strong>Affiliate ID:</strong>
            <input
              type="text"
              value={affiliateId}
              onChange={(e) => setAffiliateId(e.target.value)}
              style={{
                marginLeft: '10px',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px'
              }}
              placeholder="Enter affiliate ID"
            />
          </label>
          <button
            onClick={() => loadAffiliateProducts()}
            disabled={loading || !affiliateId}
            style={{
              padding: '8px 16px',
              backgroundColor: loading ? '#ccc' : '#0066cc',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? '⏳ Loading...' : '🔍 Load Products'}
          </button>
          </div>
        )}

        {/* Load All Products Button - only show when all mode */}
        {viewMode === 'all' && (
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '15px' }}>
            <button
              onClick={() => loadAffiliateProducts()}
              disabled={loading}
              style={{
                padding: '8px 16px',
                backgroundColor: loading ? '#ccc' : '#0066cc',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? '⏳ Loading...' : '🔍 Load All Products'}
            </button>
          </div>
        )}

        <div style={{ fontSize: '14px', color: '#6c757d' }}>
          <strong>Middleware URL:</strong> {process.env.NEXT_PUBLIC_MIDDLEWARE_URL || 'http://localhost:3005'}
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div style={{
          textAlign: 'center',
          padding: '40px',
          backgroundColor: '#e3f2fd',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <h3>⏳ Loading affiliate products...</h3>
          <p>Fetching data from middleware API...</p>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div style={{
          backgroundColor: '#f8d7da',
          border: '1px solid #f5c6cb',
          borderRadius: '8px',
          padding: '15px',
          marginBottom: '20px'
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#721c24' }}>❌ Error</h3>
          <p style={{ margin: 0, color: '#721c24' }}>{error}</p>
        </div>
      )}

      {/* Results Display */}
      {data && (
        <div style={{
          backgroundColor: '#d4edda',
          border: '1px solid #c3e6cb',
          borderRadius: '8px',
          padding: '20px',
          marginBottom: '20px'
        }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#155724' }}>
            ✅ Products loaded via Middleware
          </h3>
          
          <div style={{ marginBottom: '15px', fontSize: '14px', color: '#155724' }}>
            <strong>Source:</strong> {data.source} |
            <strong> Mode:</strong> {data.mode} |
            <strong> Middleware URL:</strong> {data.middleware_url || 'http://localhost:3005'} |
            <strong> Affiliate ID:</strong> {data.affiliate?.id}
          </div>

          {/* Summary */}
          {data.summary && (
            <div style={{
              backgroundColor: '#fff3e0',
              border: '1px solid #ff9800',
              borderRadius: '8px',
              padding: '15px',
              marginBottom: '15px'
            }}>
              <h4 style={{ color: '#f57c00', margin: '0 0 10px 0' }}>
                📊 Summary - {data.mode === 'all' ? 'All Products Mode' : 'Applied Products Mode'}
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                <div><strong>Categories:</strong> {data.summary.total_categories}</div>
                <div><strong>Total Products:</strong> {data.summary.total_products}</div>
                <div><strong>With Commission:</strong> {data.summary.products_with_commission || data.summary.total_applicable_products}</div>
                <div><strong>Without Commission:</strong> {data.summary.products_without_commission || 0}</div>
                <div><strong>Commission Plans:</strong> {data.commission_plans?.length || 0}</div>
              </div>
              {data.note && (
                <div style={{
                  marginTop: '10px',
                  padding: '8px',
                  backgroundColor: 'rgba(255,152,0,0.1)',
                  borderRadius: '4px',
                  fontSize: '13px',
                  color: '#f57c00'
                }}>
                  ℹ️ {data.note}
                </div>
              )}
            </div>
          )}

          {/* Commission Plans */}
          {data.commission_plans && data.commission_plans.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <h3>💰 Commission Plans</h3>
              {data.commission_plans.map(plan => (
                <div key={plan.id} style={{
                  backgroundColor: '#f3e5f5',
                  border: '1px solid #9c27b0',
                  borderRadius: '8px',
                  padding: '15px',
                  marginBottom: '10px'
                }}>
                  <h4 style={{ margin: '0 0 10px 0', color: '#7b1fa2' }}>
                    {plan.name} (ID: {plan.id})
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px' }}>
                    <div><strong>Type:</strong> {plan.type}</div>
                    <div><strong>Rate:</strong> {formatCommission(plan)}</div>
                    <div><strong>Recurring:</strong> {plan.recurring === '1' ? 'Yes' : 'No'}</div>
                    <div><strong>Default:</strong> {plan.default === '1' ? 'Yes' : 'No'}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {data.products && data.products.length > 0 ? (
            <div>
              <h3>🛍️ Available Products ({data.products.length})</h3>
              <div style={{ display: 'grid', gap: '20px' }}>
                {data.products.map(product => (
                  <div key={product.id} style={{
                    backgroundColor: 'white',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    padding: '20px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                      <div>
                        <h4 style={{ margin: '0 0 5px 0', color: '#0066cc' }}>
                          {product.name} (ID: {product.id})
                        </h4>
                        <p style={{ margin: '0', color: '#666', fontSize: '14px' }}>
                          Category: {product.category?.name || product.orderpage_name}
                        </p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{
                          fontSize: '18px',
                          fontWeight: 'bold',
                          color: product.commission?.has_commission ? '#2e7d32' : '#f57c00'
                        }}>
                          {product.commission?.has_commission ? (
                            <>Commission: {formatCommission(product.commission)}</>
                          ) : (
                            <>No Commission Plan</>
                          )}
                        </div>
                        <div style={{ fontSize: '12px', color: '#666' }}>
                          Plan: {product.commission?.plan_name || 'None'}
                        </div>
                        {product.commission?.has_commission === false && (
                          <div style={{ fontSize: '10px', color: '#f57c00', marginTop: '2px' }}>
                            ⚠️ Not applicable for this affiliate
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Pricing */}
                    <div style={{
                      backgroundColor: '#f8f9fa',
                      padding: '15px',
                      borderRadius: '6px',
                      marginBottom: '15px'
                    }}>
                      <h5 style={{ margin: '0 0 10px 0' }}>💰 Pricing & Commission</h5>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px' }}>
                        <div>
                          <strong>Monthly:</strong> {formatPrice(product.m || product.monthly_price)}
                          {product.commission?.monthly_amount > 0 && (
                            <div style={{ color: '#2e7d32', fontSize: '12px' }}>
                              Commission: {product.commission.monthly_amount} CZK
                            </div>
                          )}
                        </div>
                        <div>
                          <strong>Quarterly:</strong> {formatPrice(product.q || product.quarterly_price)}
                          {product.commission?.quarterly_amount > 0 && (
                            <div style={{ color: '#2e7d32', fontSize: '12px' }}>
                              Commission: {product.commission.quarterly_amount} CZK
                            </div>
                          )}
                        </div>
                        <div>
                          <strong>Semi-annually:</strong> {formatPrice(product.s || product.semiannually_price)}
                          {product.commission?.semiannually_amount > 0 && (
                            <div style={{ color: '#2e7d32', fontSize: '12px' }}>
                              Commission: {product.commission.semiannually_amount} CZK
                            </div>
                          )}
                        </div>
                        <div>
                          <strong>Annually:</strong> {formatPrice(product.a || product.annually_price)}
                          {product.commission?.annually_amount > 0 && (
                            <div style={{ color: '#2e7d32', fontSize: '12px' }}>
                              Commission: {product.commission.annually_amount} CZK
                            </div>
                          )}
                        </div>
                        <div>
                          <strong>Biennially:</strong> {formatPrice(product.b || product.biennially_price)}
                          {product.commission?.biennially_amount > 0 && (
                            <div style={{ color: '#2e7d32', fontSize: '12px' }}>
                              Commission: {product.commission.biennially_amount} CZK
                            </div>
                          )}
                        </div>
                        <div>
                          <strong>Triennially:</strong> {formatPrice(product.t || product.triennially_price)}
                          {product.commission?.triennially_amount > 0 && (
                            <div style={{ color: '#2e7d32', fontSize: '12px' }}>
                              Commission: {product.commission.triennially_amount} CZK
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Product Details */}
                    {product.description && (
                      <div style={{
                        backgroundColor: '#f8f9fa',
                        padding: '15px',
                        borderRadius: '6px',
                        marginBottom: '15px'
                      }}>
                        <h5 style={{ margin: '0 0 10px 0' }}>📝 Description</h5>
                        <div style={{ fontSize: '14px', color: '#6c757d' }}>
                          {product.description}
                        </div>
                      </div>
                    )}

                    {/* Product Tags/Specifications */}
                    {product.tags && Object.keys(product.tags).length > 0 && (
                      <div style={{
                        backgroundColor: '#e3f2fd',
                        padding: '15px',
                        borderRadius: '6px',
                        marginBottom: '15px'
                      }}>
                        <h5 style={{ margin: '0 0 10px 0', color: '#1976d2' }}>🏷️ Specifications</h5>
                        <div style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: '8px'
                        }}>
                          {(() => {
                            // Filter and sort tags: CPU, RAM, SSD in that order
                            const tagEntries = Object.entries(product.tags);
                            const filteredTags = tagEntries.filter(([tagId, tagValue]) => {
                              const value = tagValue.toUpperCase();
                              return value.includes('CPU') || value.includes('RAM') || value.includes('SSD');
                            });

                            // Sort by priority: CPU first, then RAM, then SSD
                            const sortedTags = filteredTags.sort(([aId, aValue], [bId, bValue]) => {
                              const aUpper = aValue.toUpperCase();
                              const bUpper = bValue.toUpperCase();

                              const getPriority = (value) => {
                                if (value.includes('CPU')) return 1;
                                if (value.includes('RAM')) return 2;
                                if (value.includes('SSD')) return 3;
                                return 4;
                              };

                              return getPriority(aUpper) - getPriority(bUpper);
                            });

                            return sortedTags.map(([tagId, tagValue]) => (
                              <span
                                key={tagId}
                                style={{
                                  backgroundColor: '#1976d2',
                                  color: 'white',
                                  padding: '4px 8px',
                                  borderRadius: '12px',
                                  fontSize: '12px',
                                  fontWeight: '500',
                                  display: 'inline-block'
                                }}
                              >
                                {tagValue}
                              </span>
                            ));
                          })()}
                        </div>
                        <div style={{
                          fontSize: '11px',
                          color: '#666',
                          marginTop: '8px'
                        }}>
                          {(() => {
                            // Show filtered tag IDs for debugging
                            const tagEntries = Object.entries(product.tags);
                            const filteredTags = tagEntries.filter(([tagId, tagValue]) => {
                              const value = tagValue.toUpperCase();
                              return value.includes('CPU') || value.includes('RAM') || value.includes('SSD');
                            });
                            const filteredTagIds = filteredTags.map(([tagId]) => tagId);

                            return `Filtered Tags (CPU/RAM/SSD): ${filteredTagIds.join(', ')} | All Tags: ${Object.keys(product.tags).join(', ')}`;
                          })()}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{
              backgroundColor: '#fff3cd',
              border: '1px solid #ffeaa7',
              borderRadius: '8px',
              padding: '20px',
              textAlign: 'center'
            }}>
              <p>No products with commissions found for affiliate ID {affiliateId}</p>
            </div>
          )}

          {/* Raw Data (Collapsible) */}
          <details style={{ marginTop: '30px' }}>
            <summary style={{
              cursor: 'pointer',
              padding: '10px',
              backgroundColor: '#f5f5f5',
              borderRadius: '4px',
              fontWeight: 'bold'
            }}>
              🔍 Raw API Response
            </summary>
            <pre style={{
              backgroundColor: '#f8f9fa',
              padding: '15px',
              borderRadius: '4px',
              overflow: 'auto',
              fontSize: '12px',
              marginTop: '10px'
            }}>
              {JSON.stringify(data, null, 2)}
            </pre>
          </details>
        </div>
      )}

      {/* Info */}
      {/* Edit Product Pricing Section */}
      <div style={{
        backgroundColor: '#d1ecf1',
        border: '1px solid #bee5eb',
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '20px'
      }}>
        <h3 style={{ margin: '0 0 15px 0', color: '#0c5460' }}>🔧 Edit Product Pricing (HostBill Admin API)</h3>
        <p style={{ margin: '0 0 15px 0', color: '#0c5460' }}>
          Update product pricing for different billing cycles using HostBill Admin API.
          <br />
          <strong>Current Product:</strong> {selectedProductId} | <strong>Affiliate:</strong> #{affiliateId}
        </p>

        <div style={{
          backgroundColor: '#f8d7da',
          border: '2px solid #dc3545',
          borderRadius: '6px',
          padding: '15px',
          marginBottom: '15px',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: '18px',
            fontWeight: 'bold',
            color: '#dc3545',
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }}>
            ⚠️ WARNING ⚠️
          </div>
          <div style={{
            fontSize: '16px',
            fontWeight: 'bold',
            color: '#721c24',
            marginTop: '5px'
          }}>
            This will modify actual HostBill product pricing!
          </div>
          <div style={{
            fontSize: '14px',
            color: '#721c24',
            marginTop: '5px'
          }}>
            Changes will affect real customer billing and invoices.
          </div>
        </div>

        <div style={{
          backgroundColor: '#e2e3e5',
          border: '1px solid #d6d8db',
          borderRadius: '6px',
          padding: '10px',
          marginBottom: '15px',
          fontSize: '14px',
          color: '#383d41'
        }}>
          <strong>💡 Auto-calculation:</strong> Enter monthly price and adjust discount percentages, then click "🧮 Calculate from Monthly" to pre-fill form:
          <br />
          <small>
            • Each period has editable discount % field (default: Q=0%, S=5%, A=10%, B=15%, T=20%)
            <br />
            • Calculation: Monthly price × months × (1 - discount%) = Final price
            <br />
            • <strong>Note:</strong> "Calculate" only fills the form, "Update Pricing" writes to database
          </small>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Product ID:
          </label>
          <select
            value={selectedProductId}
            onChange={(e) => setSelectedProductId(e.target.value)}
            style={{
              padding: '8px 12px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              marginRight: '10px'
            }}
          >
            <option value="5">5 - VPS Start</option>
            <option value="10">10 - VPS Profi</option>
            <option value="11">11 - VPS Premium</option>
            <option value="12">12 - VPS Enterprise</option>
          </select>
        </div>

        {/* Pricing Form */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '15px',
          marginBottom: '15px'
        }}>
          {[
            { code: 'm', name: 'Monthly' },
            { code: 'q', name: 'Quarterly' },
            { code: 's', name: 'Semiannually' },
            { code: 'a', name: 'Annually' },
            { code: 'b', name: 'Biennially' },
            { code: 't', name: 'Triennially' }
          ].map(cycle => (
            <div key={cycle.code} style={{
              backgroundColor: '#f8f9fa',
              border: '1px solid #dee2e6',
              borderRadius: '6px',
              padding: '10px'
            }}>
              <h5 style={{ margin: '0 0 8px 0', color: '#495057' }}>{cycle.name} ({cycle.code})</h5>
              <div style={{ marginBottom: '5px' }}>
                <label style={{ fontSize: '12px', color: '#666' }}>Recurring Price (CZK):</label>
                <input
                  type="number"
                  value={editPricingData[cycle.code].recurring}
                  onChange={(e) => setEditPricingData(prev => ({
                    ...prev,
                    [cycle.code]: {
                      ...prev[cycle.code],
                      recurring: e.target.value
                    }
                  }))}
                  placeholder="299"
                  style={{
                    width: '100%',
                    padding: '4px 8px',
                    border: '1px solid #ccc',
                    borderRadius: '3px',
                    fontSize: '12px'
                  }}
                />
              </div>
              <div style={{ marginBottom: '5px' }}>
                <label style={{ fontSize: '12px', color: '#666' }}>Setup Fee (CZK):</label>
                <input
                  type="number"
                  value={editPricingData[cycle.code].setup}
                  onChange={(e) => setEditPricingData(prev => ({
                    ...prev,
                    [cycle.code]: {
                      ...prev[cycle.code],
                      setup: e.target.value
                    }
                  }))}
                  placeholder="0"
                  style={{
                    width: '100%',
                    padding: '4px 8px',
                    border: '1px solid #ccc',
                    borderRadius: '3px',
                    fontSize: '12px'
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: '#666' }}>Discount %:</label>
                <input
                  type="number"
                  value={editPricingData[cycle.code].discount}
                  onChange={(e) => setEditPricingData(prev => ({
                    ...prev,
                    [cycle.code]: {
                      ...prev[cycle.code],
                      discount: e.target.value
                    }
                  }))}
                  placeholder="0"
                  min="0"
                  max="100"
                  style={{
                    width: '100%',
                    padding: '4px 8px',
                    border: '1px solid #ccc',
                    borderRadius: '3px',
                    fontSize: '12px'
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginBottom: '15px' }}>
          <button
            onClick={updateProductPricing}
            disabled={editPricingLoading}
            style={{
              padding: '10px 20px',
              backgroundColor: editPricingLoading ? '#6c757d' : '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: editPricingLoading ? 'not-allowed' : 'pointer',
              fontWeight: 'bold'
            }}
          >
            {editPricingLoading ? '🔄 Updating...' : '🔧 Update Pricing'}
          </button>

          <button
            onClick={() => setEditPricingData({
              m: { recurring: '299', setup: '0', discount: '0' },
              q: { recurring: '299', setup: '0', discount: '0' },
              s: { recurring: '299', setup: '0', discount: '5' },
              a: { recurring: '299', setup: '0', discount: '10' },
              b: { recurring: '299', setup: '0', discount: '15' },
              t: { recurring: '299', setup: '0', discount: '20' }
            })}
            style={{
              padding: '10px 20px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              marginLeft: '10px'
            }}
          >
            📝 Fill All 299 CZK
          </button>

          <button
            onClick={calculatePricesFromMonthly}
            style={{
              padding: '10px 20px',
              backgroundColor: '#17a2b8',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              marginLeft: '10px'
            }}
          >
            🧮 Calculate & Fill Form
          </button>
        </div>

        {editPricingResult && (
          <div style={{
            backgroundColor: '#d4edda',
            border: '1px solid #c3e6cb',
            borderRadius: '6px',
            padding: '15px',
            marginTop: '15px'
          }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#155724' }}>
              ✅ Pricing Updated Successfully
            </h4>
            <div style={{ fontSize: '14px', color: '#155724' }}>
              <strong>Product:</strong> {editPricingResult.productName} (ID: {editPricingResult.productId})
              <br />
              <strong>Updated Prices:</strong>
              <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
                {Object.entries(editPricingResult.finalPrices || {}).map(([period, price]) => (
                  <li key={period}>
                    {period}: {price} CZK
                  </li>
                ))}
              </ul>
              <small>Updated at: {new Date(editPricingResult.timestamp).toLocaleString()}</small>
            </div>
          </div>
        )}
      </div>

      {/* Product Pricing Test Section */}
      <div style={{
        backgroundColor: '#fff3cd',
        border: '1px solid #ffeaa7',
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '20px'
      }}>
        <h3 style={{ margin: '0 0 15px 0', color: '#856404' }}>🔍 Product Pricing Test</h3>
        <p style={{ margin: '0 0 15px 0', color: '#856404' }}>
          Test HostBill product pricing for different billing cycles to diagnose pricing issues.
          <br />
          <strong>Current Affiliate:</strong> #{affiliateId} | <strong>View Mode:</strong> {viewMode}
          <br />
          <small>
            {viewMode === 'affiliate' ?
              'Testing with affiliate-specific commission data' :
              'Testing all products without commission data'
            }
          </small>
        </p>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Product ID:
          </label>
          <select
            value={selectedProductId}
            onChange={(e) => setSelectedProductId(e.target.value)}
            style={{
              padding: '8px 12px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              marginRight: '10px'
            }}
          >
            <option value="5">5 - VPS Start</option>
            <option value="10">10 - VPS Profi</option>
            <option value="11">11 - VPS Premium</option>
            <option value="12">12 - VPS Enterprise</option>
          </select>

          <button
            onClick={() => loadProductPricing(selectedProductId)}
            disabled={pricingLoading}
            style={{
              padding: '8px 16px',
              backgroundColor: pricingLoading ? '#6c757d' : '#ffc107',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: pricingLoading ? 'not-allowed' : 'pointer'
            }}
          >
            {pricingLoading ? '🔄 Testing...' : '🔍 Test Pricing'}
          </button>
        </div>

        {pricingData && (
          <div style={{
            backgroundColor: '#f8f9fa',
            border: '1px solid #dee2e6',
            borderRadius: '6px',
            padding: '15px',
            marginTop: '15px'
          }}>
            <h4 style={{ margin: '0 0 10px 0' }}>
              📊 Pricing Results for Product {pricingData.productId} (Affiliate #{pricingData.affiliateId})
            </h4>

            <div style={{ display: 'grid', gap: '10px' }}>
              {pricingData.results.map((result, index) => (
                <div
                  key={index}
                  style={{
                    backgroundColor: result.success ? '#d4edda' : '#f8d7da',
                    border: `1px solid ${result.success ? '#c3e6cb' : '#f5c6cb'}`,
                    borderRadius: '4px',
                    padding: '10px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <strong>{result.cycleName}</strong>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      Code: {result.cycle} | Period: {result.period} months
                    </div>
                    {result.method && (
                      <div style={{ fontSize: '11px', color: '#888', fontStyle: 'italic' }}>
                        Method: {result.method}
                      </div>
                    )}
                    {result.note && (
                      <div style={{
                        fontSize: '10px',
                        color: result.priceStatus === 'set_in_hostbill' ? '#28a745' :
                               result.priceStatus === 'set_but_zero' ? '#ffc107' : '#dc3545',
                        fontWeight: 'bold',
                        marginTop: '2px'
                      }}>
                        {result.note}
                      </div>
                    )}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    {result.success ? (
                      <div>
                        <div style={{ fontWeight: 'bold', color: '#155724' }}>
                          {result.price > 0 ? `${result.price} CZK` : '0 CZK'}
                        </div>
                        {result.setupFee > 0 && (
                          <div style={{ fontSize: '12px', color: '#666' }}>
                            Setup: {result.setupFee} CZK
                          </div>
                        )}
                      </div>
                    ) : (
                      <div style={{ color: '#721c24', fontSize: '12px' }}>
                        Error: {result.error}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
              Tested at: {new Date(pricingData.timestamp).toLocaleString()}
            </div>
          </div>
        )}
      </div>

      {/* Product Detail - View and Clone Section */}
      <div style={{
        backgroundColor: '#f8f9fa',
        border: '1px solid #dee2e6',
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '20px'
      }}>
        <h3 style={{ margin: '0 0 15px 0', color: '#495057' }}>🔍 Product Detail - View and Clone</h3>

        {/* Dual Listbox Layout */}
        <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', marginBottom: '20px' }}>

          {/* Left Listbox - Available Products */}
          <div style={{ flex: '1', minWidth: '300px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#495057' }}>
              📋 Available Products ({leftProducts.length})
            </label>
            <select
              multiple
              size="10"
              value={selectedLeftProducts}
              onChange={e => {
                const values = Array.from(e.target.selectedOptions, option => option.value);
                setSelectedLeftProducts(values);
              }}
              style={{
                width: '100%',
                height: '250px',
                padding: '8px',
                border: '2px solid #ced4da',
                borderRadius: '6px',
                fontSize: '13px',
                backgroundColor: '#ffffff'
              }}
            >
              {leftProducts.map((product) => (
                <option key={product.id} value={product.id}>
                  ID: {product.id} — {product.name}
                </option>
              ))}
            </select>
            <div style={{ fontSize: '11px', color: '#6c757d', marginTop: '4px' }}>
              💡 Hold Ctrl/Cmd to select multiple products
            </div>
          </div>

          {/* Control Buttons */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            alignSelf: 'center',
            minWidth: '120px'
          }}>
            <button
              type="button"
              onClick={moveToRight}
              disabled={selectedLeftProducts.length === 0}
              style={{
                padding: '8px 12px',
                backgroundColor: selectedLeftProducts.length > 0 ? '#28a745' : '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: selectedLeftProducts.length > 0 ? 'pointer' : 'not-allowed',
                fontWeight: 'bold',
                fontSize: '12px'
              }}
            >
              ➡️ Move Selected
            </button>

            <button
              type="button"
              onClick={moveAllToRight}
              disabled={leftProducts.length === 0}
              style={{
                padding: '8px 12px',
                backgroundColor: leftProducts.length > 0 ? '#17a2b8' : '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: leftProducts.length > 0 ? 'pointer' : 'not-allowed',
                fontWeight: 'bold',
                fontSize: '12px'
              }}
            >
              ⏩ Move All
            </button>

            <button
              type="button"
              onClick={moveToLeft}
              disabled={selectedRightProducts.length === 0}
              style={{
                padding: '8px 12px',
                backgroundColor: selectedRightProducts.length > 0 ? '#ffc107' : '#6c757d',
                color: selectedRightProducts.length > 0 ? '#212529' : 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: selectedRightProducts.length > 0 ? 'pointer' : 'not-allowed',
                fontWeight: 'bold',
                fontSize: '12px'
              }}
            >
              ⬅️ Move Selected
            </button>

            <button
              type="button"
              onClick={moveAllToLeft}
              disabled={rightProducts.length === 0}
              style={{
                padding: '8px 12px',
                backgroundColor: rightProducts.length > 0 ? '#fd7e14' : '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: rightProducts.length > 0 ? 'pointer' : 'not-allowed',
                fontWeight: 'bold',
                fontSize: '12px'
              }}
            >
              ⏪ Move All
            </button>
          </div>

          {/* Right Listbox - Selected Products */}
          <div style={{ flex: '1', minWidth: '300px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#495057' }}>
              ✅ Selected Products ({rightProducts.length})
            </label>
            <select
              multiple
              size="10"
              value={selectedRightProducts}
              onChange={e => {
                const values = Array.from(e.target.selectedOptions, option => option.value);
                setSelectedRightProducts(values);
              }}
              style={{
                width: '100%',
                height: '250px',
                padding: '8px',
                border: '2px solid #28a745',
                borderRadius: '6px',
                fontSize: '13px',
                backgroundColor: '#f8fff8'
              }}
            >
              {rightProducts.map((product) => (
                <option key={product.id} value={product.id}>
                  ID: {product.id} — {product.name}
                </option>
              ))}
            </select>
            <div style={{ fontSize: '11px', color: '#6c757d', marginTop: '4px' }}>
              💡 Hold Ctrl/Cmd to select multiple products
            </div>

            {/* Action Buttons - positioned under right listbox */}
            <div style={{
              display: 'flex',
              gap: '8px',
              flexWrap: 'wrap',
              justifyContent: 'flex-start',
              marginTop: '10px'
            }}>
              <button
                type="button"
                onClick={() => {
                  if (rightProducts.length > 0) {
                    const firstProduct = rightProducts[0];
                    loadProductDetailWithCategories(firstProduct.id);
                  }
                }}
                disabled={rightProducts.length === 0 || loadingDetail}
                style={{
                  padding: '8px 12px',
                  backgroundColor: rightProducts.length > 0 ? '#007bff' : '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: rightProducts.length > 0 ? 'pointer' : 'not-allowed',
                  fontWeight: 'bold',
                  fontSize: '12px'
                }}
              >
                {loadingDetail ? '🔄' : `👁️ View Detail 1st (${rightProducts.length})`}
              </button>

              <button
                type="button"
                onClick={handleBulkView}
                disabled={rightProducts.length === 0 || loadingDetail}
                style={{
                  padding: '8px 12px',
                  backgroundColor: rightProducts.length > 0 ? '#17a2b8' : '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: rightProducts.length > 0 ? 'pointer' : 'not-allowed',
                  fontWeight: 'bold',
                  fontSize: '12px'
                }}
              >
                {loadingDetail ? '🔄' : `👁️ View Selected (${rightProducts.length})`}
              </button>

              <button
                type="button"
                onClick={handleBulkClone}
                disabled={rightProducts.length === 0 || cloneLoading}
                style={{
                  padding: '8px 12px',
                  backgroundColor: cloneLoading ? '#6c757d' : (rightProducts.length > 0 ? '#28a745' : '#6c757d'),
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: (rightProducts.length > 0 && !cloneLoading) ? 'pointer' : 'not-allowed',
                  fontWeight: 'bold',
                  fontSize: '12px'
                }}
              >
                {cloneLoading ? '🔄' : `📋 Clone Selected (${rightProducts.length})`}
              </button>

              <button
                type="button"
                onClick={handleBulkDelete}
                disabled={rightProducts.length === 0 || deleteLoading}
                style={{
                  padding: '8px 12px',
                  backgroundColor: deleteLoading ? '#6c757d' : (rightProducts.length > 0 ? '#dc3545' : '#6c757d'),
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: (rightProducts.length > 0 && !deleteLoading) ? 'pointer' : 'not-allowed',
                  fontWeight: 'bold',
                  fontSize: '12px'
                }}
              >
                {deleteLoading ? '🔄' : `🗑️ Delete Selected (${rightProducts.length})`}
              </button>
            </div>
          </div>
        </div>

        {/* Detailed View Product Display - View Detail 1st */}
        {detailedViewProduct && (
          <div style={{
            marginBottom: '20px',
            padding: '20px',
            backgroundColor: '#f0f8ff',
            border: '2px solid #007bff',
            borderRadius: '10px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, color: '#007bff' }}>
                👁️ Detailed Product View - {detailedViewProduct.name}
              </h3>
              <button
                onClick={() => setDetailedViewProduct(null)}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}
              >
                ✕ Close
              </button>
            </div>

            {/* HostBill API Categories Display */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '15px' }}>

              {/* 1. Connect with app */}
              <div style={{
                padding: '15px',
                backgroundColor: '#ffffff',
                border: '1px solid #dee2e6',
                borderRadius: '8px',
                borderLeft: '4px solid #007bff',
                position: 'relative'
              }}>
                <button
                  onClick={() => {
                    const detailsElement = document.getElementById(`connect-details-${detailedViewProduct.id}`);
                    if (detailsElement) {
                      detailsElement.style.display = detailsElement.style.display === 'none' ? 'block' : 'none';
                    }
                  }}
                  style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    padding: '4px 8px',
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '11px',
                    fontWeight: 'bold'
                  }}
                >
                  📋 Details
                </button>
                <h4 style={{ margin: '0 0 10px 0', color: '#007bff' }}>
                  🔗 1. Connect with app
                </h4>
                <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#6c757d' }}>
                  Připojení s aplikací/modulem
                </p>
                <div style={{ fontSize: '14px' }}>
                  <strong>Module:</strong> {detailedViewProduct.modname || detailedViewProduct.module || 'N/A'}<br/>
                  <strong>Type:</strong> {detailedViewProduct.ptype || detailedViewProduct.type || 'N/A'}<br/>
                  <strong>Server Type:</strong> {detailedViewProduct.servertype || 'N/A'}
                </div>

                {/* Detailed Connect with app info */}
                <div
                  id={`connect-details-${detailedViewProduct.id}`}
                  style={{
                    display: 'none',
                    marginTop: '15px',
                    padding: '10px',
                    backgroundColor: '#f8f9fa',
                    border: '1px solid #dee2e6',
                    borderRadius: '4px',
                    fontSize: '13px'
                  }}
                >
                  <h5 style={{ margin: '0 0 10px 0', color: '#007bff' }}>Connect with app - Detailed Info:</h5>
                  <div><strong>Module Name:</strong> {detailedViewProduct.modname || 'N/A'}</div>
                  <div><strong>Module Type:</strong> {detailedViewProduct.module || 'N/A'}</div>
                  <div><strong>Product Type:</strong> {detailedViewProduct.ptype || detailedViewProduct.type || 'N/A'}</div>
                  <div><strong>Server Type:</strong> {detailedViewProduct.servertype || 'N/A'}</div>
                  <div><strong>Server Group:</strong> {detailedViewProduct.server_group || 'N/A'}</div>
                  <div><strong>Module Settings:</strong> {detailedViewProduct.module_settings ? 'Configured' : 'Default'}</div>
                  <div><strong>API Connection:</strong> {detailedViewProduct.api_connection || 'Standard'}</div>
                </div>
              </div>

              {/* 2. Automation */}
              <div style={{
                padding: '15px',
                backgroundColor: '#ffffff',
                border: '1px solid #dee2e6',
                borderRadius: '8px',
                borderLeft: '4px solid #28a745',
                position: 'relative'
              }}>
                <button
                  onClick={() => {
                    const detailsElement = document.getElementById(`automation-details-${detailedViewProduct.id}`);
                    if (detailsElement) {
                      detailsElement.style.display = detailsElement.style.display === 'none' ? 'block' : 'none';
                    }
                  }}
                  style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    padding: '4px 8px',
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '11px',
                    fontWeight: 'bold'
                  }}
                >
                  📋 Details
                </button>
                <h4 style={{ margin: '0 0 10px 0', color: '#28a745' }}>
                  ⚙️ 2. Automation
                </h4>
                <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#6c757d' }}>
                  Automatizační skripty
                </p>
                <div style={{ fontSize: '14px' }}>
                  <strong>Auto Setup:</strong> {detailedViewProduct.autosetup || 'N/A'}<br/>
                  <strong>Welcome Email:</strong> {detailedViewProduct.welcome_email || 'N/A'}<br/>
                  <strong>Suspend Email:</strong> {detailedViewProduct.suspend_email || 'N/A'}
                </div>

                {/* Detailed Automation info */}
                <div
                  id={`automation-details-${detailedViewProduct.id}`}
                  style={{
                    display: 'none',
                    marginTop: '15px',
                    padding: '10px',
                    backgroundColor: '#f8f9fa',
                    border: '1px solid #dee2e6',
                    borderRadius: '4px',
                    fontSize: '13px'
                  }}
                >
                  <h5 style={{ margin: '0 0 10px 0', color: '#28a745' }}>Automation - Detailed Info:</h5>
                  <div><strong>Auto Setup:</strong> {detailedViewProduct.autosetup || 'N/A'}</div>
                  <div><strong>Welcome Email:</strong> {detailedViewProduct.welcome_email || 'N/A'}</div>
                  <div><strong>Suspend Email:</strong> {detailedViewProduct.suspend_email || 'N/A'}</div>
                  <div><strong>Terminate Email:</strong> {detailedViewProduct.terminate_email || 'N/A'}</div>
                  <div><strong>Auto Provision:</strong> {detailedViewProduct.auto_provision ? 'Enabled' : 'Disabled'}</div>
                  <div><strong>Auto Suspend:</strong> {detailedViewProduct.auto_suspend ? 'Enabled' : 'Disabled'}</div>
                  <div><strong>Auto Terminate:</strong> {detailedViewProduct.auto_terminate ? 'Enabled' : 'Disabled'}</div>
                  <div><strong>Provision Script:</strong> {detailedViewProduct.provision_script || 'N/A'}</div>
                </div>
              </div>

              {/* 3. Emails */}
              <div style={{
                padding: '15px',
                backgroundColor: '#ffffff',
                border: '1px solid #dee2e6',
                borderRadius: '8px',
                borderLeft: '4px solid #17a2b8',
                position: 'relative'
              }}>
                <button
                  onClick={() => {
                    const detailsElement = document.getElementById(`emails-details-${detailedViewProduct.id}`);
                    if (detailsElement) {
                      detailsElement.style.display = detailsElement.style.display === 'none' ? 'block' : 'none';
                    }
                  }}
                  style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    padding: '4px 8px',
                    backgroundColor: '#17a2b8',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '11px',
                    fontWeight: 'bold'
                  }}
                >
                  📋 Details
                </button>
                <h4 style={{ margin: '0 0 10px 0', color: '#17a2b8' }}>
                  📧 3. Emails
                </h4>
                <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#6c757d' }}>
                  Email šablony
                </p>
                <div style={{ fontSize: '14px' }}>
                  <strong>Email Templates:</strong> {detailedViewProduct.email_templates ? 'Configured' : 'Default'}<br/>
                  <strong>Notifications:</strong> {detailedViewProduct.notifications || 'Standard'}<br/>
                  <strong>Email Type:</strong> {detailedViewProduct.email_type || 'HTML'}
                </div>

                {/* Detailed Emails info */}
                <div
                  id={`emails-details-${detailedViewProduct.id}`}
                  style={{
                    display: 'none',
                    marginTop: '15px',
                    padding: '10px',
                    backgroundColor: '#f8f9fa',
                    border: '1px solid #dee2e6',
                    borderRadius: '4px',
                    fontSize: '13px'
                  }}
                >
                  <h5 style={{ margin: '0 0 10px 0', color: '#17a2b8' }}>Emails - Detailed Info:</h5>
                  <div><strong>Email Templates:</strong> {detailedViewProduct.email_templates ? 'Configured' : 'Default'}</div>
                  <div><strong>Notifications:</strong> {detailedViewProduct.notifications || 'Standard'}</div>
                  <div><strong>Email Type:</strong> {detailedViewProduct.email_type || 'HTML'}</div>
                  <div><strong>Welcome Email Template:</strong> {detailedViewProduct.welcome_email_template || 'Default'}</div>
                  <div><strong>Suspend Email Template:</strong> {detailedViewProduct.suspend_email_template || 'Default'}</div>
                  <div><strong>Terminate Email Template:</strong> {detailedViewProduct.terminate_email_template || 'Default'}</div>
                  <div><strong>Email Notifications:</strong> {detailedViewProduct.email_notifications ? 'Enabled' : 'Disabled'}</div>
                  <div><strong>Admin Notifications:</strong> {detailedViewProduct.admin_notifications ? 'Enabled' : 'Disabled'}</div>
                </div>
              </div>

              {/* 4. Components */}
              <div style={{
                padding: '15px',
                backgroundColor: '#ffffff',
                border: '1px solid #dee2e6',
                borderRadius: '8px',
                borderLeft: '4px solid #ffc107',
                position: 'relative'
              }}>
                <button
                  onClick={() => {
                    const detailsElement = document.getElementById(`components-details-${detailedViewProduct.id}`);
                    if (detailsElement) {
                      detailsElement.style.display = detailsElement.style.display === 'none' ? 'block' : 'none';
                    }
                  }}
                  style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    padding: '4px 8px',
                    backgroundColor: '#ffc107',
                    color: '#212529',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '11px',
                    fontWeight: 'bold'
                  }}
                >
                  📋 Details
                </button>
                <h4 style={{ margin: '0 0 10px 0', color: '#e67e22' }}>
                  🧩 4. Components ⭐
                </h4>
                <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#6c757d' }}>
                  Komponenty/Form fields
                </p>
                <div style={{ fontSize: '14px', marginBottom: '10px' }}>
                  <strong>Modules:</strong> {detailedViewProduct.modules?.length || 0}<br/>
                  <strong>Options:</strong> {detailedViewProduct.modules?.[0]?.options ? Object.keys(detailedViewProduct.modules[0].options).length : 0}<br/>
                  <strong>Custom Fields:</strong> {detailedViewProduct.custom_fields?.length || 0}
                </div>

                {/* Detailed Components info */}
                <div
                  id={`components-details-${detailedViewProduct.id}`}
                  style={{
                    display: 'none',
                    marginTop: '15px',
                    padding: '10px',
                    backgroundColor: '#f8f9fa',
                    border: '1px solid #dee2e6',
                    borderRadius: '4px',
                    fontSize: '13px'
                  }}
                >
                  <h5 style={{ margin: '0 0 10px 0', color: '#e67e22' }}>Components - Detailed Info:</h5>
                  <div><strong>Total Modules:</strong> {detailedViewProduct.modules?.length || 0}</div>
                  <div><strong>Module Name:</strong> {detailedViewProduct.modules?.[0]?.modname || detailedViewProduct.modname || 'N/A'}</div>
                  <div><strong>Module File:</strong> {detailedViewProduct.modules?.[0]?.filename || 'N/A'}</div>
                  <div><strong>Module ID:</strong> {detailedViewProduct.modules?.[0]?.module || 'N/A'}</div>
                  <div><strong>Main Module:</strong> {detailedViewProduct.modules?.[0]?.main ? 'Yes' : 'No'}</div>
                  <div><strong>Total Options:</strong> {detailedViewProduct.modules?.[0]?.options ? Object.keys(detailedViewProduct.modules[0].options).length : 0}</div>
                  <div><strong>Custom Fields:</strong> {detailedViewProduct.custom_fields?.length || 0}</div>
                  <div><strong>Form Fields:</strong> {detailedViewProduct.form_fields?.length || 0}</div>
                  <div><strong>Configuration Fields:</strong> {detailedViewProduct.config_fields?.length || 0}</div>

                  {/* Server Configuration */}
                  {detailedViewProduct.modules?.[0]?.server && (
                    <>
                      <div><strong>Server Assignment:</strong> Available</div>
                      <div><strong>Assigned Server IDs:</strong> {Object.keys(detailedViewProduct.modules[0].server).join(', ')}</div>
                    </>
                  )}

                  {/* All Module Options */}
                  {detailedViewProduct.modules?.[0]?.options && (
                    <>
                      <div style={{ marginTop: '10px', marginBottom: '5px' }}>
                        <strong>All Module Options ({Object.keys(detailedViewProduct.modules[0].options).length}):</strong>
                      </div>
                      <div style={{
                        maxHeight: '400px',
                        overflowY: 'auto',
                        backgroundColor: '#ffffff',
                        border: '1px solid #dee2e6',
                        borderRadius: '4px',
                        padding: '10px',
                        marginLeft: '15px'
                      }}>
                        {Object.entries(detailedViewProduct.modules[0].options).map(([key, value]) => (
                          <div key={key} style={{
                            marginBottom: '8px',
                            padding: '8px',
                            backgroundColor: '#f8f9fa',
                            border: '1px solid #e9ecef',
                            borderRadius: '3px',
                            borderLeft: '3px solid #ffc107'
                          }}>
                            <div style={{
                              fontWeight: 'bold',
                              color: '#e67e22',
                              marginBottom: '4px',
                              fontSize: '13px'
                            }}>
                              {key}
                            </div>
                            <div style={{ fontSize: '12px', color: '#495057' }}>
                              {typeof value === 'object' ? (
                                <div>
                                  <div><strong>Type:</strong> {value.type || 'object'}</div>
                                  <div><strong>Value:</strong> {
                                    typeof value.value === 'object'
                                      ? 'Complex structure'
                                      : String(value.value) || 'N/A'
                                  }</div>
                                  {value.default && (
                                    <div><strong>Default:</strong> {
                                      Array.isArray(value.default)
                                        ? value.default.join(', ')
                                        : String(value.default)
                                    }</div>
                                  )}
                                  {value.variable && (
                                    <div><strong>Variable:</strong> {value.variable}</div>
                                  )}
                                  {value.multiple && (
                                    <div><strong>Multiple:</strong> Yes</div>
                                  )}
                                </div>
                              ) : (
                                <div><strong>Value:</strong> {String(value) || 'N/A'}</div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  {/* Default Options Summary */}
                  {detailedViewProduct.modules?.[0]?.default && (
                    <>
                      <div style={{ marginTop: '10px' }}><strong>Default Configuration:</strong> Available</div>
                      <div><strong>Default Options Count:</strong> {Object.keys(detailedViewProduct.modules[0].default).length}</div>
                    </>
                  )}
                </div>

                {/* Show detailed options if available */}
                {detailedViewProduct.modules?.[0]?.options && Object.keys(detailedViewProduct.modules[0].options).length > 0 && (
                  <div style={{ marginTop: '10px' }}>
                    <button
                      onClick={() => {
                        const optionsElement = document.getElementById(`options-${detailedViewProduct.id}`);
                        if (optionsElement) {
                          optionsElement.style.display = optionsElement.style.display === 'none' ? 'block' : 'none';
                        }
                      }}
                      style={{
                        padding: '4px 8px',
                        backgroundColor: '#ffc107',
                        color: '#212529',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: 'bold'
                      }}
                    >
                      📋 Show/Hide Options ({Object.keys(detailedViewProduct.modules[0].options).length})
                    </button>

                    <div
                      id={`options-${detailedViewProduct.id}`}
                      style={{
                        display: 'none',
                        marginTop: '10px',
                        maxHeight: '300px',
                        overflowY: 'auto',
                        backgroundColor: '#f8f9fa',
                        border: '1px solid #dee2e6',
                        borderRadius: '4px',
                        padding: '10px'
                      }}
                    >
                      <h5 style={{ margin: '0 0 10px 0', color: '#495057' }}>Module Options:</h5>
                      <div style={{ fontSize: '12px' }}>
                        {Object.entries(detailedViewProduct.modules[0].options).slice(0, 20).map(([key, value]) => (
                          <div key={key} style={{
                            marginBottom: '8px',
                            padding: '6px',
                            backgroundColor: '#ffffff',
                            border: '1px solid #e9ecef',
                            borderRadius: '3px'
                          }}>
                            <strong style={{ color: '#007bff' }}>{key}:</strong>
                            <div style={{ marginTop: '2px', color: '#6c757d' }}>
                              {typeof value === 'object' ? (
                                <pre style={{ margin: 0, fontSize: '11px', whiteSpace: 'pre-wrap' }}>
                                  {JSON.stringify(value, null, 2)}
                                </pre>
                              ) : (
                                <span>{String(value) || 'N/A'}</span>
                              )}
                            </div>
                          </div>
                        ))}
                        {Object.keys(detailedViewProduct.modules[0].options).length > 20 && (
                          <div style={{
                            padding: '8px',
                            textAlign: 'center',
                            color: '#6c757d',
                            fontStyle: 'italic'
                          }}>
                            ... and {Object.keys(detailedViewProduct.modules[0].options).length - 20} more options
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 5. Other settings */}
              <div style={{
                padding: '15px',
                backgroundColor: '#ffffff',
                border: '1px solid #dee2e6',
                borderRadius: '8px',
                borderLeft: '4px solid #6f42c1',
                position: 'relative'
              }}>
                <button
                  onClick={() => {
                    const detailsElement = document.getElementById(`other-details-${detailedViewProduct.id}`);
                    if (detailsElement) {
                      detailsElement.style.display = detailsElement.style.display === 'none' ? 'block' : 'none';
                    }
                  }}
                  style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    padding: '4px 8px',
                    backgroundColor: '#6f42c1',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '11px',
                    fontWeight: 'bold'
                  }}
                >
                  📋 Details
                </button>
                <h4 style={{ margin: '0 0 10px 0', color: '#6f42c1' }}>
                  ⚙️ 5. Other settings
                </h4>
                <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#6c757d' }}>
                  Ostatní nastavení
                </p>
                <div style={{ fontSize: '14px' }}>
                  <strong>Visible:</strong> {detailedViewProduct.visible ? 'Yes' : 'No'}<br/>
                  <strong>Order:</strong> {detailedViewProduct.order || 'Default'}<br/>
                  <strong>Stock Control:</strong> {detailedViewProduct.stock_control || 'Disabled'}
                </div>

                {/* Detailed Other settings info */}
                <div
                  id={`other-details-${detailedViewProduct.id}`}
                  style={{
                    display: 'none',
                    marginTop: '15px',
                    padding: '10px',
                    backgroundColor: '#f8f9fa',
                    border: '1px solid #dee2e6',
                    borderRadius: '4px',
                    fontSize: '13px'
                  }}
                >
                  <h5 style={{ margin: '0 0 10px 0', color: '#6f42c1' }}>Other settings - Detailed Info:</h5>
                  <div><strong>Visible:</strong> {detailedViewProduct.visible ? 'Yes' : 'No'}</div>
                  <div><strong>Order:</strong> {detailedViewProduct.order || 'Default'}</div>
                  <div><strong>Stock Control:</strong> {detailedViewProduct.stock_control || 'Disabled'}</div>
                  <div><strong>Stock Quantity:</strong> {detailedViewProduct.stock_quantity || 'Unlimited'}</div>
                  <div><strong>Weight:</strong> {detailedViewProduct.weight || 'N/A'}</div>
                  <div><strong>Tax Class:</strong> {detailedViewProduct.tax_class || 'Default'}</div>
                  <div><strong>Require Domain:</strong> {detailedViewProduct.require_domain ? 'Yes' : 'No'}</div>
                  <div><strong>Allow Subdomains:</strong> {detailedViewProduct.allow_subdomains ? 'Yes' : 'No'}</div>
                </div>
              </div>

              {/* 6. Client functions */}
              <div style={{
                padding: '15px',
                backgroundColor: '#ffffff',
                border: '1px solid #dee2e6',
                borderRadius: '8px',
                borderLeft: '4px solid #fd7e14',
                position: 'relative'
              }}>
                <button
                  onClick={() => {
                    const detailsElement = document.getElementById(`client-details-${detailedViewProduct.id}`);
                    if (detailsElement) {
                      detailsElement.style.display = detailsElement.style.display === 'none' ? 'block' : 'none';
                    }
                  }}
                  style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    padding: '4px 8px',
                    backgroundColor: '#fd7e14',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '11px',
                    fontWeight: 'bold'
                  }}
                >
                  📋 Details
                </button>
                <h4 style={{ margin: '0 0 10px 0', color: '#fd7e14' }}>
                  👤 6. Client functions
                </h4>
                <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#6c757d' }}>
                  Klientské funkce
                </p>
                <div style={{ fontSize: '14px' }}>
                  <strong>Client Area:</strong> {detailedViewProduct.client_area || 'Standard'}<br/>
                  <strong>Upgrades:</strong> {detailedViewProduct.allow_upgrades ? 'Allowed' : 'Disabled'}<br/>
                  <strong>Downgrades:</strong> {detailedViewProduct.allow_downgrades ? 'Allowed' : 'Disabled'}
                </div>

                {/* Detailed Client functions info */}
                <div
                  id={`client-details-${detailedViewProduct.id}`}
                  style={{
                    display: 'none',
                    marginTop: '15px',
                    padding: '10px',
                    backgroundColor: '#f8f9fa',
                    border: '1px solid #dee2e6',
                    borderRadius: '4px',
                    fontSize: '13px'
                  }}
                >
                  <h5 style={{ margin: '0 0 10px 0', color: '#fd7e14' }}>Client functions - Detailed Info:</h5>
                  <div><strong>Client Area:</strong> {detailedViewProduct.client_area || 'Standard'}</div>
                  <div><strong>Allow Upgrades:</strong> {detailedViewProduct.allow_upgrades ? 'Allowed' : 'Disabled'}</div>
                  <div><strong>Allow Downgrades:</strong> {detailedViewProduct.allow_downgrades ? 'Allowed' : 'Disabled'}</div>
                  <div><strong>Client Functions:</strong> {detailedViewProduct.client_functions || 'Standard'}</div>
                  <div><strong>Control Panel:</strong> {detailedViewProduct.control_panel || 'N/A'}</div>
                  <div><strong>Login URL:</strong> {detailedViewProduct.login_url || 'N/A'}</div>
                  <div><strong>Client Actions:</strong> {detailedViewProduct.client_actions || 'Standard'}</div>
                  <div><strong>Self Management:</strong> {detailedViewProduct.self_management ? 'Enabled' : 'Disabled'}</div>
                </div>
              </div>

              {/* 7. Price */}
              <div style={{
                padding: '15px',
                backgroundColor: '#ffffff',
                border: '1px solid #dee2e6',
                borderRadius: '8px',
                borderLeft: '4px solid #dc3545',
                position: 'relative'
              }}>
                <button
                  onClick={() => {
                    const detailsElement = document.getElementById(`price-details-${detailedViewProduct.id}`);
                    if (detailsElement) {
                      detailsElement.style.display = detailsElement.style.display === 'none' ? 'block' : 'none';
                    }
                  }}
                  style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    padding: '4px 8px',
                    backgroundColor: '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '11px',
                    fontWeight: 'bold'
                  }}
                >
                  📋 Details
                </button>
                <h4 style={{ margin: '0 0 10px 0', color: '#dc3545' }}>
                  💰 7. Price
                </h4>
                <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#6c757d' }}>
                  Ceny
                </p>
                <div style={{ fontSize: '14px' }}>
                  <strong>Monthly:</strong> {detailedViewProduct.m ? `${detailedViewProduct.m} CZK` : 'N/A'}<br/>
                  <strong>Quarterly:</strong> {detailedViewProduct.q ? `${detailedViewProduct.q} CZK` : 'N/A'}<br/>
                  <strong>Annually:</strong> {detailedViewProduct.a ? `${detailedViewProduct.a} CZK` : 'N/A'}<br/>
                  <strong>Setup Fee:</strong> {detailedViewProduct.setup_fee ? `${detailedViewProduct.setup_fee} CZK` : 'Free'}
                </div>

                {/* Detailed Price info */}
                <div
                  id={`price-details-${detailedViewProduct.id}`}
                  style={{
                    display: 'none',
                    marginTop: '15px',
                    padding: '10px',
                    backgroundColor: '#f8f9fa',
                    border: '1px solid #dee2e6',
                    borderRadius: '4px',
                    fontSize: '13px'
                  }}
                >
                  <h5 style={{ margin: '0 0 10px 0', color: '#dc3545' }}>Price - Detailed Info:</h5>
                  <div><strong>Monthly (m):</strong> {detailedViewProduct.m ? `${detailedViewProduct.m} CZK` : 'N/A'}</div>
                  <div><strong>Quarterly (q):</strong> {detailedViewProduct.q ? `${detailedViewProduct.q} CZK` : 'N/A'}</div>
                  <div><strong>Semi-annually (s):</strong> {detailedViewProduct.s ? `${detailedViewProduct.s} CZK` : 'N/A'}</div>
                  <div><strong>Annually (a):</strong> {detailedViewProduct.a ? `${detailedViewProduct.a} CZK` : 'N/A'}</div>
                  <div><strong>Biennially (b):</strong> {detailedViewProduct.b ? `${detailedViewProduct.b} CZK` : 'N/A'}</div>
                  <div><strong>Triennially (t):</strong> {detailedViewProduct.t ? `${detailedViewProduct.t} CZK` : 'N/A'}</div>
                  <div><strong>Setup Fee:</strong> {detailedViewProduct.setup_fee ? `${detailedViewProduct.setup_fee} CZK` : 'Free'}</div>
                  <div><strong>Currency:</strong> {detailedViewProduct.currency || 'CZK'}</div>
                  <div><strong>Tax Exempt:</strong> {detailedViewProduct.tax_exempt ? 'Yes' : 'No'}</div>
                </div>
              </div>
            </div>

            {/* Basic Product Info */}
            <div style={{
              marginTop: '20px',
              padding: '15px',
              backgroundColor: '#f8f9fa',
              border: '1px solid #dee2e6',
              borderRadius: '8px'
            }}>
              <h4 style={{ margin: '0 0 10px 0', color: '#495057' }}>
                📋 Basic Product Information
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', fontSize: '14px' }}>
                <div><strong>ID:</strong> {detailedViewProduct.id}</div>
                <div><strong>Name:</strong> {detailedViewProduct.name}</div>
                <div><strong>Category:</strong> {detailedViewProduct.category}</div>
                <div><strong>Description:</strong> {detailedViewProduct.description || 'N/A'}</div>
              </div>
            </div>
          </div>
        )}

        {/* Bulk View Details Display */}
        {bulkViewDetails && bulkViewDetails.length > 0 && (
          <div style={{
            marginBottom: '20px',
            padding: '15px',
            backgroundColor: '#e7f3ff',
            border: '1px solid #b3d9ff',
            borderRadius: '8px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h4 style={{ margin: 0, color: '#0056b3' }}>
                👁️ Product Details ({bulkViewDetails.length} products)
              </h4>
              <button
                onClick={() => setBulkViewDetails(null)}
                style={{
                  padding: '4px 8px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                ✕ Close
              </button>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '13px'
              }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8f9fa' }}>
                    <th style={{ padding: '8px', border: '1px solid #dee2e6', textAlign: 'left' }}>ID</th>
                    <th style={{ padding: '8px', border: '1px solid #dee2e6', textAlign: 'left' }}>Name</th>
                    <th style={{ padding: '8px', border: '1px solid #dee2e6', textAlign: 'left' }}>Category</th>
                    <th style={{ padding: '8px', border: '1px solid #dee2e6', textAlign: 'left' }}>Type</th>
                    <th style={{ padding: '8px', border: '1px solid #dee2e6', textAlign: 'left' }}>Monthly Price</th>
                    <th style={{ padding: '8px', border: '1px solid #dee2e6', textAlign: 'left' }}>Module</th>
                  </tr>
                </thead>
                <tbody>
                  {bulkViewDetails.map((product, index) => (
                    <tr key={product.id} style={{ backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8f9fa' }}>
                      <td style={{ padding: '8px', border: '1px solid #dee2e6' }}>{product.id}</td>
                      <td style={{ padding: '8px', border: '1px solid #dee2e6', fontWeight: 'bold' }}>
                        {product.name}
                      </td>
                      <td style={{ padding: '8px', border: '1px solid #dee2e6' }}>{product.category}</td>
                      <td style={{ padding: '8px', border: '1px solid #dee2e6' }}>{product.ptype || product.type}</td>
                      <td style={{ padding: '8px', border: '1px solid #dee2e6' }}>
                        {product.m ? `${product.m} CZK` : 'N/A'}
                      </td>
                      <td style={{ padding: '8px', border: '1px solid #dee2e6' }}>{product.modname || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Bulk Delete Result Display */}
        {bulkDeleteResult && (
          <div style={{
            marginBottom: '15px',
            padding: '12px',
            borderRadius: '6px',
            backgroundColor: bulkDeleteResult.success ? '#d4edda' : '#f8d7da',
            border: `1px solid ${bulkDeleteResult.success ? '#c3e6cb' : '#f5c6cb'}`,
            color: bulkDeleteResult.success ? '#155724' : '#721c24'
          }}>
            {bulkDeleteResult.success ? (
              <div>
                <strong>✅ Bulk delete completed!</strong>
                <div style={{ marginTop: '5px', fontSize: '0.9em' }}>
                  Successfully deleted: {bulkDeleteResult.deletedCount}/{bulkDeleteResult.totalCount} products
                  {bulkDeleteResult.failedCount > 0 && (
                    <span style={{ color: '#856404' }}> (Failed: {bulkDeleteResult.failedCount})</span>
                  )}
                </div>
                <div style={{ marginTop: '5px', fontSize: '0.85em', color: '#0c5460' }}>
                  Products list has been refreshed automatically.
                </div>
              </div>
            ) : (
              <div>
                <strong>❌ Bulk delete failed:</strong> {bulkDeleteResult.error}
              </div>
            )}
          </div>
        )}

        {/* Bulk Clone Result Display */}
        {bulkCloneResult && (
          <div style={{
            marginBottom: '15px',
            padding: '12px',
            borderRadius: '6px',
            backgroundColor: bulkCloneResult.success ? '#d4edda' : '#f8d7da',
            border: `1px solid ${bulkCloneResult.success ? '#c3e6cb' : '#f5c6cb'}`,
            color: bulkCloneResult.success ? '#155724' : '#721c24'
          }}>
            {bulkCloneResult.success ? (
              <div>
                <strong>✅ Bulk clone completed!</strong>
                <div style={{ marginTop: '5px', fontSize: '0.9em' }}>
                  Successfully cloned: {bulkCloneResult.clonedCount}/{bulkCloneResult.totalCount} products
                  {bulkCloneResult.failedCount > 0 && (
                    <span style={{ color: '#856404' }}> (Failed: {bulkCloneResult.failedCount})</span>
                  )}
                </div>
                {bulkCloneResult.results && (
                  <div style={{ marginTop: '8px', fontSize: '0.85em' }}>
                    <strong>Cloned products:</strong>
                    <ul style={{ margin: '4px 0', paddingLeft: '20px' }}>
                      {bulkCloneResult.results.filter(r => r.success).map((result, index) => (
                        <li key={index}>
                          {result.source} → {result.target} (ID: {result.id})
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <div style={{ marginTop: '5px', fontSize: '0.85em', color: '#0c5460' }}>
                  Products list has been refreshed automatically.
                </div>
              </div>
            ) : (
              <div>
                <strong>❌ Bulk clone failed:</strong> {bulkCloneResult.error}
              </div>
            )}
          </div>
        )}

        {/* Delete Result Display */}
        {deleteResult && (
          <div style={{
            marginBottom: '15px',
            padding: '12px',
            borderRadius: '6px',
            backgroundColor: deleteResult.success ? '#d4edda' : '#f8d7da',
            border: `1px solid ${deleteResult.success ? '#c3e6cb' : '#f5c6cb'}`,
            color: deleteResult.success ? '#155724' : '#721c24'
          }}>
            {deleteResult.success ? (
              <div>
                <strong>✅ Product deleted successfully!</strong>
                <div style={{ marginTop: '5px', fontSize: '0.9em' }}>
                  Deleted: {deleteResult.deletedProduct?.name} (ID: {deleteResult.deletedProduct?.id})
                </div>
                <div style={{ marginTop: '5px', fontSize: '0.85em', color: '#0c5460' }}>
                  Products list will be refreshed automatically.
                </div>
              </div>
            ) : (
              <div>
                <strong>❌ Delete failed:</strong> {deleteResult.error}
              </div>
            )}
          </div>
        )}

        {/* Product Detail Display */}
        {fromDetail && renderProductDetail(fromDetail)}

        {/* Clone Product Section */}
        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e9ecef',
          borderRadius: '6px',
          padding: '15px'
        }}>
          <h4 style={{ margin: '0 0 15px 0', color: '#495057' }}>📋 Clone Product Settings</h4>

          <form onSubmit={handleClone}>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Source Product:
              </label>
              <select
                value={fromProduct}
                onChange={e => {
                  setFromProduct(e.target.value);
                  setFromDetail(null);
                }}
                required
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px'
                }}
              >
                <option value="">--Select Source Product--</option>
                {allProducts.map((p) => (
                  <option key={p.id} value={p.id}>
                    ID: {p.id} — {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Target Product:
              </label>
              <select
                value={isCreatingNew ? 'CREATE_NEW' : toProduct}
                onChange={e => {
                  if (e.target.value === 'CREATE_NEW') {
                    setIsCreatingNew(true);
                    setToProduct('');
                    setToDetail(null);
                  } else {
                    setIsCreatingNew(false);
                    setToProduct(e.target.value);
                    setToDetail(null);
                    setNewProductName('');
                  }
                }}
                required
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px'
                }}
              >
                <option value="">--Select Target Product--</option>
                <option value="CREATE_NEW">🆕 Create New Product</option>
                {allProducts.map((p) => (
                  <option key={p.id} value={p.id}>
                    ID: {p.id} — {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* New Product Name Input - shown when Create New is selected */}
            {isCreatingNew && (
              <div style={{
                marginBottom: '15px',
                backgroundColor: '#f8f9fa',
                border: '1px solid #dee2e6',
                borderRadius: '6px',
                padding: '15px'
              }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#495057' }}>
                  🆕 New Product Name:
                </label>
                <input
                  type="text"
                  value={newProductName}
                  onChange={e => setNewProductName(e.target.value)}
                  placeholder="Enter name for the new product..."
                  required={isCreatingNew}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ced4da',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                />
                <div style={{
                  marginTop: '5px',
                  fontSize: '12px',
                  color: '#6c757d'
                }}>
                  💡 A new product will be created with this name. <strong>By default, ALL settings are selected</strong> for complete copy. You can uncheck specific categories if you want to copy only selected settings. Pricing is always copied accurately using editProduct API.
                </div>
              </div>
            )}

            <div style={{ marginBottom: '15px' }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                <label style={{ fontWeight: 'bold', marginRight: '15px' }}>
                  Clone Settings:
                </label>
                <button
                  type="button"
                  onClick={handleSelectAllSettings}
                  style={{
                    padding: '4px 8px',
                    fontSize: '12px',
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '3px',
                    cursor: 'pointer'
                  }}
                >
                  {cloneSettings.length === SETTINGS_LABELS.length ? '❌ Deselect All' : '✅ Select All'}
                </button>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {SETTINGS_LABELS.map(({ id, label }) => (
                  <label key={id} style={{ display: 'flex', alignItems: 'center', marginRight: '15px' }}>
                    <input
                      type="checkbox"
                      checked={cloneSettings.includes(id)}
                      onChange={() => handleCloneSettingsChange(id)}
                      style={{ marginRight: '5px' }}
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={cloneLoading}
              style={{
                padding: '10px 20px',
                backgroundColor: cloneLoading ? '#6c757d' : (isCreatingNew ? '#007bff' : '#28a745'),
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: cloneLoading ? 'not-allowed' : 'pointer',
                fontWeight: 'bold'
              }}
            >
              {cloneLoading
                ? (isCreatingNew ? '🔄 Creating New Product...' : '🔄 Cloning...')
                : (isCreatingNew ? '🆕 Clone New Product' : '📋 Clone Product')
              }
            </button>
          </form>

          {cloneResult && (
            <div style={{
              marginTop: '15px',
              padding: '10px',
              borderRadius: '4px',
              backgroundColor: cloneResult.success ? '#d4edda' : '#f8d7da',
              border: `1px solid ${cloneResult.success ? '#c3e6cb' : '#f5c6cb'}`,
              color: cloneResult.success ? '#155724' : '#721c24'
            }}>
              {cloneResult.success ? (
                <div>
                  <strong>✅ Product cloned successfully!</strong>
                  <div style={{ marginTop: '5px', fontSize: '0.9em' }}>
                    {cloneResult.message || 'Clone operation completed'}
                  </div>

                  {/* Components Warning */}
                  {cloneResult.componentsWarning && (
                    <div style={{
                      marginTop: '10px',
                      padding: '8px',
                      backgroundColor: '#fff3cd',
                      border: '1px solid #ffeaa7',
                      borderRadius: '4px',
                      color: '#856404'
                    }}>
                      <strong>⚠️ Components Notice:</strong>
                      <div style={{ fontSize: '0.85em', marginTop: '3px' }}>
                        {cloneResult.componentsWarning.message}
                      </div>
                      <div style={{ fontSize: '0.8em', marginTop: '3px', fontStyle: 'italic' }}>
                        {cloneResult.componentsWarning.action}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <strong>❌ Clone failed:</strong> {cloneResult.error || 'Unknown error'}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div style={{
        backgroundColor: '#e2e3e5',
        border: '1px solid #d6d8db',
        borderRadius: '8px',
        padding: '15px'
      }}>
        <h3 style={{ margin: '0 0 10px 0', color: '#383d41' }}>ℹ️ Information</h3>
        <ul style={{ margin: 0, paddingLeft: '20px', color: '#383d41' }}>
          <li>This test uses middleware API instead of direct HostBill calls</li>
          <li>Middleware server (systrix-middleware-nextjs) must be running on port 3005</li>
          <li>Products include commission information for the specified affiliate</li>
          <li>Communication goes EXCLUSIVELY via middleware (no fallback)</li>
          <li>Data source: Middleware → HostBill API</li>
          <li><strong>NEW:</strong> Product Pricing Test diagnoses billing cycle pricing issues</li>
          <li><strong>NEW:</strong> Product Detail - View and Clone with dual listbox interface for selecting and managing multiple products with move buttons and bulk operations (View Detail 1st shows comprehensive product details organized by 7 HostBill API categories, each with expandable Details button showing structured information, Components section displays ALL 142 module options in scrollable format with detailed parsing, View Selected, Clone Selected, Delete Selected - all buttons show selected count in parentheses)</li>
          <li><strong>FIXED:</strong> Create New Product option with CORRECTED settings according to official HostBill API documentation (7 settings instead of 9) - Components cloning should now work properly with accurate settings mapping</li>
          <li><strong>NEW:</strong> Delete Product functionality - red button next to View Details with confirmation dialog and automatic list refresh</li>
          <li><strong>ENHANCED:</strong> Product details display shows all 9 SETTINGS_LABELS sections with comprehensive information</li>
          <li><strong>SETTINGS:</strong> Updated to include all 9 HostBill settings (General, Pricing, Configuration, Components, Emails, Related products, Automation scripts, Order process, Domain settings)</li>
          <li><strong>MIDDLEWARE ENDPOINTS:</strong> /api/affiliate/1/products, /api/hostbill/product-detail, /api/hostbill/clone-product, /api/hostbill/clone-new-product, /api/hostbill/delete-product</li>
        </ul>
      </div>
    </div>
  );
}
