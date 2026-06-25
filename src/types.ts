export interface UserProfile {
  name: string;
  birthDate: string;
  avatar: string; // Preset name or base64
  operator: string; // Skylink, Orange, Telekom, O2, UPC, Antik
  favoriteGenres: string[];
  favoriteShows: string; // Users can write list of favorite movies/series
}

export interface TVShow {
  id: string;
  station: string; // e.g., "TV Markíza", "TV JOJ", "Jednotka", "HBO", "Spektrum", "Eurosport 1"
  title: string;
  startTime: string; // Format "HH:MM" e.g., "20:15"
  endTime: string; // Format "HH:MM" e.g., "22:15"
  durationMinutes: number;
  description: string;
  genre: string; // e.g., "Akcia", "Dráma", "Sci-Fi", "Dokument", "Komédia", "Šport", "Rozprávka"
  posterUrl: string;
  ratingImdb?: number;
  ratingCsfd?: number;
  cast?: string[];
  director?: string;
  year?: number;
  isMovie: boolean;
}

export const PRESET_AVATARS = [
  { id: 'avatar_popcorn', name: 'Popcorn Guy', emoji: '🍿' },
  { id: 'avatar_clapper', name: 'Director', emoji: '🎬' },
  { id: 'avatar_tv', name: 'TV Addict', emoji: '📺' },
  { id: 'avatar_alien', name: 'Sci-Fi Fan', emoji: '👽' },
  { id: 'avatar_detective', name: 'Thriller Fan', emoji: '🕵️' },
  { id: 'avatar_ninja', name: 'Action Fan', emoji: '🥷' },
  { id: 'avatar_wizard', name: 'Fantasy Fan', emoji: '🧙' },
  { id: 'avatar_lion', name: 'Documentary Fan', emoji: '🦁' },
];

export const PRESET_OPERATORS = [
  { id: 'skylink', name: 'Skylink', color: 'from-blue-600 to-cyan-500', logo: '📡' },
  { id: 'orange', name: 'Orange TV', color: 'from-orange-500 to-amber-600', logo: '🍊' },
  { id: 'telekom', name: 'Magio Telekom', color: 'from-pink-600 to-rose-500', logo: 'T' },
  { id: 'o2', name: 'O2 TV', color: 'from-blue-700 to-indigo-600', logo: 'O₂' },
  { id: 'upc', name: 'UPC', color: 'from-teal-500 to-cyan-600', logo: '🌀' },
  { id: 'antik', name: 'Antik Telecom', color: 'from-red-600 to-orange-500', logo: '🐜' },
];

export const PRESET_GENRES = [
  { id: 'akcia', name: 'Akcia', emoji: '💥' },
  { id: 'sci-fi', name: 'Sci-Fi / Fantasy', emoji: '🚀' },
  { id: 'drama', name: 'Dráma', emoji: '🎭' },
  { id: 'komedia', name: 'Komédia', emoji: '😂' },
  { id: 'thriller', name: 'Thriller / Horor', emoji: '😱' },
  { id: 'dokument', name: 'Dokument', emoji: '🌍' },
  { id: 'sport', name: 'Šport', emoji: '⚽' },
  { id: 'rozpravka', name: 'Rozprávky / Animovaný', emoji: '🧸' },
];
