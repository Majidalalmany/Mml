import re

with open('src/components/OrdersManager.tsx', 'r') as f:
    content = f.read()

bad_block = """      // Window event listener for immediately placed orders
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

    } catch (e) {
      console.warn('Orders listener setup error in OrdersManager:', e);
    }"""

good_block = """    } catch (e) {
      console.warn('Orders listener setup error in OrdersManager:', e);
    }

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
    window.addEventListener('jahez_order_placed', handleOrderPlaced);"""

if bad_block in content:
    content = content.replace(bad_block, good_block)
    with open('src/components/OrdersManager.tsx', 'w') as f:
        f.write(content)
    print("Fixed scope")
else:
    print("Could not find bad block")

