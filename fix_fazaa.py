import re

with open('src/components/FazaaOrdersManager.tsx', 'r') as f:
    content = f.read()

old_safe_orders = "const safeOrders = orders || [];"
new_safe_orders = """const safeOrders = useMemo(() => {
    const raw = orders || [];
    const uniqueMap = new Map();
    raw.forEach(o => {
      if (o.id) uniqueMap.set(o.id, o);
      else if (o.orderNumber) uniqueMap.set(o.orderNumber, o);
    });
    return Array.from(uniqueMap.values());
  }, [orders]);"""

if old_safe_orders in content:
    content = content.replace(old_safe_orders, new_safe_orders)
    # Add useMemo import if needed
    if "useMemo" not in content.split("from 'react'")[0]:
        content = content.replace("import React, { useState", "import React, { useState, useMemo")
    with open('src/components/FazaaOrdersManager.tsx', 'w') as f:
        f.write(content)
    print("Successfully deduplicated safeOrders in Fazaa.")
else:
    print("Could not find safeOrders in Fazaa.")
