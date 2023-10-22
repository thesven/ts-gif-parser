/**
 * provides a base type for a color
 */
export type Color = {
  rawValue: string;
};

/**
 * provides a type for a hex colour
 */
export type HexColour = Color & {
  value: string;
};

/**
 * provides a type for a rgb colour
 */
export type RgbColour = Color & {
  r: number;
  g: number;
  b: number;
};

/**
 * provides a type for a lab colour
 */
export type LabColour = Color & {
  l: number;
  a: number;
  b: number;
};

/**
 * provides a header block type
 */
export type HeaderBlock = {
  signature: string;
  version: string;
};

/**
 * provides locical screen descriptor type
 */
export type LogicalScreenDescriptor = {
  width: number;
  height: number;
  globalColorTableFlag: boolean;
  colorResolution: number;
  colorResolutionValue: number;
  sortFlag: boolean;
  backgroundColorIndex: number;
  pixelAspectRatio: number;
};

/**
 * provides options for the table reader
 */
export type GifTableReaderOptions = {
  outputFormat: 'HEX' | 'RBG' | 'LAB';
  filePath: string;
};
