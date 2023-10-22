/**
 * provides a type for a hex colour
 */
export type HexColour = {
  value: string;
};

/**
 * provides a type for a rgb colour
 */
export type RgbColour = {
  r: number;
  g: number;
  b: number;
};

/**
 * provides lab color type
 */
export type LabColor = {
  l: number;
  a: number;
  b: number;
};

export type Color = {
  rgbValues: RgbColour;
  labValues: LabColor;
  hexValue: HexColour;
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
 * provides Graphics Control Extension type
 */
export type GraphicsControlExtension = {
  disposalMethod: number;
  userInputFlag: boolean;
  transparentColorFlag: boolean;
  delayTime: number;
  transparentColorIndex: number;
};

/**
 * provides options for the table reader
 */
export type GifTableReaderOptions = {
  outputFormat: 'HEX';
  filePath: string;
};
