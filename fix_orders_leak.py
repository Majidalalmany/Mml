import re

with open('src/components/OrdersManager.tsx', 'r') as f:
    content = f.read()

# Replace Orders Listener
old_orders_effect = """  useEffect(() => {
    try {
      // 1. Initial & Periodical API sync (to fetch orders placed via Mobile Client REST API)
      const fetchApiOrders = async () => {
        try {
          const res = await fetch('/api/orders');
          if (res.ok) {
            const data = await res.json();
            if (data.orders && Array.isArray(data.orders)) {
              setLiveOrders(prev => {
                const map = new Map<string, Order>();
                prev.forEach(o => map.set(o.id || o.orderNumber, o));
                data.orders.forEach((o: Order) => map.set(o.id || o.orderNumber, o));
                return Array.from(map.values());
              });
            }
          }
        } catch {
          // Offline mode / silent
        }
      };
      fetchApiOrders();

      const ordersQuery = query(collection(db, 'orders'));
      const unsubscribe = onSnapshot(ordersQuery, (snapshot) => {
        const list: Order[] = snapshot.docs.map(docSnap => {
          const data = docSnap.data();
          const isGlobal = Boolean(
            data.orderType === 'global_store' ||
            data.orderType?.includes?.('global_store') ||
            data.orderType?.includes?.('متجر عالمي') ||
            data.orderScope === 'international' ||
            data.orderScope === 'global' ||
            data.serviceType === 'global_store' ||
            data.serviceType === 'global' ||
            data.isGlobalStore ||
            data.categoryId === 'global_stores' ||
            data.categoryId === 'cat-global' ||
            data.categoryId === 'global' ||
            data.categoryName === 'المتاجر العالمية' ||
            data.categoryName?.includes?.('عالمي') ||
            data.storeCategory === 'المتاجر العالمية' ||
            data.storeCategory?.includes?.('عالمي') ||
            data.storeId === 'amazon' ||
            data.storeId === 'global-store-amazon' ||
            data.storeId === 'shein' ||
            data.storeId === 'global-store-shein' ||
            data.storeName?.includes?.('أمازون') ||
            data.storeName?.includes?.('شي إن') ||
            data.storeName?.toLowerCase() === 'amazon' ||
            data.storeName?.toLowerCase() === 'shein' ||
            data.storeName?.toLowerCase() === 'aliexpress'
          );

          return {
            id: docSnap.id,
            isGlobalStore: isGlobal,
            paymentMethod: data.paymentMethod || 'cash',
            paymentStatus: data.paymentStatus || 'pending',
            createdAt: data.createdAt ? (typeof data.createdAt === 'string' ? data.createdAt : data.createdAt.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString()) : new Date().toISOString(),
            ...data
          } as Order;
        });

        // Set live orders directly from Firestore snapshot without stale localStorage
        setLiveOrders(list);
      }, (err) => {
        console.warn('Orders onSnapshot error in OrdersManager:', err);
      });

      // Window event listener for immediately placed orders
      const handleOrderPlaced = (e: any) => {
        const newOrder = e.detail?.order;
        if (newOrder) {
          setLiveOrders(prev => {
            if (prev.some(o => o.id === newOrder.id || o.orderNumber === newOrder.orderNumber)) {
              return prev;
            }
            return [newOrder, ...prev];
          });
        }
      };
      window.addEventListener('jahez_order_placed', handleOrderPlaced);

      return () => {
        unsubscribe();
        window.removeEventListener('jahez_order_placed', handleOrderPlaced);
      };
    } catch (e) {
      console.warn('Orders listener setup error in OrdersManager:', e);
    }
  }, []);"""

new_orders_effect = """  useEffect(() => {
    let unsubscribe: any;
    
    const fetchApiOrders = async () => {
      try {
        const res = await fetch('/api/orders');
        if (res.ok) {
          const data = await res.json();
          if (data.orders && Array.isArray(data.orders)) {
            setLiveOrders(prev => {
              const map = new Map<string, Order>();
              prev.forEach(o => map.set(o.id || o.orderNumber, o));
              data.orders.forEach((o: Order) => map.set(o.id || o.orderNumber, o));
              return Array.from(map.values());
            });
          }
        }
      } catch {
        // Offline mode / silent
      }
    };
    fetchApiOrders();

    const handleOrderPlaced = (e: any) => {
      const newOrder = e.detail?.order;
      if (newOrder) {
        setLiveOrders(prev => {
          if (prev.some(o => o.id === newOrder.id || o.orderNumber === newOrder.orderNumber)) {
            return prev;
          }
          return [newOrder, ...prev];
        });
      }
    };
    window.addEventListener('jahez_order_placed', handleOrderPlaced);

    try {
      const ordersQuery = query(collection(db, 'orders'));
      unsubscribe = onSnapshot(ordersQuery, (snapshot) => {
        const list: Order[] = snapshot.docs.map(docSnap => {
          const data = docSnap.data();
          const isGlobal = Boolean(
            data.orderType === 'global_store' ||
            data.orderType?.includes?.('global_store') ||
            data.orderType?.includes?.('متجر عالمي') ||
            data.orderScope === 'international' ||
            data.orderScope === 'global' ||
            data.serviceType === 'global_store' ||
            data.serviceType === 'global' ||
            data.isGlobalStore ||
            data.categoryId === 'global_stores' ||
            data.categoryId === 'cat-global' ||
            data.categoryId === 'global' ||
            data.categoryName === 'المتاجر العالمية' ||
            data.categoryName?.includes?.('عالمي') ||
            data.storeCategory === 'المتاجر العالمية' ||
            data.storeCategory?.includes?.('عالمي') ||
            data.storeId === 'amazon' ||
            data.storeId === 'global-store-amazon' ||
            data.storeId === 'shein' ||
            data.storeId === 'global-store-shein' ||
            data.storeName?.includes?.('أمازون') ||
            data.storeName?.includes?.('شي إن') ||
            data.storeName?.toLowerCase() === 'amazon' ||
            data.storeName?.toLowerCase() === 'shein' ||
            data.storeName?.toLowerCase() === 'aliexpress'
          );

          return {
            id: docSnap.id,
            isGlobalStore: isGlobal,
            paymentMethod: data.paymentMethod || 'cash',
            paymentStatus: data.paymentStatus || 'pending',
            createdAt: data.createdAt ? (typeof data.createdAt === 'string' ? data.createdAt : data.createdAt.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString()) : new Date().toISOString(),
            ...data
          } as Order;
        });
        setLiveOrders(list);
      }, (err) => {
        console.warn('Orders onSnapshot error in OrdersManager:', err);
      });
    } catch (e) {
      console.warn('Orders listener setup error in OrdersManager:', e);
    }

    return () => {
      if (unsubscribe) unsubscribe();
      window.removeEventListener('jahez_order_placed', handleOrderPlaced);
    };
  }, []);"""

if old_orders_effect in content:
    content = content.replace(old_orders_effect, new_orders_effect)
    print("Fixed Orders Listener in OrdersManager.tsx")
else:
    print("Could not find old_orders_effect in OrdersManager.tsx")

old_drivers_effect = """  // Firestore Realtime Drivers Listener
  useEffect(() => {
    try {
      const driversQuery = query(collection(db, 'drivers'));
      const unsubscribe = onSnapshot(driversQuery, (snapshot) => {
        const fetchedList: DriverUser[] = snapshot.docs.map(docSnap => ({
          id: docSnap.id,
          ...docSnap.data()
        })) as DriverUser[];

        if (fetchedList.length > 0) {
          // Merge fetched with defaults to ensure complete list
          const combined = [...fetchedList];
          DEFAULT_DRIVERS.forEach(defDrv => {
            if (!combined.some(d => d.id === defDrv.id || d.phone === defDrv.phone)) {
              combined.push(defDrv);
            }
          });
          setDrivers(combined);
        } else {
          setDrivers(DEFAULT_DRIVERS);
        }
      }, (err) => {
        console.warn('Drivers listener fallback:', err);
        setDrivers(DEFAULT_DRIVERS);
      });

      return () => unsubscribe();
    } catch (e) {
      setDrivers(DEFAULT_DRIVERS);
    }
  }, []);"""

new_drivers_effect = """  // Firestore Realtime Drivers Listener
  useEffect(() => {
    let unsubscribe: any;
    try {
      const driversQuery = query(collection(db, 'drivers'));
      unsubscribe = onSnapshot(driversQuery, (snapshot) => {
        const fetchedList: DriverUser[] = snapshot.docs.map(docSnap => ({
          id: docSnap.id,
          ...docSnap.data()
        })) as DriverUser[];

        if (fetchedList.length > 0) {
          const combined = [...fetchedList];
          DEFAULT_DRIVERS.forEach(defDrv => {
            if (!combined.some(d => d.id === defDrv.id || d.phone === defDrv.phone)) {
              combined.push(defDrv);
            }
          });
          setDrivers(combined);
        } else {
          setDrivers(DEFAULT_DRIVERS);
        }
      }, (err) => {
        console.warn('Drivers listener fallback:', err);
        setDrivers(DEFAULT_DRIVERS);
      });
    } catch (e) {
      setDrivers(DEFAULT_DRIVERS);
    }
    
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);"""

if old_drivers_effect in content:
    content = content.replace(old_drivers_effect, new_drivers_effect)
    print("Fixed Drivers Listener in OrdersManager.tsx")
else:
    print("Could not find old_drivers_effect in OrdersManager.tsx")

with open('src/components/OrdersManager.tsx', 'w') as f:
    f.write(content)

