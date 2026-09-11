import re
with open('src/components/OrdersManager.tsx', 'r') as f:
    content = f.read()

content = content.replace("status: \"PREPARING\", // إجبار الحالة على PREPARING بأحرف كبيرة", "status: 'preparing',")
content = content.replace("status: 'PREPARING' as any", "status: 'preparing'")
content = content.replace("PREPARING' as any", "preparing'")

with open('src/components/OrdersManager.tsx', 'w') as f:
    f.write(content)
print("Fixed PREPARING capitalization")
