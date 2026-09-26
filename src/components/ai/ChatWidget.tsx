import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User, Sparkles, Zap, Utensils } from 'lucide-react';
import { FoodItem, Order } from '../../types';
import { createAssistantChat } from '../../services/ai/gemini';

interface Message {
  role: 'user' | 'model';
  text: string;
}

interface ChatWidgetProps {
  menu: FoodItem[];
  userName: string;
  orders: Order[];
  onAddToCart?: (item: FoodItem) => void;
}

const ChatWidget: React.FC<ChatWidgetProps> = ({ menu, userName, orders, onAddToCart }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: `Hi ${userName}! 👋 I'm your Crave Smart Assistant. Ask me for recommendations under ₹100, high protein meals, or check your active order!` }
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

  const handleSend = async (userMessage?: string) => {
    const textToSend = userMessage || input.trim();
    if (!textToSend || isLoading) return;

    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: textToSend }]);
    setIsLoading(true);

    try {
      if (!chatSessionRef.current) {
        chatSessionRef.current = createAssistantChat(menu, userName, orders);
      }

      const result = await chatSessionRef.current.sendMessage({ message: textToSend });
      setMessages(prev => [...prev, { role: 'model', text: result.text }]);
    } catch (error) {
      console.error("Chat Error:", error);
      setMessages(prev => [...prev, { role: 'model', text: "Local AI engine is processing... Please try again!" }]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickActions = [
    "What can I eat under ₹100?",
    "Show high protein options",
    "Where is my active order?",
    "Suggest cheap breakfast"
  ];

  return (
    <div className="fixed bottom-4 md:bottom-8 right-4 md:right-8 z-[200] font-sans">
      {isOpen && (
        <div className="absolute bottom-16 md:bottom-20 right-0 w-[300px] sm:w-[380px] md:w-[420px] h-[500px] md:h-[600px] bg-white/95 dark:bg-[#0f172a]/95 backdrop-blur-2xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden animate-in slide-in-from-bottom-6 fade-in duration-300">
          {/* Top Header */}
          <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-4 sm:p-5 text-white flex items-center justify-between relative overflow-hidden shrink-0">
            <div className="relative z-10 flex items-center space-x-3">
              <div className="p-1 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 shadow-sm shrink-0">
                <img src="/chat-icon.png" alt="Crave Assistant" className="w-8 h-8 rounded-xl object-cover" />
              </div>
              <div>
                <h4 className="font-extrabold text-base tracking-tight">Crave Smart Assistant</h4>
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse mr-1.5" />
                  <p className="text-[10px] font-bold uppercase tracking-wider text-blue-100">Local AI Engine • Zero Cloud APIs</p>
                </div>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="relative z-10 bg-white/10 p-2 rounded-full hover:bg-white/20 transition-all text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Actions Chips */}
          <div className="px-4 py-2.5 bg-slate-100/80 dark:bg-slate-800/60 border-b border-slate-200/60 dark:border-slate-800 flex gap-1.5 overflow-x-auto no-scrollbar shrink-0">
            {quickActions.map((action, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(action)}
                className="whitespace-nowrap px-3 py-1 rounded-full text-[10px] font-bold bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 border border-slate-200 dark:border-slate-700 hover:border-blue-400 shadow-2xs transition-all cursor-pointer"
              >
                {action}
              </button>
            ))}
          </div>

          {/* Messages Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 dark:bg-slate-900/40">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in duration-200`}>
                <div className={`max-w-[85%] p-3.5 rounded-2xl text-xs sm:text-sm font-medium leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-br-none shadow-md'
                    : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-bl-none border border-slate-200 dark:border-slate-700/80 shadow-sm'
                }`}>
                  <p className="whitespace-pre-line">{msg.text}</p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl rounded-bl-none border border-slate-200 dark:border-slate-700 flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-100" />
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-200" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer */}
          <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center space-x-2 shrink-0">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about cheap food, order status..."
              className="flex-1 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 border-none"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-40 transition-all shadow-md shrink-0 cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {/* Floating Toggle Button with Custom Image */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle Crave Smart AI Assistant"
        className="group relative p-1 rounded-full bg-blue-600 hover:bg-blue-500 text-white shadow-xl shadow-blue-500/30 transition-all duration-300 hover:scale-110 active:scale-95 flex items-center justify-center cursor-pointer border-2 border-white dark:border-slate-800"
      >
        {isOpen ? (
          <div className="w-12 h-12 rounded-full bg-slate-900/90 text-white flex items-center justify-center">
            <X className="w-6 h-6" />
          </div>
        ) : (
          <img 
            src="/chat-icon.png" 
            alt="Crave AI Chat Assistant" 
            className="w-12 h-12 rounded-full object-cover shadow-sm"
          />
        )}
        <span className="absolute right-full mr-3 hidden group-hover:flex items-center px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-bold whitespace-nowrap shadow-lg">
          Crave Smart AI Assistant
        </span>
      </button>
    </div>
  );
};

export default ChatWidget;
