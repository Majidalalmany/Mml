import re

with open('src/components/OrdersManager.tsx', 'r') as f:
    content = f.read()

content = content.replace("if (onShowToast) onShowToast('تم حذف الطلب بنجاح', 'success');", "")
content = content.replace("if (onShowToast) onShowToast('فشل حذف الطلب', 'error');", "alert('فشل حذف الطلب');")

with open('src/components/OrdersManager.tsx', 'w') as f:
    f.write(content)
print("Fixed toasts")
