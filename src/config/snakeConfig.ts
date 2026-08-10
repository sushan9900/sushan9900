export interface SnakeConfig {
  username: string;
  snakeCount: number;
  theme: 'cyberpunk' | 'minimalist' | 'isometric';
  speedMultiplier: number;
  comboThreshold: number;
  maxFileSizeKB: number;
}

export const config: SnakeConfig = {
  username: process.env.SNAKE_USERNAME || 'sushan9900',
  snakeCount: Math.min(Math.max(parseInt(process.env.SNAKE_COUNT || '3', 10), 1), 3),
  theme: (process.env.SNAKE_THEME as 'cyberpunk' | 'minimalist' | 'isometric') || 'cyberpunk',
  speedMultiplier: parseFloat(process.env.SNAKE_SPEED || '1.0'),
  comboThreshold: parseInt(process.env.SNAKE_COMBO_THRESHOLD || '3', 10),
  maxFileSizeKB: 150
};
