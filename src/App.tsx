import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Tv, 
  Search, 
  Star, 
  Sparkles, 
  MessageSquare, 
  User, 
  Clock, 
  Filter, 
  SlidersHorizontal,
  Plus, 
  RotateCcw,
  Check, 
  HelpCircle,
  TrendingUp,
  X,
  Play,
  Share2,
  Eye,
  EyeOff
} from 'lucide-react';
import CustomCursor from './components/CustomCursor';
import SetupWizard from './components/SetupWizard';
import ShowDetailModal from './components/ShowDetailModal';
import AIChatCompanion from './components/AIChatCompanion';
import { UserProfile, TVShow, PRESET_OPERATORS, PRESET_AVATARS, PRESET_GENRES } from './types';
import { TV_SHOWS_DATABASE, STATIONS_PRESET } from './data';

// Helper: Convert "HH:MM" to minutes from midnight
const timeToMinutes = (timeStr: string): number => {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
};

// Toast notification interface
interface Toast {
  id: string;
  message: string;
  type: 'success' | 'info' | 'warning';
}

export default function App() {
  // Toast notifications state
  const [toasts, setToasts] = useState<Toast[]>([]);
  const showToast = (message: string, type: 'success' | 'info' | 'warning' = 'success') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  // Application State
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isSetUp, setIsSetUp] = useState<boolean>(false);
  const [showEditProfile, setShowEditProfile] = useState<boolean>(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState<boolean>(false);

  // Watched / Already Seen State
  const [watchedShowIds, setWatchedShowIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('finda_watched_shows');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse watched shows:', e);
      }
    }
    return [];
  });
  const [hideWatched, setHideWatched] = useState<boolean>(false);

  const handleToggleWatched = (showId: string) => {
    setWatchedShowIds(prev => {
      const next = prev.includes(showId) 
        ? prev.filter(id => id !== showId) 
        : [...prev, showId];
      localStorage.setItem('finda_watched_shows', JSON.stringify(next));
      return next;
    });
  };
  
  // Filtering & Search
  const [selectedStation, setSelectedStation] = useState<string>('Všetky');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedGenreFilter, setSelectedGenreFilter] = useState<string>('Všetky');
  const [onlyRecommended, setOnlyRecommended] = useState<boolean>(false);
  const [onlyMovies, setOnlyMovies] = useState<boolean>(false);
  const [onlyLive, setOnlyLive] = useState<boolean>(false);

  // Simulated Time (Lets user slide/mock time to see "Live" progress bars!)
  const [useRealTime, setUseRealTime] = useState<boolean>(false);
  const [simulatedHour, setSimulatedHour] = useState<number>(21); // Default to 21:00 (prime-time)
  const [simulatedMinute, setSimulatedMinute] = useState<number>(15); // Default to 21:15
  const [currentTimeMinutes, setCurrentTimeMinutes] = useState<number>(21 * 60 + 15);

  // Active Selected Show Modal
  const [selectedShow, setSelectedShow] = useState<TVShow | null>(null);

  // AI Chat Assistant Panel State
  const [showAIChat, setShowAIChat] = useState<boolean>(false);

  // TV shows data state fetched dynamically from Slovak TV schedules
  const [tvShowsList, setTvShowsList] = useState<TVShow[]>(TV_SHOWS_DATABASE);
  const [liveTvSource, setLiveTvSource] = useState<"local" | "live">("local");
  const [loadingLiveTv, setLoadingLiveTv] = useState<boolean>(false);

  // System real-time clock
  const [systemTime, setSystemTime] = useState<Date>(new Date());

  // Load user profile from LocalStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('finda_user_profile');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setUserProfile(parsed);
        setIsSetUp(true);
      } catch (e) {
        console.error('Failed to parse saved user profile:', e);
      }
    }

    // Update real-time clock every second
    const timer = setInterval(() => {
      setSystemTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch live TV program from Slovak TV schedule (tv-program.aktuality.sk proxy) when set up
  useEffect(() => {
    if (!isSetUp) return;

    const fetchLiveTv = async () => {
      setLoadingLiveTv(true);
      showToast("Pripájam sa k tv-program.aktuality.sk pre reálny program na dnes... 📡", "info");
      try {
        const response = await fetch("/api/live-tv");
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (data.shows && Array.isArray(data.shows) && data.shows.length > 0) {
          // Adjust ids to avoid duplicates and store
          const sanitizedShows = data.shows.map((show: any, index: number) => ({
            ...show,
            id: show.id || `live_${index}`
          }));
          setTvShowsList(sanitizedShows);
          setLiveTvSource("live");
          showToast("Aktuálny program úspešne načítaný z tv-program.aktuality.sk! ✅", "success");
        } else {
          console.log("No live shows returned, using local template.");
          setLiveTvSource("local");
          showToast("Aktuálne používame stabilnú programovú ponuku. 🍿", "info");
        }
      } catch (err) {
        console.error("Failed to load live tv program:", err);
        setLiveTvSource("local");
        showToast("Nepodarilo sa stiahnuť reálny program, používam pripravený zoznam.", "warning");
      } finally {
        setLoadingLiveTv(false);
      }
    };

    fetchLiveTv();
  }, [isSetUp]);

  // Update current active minutes when simulated or real time changes
  useEffect(() => {
    if (useRealTime) {
      const h = systemTime.getHours();
      const m = systemTime.getMinutes();
      setCurrentTimeMinutes(h * 60 + m);
    } else {
      setCurrentTimeMinutes(simulatedHour * 60 + simulatedMinute);
    }
  }, [useRealTime, simulatedHour, simulatedMinute, systemTime]);

  // Handle onboarding completion
  const handleOnboardingComplete = (profile: UserProfile) => {
    setUserProfile(profile);
    setIsSetUp(true);
    localStorage.setItem('finda_user_profile', JSON.stringify(profile));
  };

  // Handle logout / reset
  const handleResetApp = () => {
    setShowLogoutConfirm(true);
  };

  const handleConfirmLogout = () => {
    localStorage.removeItem('finda_user_profile');
    setUserProfile(null);
    setIsSetUp(false);
    setShowEditProfile(false);
    setShowLogoutConfirm(false);
    showToast('Profil bol úspešne vymazaný. Môžeš sa znova nastaviť! 👋', 'info');
  };

  // Update Profile Save
  const handleUpdateProfile = (updated: UserProfile) => {
    setUserProfile(updated);
    localStorage.setItem('finda_user_profile', JSON.stringify(updated));
    setShowEditProfile(false);
  };

  // Helper: check if movie/show is currently running based on active clock
  const getShowAirStatus = (show: TVShow) => {
    const start = timeToMinutes(show.startTime);
    let end = timeToMinutes(show.endTime);
    
    // Handle overnight shows (e.g., starts 22:00, ends 01:15)
    if (end < start) {
      end += 24 * 60; // Add 24 hours in minutes
    }

    const current = currentTimeMinutes;
    const adjustedCurrent = (current < start && end >= 24 * 60) ? current + 24 * 60 : current;

    const isLive = adjustedCurrent >= start && adjustedCurrent < end;
    const isPast = adjustedCurrent >= end;
    const isFuture = adjustedCurrent < start;

    let progress = 0;
    if (isLive) {
      const duration = end - start;
      const elapsed = adjustedCurrent - start;
      progress = Math.min(100, Math.max(0, Math.round((elapsed / duration) * 100)));
    }

    return { isLive, isPast, isFuture, progress };
  };

  // Recommendation engine: Match shows against user profile preferences (Requirement 5)
  const checkIfRecommended = (show: TVShow): boolean => {
    if (!userProfile) return false;

    // 1. Check if the show's genre is in user's favorite genres
    const genreMatch = userProfile.favoriteGenres.some(
      g => g.toLowerCase() === show.genre.toLowerCase() || 
           (show.genre.toLowerCase().includes('/') && 
            show.genre.toLowerCase().split('/').some(part => part.trim().toLowerCase() === g.toLowerCase()))
    );

    // 2. Keyword matching from text field "Obľúbené filmy a seriály"
    let keywordMatch = false;
    if (userProfile.favoriteShows && userProfile.favoriteShows.trim().length > 0) {
      // Split user's text into keywords, remove punctuation, filter short words
      const keywords = userProfile.favoriteShows
        .toLowerCase()
        .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "")
        .split(/\s+/)
        .filter(w => w.length >= 3); // match significant words

      keywordMatch = keywords.some(keyword => 
        show.title.toLowerCase().includes(keyword) || 
        show.description.toLowerCase().includes(keyword) ||
        (show.cast && show.cast.some(actor => actor.toLowerCase().includes(keyword)))
      );
    }

    return genreMatch || keywordMatch;
  };

  // Filter shows database based on all chosen state filters
  const filteredShows = tvShowsList.filter(show => {
    // 1. Station Filter
    if (selectedStation !== 'Všetky' && show.station !== selectedStation) {
      return false;
    }

    // 2. Search Query
    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase();
      const matchTitle = show.title.toLowerCase().includes(q);
      const matchDesc = show.description.toLowerCase().includes(q);
      const matchGenre = show.genre.toLowerCase().includes(q);
      const matchCast = show.cast && show.cast.some(actor => actor.toLowerCase().includes(q));
      if (!matchTitle && !matchDesc && !matchGenre && !matchCast) {
        return false;
      }
    }

    // 3. Genre Filter
    if (selectedGenreFilter !== 'Všetky' && show.genre !== selectedGenreFilter) {
      return false;
    }

    // 4. Recommendation filter
    if (onlyRecommended && !checkIfRecommended(show)) {
      return false;
    }

    // 5. Movies only
    if (onlyMovies && !show.isMovie) {
      return false;
    }

    // 6. Currently Live only
    if (onlyLive) {
      const { isLive } = getShowAirStatus(show);
      if (!isLive) return false;
    }

    // 7. Hide already watched
    if (hideWatched && watchedShowIds.includes(show.id)) {
      return false;
    }

    return true;
  });

  // Render onboarding wizard if not setup
  if (!isSetUp || !userProfile) {
    return <SetupWizard onComplete={handleOnboardingComplete} />;
  }

  // Get active avatar preset emoji
  const userAvatarObj = PRESET_AVATARS.find(a => a.id === userProfile.avatar);
  const avatarVisual = userProfile.avatar.startsWith('data:image') 
    ? <img src={userProfile.avatar} className="w-10 h-10 rounded-xl object-cover border border-indigo-400" alt="Avatar" />
    : <span className="text-2xl">{userAvatarObj?.emoji || '🍿'}</span>;

  // Active operator logo/color details
  const activeOperatorObj = PRESET_OPERATORS.find(op => op.id === userProfile.operator) || PRESET_OPERATORS[0];

  // Helper formatting for clock display
  const formatTime = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  return (
    <div id="finda-app-root" className="min-h-screen bg-bento-bg text-bento-text flex flex-col font-sans selection:bg-blue-500/30 selection:text-white">
      
      {/* TOP HEADER NAVIGATION */}
      <header className="sticky top-0 z-40 bg-bento-card border-b border-bento-border px-4 md:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-baseline gap-1">
            <h1 className="text-3xl font-black tracking-tighter text-white">finda<span className="text-blue-500">.</span></h1>
            <span className="text-[10px] bg-blue-500/10 border border-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded-full font-bold ml-1.5 uppercase tracking-wider">PRO</span>
            
            {/* Live TV source indicator badge */}
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ml-2 uppercase tracking-wider flex items-center gap-1 border ${
              loadingLiveTv
                ? 'bg-amber-500/10 border-amber-500/20 text-amber-400 animate-pulse'
                : liveTvSource === 'live'
                ? 'bg-green-500/10 border-green-500/20 text-green-400'
                : 'bg-slate-500/10 border-slate-500/20 text-slate-400'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${
                loadingLiveTv ? 'bg-amber-400 animate-ping' : liveTvSource === 'live' ? 'bg-green-400' : 'bg-slate-400'
              }`} />
              {loadingLiveTv ? 'Aktualizujem...' : liveTvSource === 'live' ? 'aktuality.sk live 📡' : 'lokálny program 🍿'}
            </span>
          </div>

          <div className="hidden md:flex items-center space-x-2 bg-bento-cell px-3.5 py-1.5 rounded-xl border border-bento-border-light">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span className="text-xs font-medium text-white">Operátor: {activeOperatorObj.name}</span>
          </div>
        </div>

        {/* TIME CONTROLS / SIMULATION DISPLAY */}
        <div className="hidden lg:flex items-center gap-4 bg-bento-cell border border-bento-border-light px-4 py-2 rounded-xl">
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-blue-400 animate-pulse" />
            <span className="text-xs text-bento-muted font-medium">Simulovaný čas:</span>
            <span className="text-sm font-bold font-mono text-white bg-bento-bg border border-bento-border px-2.5 py-0.5 rounded-lg">
              {formatTime(currentTimeMinutes)}
            </span>
          </div>

          <div className="h-4 w-[1px] bg-bento-border" />

          {/* Simulated clock slider */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-bento-muted font-bold">RÁNO</span>
            <input 
              type="range"
              min="0"
              max="1439"
              value={currentTimeMinutes}
              onChange={(e) => {
                const totalMins = Number(e.target.value);
                setUseRealTime(false);
                setSimulatedHour(Math.floor(totalMins / 60));
                setSimulatedMinute(totalMins % 60);
              }}
              className="w-32 accent-blue-500 h-1 bg-bento-border rounded-lg cursor-pointer"
            />
            <span className="text-[10px] text-bento-muted font-bold">NOC</span>
          </div>

          {/* Real vs Sim toggler */}
          <button
            onClick={() => setUseRealTime(!useRealTime)}
            className={`text-[10px] font-bold px-2.5 py-1 rounded-lg transition-all border ${
              useRealTime 
                ? 'bg-green-500/10 text-green-400 border-green-500/20' 
                : 'bg-bento-card text-bento-muted border-bento-border hover:text-white hover:border-bento-border-light'
            }`}
          >
            {useRealTime ? 'Reálny Čas ⏱️' : 'Upraviť 🌙'}
          </button>
        </div>

        {/* USER PROFILE CARD */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAIChat(prev => !prev)}
            className={`relative p-2.5 rounded-xl border transition-all ${
              showAIChat 
                ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-600/20' 
                : 'bg-bento-cell text-bento-text border-bento-border hover:bg-bento-border-light hover:text-white'
            }`}
            title="Spustiť AI asistenta finda"
          >
            <MessageSquare className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-500 rounded-full border border-bento-card animate-pulse" />
          </button>

          {/* User profile dropdown button */}
          <button
            onClick={() => setShowEditProfile(true)}
            className="flex items-center gap-3 bg-bento-cell hover:bg-bento-border-light border border-bento-border-light px-3.5 py-2 rounded-xl transition-all text-left"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-400 border border-bento-border-light flex items-center justify-center text-xs font-bold overflow-hidden">
              {avatarVisual}
            </div>
            <div className="hidden sm:block">
              <h4 className="text-xs font-bold text-white max-w-[100px] truncate">{userProfile.name}</h4>
              <p className="text-[9px] opacity-40 uppercase tracking-widest">Premium</p>
            </div>
          </button>
        </div>
      </header>

      {/* MOBILE SIMULATOR ALERT */}
      <div className="lg:hidden bg-bento-cell border-b border-bento-border px-4 py-2 flex items-center justify-between text-xs text-bento-text">
        <div className="flex items-center gap-1.5 font-mono">
          <Clock className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
          <span>Finda Čas: <strong className="text-white">{formatTime(currentTimeMinutes)}</strong></span>
        </div>
        <input 
          type="range"
          min="0"
          max="1439"
          value={currentTimeMinutes}
          onChange={(e) => {
            const totalMins = Number(e.target.value);
            setUseRealTime(false);
            setSimulatedHour(Math.floor(totalMins / 60));
            setSimulatedMinute(totalMins % 60);
          }}
          className="w-1/2 accent-blue-500 h-1 bg-bento-border rounded-lg cursor-pointer ml-4"
        />
      </div>

      {/* MAIN CONTAINER LAYOUT */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-6 lg:p-8 flex gap-6 overflow-hidden">
        
        {/* LEFT COLUMN: Main program browser */}
        <div className="flex-1 flex flex-col gap-6 overflow-y-auto">
          
          {/* BANNER / WELCOME */}
          <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-br from-bento-highlight to-bento-bg border border-bento-border-light flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl relative overflow-hidden group">
            <div className="absolute bottom-0 right-0 w-[45%] h-[120%] bg-gradient-to-l from-blue-500/10 to-transparent opacity-40 blur-3xl -rotate-12 translate-x-12 pointer-events-none" />

            <div className="space-y-3 z-10 flex-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-full text-[10px] font-bold uppercase tracking-wider">
                <Sparkles className="w-3 h-3 animate-pulse" />
                <span>Personalizovaný prehľad</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                Ahoj, {userProfile.name}! Tu je tvoja ponuka pre <span className="text-blue-400">{activeOperatorObj.name}</span>
              </h2>
              <p className="text-bento-muted text-xs max-w-xl leading-relaxed">
                Na základe tvojich obľúbených žánrov (<strong className="text-blue-300">{userProfile.favoriteGenres.join(', ')}</strong>) a filmov sme označili odporúčané prenosy <strong className="text-yellow-400 font-bold">zlatou hviezdou ⭐</strong>. Klikni na ne a prečítaj si AI analýzu!
              </p>
            </div>

            {/* Quick stats panel */}
            <div className="grid grid-cols-3 gap-3 w-full md:w-auto md:min-w-[340px] z-10">
              <div className="p-4 bg-bento-cell rounded-2xl border border-bento-border-light text-center flex flex-col justify-between h-full">
                <span className="text-xl">⭐</span>
                <div>
                  <h4 className="text-base md:text-lg font-black text-white mt-1 leading-none">
                    {tvShowsList.filter(checkIfRecommended).length}
                  </h4>
                  <p className="text-[8px] md:text-[9px] text-bento-muted uppercase tracking-wider font-bold mt-1">Odporúčaných</p>
                </div>
              </div>
              
              <button
                onClick={() => setOnlyRecommended(!onlyRecommended)}
                className={`p-4 rounded-2xl border text-center transition-all flex flex-col justify-between h-full cursor-pointer ${
                  onlyRecommended 
                    ? 'bg-amber-500/10 border-amber-500 text-amber-300 shadow-lg shadow-amber-500/10' 
                    : 'bg-bento-cell border-bento-border-light text-bento-muted hover:border-bento-border hover:text-white'
                }`}
              >
                <span className="text-xl">🎯</span>
                <div>
                  <h4 className="text-[10px] md:text-xs font-black text-white leading-none mt-1">Zhoda</h4>
                  <p className="text-[8px] md:text-[9px] text-bento-muted uppercase tracking-wider font-bold mt-1">
                    {onlyRecommended ? 'Aktívna' : 'Vypnutá'}
                  </p>
                </div>
              </button>

              <div className="p-4 bg-bento-cell rounded-2xl border border-bento-border-light text-center flex flex-col justify-between h-full relative">
                <span className="text-xl animate-bounce [animation-delay:-0.5s]">👀</span>
                <div>
                  <h4 className="text-base md:text-lg font-black text-green-400 mt-1 leading-none">
                    {watchedShowIds.length}<span className="text-[10px] text-bento-muted font-normal">/{tvShowsList.length}</span>
                  </h4>
                  <p className="text-[8px] md:text-[9px] text-bento-muted uppercase tracking-wider font-bold mt-1">Pokrok</p>
                </div>
              </div>
            </div>
          </div>

          {/* SEARCH, OPERATORS (requirement #1) & FILTER RAIL */}
          <div className="flex flex-col gap-4 bg-bento-card p-5 md:p-6 rounded-3xl border border-bento-border-light">
            
            {/* Operator showcase (Na oko prototype - requirement #1) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-bento-muted flex items-center gap-1.5">
                  <span>Porovnaj operátorov</span>
                  <span className="text-[9px] bg-bento-cell text-blue-400 px-1.5 py-0.2 rounded font-bold border border-bento-border-light">PROTOTYP</span>
                </label>
                <span className="text-[10px] text-bento-muted font-semibold">Aktuálny: {activeOperatorObj.name}</span>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {PRESET_OPERATORS.map((op) => {
                  const isActive = userProfile.operator === op.id;
                  return (
                    <button
                      key={op.id}
                      onClick={() => {
                        const updated: UserProfile = { ...userProfile, operator: op.id };
                        setUserProfile(updated);
                        localStorage.setItem('finda_user_profile', JSON.stringify(updated));
                      }}
                      className={`flex items-center gap-1.5 px-2.5 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        isActive 
                          ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-600/20' 
                          : 'bg-bento-cell text-bento-muted border-bento-border hover:bg-bento-border-light hover:text-bento-text'
                      }`}
                    >
                      <span className="text-sm">{op.logo}</span>
                      <span className="truncate">{op.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Filter controls row */}
            <div className="flex flex-col md:flex-row items-center gap-3">
              {/* Search input */}
              <div className="relative flex-1 w-full">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-bento-muted">
                  <Search className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  placeholder="Hľadať reláciu, film, hercov, žáner..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-bento-cell border border-bento-border hover:border-bento-border-light focus:border-blue-500 rounded-xl py-2.5 pl-10 pr-4 text-xs font-semibold focus:outline-none transition-all placeholder:text-slate-650 text-white"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-bento-muted hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Genre filter dropdown */}
              <div className="w-full md:w-48">
                <select
                  value={selectedGenreFilter}
                  onChange={(e) => setSelectedGenreFilter(e.target.value)}
                  className="w-full bg-bento-cell border border-bento-border hover:border-bento-border-light focus:border-blue-500 text-xs font-semibold rounded-xl py-2.5 px-3 focus:outline-none transition-all text-bento-text"
                >
                  <option value="Všetky">Všetky Žánre 🎭</option>
                  {PRESET_GENRES.map(g => (
                    <option key={g.id} value={g.name}>{g.emoji} {g.name}</option>
                  ))}
                </select>
              </div>

              {/* Toggle switch filters */}
              <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto py-1">
                {/* Live now filter */}
                <button
                  onClick={() => setOnlyLive(!onlyLive)}
                  className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all border cursor-pointer shrink-0 ${
                    onlyLive 
                      ? 'bg-red-500/10 text-red-400 border-red-500/30 shadow-lg shadow-red-500/5' 
                      : 'bg-bento-cell text-bento-muted border-bento-border hover:text-bento-text hover:border-bento-border-light'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                  <span>Práve beží 🔴</span>
                </button>

                {/* Only movies */}
                <button
                  onClick={() => setOnlyMovies(!onlyMovies)}
                  className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all border cursor-pointer shrink-0 ${
                    onlyMovies 
                      ? 'bg-blue-500/10 text-blue-400 border-blue-500/30 shadow-lg shadow-blue-500/5' 
                      : 'bg-bento-cell text-bento-muted border-bento-border hover:text-bento-text hover:border-bento-border-light'
                  }`}
                >
                  <span>Filmy 🎬</span>
                </button>

                {/* Hide watched toggle */}
                <button
                  onClick={() => setHideWatched(!hideWatched)}
                  className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all border cursor-pointer shrink-0 ${
                    hideWatched 
                      ? 'bg-green-500/10 text-green-400 border-green-500/30 shadow-lg shadow-green-500/5' 
                      : 'bg-bento-cell text-bento-muted border-bento-border hover:text-bento-text hover:border-bento-border-light'
                  }`}
                >
                  <EyeOff className="w-3.5 h-3.5" />
                  <span>Skryť videné 👀</span>
                </button>
              </div>
            </div>
          </div>

          {/* TV STATION CHANNELS TAB RAIL */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-thin scrollbar-thumb-bento-border">
            <button
              onClick={() => setSelectedStation('Všetky')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border shrink-0 cursor-pointer ${
                selectedStation === 'Všetky'
                  ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-600/10'
                  : 'bg-bento-card text-bento-muted border-bento-border hover:bg-bento-cell hover:text-white'
              }`}
            >
              📺 Všetky Stanice
            </button>
            {STATIONS_PRESET.map((station) => {
              const isActive = selectedStation === station.name;
              return (
                <button
                  key={station.name}
                  onClick={() => setSelectedStation(station.name)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border shrink-0 cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-600/10'
                      : 'bg-bento-card text-bento-muted border-bento-border hover:bg-bento-cell hover:border-bento-border-light hover:text-white'
                  }`}
                >
                  <span>{station.logo}</span>
                  <span>{station.name}</span>
                </button>
              );
            })}
          </div>

          {/* TV PROGRAMS LISTINGS */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-black text-white tracking-widest uppercase opacity-40">
                VÝSLEDKY ({filteredShows.length})
              </span>
              {onlyRecommended && (
                <span className="text-[10px] bg-amber-500/10 border border-amber-500/20 text-amber-400 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
                  Iba odporúčané prenosy ⭐
                </span>
              )}
            </div>

            {filteredShows.length === 0 ? (
              <div className="text-center py-16 bg-bento-card border border-bento-border rounded-3xl p-8">
                <span className="text-4xl">📺</span>
                <h3 className="text-lg font-bold text-white mt-4">Žiadne relácie sa nenašli</h3>
                <p className="text-xs text-bento-muted mt-2 max-w-sm mx-auto">
                  Skús zmeniť vyhľadávanie alebo vypnúť niektoré filtre (napr. filter zhody alebo práve vysielaných programov).
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedStation('Všetky');
                    setSelectedGenreFilter('Všetky');
                    setOnlyRecommended(false);
                    setOnlyMovies(false);
                    setOnlyLive(false);
                  }}
                  className="mt-6 px-4 py-2.5 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 rounded-xl text-xs font-bold border border-blue-500/20 transition-all cursor-pointer"
                >
                  Vynulovať filtre
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredShows.map((show) => {
                  const isRec = checkIfRecommended(show);
                  const { isLive, isPast, isFuture, progress } = getShowAirStatus(show);
                  const isWatched = watchedShowIds.includes(show.id);

                  return (
                    <button
                      key={show.id}
                      onClick={() => setSelectedShow(show)}
                      className={`group relative text-left bg-bento-card hover:bg-bento-cell border transition-all rounded-2xl overflow-hidden flex flex-col p-5 cursor-pointer ${
                        isLive 
                          ? 'border-blue-500 shadow-xl shadow-blue-500/5 scale-[1.01]' 
                          : 'border-bento-border-light hover:border-bento-border'
                      }`}
                    >
                      {/* Flex header */}
                      <div className="flex items-start gap-4 flex-1">
                        
                        {/* Poster miniature */}
                        <div className="w-16 h-20 rounded-lg overflow-hidden bg-bento-bg flex-shrink-0 border border-bento-border-light">
                          <img 
                            src={show.posterUrl} 
                            alt={show.title} 
                            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-all"
                          />
                        </div>

                        {/* Title & timing */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-bento-cell text-bento-text border border-bento-border-light">
                              {show.station}
                            </span>
                            {isLive && (
                              <span className="text-[9px] bg-red-500 text-white font-extrabold px-1.5 py-0.5 rounded-full animate-pulse uppercase tracking-wider">
                                NAŽIVO 🔴
                              </span>
                            )}
                          </div>

                          <h3 className="font-bold text-sm text-white group-hover:text-blue-400 transition-colors mt-2 truncate">
                            {show.title}
                          </h3>

                          {/* Time string */}
                          <p className="text-[11px] text-bento-muted font-semibold mt-0.5">
                            {show.startTime} - {show.endTime} <span className="text-bento-muted opacity-60 font-normal">({show.durationMinutes} min)</span>
                          </p>

                          {/* Preview snippet */}
                          <p className="text-[11px] text-bento-muted opacity-80 line-clamp-2 mt-1.5 leading-normal font-sans">
                            {show.description}
                          </p>
                        </div>
                      </div>

                      {/* Bottom row: badges and rating */}
                      <div className="mt-4 pt-3 border-t border-bento-border/50 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] bg-bento-cell text-blue-400 font-extrabold px-2.5 py-0.5 rounded-full border border-blue-500/10 uppercase tracking-wide">
                            {show.genre}
                          </span>
                          {show.ratingCsfd && (
                            <span className="text-[9px] text-bento-muted font-bold">
                              ČSFD: <strong className="text-red-500">{show.ratingCsfd}%</strong>
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5">
                          {/* RECOMMENDED STAR ACCENT (Requirement 5) */}
                          {isRec && (
                            <div className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 text-yellow-500 px-2 py-0.5 rounded-xl text-[10px] font-bold">
                              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                              <span className="hidden sm:inline">Odporúčané</span>
                            </div>
                          )}

                          {/* WATCHED TOGGLE */}
                          <button
                            title={isWatched ? "Označiť ako nevidené" : "Označiť ako videné"}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleWatched(show.id);
                            }}
                            className={`p-1 rounded-lg border transition-all cursor-pointer flex items-center justify-center ${
                              isWatched 
                                ? 'bg-green-500/15 border-green-500/30 text-green-400 hover:bg-green-500/25' 
                                : 'bg-bento-cell border-bento-border text-bento-muted hover:text-white hover:border-bento-border-light'
                            }`}
                          >
                            <Eye className={`w-3.5 h-3.5 ${isWatched ? 'text-green-400 fill-green-400/20' : ''}`} />
                          </button>
                        </div>
                      </div>

                      {/* Active Live Progress bar */}
                      {isLive && (
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-bento-bg">
                          <div 
                            className="h-full bg-blue-500 rounded-r-full transition-all duration-1000"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Finda AI assistant desktop sidebar */}
        <AnimatePresence>
          {showAIChat && (
            <motion.div 
              initial={{ opacity: 0, x: 20, width: 0 }}
              animate={{ opacity: 1, x: 0, width: '380px' }}
              exit={{ opacity: 0, x: 20, width: 0 }}
              className="hidden lg:block flex-shrink-0 h-[calc(100vh-120px)] overflow-hidden"
            >
              <AIChatCompanion 
                userProfile={userProfile}
                currentShows={tvShowsList}
                onOpenShow={(show) => setSelectedShow(show)}
                onClose={() => setShowAIChat(false)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* FLOATING CHAT BUBBLE FOR MOBILE */}
      <div className="lg:hidden fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setShowAIChat(true)}
          className="w-14 h-14 bg-blue-600 hover:bg-blue-500 text-white rounded-full flex items-center justify-center shadow-2xl border border-blue-400/20 transition-all active:scale-95 cursor-pointer"
        >
          <MessageSquare className="w-6 h-6" />
        </button>
      </div>

      {/* MOBILE FULL-SCREEN AI CHAT POPUP */}
      <AnimatePresence>
        {showAIChat && (
          <div className="lg:hidden fixed inset-0 z-50 p-4 bg-bento-bg/95 backdrop-blur-md flex items-center justify-center">
            <motion.div 
               initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="w-full max-w-md h-[80vh]"
            >
              <AIChatCompanion 
                userProfile={userProfile}
                currentShows={tvShowsList}
                onOpenShow={(show) => {
                  setSelectedShow(show);
                  setShowAIChat(false); // close chat when opening show details
                }}
                onClose={() => setShowAIChat(false)}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DETAIL MODAL OVERLAY */}
      {selectedShow && (
        <ShowDetailModal
          show={selectedShow}
          userProfile={userProfile}
          isRecommended={checkIfRecommended(selectedShow)}
          isWatched={watchedShowIds.includes(selectedShow.id)}
          onToggleWatched={handleToggleWatched}
          onClose={() => setSelectedShow(null)}
          showToast={showToast}
        />
      )}

      {/* CONFIGURATION / EDIT PROFILE DIALOG */}
      <AnimatePresence>
        {showEditProfile && (
          <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowEditProfile(false)}
              className="fixed inset-0 bg-bento-bg/80 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-bento-card border border-bento-border rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl p-6 text-bento-text z-10"
            >
              <div className="flex items-center justify-between mb-4 border-b border-bento-border pb-3">
                <div className="flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-400" />
                  <h3 className="text-lg font-bold text-white">Nastavenia Profilu</h3>
                </div>
                <button 
                  onClick={() => setShowEditProfile(false)}
                  className="p-1 hover:bg-bento-cell rounded-lg text-bento-muted hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Edit form nested SetupWizard parameters */}
              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                {/* Meno */}
                <div>
                  <label className="block text-[10px] font-bold text-bento-muted uppercase tracking-wider mb-1">Meno / Prezývka</label>
                  <input
                    type="text"
                    value={userProfile.name}
                    onChange={(e) => setUserProfile({ ...userProfile, name: e.target.value })}
                    className="w-full bg-bento-cell border border-bento-border focus:border-blue-500 rounded-xl py-2 px-3 text-xs focus:outline-none transition-all text-white"
                  />
                </div>

                {/* Operator selector */}
                <div>
                  <label className="block text-[10px] font-bold text-bento-muted uppercase tracking-wider mb-1">TV Operátor</label>
                  <div className="grid grid-cols-2 gap-2">
                    {PRESET_OPERATORS.map(op => (
                      <button
                        key={op.id}
                        onClick={() => setUserProfile({ ...userProfile, operator: op.id })}
                        className={`flex items-center gap-1.5 p-2 rounded-xl border text-xs font-semibold cursor-pointer ${
                          userProfile.operator === op.id
                            ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-600/10'
                            : 'bg-bento-cell text-bento-muted border-bento-border hover:border-bento-border-light hover:text-white'
                        }`}
                      >
                        <span className="text-sm">{op.logo}</span>
                        <span>{op.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Favorite Genres multiselect */}
                <div>
                  <label className="block text-[10px] font-bold text-bento-muted uppercase tracking-wider mb-1">Obľúbené Žánre</label>
                  <div className="grid grid-cols-2 gap-2">
                    {PRESET_GENRES.map(g => {
                      const isSel = userProfile.favoriteGenres.includes(g.name);
                      return (
                        <button
                          key={g.id}
                          onClick={() => {
                            const current = userProfile.favoriteGenres;
                            const next = current.includes(g.name)
                              ? current.filter(x => x !== g.name)
                              : [...current, g.name];
                            setUserProfile({ ...userProfile, favoriteGenres: next });
                          }}
                          className={`flex items-center gap-2 p-2 rounded-xl border text-xs font-semibold cursor-pointer ${
                            isSel
                              ? 'bg-blue-500/10 text-blue-400 border-blue-500 shadow-lg shadow-blue-500/5'
                              : 'bg-bento-cell text-bento-muted border-bento-border hover:border-bento-border-light hover:text-white'
                          }`}
                        >
                          <span>{g.emoji}</span>
                          <span>{g.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Favorite films text */}
                <div>
                  <label className="block text-[10px] font-bold text-bento-muted uppercase tracking-wider mb-1">
                    Obľúbené filmy / seriály
                  </label>
                  <textarea
                    rows={2}
                    value={userProfile.favoriteShows}
                    onChange={(e) => setUserProfile({ ...userProfile, favoriteShows: e.target.value })}
                    className="w-full bg-bento-cell border border-bento-border focus:border-blue-500 rounded-xl p-3 text-xs focus:outline-none transition-all text-white resize-none leading-relaxed"
                  />
                </div>
              </div>

              {/* Actions Footer */}
              <div className="border-t border-bento-border pt-4 mt-6 flex items-center justify-between gap-4">
                <button
                  onClick={handleResetApp}
                  className="px-4 py-2 bg-red-600/10 hover:bg-red-600/20 text-red-400 rounded-xl text-xs font-bold border border-red-500/20 transition-all cursor-pointer"
                >
                  Odhlásiť sa 🛑
                </button>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      // Reload original values from LocalStorage on cancel
                      const saved = localStorage.getItem('finda_user_profile');
                      if (saved) {
                        setUserProfile(JSON.parse(saved));
                      }
                      setShowEditProfile(false);
                    }}
                    className="px-4 py-2 bg-bento-cell hover:bg-bento-border-light text-bento-text rounded-xl text-xs font-bold transition-all cursor-pointer border border-bento-border"
                  >
                    Zrušiť
                  </button>
                  <button
                    onClick={() => handleUpdateProfile(userProfile)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer"
                  >
                    Uložiť zmeny
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* FOOTER METADATA */}
      <footer className="border-t border-bento-border bg-bento-card px-4 md:px-8 py-5 text-center text-[10px] text-bento-muted flex flex-col sm:flex-row items-center justify-between gap-4">
        <p>© 2026 finda. Všetky práva vyhradené. Vytvorené ako inteligentný sprievodca.</p>
        <div className="flex gap-4">
          <a href="#" onClick={(e) => {e.preventDefault(); showToast("finda Prototyp v1.0. Plne funkčný s Express a Gemini API.", "info");}} className="hover:text-blue-400 font-semibold transition-colors">O aplikácii</a>
          <span>•</span>
          <a href="#" onClick={(e) => {e.preventDefault(); showToast("Všetky dáta sú bezpečne uložené vo vašom prehliadači (localStorage).", "info");}} className="hover:text-blue-400 font-semibold transition-colors">Súkromie</a>
        </div>
      </footer>

      {/* CUSTOM LOGOUT CONFIRMATION DIALOG */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLogoutConfirm(false)}
              className="fixed inset-0 bg-black/75 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="relative bg-bento-card border border-bento-border rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl p-6 text-center z-10"
            >
              <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 text-red-400 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
                🛑
              </div>
              
              <h3 className="text-lg font-black text-white tracking-tight mb-2">Naozaj sa chceš odhlásiť?</h3>
              <p className="text-xs text-bento-muted leading-relaxed mb-6">
                Tento krok vymaže tvoj profil, vybrané žánre a históriu sledovania z tvojho zariadenia. Budeš musieť prejsť nastavením znova.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 px-4 py-2.5 bg-bento-cell hover:bg-bento-border-light text-bento-text border border-bento-border rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Zrušiť
                </button>
                <button
                  onClick={handleConfirmLogout}
                  className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-red-600/10 transition-all cursor-pointer"
                >
                  Áno, vymazať
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* TOAST NOTIFICATIONS STACK */}
      <div className="fixed bottom-6 right-6 z-[99999] flex flex-col gap-2 max-w-sm pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.9 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              className={`pointer-events-auto p-4 rounded-2xl shadow-2xl border flex items-center gap-3 backdrop-blur-md ${
                t.type === 'success'
                  ? 'bg-green-500/10 border-green-500/20 text-green-300 shadow-green-500/5'
                  : t.type === 'warning'
                  ? 'bg-amber-500/10 border-amber-500/20 text-amber-300 shadow-amber-500/5'
                  : 'bg-blue-500/10 border-blue-500/20 text-blue-300 shadow-blue-500/5'
              }`}
            >
              <span className="text-base shrink-0">
                {t.type === 'success' ? '✅' : t.type === 'warning' ? '⚠️' : 'ℹ️'}
              </span>
              <p className="text-xs font-semibold leading-relaxed">{t.message}</p>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* CUSTOM ANIMATED INTERACTIVE CURSOR */}
      <CustomCursor />
    </div>
  );
}
