import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Sparkles, ShoppingBag } from 'lucide-react';
import { ChatMessage } from '../types';
import { streamShoppingAdvice } from '../services/geminiService';
import { useApp } from '../src/contexts/AppContext';

export const ChatAssistant: React.FC = () => {
  const { content: { siteContent } } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: "Hi! I'm your GoSimpleLiving AI assistant. Looking for a specific gadget, home essential, or gift? Ask me anything!"
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input.trim()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      // Create a placeholder message for streaming
      const responseId = (Date.now() + 1).toString();
      setMessages(prev => [...prev, { id: responseId, role: 'model', text: '', isThinking: true }]);

      // Prepare history for API
      const history = messages.map(m => ({ role: m.role, text: m.text }));

      const stream = await streamShoppingAdvice(userMsg.text, history);

      let fullText = '';

      for await (const chunk of stream) {
        fullText += chunk;
        setMessages(prev =>
          prev.map(msg =>
            msg.id === responseId
              ? { ...msg, text: fullText, isThinking: false }
              : msg
          )
        );
      }

    } catch (error) {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        text: "I'm having trouble connecting to the catalog right now. Please try again later."
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!siteContent.aiChatEnabled) return null;

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 z-40 bg-slate-900 text-white p-4 rounded-full shadow-2xl hover:bg-slate-800 transition-all duration-300 transform hover:scale-105 flex items-center gap-2 ${isOpen ? 'translate-y-24 opacity-0' : 'translate-y-0 opacity-100'}`}
      >
        <Sparkles size={20} className="text-amber-400" />
        <span className="font-semibold hidden md:inline">Ask AI Expert</span>
      </button>

      {/* Chat Window */}
      <div className={`fixed bottom-6 right-6 z-50 w-full max-w-[360px] bg-white rounded-2xl shadow-2xl border border-slate-200 transition-all duration-300 origin-bottom-right flex flex-col ${isOpen ? 'scale-100 opacity-100 translate-y-0' : 'scale-90 opacity-0 translate-y-8 pointer-events-none'}`} style={{ height: '500px' }}>

        {/* Header */}
        <div className="bg-slate-900 p-4 rounded-t-2xl flex items-center justify-between">
          <div className="flex items-center gap-2 text-white">
            <div className="p-1.5 bg-amber-500 rounded-lg text-slate-900">
              <ShoppingBag size={18} />
            </div>
            <div>
              <h3 className="font-bold text-sm">Shopping Assistant</h3>
              <p className="text-xs text-slate-400">Powered by Gemini AI</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 scrollbar-hide">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed ${msg.role === 'user'
                  ? 'bg-amber-500 text-slate-900 rounded-tr-none font-medium'
                  : 'bg-white text-slate-700 shadow-sm border border-slate-100 rounded-tl-none'
                  }`}
              >
                {msg.text || (msg.isThinking && <span className="animate-pulse">Thinking...</span>)}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="p-3 border-t border-slate-100 bg-white rounded-b-2xl">
          <div className="relative flex items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about products..."
              className="w-full bg-slate-100 text-slate-900 placeholder-slate-500 rounded-xl py-3 pl-4 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="absolute right-2 p-1.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send size={16} />
            </button>
          </div>
        </form>
      </div>
    </>
  );
};