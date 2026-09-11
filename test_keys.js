const fs = require('fs');
const content = fs.readFileSync('src/components/OrdersManager.tsx', 'utf-8');
const newContent = content.replace(
  "const filteredOrders = useMemo(() => {",
  "const filteredOrders = useMemo(() => {\n    const allIds = safeOrders.map(o => o.id);\n    const duplicates = allIds.filter((item, index) => allIds.indexOf(item) !== index);\n    if (duplicates.length > 0) console.error('DUPLICATES IN SAFEORDERS:', duplicates);\n"
);
fs.writeFileSync('src/components/OrdersManager.tsx', newContent);
