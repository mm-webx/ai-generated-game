export type Speed = 1 | 5 | 20;

export interface Resources {
  food: number;
  wood: number;
  stone: number;
  diamond: number;
  technology: number;
  power: number;
}

export interface ResourceConfig {
  key: keyof Resources;
  label: string;
  description: string;
  formula: string;
  explanation: string;
}

