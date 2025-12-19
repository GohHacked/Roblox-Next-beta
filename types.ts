export type GameState = 'LOGIN' | 'DISCOVERY' | 'PROFILE' | 'AVATAR' | 'LOADING' | 'PLAYING';

export type Language = 'en' | 'ru';

export type GraphicsQuality = 'low' | 'medium' | 'high';

export interface PlayerStats {
  username: string;
  coins: number;
}

export interface PlayerAppearance {
  skin: string;
  shirt: string;
  pants: string;
}

export interface Player {
  id: string;
  username: string;
  displayName: string;
  appearance: PlayerAppearance;
  level: number;
  isLocal: boolean;
}

export type LevelType = 'rainbow' | 'glass' | 'space' | 'lava';

export interface LevelData {
  id: LevelType;
  title: string;
  creator: string;
  description: string;
  online: string;
  rating: string;
  visits: string;
  image: string; // URL for the thumbnail
}

export interface GameSettings {
  shadows: boolean; // Kept for backward compatibility logic, but controlled by graphics preset mostly
  fov: number;
  volume: number;
  graphics: GraphicsQuality;
}

export interface ChatMessage {
  id: string;
  username: string;
  text: string;
  isSystem?: boolean;
}