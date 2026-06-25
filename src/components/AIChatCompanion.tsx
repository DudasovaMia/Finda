import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, 
  MessageSquare, 
  X, 
  Sparkles, 
  Tv, 
  CornerDownRight, 
  RefreshCw,
  Minus
} from 'lucide-react';
import { UserProfile, TVShow } from '../types';

interface Message {
  role: 'user' | 'model';
  text: string;
}

interface AIChatCompanionProps {
  userProfile: UserProfile;
  currentShows: TVShow[];
  onOpenShow: (show: TVShow) => void;
  onClose?: () => void;
}

const PRESET_PROMPTS = [
  "Čo dnes večer dávajú? 🍿",
  "Odporuč mi niečo na základe môjho profilu! ⭐",
  "Dávajú dnes nejaký dobrý film? 🎬",
  "Sú v programe nejaké športové prenosy? ⚽",
];

export default function AIChatCompanion({ 
  userProfile, 
  currentShows, 
  onOpenShow,
  onClose
}: AIChatCompanionProps) {
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: 'model', 
      text: `Ahoj ${userProfile.name}! Ja som **finda AI Kamoš** – tvoj osobný televízny sprievodca. 🎬\n\nAnalyzoval som tvoj profil: obľubuješ žánre **${userProfile.favoriteGenres.join(', ')}** a tvojím operátorom je **${userProfile.operator.toUpperCase()}**.\n\nMôžeš sa ma spýtať na čokoľvek ohľadom dnešného programu alebo ma požiadať o výber filmu na mieru!` 
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() || loading) return;

    const userMsg = textToSend.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMsg,
          history: messages.slice(1), // Exclude initial greeting to keep prompt size small
          userProfile,
          currentShows
        })
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(prev => [...prev, { role: 'model', text: data.reply }]);
      } else {
        setMessages(prev => [...prev, { 
          role: 'model', 
          text: 'Prepáč, zlyhalo spojenie s mojím filmovým mozgom. Skús to prosím o chvíľu znova. 🍿' 
        }]);
      }
    } catch (err) {
      console.error('Chat error:', err);
      setMessages(prev => [...prev, { 
        role: 'model', 
        text: 'Chyba siete. Uisti sa, že tvoj server beží správne. 📡' 
      }]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([
      { 
        role: 'model', 
        text: `Premazané! Ako ti môžem opäť pomôcť s dnešným TV programom, ${userProfile.name}? 🍿` 
      }
    ]);
  };

  return (
    <div id="ai-chat-companion" className="flex flex-col h-full bg-bento-card border border-bento-border rounded-3xl overflow-hidden shadow-2xl">
      {/* Companion Titlebar */}
      <div className="p-4 bg-gradient-to-r from-bento-card to-bento-bg border-b border-bento-border flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-lg shadow-md border border-blue-400/20">
              🤖
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-bento-card" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-bold text-sm text-white">finda AI Kamoš</h3>
              <span className="text-[10px] bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded-full border border-blue-500/20 font-bold uppercase tracking-wider">PROTOTYP</span>
            </div>
            <p className="text-[10px] text-bento-muted">Online • Odpovedá okamžite</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button 
            onClick={clearChat}
            title="Vyčistiť chat"
            className="p-1.5 hover:bg-bento-cell rounded-lg text-bento-muted hover:text-white transition-colors cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          {onClose && (
            <button 
              onClick={onClose}
              className="p-1.5 hover:bg-bento-cell rounded-lg text-bento-muted hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-bento-bg/30">
        {messages.map((m, idx) => {
          const isModel = m.role === 'model';
          return (
            <div 
              key={idx}
              className={`flex gap-2.5 ${isModel ? 'justify-start' : 'justify-end'}`}
            >
              {isModel && (
                <div className="w-8 h-8 rounded-lg bg-bento-cell flex items-center justify-center text-sm border border-bento-border-light flex-shrink-0">
                  🤖
                </div>
              )}

              <div className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                isModel 
                  ? 'bg-bento-card text-bento-text border border-bento-border-light rounded-tl-none font-medium' 
                  : 'bg-blue-600 text-white rounded-tr-none font-semibold shadow-md shadow-blue-600/5'
              }`}>
                {/* Parse minor markdown styling manually */}
                {m.text.split('\n').map((line, i) => {
                  // Replace double stars with bold tags simple parser
                  let parsedLine = line;
                  const boldRegex = /\*\*(.*?)\*\*/g;
                  const parts = [];
                  let lastIndex = 0;
                  let match;
                  
                  while ((match = boldRegex.exec(line)) !== null) {
                    if (match.index > lastIndex) {
                      parts.push(line.substring(lastIndex, match.index));
                    }
                    parts.push(<strong key={match.index} className="text-white font-bold">{match[1]}</strong>);
                    lastIndex = boldRegex.lastIndex;
                  }
                  if (lastIndex < line.length) {
                    parts.push(line.substring(lastIndex));
                  }

                  return (
                    <p key={i} className={i > 0 ? 'mt-1.5' : ''}>
                      {parts.length > 0 ? parts : line}
                    </p>
                  );
                })}

                {/* Special helper: if chatbot mentions specific shows from the active list, we can link them! */}
                {isModel && currentShows.some(show => m.text.toLowerCase().includes(show.title.toLowerCase())) && (
                  <div className="mt-2 pt-2 border-t border-bento-border flex flex-wrap gap-1.5">
                    {currentShows
                      .filter(show => m.text.toLowerCase().includes(show.title.toLowerCase()))
                      .map(show => (
                        <button
                          key={show.id}
                          onClick={() => onOpenShow(show)}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-blue-500/10 border border-blue-500/20 hover:border-blue-500/50 rounded-lg text-[10px] text-blue-300 font-bold transition-all hover:bg-blue-500/20 cursor-pointer"
                        >
                          <Tv className="w-3 h-3" />
                          <span>Zobraziť {show.title}</span>
                        </button>
                      ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex gap-2.5 justify-start">
            <div className="w-8 h-8 rounded-lg bg-bento-cell flex items-center justify-center text-sm border border-bento-border-light flex-shrink-0">
              🤖
            </div>
            <div className="bg-bento-card border border-bento-border rounded-2xl rounded-tl-none p-3.5 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
              <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
              <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Preset Prompts Row */}
      {messages.length < 5 && (
        <div className="p-3 bg-bento-bg/40 border-t border-bento-border">
          <p className="text-[10px] text-bento-muted font-semibold mb-1.5 px-1 uppercase tracking-wider">Skús rýchle otázky:</p>
          <div className="flex flex-col gap-1.5">
            {PRESET_PROMPTS.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSend(p)}
                className="flex items-center gap-1.5 text-left text-[11px] text-bento-text hover:text-blue-400 hover:bg-blue-500/5 p-2 rounded-xl border border-bento-border hover:border-bento-border-light transition-all font-medium cursor-pointer"
              >
                <CornerDownRight className="w-3 h-3 text-blue-500 flex-shrink-0" />
                <span>{p}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Chat Input */}
      <form 
        onSubmit={(e) => {
          e.preventDefault();
          handleSend(input);
        }}
        className="p-3 bg-bento-card border-t border-bento-border flex gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Opýtaj sa na film, herca, stanicu..."
          className="flex-1 bg-bento-cell border border-bento-border hover:border-bento-border-light focus:border-blue-500 rounded-xl py-2 px-3 text-xs focus:outline-none transition-all placeholder:text-slate-650 text-white font-medium"
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="p-2 bg-blue-600 hover:bg-blue-500 disabled:bg-bento-cell disabled:text-bento-muted text-white rounded-xl transition-all shadow-md flex items-center justify-center flex-shrink-0 cursor-pointer"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
