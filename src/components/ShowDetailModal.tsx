import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Star, 
  Sparkles, 
  Clock, 
  Tv, 
  Film, 
  User, 
  Play, 
  ThumbsUp, 
  AlertCircle,
  Eye
} from 'lucide-react';
import { TVShow, UserProfile } from '../types';

interface ShowDetailModalProps {
  show: TVShow | null;
  userProfile: UserProfile;
  isRecommended: boolean;
  isWatched: boolean;
  onToggleWatched: (showId: string) => void;
  onClose: () => void;
  showToast: (message: string, type: 'success' | 'info' | 'warning') => void;
}

export default function ShowDetailModal({ 
  show, 
  userProfile, 
  isRecommended, 
  isWatched,
  onToggleWatched,
  onClose,
  showToast
}: ShowDetailModalProps) {
  const [insights, setInsights] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [hasVoted, setHasVoted] = useState<boolean>(false);

  useEffect(() => {
    if (!show) return;

    // Reset local modal state
    setInsights('');
    setUserRating(null);
    setHasVoted(false);

    // Fetch AI insights from Express backend
    const fetchInsights = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/show-insights', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userProfile,
            show
          })
        });

        if (response.ok) {
          const data = await response.json();
          setInsights(data.insights);
        } else {
          setInsights('Momentálne sa nepodarilo spojiť s AI asistentom, ale program plne odporúčame!');
        }
      } catch (err) {
        console.error('Failed to load insights:', err);
        setInsights('Chyba spojenia. Skontroluj, či server beží.');
      } finally {
        setLoading(false);
      }
    };

    fetchInsights();
  }, [show, userProfile]);

  if (!show) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-bento-bg/85 backdrop-blur-md"
        />

        {/* Modal box */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative bg-bento-card border border-bento-border rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col md:flex-row text-bento-text z-10"
        >
          {/* Left: Poster Area */}
          <div className="relative w-full md:w-2/5 h-64 md:h-auto min-h-[300px] bg-bento-bg overflow-hidden">
            <img 
              src={show.posterUrl} 
              alt={show.title} 
              className="w-full h-full object-cover opacity-90 transition-transform duration-700 hover:scale-105"
            />
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-bento-bg via-transparent to-transparent md:bg-gradient-to-r md:from-transparent md:to-bento-bg" />
            
            {/* Station badge */}
            <div className="absolute top-4 left-4 inline-flex items-center gap-1.5 px-3 py-1 bg-bento-card border border-bento-border-light rounded-full text-xs font-semibold tracking-wide text-white shadow-md">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              <span>{show.station}</span>
            </div>

            {/* Recommended Star Badge */}
            {isRecommended && (
              <div className="absolute bottom-4 left-4 bg-yellow-500 text-slate-950 px-3.5 py-1.5 rounded-xl font-black text-xs flex items-center gap-1.5 shadow-lg border border-yellow-400">
                <Star className="w-4 h-4 fill-slate-950 stroke-slate-950" />
                <span>Odporúčané pre teba</span>
              </div>
            )}
          </div>

          {/* Right: Content details */}
          <div className="flex-1 p-6 md:p-8 overflow-y-auto flex flex-col justify-between max-h-[90vh] md:max-h-[600px]">
            <div>
              {/* Top Row with close */}
              <div className="flex items-start justify-between gap-4 mb-2">
                <div>
                  <span className="text-xs text-blue-400 font-bold uppercase tracking-wider">
                    {show.genre} • {show.isMovie ? 'Film' : 'Seriál / Relácia'}
                  </span>
                  <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white mt-1">
                    {show.title}
                  </h2>
                </div>
                <button 
                  onClick={onClose}
                  className="p-1.5 hover:bg-bento-cell rounded-xl transition-colors text-bento-muted hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Time and ratings */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-bento-muted mb-6 bg-bento-bg/40 p-3 rounded-xl border border-bento-border-light">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-bento-muted" />
                  <span className="font-semibold text-bento-text">{show.startTime} - {show.endTime}</span>
                  <span className="text-[10px] text-bento-muted opacity-60">({show.durationMinutes} min)</span>
                </div>
                {show.year && (
                  <div className="flex items-center gap-1">
                    <span>• Rok:</span>
                    <span className="font-semibold text-bento-text">{show.year}</span>
                  </div>
                )}
                {show.ratingCsfd && (
                  <div className="flex items-center gap-1">
                    <span>• ČSFD:</span>
                    <span className="font-extrabold text-red-500">{show.ratingCsfd}%</span>
                  </div>
                )}
                {show.ratingImdb && (
                  <div className="flex items-center gap-1">
                    <span>• IMDb:</span>
                    <span className="font-extrabold text-yellow-500">{show.ratingImdb}/10</span>
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="mb-6">
                <h3 className="text-xs font-semibold text-bento-muted uppercase tracking-wider mb-2">Popis obsahu</h3>
                <p className="text-sm text-bento-text opacity-90 leading-relaxed font-sans font-normal">
                  {show.description}
                </p>
              </div>

              {/* Cast & Crew */}
              {(show.director || (show.cast && show.cast.length > 0)) && (
                <div className="grid grid-cols-2 gap-4 mb-6 border-t border-bento-border-light pt-4">
                  {show.director && (
                    <div>
                      <h4 className="text-[10px] font-semibold text-bento-muted uppercase tracking-wider mb-1">Réžia</h4>
                      <p className="text-xs font-bold text-white">{show.director}</p>
                    </div>
                  )}
                  {show.cast && show.cast.length > 0 && (
                    <div>
                      <h4 className="text-[10px] font-semibold text-bento-muted uppercase tracking-wider mb-1">Hrajú</h4>
                      <p className="text-xs font-bold text-white truncate" title={show.cast.join(', ')}>
                        {show.cast.join(', ')}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* AI INSIGHTS BLOCK */}
              <div className="border-t border-bento-border pt-4 mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-1.5 bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 rounded-lg">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <h3 className="text-xs font-black text-yellow-500 uppercase tracking-widest">
                    Finda AI Hodnotenie a Tip
                  </h3>
                </div>

                {loading ? (
                  <div className="space-y-2.5 py-2">
                    <div className="h-3 bg-bento-cell rounded-full w-4/5 animate-pulse" />
                    <div className="h-3 bg-bento-cell rounded-full w-full animate-pulse" />
                    <div className="h-3 bg-bento-cell rounded-full w-2/3 animate-pulse" />
                    <p className="text-[10px] text-bento-muted italic animate-pulse mt-1 font-medium">
                      🔍 Skenujem tvoj profil a hľadám súvislosti...
                    </p>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10 text-xs md:text-sm text-bento-text leading-relaxed font-sans font-medium whitespace-pre-wrap">
                    {insights || "Kliknutím obnov AI predpoveď."}
                  </div>
                )}
              </div>
            </div>

            {/* User Interaction & Rating */}
            <div className="border-t border-bento-border pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-auto">
              <div className="flex items-center gap-3">
                <span className="text-xs text-bento-muted font-bold">Tvoje hodnotenie:</span>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => {
                        setUserRating(star);
                        setHasVoted(true);
                        showToast(`Ďakujeme za hodnotenie! Ohodnotil si program "${show.title}" na ${star} hviezd.`, 'success');
                      }}
                      className="text-bento-muted hover:text-yellow-400 transition-colors cursor-pointer"
                    >
                      <Star 
                        className={`w-4 h-4 ${
                          (userRating !== null && star <= userRating) 
                            ? 'text-yellow-400 fill-yellow-400' 
                            : 'text-bento-border'
                        }`} 
                      />
                    </button>
                  ))}
                </div>
                {hasVoted && (
                  <span className="text-[10px] text-green-400 font-bold animate-fade-in">Uložené!</span>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                <button 
                  onClick={() => {
                    const nextWatched = !isWatched;
                    onToggleWatched(show.id);
                    showToast(nextWatched ? `Program "${show.title}" bol označený ako videný.` : `Program "${show.title}" bol označený ako nevidený.`, 'success');
                  }}
                  className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 border rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isWatched 
                      ? 'bg-green-500/15 border-green-500/30 text-green-400 hover:bg-green-500/25' 
                      : 'bg-bento-cell border-bento-border text-bento-muted hover:text-white hover:border-bento-border-light'
                  }`}
                >
                  <Eye className={`w-3.5 h-3.5 ${isWatched ? 'text-green-400 fill-green-400/20' : ''}`} />
                  <span>{isWatched ? 'Už videné' : 'Označiť ako videné'}</span>
                </button>

                <button 
                  onClick={() => showToast(`Pripomienka na program "${show.title}" bola pridaná! Upozorníme ťa 10 minút pred začiatkom.`, 'success')}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 bg-bento-cell hover:bg-bento-border-light border border-bento-border text-bento-text hover:text-white rounded-xl text-xs font-semibold transition-all cursor-pointer"
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Upozorniť ma</span>
                </button>
                
                <a 
                  href={`https://www.youtube.com/results?search_query=${encodeURIComponent(show.title + ' ' + (show.isMovie ? 'film' : 'seriál') + ' oficiálny trailer')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => showToast(`Otváram YouTube vyhľadávanie pre oficiálny trailer k filmu/seriálu "${show.title}"... 🍿`, 'info')}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-red-600/10 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>Prehrať trailer 🍿</span>
                </a>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
