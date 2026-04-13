'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, X, Loader2, BarChart3, FileText, Shield, Zap } from 'lucide-react';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AssistantPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const QUICK_ACTIONS = [
  { label: 'Analyze risks', icon: <BarChart3 size={12} />, prompt: 'What are the top risks in my portfolio right now?' },
  { label: 'Draft report', icon: <FileText size={12} />, prompt: 'Generate a weekly stakeholder report for the portfolio.' },
  { label: 'Check compliance', icon: <Shield size={12} />, prompt: 'Which projects are missing required governance approvals?' },
  { label: 'Budget forecast', icon: <Zap size={12} />, prompt: 'Based on current burn rates, which projects will exceed budget?' },
];

export default function AssistantPanel({ isOpen, onClose }: AssistantPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: 'Welcome to Kogvantage! I\'m your AI portfolio assistant powered by Claude. I can analyze your roadmap, interpret financial data, generate reports, and answer questions about your portfolio. How can I help?',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  const handleSend = async (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText || isLoading) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: messageText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/trpc/ai.chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      let assistantText: string;
      if (response.ok) {
        const data = await response.json();
        assistantText = data.result?.data || 'I received your message. The AI service will be connected shortly.';
      } else {
        assistantText = 'I\'m here to help! The AI service is being configured. In the meantime, I can show you around the platform.';
      }

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: assistantText,
          timestamp: new Date(),
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'I\'m currently in demo mode. Once your Anthropic API key is configured, I\'ll be able to analyze your portfolio, generate reports, and more.',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <aside
      className="flex flex-col border-l h-full"
      style={{
        width: '360px',
        backgroundColor: 'var(--color-surface)',
        borderColor: 'var(--color-border)',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b"
        style={{ borderColor: 'var(--color-border)' }}
      >
        <div className="flex items-center gap-2">
          <div
            className="flex items-center justify-center w-7 h-7 rounded-lg"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            <Sparkles size={14} className="text-white" />
          </div>
          <div>
            <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
              AI Assistant
            </h3>
            <span
              className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
              style={{
                backgroundColor: 'var(--color-primary)20',
                color: 'var(--color-primary-light)',
              }}
            >
              Claude Sonnet
            </span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-md transition-colors hover:bg-white/10"
          style={{ color: 'var(--color-text-muted)' }}
        >
          <X size={16} />
        </button>
      </div>

      {/* Quick Actions */}
      <div
        className="flex gap-1.5 px-3 py-2 border-b overflow-x-auto"
        style={{ borderColor: 'var(--color-border)' }}
      >
        {QUICK_ACTIONS.map((action) => (
          <button
            key={action.label}
            onClick={() => handleSend(action.prompt)}
            className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium whitespace-nowrap transition-colors hover:bg-white/5"
            style={{
              backgroundColor: 'var(--color-surface-raised)',
              color: 'var(--color-text-secondary)',
            }}
          >
            {action.icon}
            {action.label}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div
              className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full mt-0.5"
              style={{
                backgroundColor:
                  msg.role === 'assistant'
                    ? 'var(--color-primary)20'
                    : 'var(--color-surface-overlay)',
              }}
            >
              {msg.role === 'assistant' ? (
                <Bot size={12} style={{ color: 'var(--color-primary-light)' }} />
              ) : (
                <User size={12} style={{ color: 'var(--color-text-muted)' }} />
              )}
            </div>
            <div
              className={`max-w-[85%] px-3 py-2 rounded-xl text-xs leading-relaxed ${
                msg.role === 'user' ? 'rounded-br-sm' : 'rounded-bl-sm'
              }`}
              style={{
                backgroundColor:
                  msg.role === 'user'
                    ? 'var(--color-primary)'
                    : 'var(--color-surface-raised)',
                color:
                  msg.role === 'user' ? 'white' : 'var(--color-text-secondary)',
              }}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-2">
            <div
              className="flex items-center justify-center w-6 h-6 rounded-full"
              style={{ backgroundColor: 'var(--color-primary)20' }}
            >
              <Bot size={12} style={{ color: 'var(--color-primary-light)' }} />
            </div>
            <div
              className="px-3 py-2 rounded-xl rounded-bl-sm"
              style={{ backgroundColor: 'var(--color-surface-raised)' }}
            >
              <Loader2
                size={14}
                className="animate-spin"
                style={{ color: 'var(--color-primary-light)' }}
              />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div
        className="px-3 py-3 border-t"
        style={{ borderColor: 'var(--color-border)' }}
      >
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-xl"
          style={{
            backgroundColor: 'var(--color-surface-raised)',
            border: '1px solid var(--color-border)',
          }}
        >
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask about your portfolio..."
            className="flex-1 bg-transparent text-xs outline-none placeholder:text-gray-500"
            style={{ color: 'var(--color-text)' }}
            disabled={isLoading}
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || isLoading}
            className="p-1 rounded-md transition-colors disabled:opacity-30"
            style={{ color: 'var(--color-primary-light)' }}
          >
            <Send size={14} />
          </button>
        </div>
      </div>
    </aside>
  );
}
