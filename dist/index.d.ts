import { EnkaClient } from 'enka-network-api';

/**
 * Options for generating character card
 */
export interface GenerateCardOptions {
  /**
   * Directory to save the output file
   * @default 'output'
   */
  outputDir?: string;
  
  /**
   * Whether to save the card to a file
   * @default false
   */
  saveToFile?: boolean;
}

/**
 * Generate a character card from Enka Network data
 * @param user - User data from EnkaClient.fetchUser()
 * @param character - Character data from user.characters array
 * @param options - Optional configuration
 * @returns PNG image buffer
 */
export function generateCard(
  user: any,
  character: any,
  options?: GenerateCardOptions
): Promise<Buffer>;

/**
 * Create an EnkaClient instance
 * @param options - EnkaClient options
 * @returns EnkaClient instance
 */
export function createClient(options?: any): EnkaClient;

/**
 * Element color configuration
 */
export const ELEMENT_COLORS: {
  Fire: { r: number; g: number; b: number };
  Water: { r: number; g: number; b: number };
  Grass: { r: number; g: number; b: number };
  Electric: { r: number; g: number; b: number };
  Wind: { r: number; g: number; b: number };
  Ice: { r: number; g: number; b: number };
  Rock: { r: number; g: number; b: number };
  Physical: { r: number; g: number; b: number };
};

/**
 * Rarity color configuration
 */
export const RARITY_COLORS: {
  [key: number]: string;
};

/**
 * Element to property mapping
 */
export const ELEMENT_PROP_MAP: {
  [key: string]: string;
};

/**
 * Substat display order
 */
export const SUBST_ORDER: string[];

/**
 * Stat to file name mapping
 */
export const STAT_FILE_MAP: {
  [key: string]: string;
};

/**
 * Rarity reference mapping
 */
export const RARITY_REFERENCE: {
  [key: number]: string;
};