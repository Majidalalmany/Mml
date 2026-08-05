import React, { useState } from 'react';
import { 
  X, 
  Send, 
  MessageSquare, 
  CheckCircle2, 
  Sparkles, 
  User, 
  Mail, 
  Clock, 
  AlertCircle,
  Wrench,
  ShieldCheck,
  Plus,
  RefreshCw
} from 'lucide-react';
import { SupportTicket, SupportChatMessage, AdminUser } from '../types';

interface AbsherSupportModalProps {
  isOpen: boolean;
  onClose: () => void;
  tickets: SupportTicket[];
  currentUser: AdminUser | null;
  onCreateTicket: (ticket: {
    title: string;
    category: SupportTicket['category'];
    priority: SupportTicket['priority'];
    initialMessage: string;
  }) => Promise<void>;
  onSendMessage: (ticketId: string, text: string) => Promise<void>;
  onUpdateTicketStatus?: (ticketId: string, status: SupportTicket['status']) => Promise<void>;
  isLoading?: boolean;
}

export const AbsherSupportModal: React.FC<AbsherSupportModalProps> = ({
  isOpen,
  onClose,
  tickets = [],
  currentUser,
  onCreateTicket,
  onSendMessage,
  onUpdateTicketStatus,
  isLoading = false
}) => {
  const [activeTab, setActiveTab] = useState<'list' | 'create' | 'chat'>('list');
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  // New ticket state
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<SupportTicket['category']>('modification');
  const [newPriority, setNewPriority] = useState<SupportTicket['priority']>('high');
  const [newMessageText, setNewMessageText] = useState('');

  // Chat message input state
  const [chatReplyText, setChatReplyText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const activeTicket = tickets.find(t => t.id === selectedTicketId) || tickets[0];

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newMessageText.trim()) return;

    try {
      setIsSubmitting(true);
      await onCreateTicket({
        title: newTitle,
        category: newCategory,
        priority: newPriority,
        initialMessage: newMessageText
      });
      setNewTitle('');
      setNewMessageText('');
      setIsSubmitting(false);
      setActiveTab('list');
    } catch (err) {
      setIsSubmitting(false);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatReplyText.trim() || !activeTicket) return;

    try {
      setIsSubmitting(true);
      await onSendMessage(activeTicket.id, chatReplyText);
      setChatReplyText('');
      setIsSubmitting(false);
    } catch (err) {
      setIsSubmitting(false);
    }
  };

  const applyPreset = (title: string, msg: string) => {
    setNewTitle(title);
    setNewMessageText(msg);
    setActiveTab('create');
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-900 px-6 py-5 text-white flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black tracking-tight">محادثة أبشر للتعديلات والمشاكل 💬</h3>
                <span className="bg-amber-400 text-slate-950 font-extrabold text-[10px] px-2.5 py-0.5 rounded-full shadow-xs">
                  مباشر مع المدير العام
                </span>
              </div>
              <p className="text-xs text-blue-100 mt-0.5">
                تواصل مباشر لطلب أي تعديل في الموقع أو الإبلاغ عن مشكلة للحساب <strong>majdallmany3@gmail.com</strong>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
          
          {/* Navigation Bar inside modal */}
          <div className="flex items-center justify-between gap-2 border-b border-gray-200 pb-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('list')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === 'list' 
                    ? 'bg-blue-600 text-white shadow-xs' 
                    : 'bg-white text-slate-700 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                <span>قائمة المحادثات ({tickets.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('create')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === 'create' 
                    ? 'bg-blue-600 text-white shadow-xs' 
                    : 'bg-white text-slate-700 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                <Plus className="w-4 h-4" />
                <span>فتح طلب تعديل / مشكلة جديدة</span>
              </button>
            </div>

            <div className="text-[11px] text-slate-500 font-bold hidden sm:block">
              المدير المسؤول: <span className="text-blue-700 font-mono">majdallmany3@gmail.com</span>
            </div>
          </div>

          {/* Quick Presets Bar */}
          {activeTab === 'create' && (
            <div className="bg-blue-50/80 p-3 rounded-2xl border border-blue-100 space-y-2">
              <span className="text-xs font-bold text-blue-900 block">نماذج سريعة لطلبات التعديل:</span>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => applyPreset('تعديل في أسعار أو تفاصيل المنتجات', 'أبشر أستاذ مجد، نرجو تعديل الأسعار أو تفاصيل المنتجات الآتية...')}
                  className="text-xs bg-white text-blue-800 hover:bg-blue-100 px-3 py-1.5 rounded-lg border border-blue-200 font-medium"
                >
                  طلب تعديل أسعار أصناف
                </button>
                <button
                  onClick={() => applyPreset('إضافة خاصية أو متجر جديد في النظام', 'يرجى إضافة متجر جديد ببيانات التواصل التالية...')}
                  className="text-xs bg-white text-blue-800 hover:bg-blue-100 px-3 py-1.5 rounded-lg border border-blue-200 font-medium"
                >
                  إضافة متجر جديد
                </button>
                <button
                  onClick={() => applyPreset('إبلاغ عن مشكلة فنية في الموقع', 'تم ملاحظة بطء أو خلل فني في قسم...')}
                  className="text-xs bg-white text-blue-800 hover:bg-blue-100 px-3 py-1.5 rounded-lg border border-blue-200 font-medium"
                >
                  إبلاغ عن خلل فني
                </button>
              </div>
            </div>
          )}

          {/* TAB 1: LIST OF TICKETS */}
          {activeTab === 'list' && (
            <div className="space-y-3">
              {tickets.length === 0 ? (
                <div className="bg-white p-10 rounded-2xl border border-gray-200 text-center space-y-3">
                  <MessageSquare className="w-10 h-10 text-slate-300 mx-auto" />
                  <h4 className="text-sm font-bold text-slate-800">لا توجد محادثات أو طلبات مسجلة بعد</h4>
                  <p className="text-xs text-slate-400">
                    يمكنك فتح محادثة جديدة فوراً لطلب أي تعديل في الموقع للمدير العام.
                  </p>
                  <button
                    onClick={() => setActiveTab('create')}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-xs"
                  >
                    إنشاء طلب تعديل الآن
                  </button>
                </div>
              ) : (
                tickets.map((tck) => (
                  <div
                    key={tck.id}
                    onClick={() => {
                      setSelectedTicketId(tck.id);
                      setActiveTab('chat');
                    }}
                    className="bg-white p-4 rounded-2xl border border-gray-200 hover:border-blue-400 cursor-pointer shadow-2xs transition-all space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md border border-blue-100">
                          #{tck.ticketNumber}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900">{tck.title}</h4>
                      </div>

                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                        tck.status === 'completed' ? 'bg-emerald-100 text-emerald-800' :
                        tck.status === 'in_progress' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {tck.status === 'completed' ? 'تم التنفيذ أبشر ✅' :
                         tck.status === 'in_progress' ? 'قيد التعديل ⚙️' : 'جديد 🟡'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-gray-50">
                      <span>طالب التعديل: <strong className="text-slate-800">{tck.requesterName}</strong></span>
                      <span className="font-mono text-[11px]">{tck.createdAt ? new Date(tck.createdAt).toLocaleString('ar-YE') : ''}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 2: CREATE NEW TICKET */}
          {activeTab === 'create' && (
            <form onSubmit={handleCreateSubmit} className="bg-white p-5 rounded-2xl border border-gray-200 space-y-4 shadow-2xs">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">عنوان طلب التعديل أو المشكلة:</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="مثال: طلب تعديل أسعار وجبات المطعم، أو إضافة قسم عروض سريعة..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">نوع الطلب:</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="modification">طلب تعديل في تصميم أو محتوى الموقع</option>
                    <option value="bug">إبلاغ عن مشكلة فنية / خلل</option>
                    <option value="feature">إضافة ميزة أو قسم جديد</option>
                    <option value="general">استفسار عام للمدير العام</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">مستوى الأهمية:</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="normal">عادي</option>
                    <option value="high">عالي (مهم)</option>
                    <option value="urgent">عاجل جداً 🔥</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">تفاصيل الرسالة التوضيحية:</label>
                <textarea
                  required
                  rows={4}
                  value={newMessageText}
                  onChange={(e) => setNewMessageText(e.target.value)}
                  placeholder="اكتب التعديلات المطلوبة بالتفصيل ليتم استقبالها مباشرة من قبل مجد الألماني (majdallmany3@gmail.com)..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('list')}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-gray-100"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-xs flex items-center gap-1.5"
                >
                  {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  <span>إرسال الطلب (أبشر)</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: ACTIVE CHAT THREAD */}
          {activeTab === 'chat' && activeTicket && (
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden flex flex-col h-[400px] shadow-2xs">
              
              {/* Chat Thread Header */}
              <div className="bg-slate-50 p-3.5 border-b border-gray-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-mono text-blue-600 font-bold">#{activeTicket.ticketNumber}</span>
                  <h4 className="text-sm font-extrabold text-slate-900">{activeTicket.title}</h4>
                </div>

                {onUpdateTicketStatus && (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onUpdateTicketStatus(activeTicket.id, 'completed')}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold px-3 py-1 rounded-lg flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>تحديد كـ تم التعديل (أبشر)</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/30">
                {(activeTicket.messages || []).map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col max-w-[85%] ${
                      msg.isManagerReply || msg.senderEmail === 'majdallmany3@gmail.com'
                        ? 'mr-auto items-start'
                        : 'ml-auto items-end'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mb-1 px-1">
                      <strong className="text-slate-700">{msg.senderName}</strong>
                      <span className="font-mono">({msg.senderEmail})</span>
                    </div>

                    <div
                      className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                        msg.isManagerReply || msg.senderEmail === 'majdallmany3@gmail.com'
                          ? 'bg-blue-600 text-white rounded-tl-xs shadow-2xs'
                          : 'bg-white text-slate-800 border border-gray-200 rounded-tr-xs shadow-2xs'
                      }`}
                    >
                      {msg.text}
                    </div>

                    <span className="text-[9px] text-slate-400 mt-1 px-1 font-mono">
                      {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString('ar-YE', { hour: '2-digit', minute: '2-digit' }) : ''}
                    </span>
                  </div>
                ))}
              </div>

              {/* Reply Input Bar */}
              <form onSubmit={handleSendReply} className="p-3 bg-white border-t border-gray-200 flex items-center gap-2">
                <input
                  type="text"
                  value={chatReplyText}
                  onChange={(e) => setChatReplyText(e.target.value)}
                  placeholder="اكتب ردك أو استفسارك هنا..."
                  className="flex-1 px-4 py-2 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={isSubmitting || !chatReplyText.trim()}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>إرسال الرد</span>
                </button>
              </form>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
