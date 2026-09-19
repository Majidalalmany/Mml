import re

with open('src/components/StoresManager.tsx', 'r') as f:
    content = f.read()

# Add activeDropdownStoreId state
if "activeDropdownStoreId" not in content:
    content = content.replace(
        "const [deleteConfirmStoreId, setDeleteConfirmStoreId] = useState<string | null>(null);",
        "const [deleteConfirmStoreId, setDeleteConfirmStoreId] = useState<string | null>(null);\n  const [activeDropdownStoreId, setActiveDropdownStoreId] = useState<string | null>(null);"
    )

# Replace the actions block
bad_actions = """                    {/* Actions */}
                    <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                      {canEdit && (
                        <button
                          onClick={() => onEditStore(store)}
                          className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors cursor-pointer flex items-center gap-1 text-xs font-bold"
                          title="تعديل بيانات المتجر"
                        >
                          <Edit3 className="w-4 h-4" />
                          <span className="hidden sm:inline">تعديل</span>
                        </button>
                      )}
                      
                      {canDelete && (
                        deleteConfirmStoreId === store.id ? (
                          <div className="flex items-center gap-1.5 bg-rose-50 p-1.5 rounded-xl border border-rose-300 animate-in fade-in">
                            <span className="text-[11px] font-bold text-rose-800 shrink-0">تأكيد الحذف النهائي؟</span>
                            <button
                              onClick={() => {
                                onDeleteStore(store.id);
                                setDeleteConfirmStoreId(null);
                              }}
                              className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold rounded-lg shadow-2xs transition-all cursor-pointer"
                            >
                              نعم، حذف
                            </button>
                            <button
                              onClick={() => setDeleteConfirmStoreId(null)}
                              className="px-2 py-1 bg-gray-200 hover:bg-gray-300 text-slate-700 text-[11px] font-bold rounded-lg transition-all cursor-pointer"
                            >
                              إلغاء
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirmStoreId(store.id)}
                            className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition-colors cursor-pointer flex items-center gap-1 text-xs font-bold border border-rose-200"
                            title="حذف المتجر"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span className="hidden sm:inline">حذف</span>
                          </button>
                        )
                      )}
                    </div>"""

good_actions = """                    {/* Actions */}
                    <div className="pt-3 border-t border-gray-100 flex items-center justify-between relative">
                      <div className="flex-1"></div>
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveDropdownStoreId(activeDropdownStoreId === store.id ? null : store.id);
                          }}
                          className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl transition-colors cursor-pointer flex items-center gap-1 text-xs font-bold border border-slate-200"
                        >
                          <Wrench className="w-4 h-4" />
                          <span>خيارات</span>
                        </button>

                        {activeDropdownStoreId === store.id && (
                          <div className="absolute left-0 bottom-full mb-2 w-48 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-20 animate-in fade-in slide-in-from-bottom-2">
                            {canEdit && (
                              <button
                                onClick={() => {
                                  setActiveDropdownStoreId(null);
                                  onEditStore(store);
                                }}
                                className="w-full text-right px-4 py-3 hover:bg-slate-50 text-slate-700 flex items-center gap-2 text-xs font-bold transition-colors cursor-pointer"
                              >
                                <Edit3 className="w-4 h-4" />
                                <span>تعديل المتجر</span>
                              </button>
                            )}
                            {canDelete && (
                              <div className="border-t border-gray-100 p-2">
                                {deleteConfirmStoreId === store.id ? (
                                  <div className="bg-rose-50 rounded-lg p-2 flex flex-col gap-2">
                                    <span className="text-[10px] text-rose-800 font-bold text-center">تأكيد الحذف النهائي؟</span>
                                    <div className="flex gap-1">
                                      <button
                                        onClick={() => {
                                          setActiveDropdownStoreId(null);
                                          onDeleteStore(store.id);
                                          setDeleteConfirmStoreId(null);
                                        }}
                                        className="flex-1 bg-rose-600 hover:bg-rose-700 text-white text-[10px] py-1.5 rounded cursor-pointer"
                                      >
                                        تأكيد
                                      </button>
                                      <button
                                        onClick={() => setDeleteConfirmStoreId(null)}
                                        className="flex-1 bg-gray-200 hover:bg-gray-300 text-slate-700 text-[10px] py-1.5 rounded cursor-pointer"
                                      >
                                        إلغاء
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setDeleteConfirmStoreId(store.id);
                                    }}
                                    className="w-full text-right px-2 py-2 rounded-lg hover:bg-rose-50 text-rose-600 flex items-center gap-2 text-xs font-bold transition-colors cursor-pointer"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                    <span>حذف المتجر</span>
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>"""

if bad_actions in content:
    content = content.replace(bad_actions, good_actions)
    print("Replaced actions block in StoresManager")
else:
    print("Could not find actions block in StoresManager")

# Also add a document click listener to close dropdowns if not clicking inside
# We'll just leave it as toggling for now, it's fine.

with open('src/components/StoresManager.tsx', 'w') as f:
    f.write(content)
