import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { Send, Bot, User, Loader2 } from 'lucide-react';

interface ChatInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  isProcessing: boolean;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ messages, onSendMessage, isProcessing }) => {
  const [input, setInput] = useState('');
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isProcessing]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isProcessing) {
      onSendMessage(input);
      setInput('');
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-hide">
        {messages.length === 0 && (
             <div className="flex flex-col items-center justify-center h-full text-slate-400 opacity-50">
                <Bot className="w-12 h-12 mb-4" />
                <p>Tell me about the event you want to plan.</p>
             </div>
        )}
        
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-3 ${
              msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
            }`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'
              }`}
            >
              {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
            </div>
            
            <div
              className={`max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-indigo-600 text-white rounded-tr-none'
                  : 'bg-slate-100 text-slate-800 rounded-tl-none'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        
        {isProcessing && (
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600">
               <Bot size={16} />
             </div>
             <div className="bg-slate-100 p-4 rounded-2xl rounded-tl-none">
                <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
             </div>
          </div>
        )}
        <div ref={endOfMessagesRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-slate-100 bg-white">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Describe your ideas, budget, or preferences..."
            disabled={isProcessing}
            className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
          />
          <button
            type="submit"
            disabled={!input.trim() || isProcessing}
            className="p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send size={20} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatInterface;
