'use client';

import { useChat } from '@ai-sdk/react';
import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Send, Bot, User, Loader2, Trash2, Plus } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export default function Chat({ projectName }: { projectName: string }) {
  const [error, setError] = useState<string | null>(null);

  const { messages, input, handleInputChange, handleSubmit, isLoading, setMessages } = useChat({
    api: '/api/chat',
    body: { projectName },
    onError: (err) => {
      console.error(err);
      setError(err.message || 'Error al comunicarse con la IA');
    },
    onFinish: () => setError(null),
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Cargar historial al iniciar
  useEffect(() => {
    const saved = localStorage.getItem('codefox-messages');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
        }
      } catch (e) {
        console.error('Error cargando historial', e);
      }
    }
  }, [setMessages]);

  // Guardar historial cada vez que cambian los mensajes
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('codefox-messages', JSON.stringify(messages));
    }
  }, [messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const clearHistory = () => {
    if (confirm('¿Borrar todo el historial de esta conversación?')) {
      setMessages([]);
      localStorage.removeItem('codefox-messages');
      setError(null);
    }
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    handleSubmit(e);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-65px)] max-w-3xl mx-auto w-full">
      {/* Barra superior del chat */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-800 text-sm">
        <span className="text-gray-500">
          {messages.length > 0 ? `${messages.length} mensajes` : 'Nueva conversación'}
        </span>
        <div className="flex gap-2">
          <button
            onClick={clearHistory}
            className="flex items-center gap-1 text-gray-500 hover:text-red-500 transition text-xs px-2 py-1 rounded"
            title="Borrar historial"
          >
            <Trash2 size={14} />
            Borrar
          </button>
        </div>
      </div>

      {/* Mensajes */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {messages.length === 0 && !isLoading && (
          <div className="text-center text-gray-500 mt-12 px-4">
            <Bot size={48} className="mx-auto mb-4 opacity-40" />
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
              ¿Qué proyecto quieres construir hoy?
            </h2>
            <p className="mt-2 text-gray-500 text-sm max-w-md mx-auto">
              Dime la idea y te ayudo a planearla, programarla y terminarla paso a paso.
            </p>

            <div className="mt-8 grid gap-2 text-sm text-left max-w-sm mx-auto">
              {[
                'Quiero crear una app de hábitos',
                'Ayúdame a hacer una landing page',
                'Quiero aprender a hacer un bot de Discord',
                'Tengo una idea de SaaS, ayúdame a planearla',
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => {
                    handleInputChange({ target: { value: suggestion } } as any);
                    inputRef.current?.focus();
                  }}
                  className="text-left px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                >
                  → {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {m.role === 'assistant' && (
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Bot size={16} className="text-white" />
              </div>
            )}
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                m.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
              }`}
            >
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code({ node, className, children, ...props }: any) {
                    const match = /language-(\w+)/.exec(className || '');
                    const isInline = !match && !String(children).includes('\n');
                    
                    if (isInline) {
                      return (
                        <code className="bg-black/10 dark:bg-white/10 px-1.5 py-0.5 rounded text-xs font-mono" {...props}>
                          {children}
                        </code>
                      );
                    }
                    return (
                      <pre className="bg-gray-900 text-gray-100 p-3 rounded-lg overflow-x-auto my-2 text-xs font-mono">
                        <code className={className} {...props}>{children}</code>
                      </pre>
                    );
                  },
                }}
              >
                {m.content}
              </ReactMarkdown>
            </div>
            {m.role === 'user' && (
              <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                <User size={16} className="text-white" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
              <Bot size={16} className="text-white" />
            </div>
            <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl px-4 py-3 flex items-center gap-2">
              <Loader2 className="animate-spin text-gray-500" size={16} />
              <span className="text-sm text-gray-500">Pensando...</span>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-xl text-sm">
            <strong>Error:</strong> {error}
            <br />
            <span className="text-xs opacity-80">
              Revisa que tengas el archivo .env.local con tu API Key de Groq.
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={onSubmit} className="p-4 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
        <div className="flex gap-2 max-w-3xl mx-auto">
          <input
            ref={inputRef}
            className="flex-1 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white placeholder:text-gray-400"
            value={input}
            onChange={handleInputChange}
            placeholder="Escribe tu idea o pregunta..."
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl px-4 py-3 transition flex items-center justify-center min-w-[48px]"
          >
            {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </button>
        </div>
      </form>
    </div>
  );
}
