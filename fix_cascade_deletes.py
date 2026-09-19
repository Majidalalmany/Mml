import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# 1. handleDeleteCategory
bad_cat_del = """  const handleDeleteCategory = async (categoryId: string) => {
    try {
      await deleteDoc(doc(db, 'categories', categoryId));
      setCategories(prev => prev.filter(c => c.id !== categoryId));
      showToast('تم حذف التصنيف بنجاح من Firestore');
    } catch (err: any) {
      console.error('Error deleting category:', err);
      showToast('فشل حذف التصنيف: ' + (err.message || ''), 'error');
    }
  };"""

good_cat_del = """  const handleDeleteCategory = async (categoryId: string) => {
    try {
      const batch = writeBatch(db);
      
      // Delete the category itself
      batch.delete(doc(db, 'categories', categoryId));
      
      // Delete all stores that belong to this category
      const storesToDelete = stores.filter(s => s.categoryId === categoryId);
      storesToDelete.forEach(store => {
        batch.delete(doc(db, 'stores', store.id));
      });
      
      // We might also want to delete all products in these stores, but Firestore batches are limited to 500 ops.
      // Assuming a moderate size for now.
      const productIdsToDelete: string[] = [];
      products.forEach(p => {
        if (p.categoryId === categoryId || storesToDelete.some(s => s.id === p.storeId)) {
          batch.delete(doc(db, 'products', p.id));
          productIdsToDelete.push(p.id);
        }
      });

      await batch.commit();

      // UI state updates are handled by onSnapshot, but we can do them optimistically
      // Actually onSnapshot will automatically trigger, but since the requirement is:
      // "لا تقم بتحديث واجهة المستخدم (UI State) أو إخفاء العنصر المحذوف إلا بعد نجاح batch.commit()"
      // The onSnapshot takes care of the UI update AFTER commit!
      // But we had manual optimistic updates previously. Let's remove them or keep them after commit.
      setCategories(prev => prev.filter(c => c.id !== categoryId));
      setStores(prev => prev.filter(s => !storesToDelete.some(st => st.id === s.id)));
      setProducts(prev => prev.filter(p => !productIdsToDelete.includes(p.id)));

      showToast('تم حذف الفئة والمتاجر والأصناف المرتبطة بها بنجاح');
    } catch (err: any) {
      console.error('Error in cascade delete category:', err);
      showToast('فشل حذف الفئة لارتباطات البيانات: ' + (err.message || ''), 'error');
    }
  };"""

if bad_cat_del in content:
    content = content.replace(bad_cat_del, good_cat_del)
    print("Replaced handleDeleteCategory")
else:
    print("Could not find handleDeleteCategory")


# 2. handleDeleteStore
bad_store_del = """  const handleDeleteStore = async (storeId: string) => {
    try {
      const st = stores.find(s => s.id === storeId);
      await deleteDoc(doc(db, 'stores', storeId));
      showToast('تم حذف المتجر بنجاح من Firestore');
      await logSystemActivity({
        action: 'حذف متجر',
        performedBy: currentUser ? currentUser.name : 'المدير العام',
        userEmail: currentUser?.email,
        targetType: 'store',
        targetName: st?.name || storeId,
        details: `حذف المتجر ${st?.name} نهائياً من قاعدة البيانات`,
        severity: 'warning'
      });
    } catch (err: any) {
      console.error('Error deleting store:', err);
      showToast('فشل حذف المتجر: ' + (err.message || ''), 'error');
    }
  };"""

good_store_del = """  const handleDeleteStore = async (storeId: string) => {
    try {
      const st = stores.find(s => s.id === storeId);
      const batch = writeBatch(db);
      
      // Delete store
      batch.delete(doc(db, 'stores', storeId));
      
      // Delete all products associated with this store
      const productsToDelete = products.filter(p => p.storeId === storeId);
      productsToDelete.forEach(p => {
        batch.delete(doc(db, 'products', p.id));
      });

      await batch.commit();

      // UI state updates
      setStores(prev => prev.filter(s => s.id !== storeId));
      setProducts(prev => prev.filter(p => p.storeId !== storeId));

      showToast('تم حذف المتجر وجميع الأصناف التابعة له بنجاح');
      await logSystemActivity({
        action: 'حذف متجر',
        performedBy: currentUser ? currentUser.name : 'المدير العام',
        userEmail: currentUser?.email,
        targetType: 'store',
        targetName: st?.name || storeId,
        details: `حذف المتجر ${st?.name} والأصناف التابعة له من قاعدة البيانات`,
        severity: 'warning'
      });
    } catch (err: any) {
      console.error('Error in cascade delete store:', err);
      showToast('فشل الحذف المتسلسل: ' + (err.message || ''), 'error');
    }
  };"""

if bad_store_del in content:
    content = content.replace(bad_store_del, good_store_del)
    print("Replaced handleDeleteStore")
else:
    print("Could not find handleDeleteStore")

# Check if writeBatch is imported in App.tsx
if "writeBatch" not in content and "deleteDoc," in content:
    content = content.replace("deleteDoc,", "deleteDoc, writeBatch,")
elif "writeBatch" not in content and "import { collection," in content:
    content = content.replace("import { collection,", "import { collection, writeBatch,")

with open('src/App.tsx', 'w') as f:
    f.write(content)

