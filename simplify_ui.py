import re

with open('src/components/StoresManager.tsx', 'r') as f:
    content = f.read()

if "activeDropdownId" not in content:
    content = content.replace("const [deleteConfirmStoreId", "const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);\n  const [deleteConfirmStoreId")

bad_actions = """                    <div className="flex items-center gap-2">
                      <select
                        disabled={!canEdit}
                        value={store.status}
                        onChange={(e) => canEdit && onToggleStatus(store, e.target.value as 'open' | 'closed' | 'maintenance')}
                        className={`flex-1 px-2.5 py-2 rounded-xl border border-gray-200 text-[11px] font-bold bg-slate-50 text-slate-700 focus:ring-1 focus:ring-blue-500 ${
                          !canEdit ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
                        }`}
                        title="تعديل حالة المتجر (إخفاء/إظهار)"
                      >
                        <option value="open">🟢 مفتوح (ظاهر)</option>
                        <option value="closed">🔴 مغلق (مخفي من الطلبات)</option>
                        <option value="maintenance">🟡 صيانة مؤقتة</option>
                      </select>
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

good_actions = """                    <div className="flex items-center justify-between gap-2 relative">
                      <div className="flex-1">
                        <span className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold ${
                          store.status === 'open' 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                            : store.status === 'closed'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {store.status === 'open' ? '🟢 مفتوح (ظاهر)' : store.status === 'closed' ? '🔴 مغلق (مخفي)' : '🟡 صيانة مؤقتة'}
                        </span>
                      </div>
                      
                      {(canEdit || canDelete) && (
                        <div className="relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveDropdownId(activeDropdownId === store.id ? null : store.id);
                            }}
                            className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl transition-colors cursor-pointer flex items-center gap-1 text-xs font-bold border border-slate-200"
                          >
                            <Wrench className="w-4 h-4" />
                            <span>خيارات</span>
                          </button>

                          {activeDropdownId === store.id && (
                            <div className="absolute left-0 bottom-full mb-2 w-48 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-20 animate-in fade-in slide-in-from-bottom-2">
                              {canEdit && (
                                <>
                                  <button
                                    onClick={() => onToggleStatus(store, store.status === 'open' ? 'closed' : 'open')}
                                    className="w-full text-right px-4 py-2.5 hover:bg-slate-50 text-slate-700 flex items-center gap-2 text-[11px] font-bold transition-colors cursor-pointer border-b border-gray-100"
                                  >
                                    {store.status === 'open' ? '🔴 إغلاق المتجر' : '🟢 فتح المتجر'}
                                  </button>
                                  <button
                                    onClick={() => {
                                      setActiveDropdownId(null);
                                      onEditStore(store);
                                    }}
                                    className="w-full text-right px-4 py-2.5 hover:bg-slate-50 text-slate-700 flex items-center gap-2 text-[11px] font-bold transition-colors cursor-pointer"
                                  >
                                    <Edit3 className="w-4 h-4 text-slate-400" />
                                    <span>تعديل بيانات المتجر</span>
                                  </button>
                                </>
                              )}
                              {canDelete && (
                                <div className="border-t border-gray-100 p-2">
                                  {deleteConfirmStoreId === store.id ? (
                                    <div className="bg-rose-50 rounded-lg p-2 flex flex-col gap-2">
                                      <span className="text-[10px] text-rose-800 font-bold text-center">تأكيد الحذف النهائي؟</span>
                                      <div className="flex gap-1">
                                        <button
                                          onClick={() => {
                                            setActiveDropdownId(null);
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
                                      className="w-full text-right px-2 py-2 rounded-lg hover:bg-rose-50 text-rose-600 flex items-center gap-2 text-[11px] font-bold transition-colors cursor-pointer"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                      <span>حذف المتجر نهائياً</span>
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>"""

if bad_actions in content:
    content = content.replace(bad_actions, good_actions)
    print("Replaced actions block in StoresManager")
else:
    print("Could not find actions block in StoresManager")
    
if "import { Globe" in content and "Wrench" not in content:
    content = content.replace("import { Globe", "import { Wrench, Globe")

with open('src/components/StoresManager.tsx', 'w') as f:
    f.write(content)

