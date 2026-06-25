import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Check, 
  ChevronRight, 
  ChevronLeft, 
  Tv, 
  User, 
  Calendar, 
  Sparkles, 
  Film, 
  Compass,
  Upload
} from 'lucide-react';
import { 
  UserProfile, 
  PRESET_AVATARS, 
  PRESET_OPERATORS, 
  PRESET_GENRES 
} from '../types';

interface SetupWizardProps {
  onComplete: (profile: UserProfile) => void;
  initialProfile?: UserProfile;
}

export default function SetupWizard({ onComplete, initialProfile }: SetupWizardProps) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState(initialProfile?.name || '');
  const [birthDate, setBirthDate] = useState(initialProfile?.birthDate || '1995-01-01');
  const [selectedAvatar, setSelectedAvatar] = useState(initialProfile?.avatar || 'avatar_popcorn');
  const [customAvatar, setCustomAvatar] = useState<string | null>(null);
  const [selectedOperator, setSelectedOperator] = useState(initialProfile?.operator || 'skylink');
  const [selectedGenres, setSelectedGenres] = useState<string[]>(initialProfile?.favoriteGenres || []);
  const [favoriteShows, setFavoriteShows] = useState(initialProfile?.favoriteShows || '');

  const totalSteps = 4;

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(prev => prev + 1);
    } else {
      // Validate and complete
      const finalProfile: UserProfile = {
        name: name.trim() || 'Filmový Fanúšik',
        birthDate: birthDate || '1995-01-01',
        avatar: customAvatar || selectedAvatar,
        operator: selectedOperator,
        favoriteGenres: selectedGenres.length > 0 ? selectedGenres : ['Akcia', 'Sci-Fi'],
        favoriteShows: favoriteShows.trim(),
      };
      onComplete(finalProfile);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(prev => prev - 1);
    }
  };

  const toggleGenre = (genreName: string) => {
    setSelectedGenres(prev => 
      prev.includes(genreName) 
        ? prev.filter(g => g !== genreName)
        : [...prev, genreName]
    );
  };

  // Image Upload handler for custom avatar
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCustomAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const activeAvatarEmoji = PRESET_AVATARS.find(a => a.id === selectedAvatar)?.emoji || '🍿';

  return (
    <div id="setup-wizard-container" className="min-h-screen bg-bento-bg text-bento-text flex flex-col justify-between p-4 md:p-8">
      {/* Header */}
      <div className="max-w-xl mx-auto w-full pt-6 text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-wider mb-4">
          <Sparkles className="w-3.5 h-3.5 animate-pulse text-blue-400" />
          <span>Finda — Inteligentný sprievodca</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-black tracking-tight bg-gradient-to-r from-white via-slate-200 to-blue-400 bg-clip-text text-transparent">
          NASTAVME TVOJ PROFIL
        </h1>
        <p className="text-bento-muted text-xs mt-2 max-w-sm mx-auto font-medium">
          Prispôsob si TV vysielanie na mieru a odhaľ programy s inteligentným odporúčaním.
        </p>

        {/* Progress bar */}
        <div className="mt-8 flex items-center justify-center gap-2">
          {Array.from({ length: totalSteps }).map((_, idx) => (
            <div 
              key={idx}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                idx + 1 === step 
                  ? 'w-10 bg-blue-600' 
                  : idx + 1 < step 
                    ? 'w-3 bg-blue-800' 
                    : 'w-3 bg-bento-cell'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Steps Content Area */}
      <div className="flex-1 flex items-center justify-center max-w-2xl mx-auto w-full py-8">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="w-full bg-bento-card border border-bento-border rounded-3xl p-6 md:p-8 shadow-xl"
            >
              <div className="flex items-center gap-3.5 mb-6">
                <div className="p-2.5 rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  <Compass className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-white uppercase tracking-tight">Krok 1: Výber TV operátora</h2>
                  <p className="text-xs text-bento-muted mt-0.5 font-medium">Zvoľ poskytovateľa, ktorého programy chceš sledovať.</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 md:gap-4">
                {PRESET_OPERATORS.map((op) => {
                  const isSelected = selectedOperator === op.id;
                  return (
                    <button
                      key={op.id}
                      onClick={() => setSelectedOperator(op.id)}
                      className={`relative group flex flex-col items-center justify-center p-5 rounded-2xl border transition-all text-center cursor-pointer ${
                        isSelected 
                          ? 'bg-bento-cell border-blue-500 shadow-xl shadow-blue-500/5' 
                          : 'bg-bento-cell border-bento-border hover:border-bento-border-light hover:bg-bento-border-light/40'
                      }`}
                    >
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${op.color} flex items-center justify-center text-xl font-bold text-white shadow-md mb-3`}>
                        {op.logo}
                      </div>
                      <span className="font-bold text-sm text-white">{op.name}</span>
                      <span className="text-[10px] text-bento-muted mt-1 font-medium">Satelit / Kábel / Web</span>

                      {isSelected && (
                        <div className="absolute top-2.5 right-2.5 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                          <Check className="w-3 h-3 text-white stroke-[3px]" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="w-full bg-bento-card border border-bento-border rounded-3xl p-6 md:p-8 shadow-xl"
            >
              <div className="flex items-center gap-3.5 mb-6">
                <div className="p-2.5 rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-white uppercase tracking-tight">Krok 2: Osobné údaje</h2>
                  <p className="text-xs text-bento-muted mt-0.5 font-medium">Nastav si meno, dátum narodenia a profilový obrázok.</p>
                </div>
              </div>

              <div className="space-y-5">
                {/* Avatar Row */}
                <div className="flex flex-col items-center sm:flex-row gap-6 p-4 rounded-2xl bg-bento-cell border border-bento-border">
                  <div className="relative group">
                    {customAvatar ? (
                      <img 
                        src={customAvatar} 
                        alt="Custom Avatar" 
                        className="w-20 h-20 rounded-2xl object-cover border-2 border-blue-500 shadow-md"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-2xl bg-bento-bg border-2 border-bento-border flex items-center justify-center text-4xl shadow-inner group-hover:border-blue-500 transition-colors">
                        {activeAvatarEmoji}
                      </div>
                    )}
                    
                    {/* Upload Overlay Button */}
                    <label className="absolute -bottom-1 -right-1 p-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl cursor-pointer shadow-md transition-colors">
                      <Upload className="w-3.5 h-3.5" />
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleImageUpload} 
                        className="hidden" 
                      />
                    </label>
                  </div>

                  <div className="flex-1">
                    <p className="text-xs font-bold text-bento-muted mb-2 text-center sm:text-left">
                      Vyber si emoji avatara alebo nahraj vlastnú fotku:
                    </p>
                    <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                      {PRESET_AVATARS.map((av) => (
                        <button
                          key={av.id}
                          type="button"
                          onClick={() => {
                            setSelectedAvatar(av.id);
                            setCustomAvatar(null); // Clear custom upload if user picks emoji
                          }}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg border transition-all cursor-pointer ${
                            selectedAvatar === av.id && !customAvatar
                              ? 'bg-blue-500/20 border-blue-500 scale-110 shadow-sm text-white'
                              : 'bg-bento-bg border-bento-border hover:border-bento-border-light text-bento-muted hover:text-white'
                          }`}
                          title={av.name}
                        >
                          {av.emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Name field */}
                <div>
                  <label className="block text-[10px] font-bold text-bento-muted mb-1.5 uppercase tracking-wider">
                    Vaše meno / Prezývka
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-bento-muted">
                      <User className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      placeholder="Napr. Janko Filmožrút"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-bento-cell border border-bento-border hover:border-bento-border-light focus:border-blue-500 rounded-xl py-3 pl-10 pr-4 text-xs font-semibold focus:outline-none transition-all placeholder:text-slate-650 text-white"
                    />
                  </div>
                </div>

                {/* Birthdate field */}
                <div>
                  <label className="block text-[10px] font-bold text-bento-muted mb-1.5 uppercase tracking-wider">
                    Dátum narodenia
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-bento-muted">
                      <Calendar className="w-4 h-4" />
                    </span>
                    <input
                      type="date"
                      value={birthDate}
                      onChange={(e) => setBirthDate(e.target.value)}
                      className="w-full bg-bento-cell border border-bento-border hover:border-bento-border-light focus:border-blue-500 rounded-xl py-3 pl-10 pr-4 text-xs font-semibold focus:outline-none transition-all text-white"
                    />
                  </div>
                  <p className="text-[10px] text-bento-muted mt-1.5 pl-1 font-medium">
                    Slúži na inteligentné odporúčanie vekovo vhodného obsahu.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="w-full bg-bento-card border border-bento-border rounded-3xl p-6 md:p-8 shadow-xl"
            >
              <div className="flex items-center gap-3.5 mb-6">
                <div className="p-2.5 rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  <Tv className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-white uppercase tracking-tight">Krok 3: Obľúbené žánre</h2>
                  <p className="text-xs text-bento-muted mt-0.5 font-medium">Vyber žánre, ktoré najradšej sleduješ. Môžeš vybrať viacero.</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {PRESET_GENRES.map((g) => {
                  const isSelected = selectedGenres.includes(g.name);
                  return (
                    <button
                      key={g.id}
                      onClick={() => toggleGenre(g.name)}
                      className={`flex items-center gap-3 p-4 rounded-xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-blue-500/10 border-blue-500 shadow-md text-white font-bold'
                          : 'bg-bento-cell border-bento-border text-bento-muted hover:border-bento-border-light hover:bg-bento-border-light/40'
                      }`}
                    >
                      <span className="text-xl">{g.emoji}</span>
                      <span className="font-bold text-xs flex-1">{g.name}</span>
                      {isSelected && (
                        <div className="w-4 h-4 rounded-full bg-blue-600 flex items-center justify-center">
                          <Check className="w-2.5 h-2.5 text-white" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {selectedGenres.length === 0 && (
                <p className="text-[10px] text-yellow-500 font-bold mt-4 text-center">
                  ⚠️ Pre lepšie personalizované odporúčanie vyber aspoň jeden žáner!
                </p>
              )}
            </motion.div>
          )}

          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="w-full bg-bento-card border border-bento-border rounded-3xl p-6 md:p-8 shadow-xl"
            >
              <div className="flex items-center gap-3.5 mb-6">
                <div className="p-2.5 rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  <Film className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-white uppercase tracking-tight">Krok 4: Tvoj filmový vkus</h2>
                  <p className="text-xs text-bento-muted mt-0.5 font-medium">Napíš nám, aké filmy alebo seriály ťa bavia.</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-bento-muted mb-2 uppercase tracking-wider">
                    Tvoje obľúbené filmy a seriály
                  </label>
                  <textarea
                    rows={4}
                    value={favoriteShows}
                    onChange={(e) => setFavoriteShows(e.target.value)}
                    placeholder="Napr. Inception, Harry Potter, Gladiator, Dunaj k vašim službám, Game of Thrones..."
                    className="w-full bg-bento-cell border border-bento-border hover:border-bento-border-light focus:border-blue-500 rounded-2xl p-4 text-xs font-semibold focus:outline-none transition-all placeholder:text-slate-650 text-white leading-relaxed resize-none"
                  />
                </div>

                <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/10 text-blue-300 text-xs flex gap-2.5 leading-relaxed">
                  <Sparkles className="w-5 h-5 text-blue-400 flex-shrink-0" />
                  <p className="font-semibold">
                    <strong className="text-blue-400">Finda tip:</strong> Tieto názvy budú porovnávané s televíznym programom a vďaka našej AI označia pasujúce filmy <strong className="text-yellow-400">zlatou hviezdou ⭐</strong> priamo na časovej osi!
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer Navigation Controls */}
      <div className="max-w-xl mx-auto w-full pb-6 flex items-center justify-between gap-4">
        {step > 1 ? (
          <button
            onClick={handleBack}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-bento-card border border-bento-border text-bento-text hover:text-white hover:bg-bento-cell transition-all font-bold text-xs cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Späť</span>
          </button>
        ) : (
          <div /> // empty placeholder to align next button right
        )}

        <button
          onClick={handleNext}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all font-bold text-xs ml-auto cursor-pointer"
        >
          <span>{step === totalSteps ? 'Dokončiť a vstúpiť' : 'Ďalej'}</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
