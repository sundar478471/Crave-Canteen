import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User, Sparkles, Zap } from 'lucide-react';
import { FoodItem, Order } from '@shared/types';

import { createAssistantChat } from '../../services/ai/gemini';

interface Message {
  role: 'user' | 'model';
  text: string;
}

interface ChatWidgetProps {
  menu: FoodItem[];
  userName: string;
  orders: Order[];
}

const ChatWidget: React.FC<ChatWidgetProps> = ({ menu, userName, orders }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: `Hi ${userName}! 👋 I'm your Crave Assistant. I can recommend food or check your order status. What's on your mind?` }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  
  const chatSessionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  useEffect(() => {
    chatSessionRef.current = createAssistantChat(menu, userName, orders);
  }, [menu, userName, orders]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);

    try {
      if (!chatSessionRef.current) {
        chatSessionRef.current = createAssistantChat(menu, userName, orders);
      }

      const result = await chatSessionRef.current.sendMessage({ message: userMessage });
      setMessages(prev => [...prev, { role: 'model', text: result.text }]);
    } catch (error) {
      console.error("Chat Error:", error);
      setMessages(prev => [...prev, { role: 'model', text: "The kitchen cloud is a bit foggy! 🌫️ Can you try asking that again?" }]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickActions = [
    "What's healthy?",
    "My order status?",
    "Recommend snacks",
  ];

  return (
    <div className="fixed bottom-4 md:bottom-8 right-4 md:right-8 z-[200] font-sans">
      {isOpen && (
        <div className="absolute bottom-16 md:bottom-24 right-0 w-[280px] md:w-[420px] h-[450px] md:h-[600px] bg-white/95 backdrop-blur-xl rounded-2xl md:rounded-[3rem] shadow-2xl border border-white/20 flex flex-col overflow-hidden animate-in slide-in-from-bottom-6 fade-in duration-300">
          <div className="bg-slate-900 p-4 md:p-8 text-white flex items-center justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 md:w-32 h-24 md:h-32 bg-orange-600/20 rounded-full blur-2xl md:blur-3xl -mr-12 md:-mr-16 -mt-12 md:-mt-16"></div>
            <div className="relative z-10 flex items-center space-x-2 md:space-x-4">
              <div className="bg-orange-600 p-2 md:p-3 rounded-xl md:rounded-2xl shadow-lg shadow-orange-900/40">
                <Bot className="w-4 h-4 md:w-6 md:h-6 text-white" />
              </div>
              <div>
                <h4 className="font-black text-sm md:text-lg italic tracking-tighter">Crave Assistant</h4>
                <div className="flex items-center">
                  <span className="w-1.5 h-1.5 md:w-2 md:h-2 bg-emerald-500 rounded-full animate-pulse mr-1 md:mr-2"></span>
                  <p className="text-[7px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">Kitchen AI Online</p>
                </div>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="relative z-10 bg-white/10 p-1.5 md:p-2 rounded-full hover:bg-white/20 transition-all"
            >
              <X className="w-4 h-4 md:w-5 md:h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 md:space-y-6 bg-gray-50/30">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                <div className={`max-w-[90%] md:max-w-[85%] flex items-end space-x-2 md:space-x-3 ${msg.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                  <div className={`shrink-0 w-6 h-6 md:w-8 md:h-8 rounded-lg md:rounded-xl flex items-center justify-center shadow-sm ${msg.role === 'user' ? 'bg-orange-100 text-orange-600' : 'bg-slate-900 text-white'}`}>
                    {msg.role === 'user' ? <User className="w-3 h-3 md:w-4 md:h-4" /> : <Bot className="w-3 h-3 md:w-4 md:h-4" />}
                  </div>
                  <div className={`p-3 md:p-4 rounded-xl md:rounded-[1.8rem] text-[11px] md:text-sm font-semibold leading-relaxed shadow-sm ${
                    msg.role === 'user' 
                    ? 'bg-orange-600 text-white rounded-br-none shadow-orange-100' 
                    : 'bg-white text-slate-700 border border-gray-100 rounded-bl-none shadow-slate-100'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white/80 border border-gray-100 p-3 md:p-4 rounded-xl md:rounded-[1.5rem] rounded-tl-none flex items-center space-x-2 md:space-x-3 shadow-sm">
                  <div className="flex space-x-1">
                    <div className="w-1 h-1 md:w-1.5 md:h-1.5 bg-orange-600 rounded-full animate-bounce"></div>
                    <div className="w-1 h-1 md:w-1.5 md:h-1.5 bg-orange-600 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-1 h-1 md:w-1.5 md:h-1.5 bg-orange-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  </div>
                  <span className="text-[7px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">Analyzing Kitchen Data</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {!isLoading && messages.length < 6 && (
            <div className="px-4 md:px-6 pb-2 flex flex-wrap gap-1 md:gap-2">
              {quickActions.map(action => (
                <button 
                  key={action}
                  onClick={() => { setInput(action); setTimeout(() => handleSend(), 10); }}
                  className="text-[7px] md:text-[9px] font-black uppercase tracking-widest bg-white border border-gray-100 px-3 py-1.5 md:px-4 md:py-2 rounded-full text-slate-500 hover:border-orange-500 hover:text-orange-600 transition-all shadow-sm"
                >
                  {action}
                </button>
              ))}
            </div>
          )}

          <form onSubmit={handleSend} className="p-4 md:p-6 bg-white border-t border-gray-100">
            <div className="relative group">
              <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Message assistant..."
                className="w-full pl-4 md:pl-6 pr-10 md:pr-14 py-3 md:py-5 bg-gray-50 border border-gray-100 rounded-xl md:rounded-[2rem] text-[11px] md:text-sm font-black focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500/50 transition-all placeholder:text-slate-300"
              />
              <button 
                type="submit"
                disabled={!input.trim() || isLoading}
                className={`absolute right-1.5 md:right-2 top-1/2 -translate-y-1/2 p-2.5 md:p-4 rounded-lg md:rounded-2xl transition-all shadow-xl ${
                  !input.trim() || isLoading 
                  ? 'bg-gray-100 text-slate-300' 
                  : 'bg-orange-600 text-white hover:bg-orange-700 shadow-orange-200 active:scale-95'
                }`}
              >
                <Send className="w-3 h-3 md:w-4 md:h-4" />
              </button>
            </div>
            <div className="flex items-center justify-center space-x-1 md:space-x-2 mt-3 md:mt-4 opacity-30">
              <Zap className="w-2.5 h-2.5 md:w-3 md:h-3 text-orange-600" />
              <p className="text-[7px] md:text-[9px] font-black uppercase tracking-[0.2em] md:tracking-[0.3em] text-slate-400">Gemini Pro Vision Enabled</p>
            </div>
          </form>
        </div>
      )}

      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-12 h-12 md:w-20 md:h-20 rounded-xl md:rounded-[2.5rem] flex items-center justify-center shadow-[0_10px_30px_rgba(249,115,22,0.2)] md:shadow-[0_20px_50px_rgba(249,115,22,0.3)] transition-all duration-500 hover:scale-110 active:scale-90 group relative ${isOpen ? 'bg-slate-900 rotate-90 rounded-full' : 'bg-orange-600 hover:bg-orange-700'}`}
      >
        {isOpen ? (
          <X className="w-5 h-5 md:w-8 md:h-8 text-white" />
        ) : (
          <>
            <MessageCircle className="w-6 h-6 md:w-9 md:h-9 text-white group-hover:rotate-12 transition-transform" />
            <div className="absolute -top-0.5 -right-0.5 w-4 h-4 md:w-7 md:h-7 bg-emerald-500 rounded-lg md:rounded-2xl border-2 md:border-4 border-white flex items-center justify-center shadow-lg">
              <Sparkles className="w-2 h-2 md:w-3 md:h-3 text-white animate-pulse" />
            </div>
            <div className="absolute -bottom-0.5 -left-0.5 w-2.5 h-2.5 md:w-4 md:h-4 bg-orange-400 rounded-full border border-white animate-ping"></div>
          </>
        )}
      </button>
    </div>
  );
};

export default ChatWidget;
