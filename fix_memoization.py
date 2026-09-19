import re
import os

def apply_memoization(file_path):
    with open(file_path, 'r') as f:
        content = f.read()
    
    changed = False

    # Check and add useMemo to imports if missing
    if 'useMemo' not in content:
        content = content.replace("import React, { useState", "import React, { useState, useMemo")
        changed = True

    # 1. StoresManager
    if 'StoresManager.tsx' in file_path:
        # allServiceCategories
        if "const allServiceCategories = getAllServiceCategories(safeCategories, safeStores);" in content:
            content = content.replace(
                "const allServiceCategories = getAllServiceCategories(safeCategories, safeStores);",
                "const allServiceCategories = useMemo(() => getAllServiceCategories(safeCategories, safeStores), [safeCategories, safeStores]);"
            )
            changed = True
        
        # filteredStores
        bad_filter = """  const filteredStores = safeStores.filter(s => {
    const activityName = (s.activityType || s.categoryName || '').toLowerCase();
    const matchesSearch = !searchTerm.trim() || 
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activityName.includes(searchTerm.toLowerCase());
    const matchesService = isStoreInServiceCategory(s, selectedService, safeCategories);
    const matchesStatus = selectedStatus === 'all' || s.status === selectedStatus;
    return matchesSearch && matchesService && matchesStatus;
  });"""
        good_filter = """  const filteredStores = useMemo(() => safeStores.filter(s => {
    const activityName = (s.activityType || s.categoryName || '').toLowerCase();
    const matchesSearch = !searchTerm.trim() || 
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activityName.includes(searchTerm.toLowerCase());
    const matchesService = isStoreInServiceCategory(s, selectedService, safeCategories);
    const matchesStatus = selectedStatus === 'all' || s.status === selectedStatus;
    return matchesSearch && matchesService && matchesStatus;
  }), [safeStores, searchTerm, selectedService, safeCategories, selectedStatus]);"""
        if bad_filter in content:
            content = content.replace(bad_filter, good_filter)
            changed = True
            
    # 2. ProductsManager
    if 'ProductsManager.tsx' in file_path:
        bad_filter_prod = """  const filteredProducts = products.filter(p => {
    // 1. Search Filter
    const matchesSearch = !searchTerm.trim() || 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.description || '').toLowerCase().includes(searchTerm.toLowerCase());

    // 2. Store Filter
    const matchesStore = selectedStore === 'all' || p.storeId === selectedStore;

    // 3. Category Filter
    const matchesCategory = selectedCategory === 'all' || p.categoryId === selectedCategory;

    // 4. Stock Filter
    const matchesStock = stockFilter === 'all' || 
      (stockFilter === 'inStock' && (p.isAvailable !== false && p.stockStatus !== 'out_of_stock')) ||
      (stockFilter === 'outOfStock' && (p.isAvailable === false || p.stockStatus === 'out_of_stock'));

    // 5. Price Filter
    const price = typeof p.price === 'number' ? p.price : 0;
    const matchesMinPrice = !minPrice || price >= parseFloat(minPrice);
    const matchesMaxPrice = !maxPrice || price <= parseFloat(maxPrice);

    return matchesSearch && matchesStore && matchesCategory && matchesStock && matchesMinPrice && matchesMaxPrice;
  }).sort((a, b) => {"""
        good_filter_prod = """  const filteredProducts = useMemo(() => products.filter(p => {
    // 1. Search Filter
    const matchesSearch = !searchTerm.trim() || 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.description || '').toLowerCase().includes(searchTerm.toLowerCase());

    // 2. Store Filter
    const matchesStore = selectedStore === 'all' || p.storeId === selectedStore;

    // 3. Category Filter
    const matchesCategory = selectedCategory === 'all' || p.categoryId === selectedCategory;

    // 4. Stock Filter
    const matchesStock = stockFilter === 'all' || 
      (stockFilter === 'inStock' && (p.isAvailable !== false && p.stockStatus !== 'out_of_stock')) ||
      (stockFilter === 'outOfStock' && (p.isAvailable === false || p.stockStatus === 'out_of_stock'));

    // 5. Price Filter
    const price = typeof p.price === 'number' ? p.price : 0;
    const matchesMinPrice = !minPrice || price >= parseFloat(minPrice);
    const matchesMaxPrice = !maxPrice || price <= parseFloat(maxPrice);

    return matchesSearch && matchesStore && matchesCategory && matchesStock && matchesMinPrice && matchesMaxPrice;
  }).sort((a, b) => {"""
        
        if bad_filter_prod in content:
            content = content.replace(bad_filter_prod, good_filter_prod)
            
            # Need to close the useMemo at the end of sort
            content = content.replace("""    }
    return 0;
  });""", """    }
    return 0;
  }), [products, searchTerm, selectedStore, selectedCategory, stockFilter, minPrice, maxPrice, sortBy]);""")
            changed = True
            
    # 3. CategoriesManager
    if 'CategoriesManager.tsx' in file_path:
        bad_cat_filter = """  const filteredCategories = categories.filter(c => {
    const matchesSearch = !searchTerm.trim() || 
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (c.label || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.description || '').toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesStatus = filterStatus === 'all' || c.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  }).sort((a, b) => {"""
        good_cat_filter = """  const filteredCategories = useMemo(() => categories.filter(c => {
    const matchesSearch = !searchTerm.trim() || 
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (c.label || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.description || '').toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesStatus = filterStatus === 'all' || c.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  }).sort((a, b) => {"""
        if bad_cat_filter in content:
            content = content.replace(bad_cat_filter, good_cat_filter)
            content = content.replace("""      return (b.order || 0) - (a.order || 0); // fallback
    }
  });""", """      return (b.order || 0) - (a.order || 0); // fallback
    }
  }), [categories, searchTerm, filterStatus, sortBy]);""")
            changed = True

    if changed:
        with open(file_path, 'w') as f:
            f.write(content)
        print(f"Applied memoization to {file_path}")

apply_memoization('src/components/StoresManager.tsx')
apply_memoization('src/components/ProductsManager.tsx')
apply_memoization('src/components/CategoriesManager.tsx')
