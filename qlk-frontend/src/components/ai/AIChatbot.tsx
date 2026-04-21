import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bot, 
  Send, 
  X, 
  Mic, 
  MicOff, 
  Maximize2, 
  Minimize2,
  Trash2,
  Sparkles,
  ChevronRight,
  Database
} from 'lucide-react';
import { aiApi } from '../../api/ai';
import type { AIResponse } from '../../api/ai';
import AIChart from './AIChart';
import './AIChatbot.css';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  chart?: any;
  explanation?: string;
  sql?: string;
  data?: any[];
  timestamp: Date;
}

interface AIChatbotProps {
  activePage?: string;
}

// Suggested quick prompts to help users get started
const QUICK_PROMPTS = [
  { icon: '📦', label: 'Tổng tồn kho', text: 'Hiện tại tổng tồn kho của toàn hệ thống là bao nhiêu?' },
  { icon: '📊', label: 'Phân bổ theo danh mục', text: 'Vẽ biểu đồ phân bổ sản phẩm theo từng danh mục.' },
  { icon: '🔧', label: 'Sản phẩm tồn thấp', text: 'Liệt kê các sản phẩm đang có tồn kho thấp hơn mức tối thiểu.' },
  { icon: '👷', label: 'KTV đang giữ hàng', text: 'Kỹ thuật viên nào đang giữ nhiều thiết bị nhất?' },
  { icon: '📋', label: 'Phiếu nhập gần đây', text: 'Danh sách 5 phiếu nhập kho gần đây nhất.' },
  { icon: '🛠️', label: 'Tình trạng sửa chữa', text: 'Có bao nhiêu thiết bị đang trong quá trình sửa chữa?' },
];

// Format raw DB column names into friendly Vietnamese labels
const formatHeader = (key: string): string => {
  const map: Record<string, string> = {
    productname: 'Tên sản phẩm', quantity: 'Số lượng', unit: 'Đơn vị',
    price: 'Đơn giá', categoryname: 'Danh mục', warehousename: 'Tên kho',
    fullname: 'Họ tên', email: 'Email', totalcount: 'Tổng số',
    count: 'Số lượng', sum: 'Tổng', minquantity: 'Tồn kho tối thiểu',
    receiptcode: 'Mã phiếu', importdate: 'Ngày nhập', exportdate: 'Ngày xuất',
    status: 'Trạng thái', faultyquantity: 'Hàng hỏng', problem: 'Vấn đề',
    technicianname: 'Kỹ thuật viên', customername: 'Khách hàng', address: 'Địa chỉ',
    serialnumber: 'Số Serial', macaddress: 'Địa chỉ MAC',
  };
  return map[key.toLowerCase()] || key;
};

const AIChatbot: React.FC<AIChatbotProps> = ({ activePage }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async (text?: string) => {
    const messageText = (text || input).trim();
    if (!messageText || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await aiApi.query(messageText, activePage);
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.text,
        // Guard: only attach chart if it's valid and has a renderable type
        chart: response.chart && response.chart.type && response.chart.type !== 'none' ? response.chart : undefined,
        explanation: response.explanation,
        sql: response.sqlQuery,
        data: response.data,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMessage]);
    } catch (error: any) {
      console.error('AI Query Error:', error);
      const status = error.response?.status;
      let errorMsg = 'Xin lỗi, đã có lỗi xảy ra khi kết nối với máy chủ AI.';
      if (status === 429) errorMsg = '⚠️ Trợ lý AI đang quá tải. Vui lòng thử lại sau vài giây.';
      else if (status === 401) errorMsg = '🔒 Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
      else if (status === 500) errorMsg = '🔧 Máy chủ AI gặp sự cố. Vui lòng thử lại.';
      else if (error.message?.includes('Network')) errorMsg = '📶 Mất kết nối mạng. Vui lòng kiểm tra kết nối.';

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: errorMsg,
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Web Speech API Integration
  const toggleListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Trình duyệt của bạn không hỗ trợ nhận diện giọng nói.');
      return;
    }
    if (isListening) { setIsListening(false); return; }
    const recognition = new SpeechRecognition();
    recognition.lang = 'vi-VN';
    recognition.interimResults = false;
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    recognition.onresult = (event: any) => setInput(event.results[0][0].transcript);
    recognition.start();
  };

  const clearChat = () => {
    if (window.confirm('Bạn có chắc muốn xóa lịch sử trò chuyện?')) {
      setMessages([]);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end ai-chatbot-container">
      <AnimatePresence>
        {isOpen && !isMinimized && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 24 }}
            className="ai-chatbot-window"
          >
            {/* Header */}
            <div className="ai-chatbot-header">
              <div className="flex items-center gap-3">
                <div className="bot-icon-circle">
                  <Bot size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-sm tracking-tight m-0">AI Assistant</h3>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-[10px] opacity-80 uppercase font-bold tracking-widest">VNPT Inventory</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {messages.length > 0 && (
                  <button onClick={clearChat} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors bg-transparent text-white" title="Xóa hội thoại">
                    <Trash2 size={15} />
                  </button>
                )}
                <button onClick={() => setIsMinimized(true)} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors bg-transparent text-white">
                  <Minimize2 size={15} />
                </button>
                <button onClick={() => setIsOpen(false)} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors bg-transparent text-white">
                  <X size={17} />
                </button>
              </div>
            </div>

            {/* Chat Content */}
            <div className="ai-chatbot-content premium-scroll">
              {/* Welcome / Empty State */}
              {messages.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center py-6 px-4"
                >
                  <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'linear-gradient(135deg, #0066CC, #004499)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px', boxShadow: '0 8px 24px rgba(0,102,204,0.3)' }}>
                    <Sparkles size={24} color="white" />
                  </div>
                  <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', margin: '0 0 4px' }}>Trợ lý AI VNPT</h3>
                  <p style={{ fontSize: '12px', color: '#64748b', textAlign: 'center', margin: '0 0 20px', lineHeight: 1.6 }}>
                    Hỏi tôi về tồn kho, kỹ thuật viên, sửa chữa hoặc bất kỳ dữ liệu nào trong hệ thống
                  </p>

                  {/* Quick Prompt Suggestions */}
                  <div style={{ width: '100%' }}>
                    <div style={{ fontSize: '10px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px', textAlign: 'left' }}>
                      Gợi ý câu hỏi
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {QUICK_PROMPTS.map((prompt) => (
                        <button
                          key={prompt.text}
                          onClick={() => handleSend(prompt.text)}
                          style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '10px 12px', background: '#f8fafc', border: '1.5px solid #e2e8f0',
                            borderRadius: '10px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
                            width: '100%'
                          }}
                          onMouseEnter={e => {
                            (e.currentTarget as HTMLElement).style.background = '#eff6ff';
                            (e.currentTarget as HTMLElement).style.borderColor = '#bfdbfe';
                          }}
                          onMouseLeave={e => {
                            (e.currentTarget as HTMLElement).style.background = '#f8fafc';
                            (e.currentTarget as HTMLElement).style.borderColor = '#e2e8f0';
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '16px' }}>{prompt.icon}</span>
                            <div>
                              <div style={{ fontSize: '12px', fontWeight: 700, color: '#1e293b' }}>{prompt.label}</div>
                              <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '1px' }}>{prompt.text.substring(0, 42)}...</div>
                            </div>
                          </div>
                          <ChevronRight size={14} color="#94a3b8" />
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Messages */}
              {messages.map((m) => (
                <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[88%] group flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                    <div className={`message-bubble ${m.role === 'user' ? 'message-user' : 'message-assistant'}`}>
                      {m.content && <p className="m-0">{m.content}</p>}

                      {/* Chart — only render if type is valid (not 'none') */}
                      {m.role === 'assistant' && m.chart && m.chart.type && m.chart.type !== 'none' && (
                        <div className="mt-3 bg-slate-900 rounded-xl p-2 overflow-hidden">
                          <AIChart config={m.chart} />
                        </div>
                      )}

                      {/* Data Table */}
                      {m.role === 'assistant' && m.data && m.data.length > 0 && (
                        <div className="mt-3 ai-data-result">
                          {m.data.length === 1 && Object.keys(m.data[0]).length === 1 ? (
                            <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-center">
                              <span className="text-[10px] uppercase text-blue-500 font-bold block mb-1">Kết quả</span>
                              <span className="text-2xl font-bold text-blue-700">
                                {Object.values(m.data[0])[0] as string | number}
                              </span>
                            </div>
                          ) : (
                            <div className="bg-white/50 rounded-lg overflow-hidden border border-slate-100">
                              <div className="max-h-[200px] overflow-y-auto premium-scroll">
                                <table className="w-full text-[11px] text-left border-collapse">
                                  <thead className="bg-slate-50 sticky top-0">
                                    <tr>
                                      {Object.keys(m.data[0]).map(key => (
                                        <th key={key} className="p-2 font-bold text-slate-600 border-b border-slate-100">
                                          {formatHeader(key)}
                                        </th>
                                      ))}
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {m.data.map((row, idx) => (
                                      <tr key={idx} className="border-b border-slate-50 last:border-0 hover:bg-blue-50/30 transition-colors">
                                        {Object.values(row).map((val: any, i) => (
                                          <td key={i} className="p-2 text-slate-700">
                                            {typeof val === 'boolean' ? (val ? '✓' : '✗') : (val ?? '—')}
                                          </td>
                                        ))}
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] mt-1 opacity-40 px-1">
                      {m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}

              {/* Loading dots */}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="message-bubble message-assistant">
                    <div className="flex gap-1.5 items-center">
                      <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                      <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                      <span className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" />
                      <span className="text-[11px] text-slate-400 ml-1">Đang phân tích...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="ai-input-container">
              <div className="ai-input-wrapper">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Đặt câu hỏi về kho hàng..."
                    className="ai-input-field"
                    disabled={isLoading}
                  />
                  <button
                    onClick={toggleListening}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 voice-btn ${isListening ? 'active' : ''}`}
                    title="Nhận diện giọng nói"
                  >
                    {isListening ? <MicOff size={16} /> : <Mic size={16} />}
                  </button>
                </div>
                <button
                  onClick={() => handleSend()}
                  disabled={!input.trim() || isLoading}
                  className={`p-2.5 rounded-xl transition-all ${
                    !input.trim() || isLoading
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      : 'bg-blue-600 text-white shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-95'
                  }`}
                >
                  <Send size={17} />
                </button>
              </div>
              {/* Quick prompts shortlist in input area */}
              {messages.length > 0 && (
                <div style={{ display: 'flex', gap: '6px', padding: '6px 0 2px', overflowX: 'auto' }} className="premium-scroll-x">
                  {QUICK_PROMPTS.slice(0, 4).map((p) => (
                    <button
                      key={p.text}
                      onClick={() => handleSend(p.text)}
                      disabled={isLoading}
                      style={{
                        flexShrink: 0, padding: '4px 10px', background: '#f1f5f9', border: '1px solid #e2e8f0',
                        borderRadius: '12px', fontSize: '11px', fontWeight: 600, color: '#475569', cursor: 'pointer',
                        whiteSpace: 'nowrap', transition: 'all 0.15s'
                      }}
                    >
                      {p.icon} {p.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Buttons */}
      <div className="flex flex-col gap-3">
        {isOpen && isMinimized && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-12 h-12 bg-white border border-blue-200 rounded-2xl flex items-center justify-center text-blue-600 shadow-lg"
            onClick={() => setIsMinimized(false)}
          >
            <Maximize2 size={18} />
          </motion.button>
        )}
        
        <button
          onClick={() => {
            if (!isOpen) setIsOpen(true);
            setIsMinimized(false);
          }}
          className="floating-bot-btn"
          title="Trợ lý AI VNPT"
        >
          <Bot size={26} />
          {!isOpen && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white flex items-center justify-center">
              <Sparkles size={8} color="white" />
            </span>
          )}
        </button>
      </div>
    </div>
  );
};

export default AIChatbot;
