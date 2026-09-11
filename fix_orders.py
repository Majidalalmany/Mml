import re

with open('src/components/OrdersManager.tsx', 'r') as f:
    content = f.read()

# Replace the safeOrders definition with a deduplicated one
old_safe_orders = "const safeOrders = liveOrders.length > 0 ? liveOrders : (orders || []);"
new_safe_orders = """const safeOrders = useMemo(() => {
    const raw = liveOrders.length > 0 ? liveOrders : (orders || []);
    const uniqueMap = new Map();
    raw.forEach(o => {
      if (o.id) uniqueMap.set(o.id, o);
      else if (o.orderNumber) uniqueMap.set(o.orderNumber, o);
    });
    return Array.from(uniqueMap.values());
  }, [liveOrders, orders]);"""

if old_safe_orders in content:
    content = content.replace(old_safe_orders, new_safe_orders)
    with open('src/components/OrdersManager.tsx', 'w') as f:
        f.write(content)
    print("Successfully deduplicated safeOrders.")
else:
    print("Could not find safeOrders definition.")

