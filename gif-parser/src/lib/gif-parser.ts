import * as fs from 'fs';
import * as path from 'path';
import {
  Color,
  GifTableReaderOptions,
  GraphicsControlExtension,
  HeaderBlock,
  Image,
  ImageDescriptor,
  LabColor,
  LogicalScreenDescriptor,
} from './types';

/**
 * Provides a GifTableReader
 * @see https://giflib.sourceforge.net/whatsinagif/bits_and_bytes.html
 */
export class GifParser {
  protected binValue: Buffer | undefined = undefined;
  protected headerBlock: HeaderBlock | undefined = undefined;
  protected logicalScreenDescriptor: LogicalScreenDescriptor | undefined =
    undefined;
  protected hasGlobalColorTable: boolean | undefined = undefined;
  protected globalColorTable: Color[] | undefined = undefined;
  protected graphicsControlExtension: GraphicsControlExtension | undefined =
    undefined;
  protected images: Image[] | undefined = undefined;

  public constructor(protected readonly options: GifTableReaderOptions) {
    this.binValue = this.loadGif(options.filePath);
    this.headerBlock = this.parseHeaderBlock(this.binValue);
    this.logicalScreenDescriptor = this.parseLogicalScreenDescriptor(
      this.binValue
    );
    this.hasGlobalColorTable =
      this.logicalScreenDescriptor.globalColorTableFlag;
    this.globalColorTable = this.parseGlobalColorTable(this.binValue);
    this.graphicsControlExtension = this.parseGraphicsControlExtension(
      this.binValue
    );
    this.images = this.parseImages(this.binValue);
  }

  /**
   * Retrieves the header block.
   *
   * @return {HeaderBlock} The header block.
   */
  public getHeaderBlock(): HeaderBlock {
    return (
      this.headerBlock ??
      (() => {
        throw new Error('The headerBlock is undefined');
      })()
    );
  }

  /**
   * Retrieves the binary value.
   *
   * @return {Buffer} The binary value.
   */
  public getBinValue(): Buffer {
    return (
      this.binValue ??
      (() => {
        throw new Error('The binValue is undefined');
      })()
    );
  }

  /**
   * Retrieves the logical screen descriptor.
   *
   * @return {LogicalScreenDescriptor} The logical screen descriptor.
   */
  public getLogicalScreenDescriptor(): LogicalScreenDescriptor {
    return (
      this.logicalScreenDescriptor ??
      (() => {
        throw new Error('The logicalScreenDescriptor is undefined');
      })()
    );
  }

  /**
   * Retrieves the global color table.
   *
   * @return {Color[]} The global color table.
   */
  public getGlobalColorTable(): Color[] {
    return (
      this.globalColorTable ??
      (() => {
        throw new Error('The globalColorTable is undefined');
      })()
    );
  }

  /**
   * Retrieves the graphics control extension.
   *
   * @return {GraphicsControlExtension} The graphics control extension.
   */
  public getGraphicsControlExtension(): GraphicsControlExtension {
    return (
      this.graphicsControlExtension ??
      (() => {
        throw new Error('The graphicsControlExtension is undefined');
      })()
    );
  }
  /**
   * Retrieves the images.
   *
   * @return {Image[]} The array of images.
   */
  //
  public getImages(): Image[] {
    return (
      this.images ??
      (() => {
        throw new Error('The images is undefined');
      })()
    );
  }

  /**
   * Parses the given buffer and extracts the images.
   *
   * @param {Buffer} buffer - The buffer to parse.
   * @return {Image[]} An array of Image objects representing the extracted images.
   */
  private parseImages(buffer: Buffer): Image[] {
    const images: Image[] = [];

    let offset = 7; // Skip the logical screen descriptor

    while (offset < buffer.length) {
      if (buffer[offset] !== 0x2c) {
        // Not an image descriptor, skip to the next byte
        offset++;
        continue;
      }

      const imageDescriptorBuffer = buffer.subarray(offset + 1, offset + 11);
      const imageDescriptor = this.parseImageDescriptor(imageDescriptorBuffer);

      offset += 11;

      let localColorTable: Color[] | undefined;
      if (imageDescriptor.localColorTableFlag) {
        // Parse the local color table
        const localColorTableSize = Math.pow(
          2,
          (imageDescriptor.localColorTableSize & 0b00000111) + 1
        );
        const localColorTableBuffer = buffer.subarray(
          offset,
          offset + 3 * localColorTableSize
        );
        localColorTable = this.parseColorTable(localColorTableBuffer);

        offset += 3 * localColorTableSize;
      }

      // Skip the LZW minimum code size byte
      offset++;

      // Parse the image data
      const imageData = this.parseImageData(buffer, offset);

      const image: Image = {
        imageDescriptor,
        localColorTable,
        imageData,
      };

      images.push(image);

      // Skip to the next image descriptor
      offset += imageData.length + 1;
    }

    return images;
  }

  /**
   * Parses the image descriptor from the given buffer.
   *
   * @param {Buffer} buffer - The buffer containing the image descriptor.
   * @return {ImageDescriptor} The parsed image descriptor.
   */
  private parseImageDescriptor(buffer: Buffer): ImageDescriptor {
    const packed = buffer[9];

    const imageDescriptor: ImageDescriptor = {
      imageLeftPosition: buffer.readUInt16LE(0),
      imageTopPosition: buffer.readUInt16LE(2),
      imageWidth: buffer.readUInt16LE(4),
      imageHeight: buffer.readUInt16LE(6),
      localColorTableFlag: Boolean(packed & 0b10000000),
      interlaceFlag: Boolean(packed & 0b01000000),
      localColorTableSize: packed & 0b00000111,
    };

    return imageDescriptor;
  }

  /**
   * Parses the image data from the given buffer.
   *
   * @param {Buffer} buffer - The buffer containing the image data.
   * @param {number} offset - The starting offset in the buffer.
   * @return {Buffer} - The parsed image data as a Buffer.
   */
  private parseImageData(buffer: Buffer, offset: number): Buffer {
    const imageData: number[] = [];

    // Skip the LZW minimum code size byte
    offset++;

    while (buffer[offset] !== 0x00) {
      const blockSize = buffer[offset];
      offset++;

      for (let i = 0; i < blockSize; i++) {
        imageData.push(buffer[offset]);
        offset++;
      }
    }

    // Convert the array of numbers to a Buffer
    return Buffer.from(imageData);
  }

  /**
   * Parses the global color table from the given buffer.
   *
   * @param {Buffer} buffer - The buffer containing the global color table.
   * @return {Color[]} An array of Color objects representing the colors in the global color table.
   */
  private parseGlobalColorTable(buffer: Buffer): Color[] {
    if (!this.hasGlobalColorTable) {
      return [];
    }
    if (!this.logicalScreenDescriptor) {
      throw new Error(
        'The logicalScreenDescriptor is undefined. This should not happen.'
      );
    }
    // The global color table immediately follows the logical screen descriptor and has a length of 3 * 2^(N+1) bytes
    const colorTableSize: number = Math.pow(
      2,
      this.logicalScreenDescriptor.colorResolution + 1
    );
    const colorTableBuffer: Buffer = buffer.subarray(
      13,
      13 + 3 * colorTableSize
    );

    const colors: Color[] = this.parseColorTable(colorTableBuffer);

    return colors;
  }

  /**
   * Parses the color table from a buffer and returns an array of colors.
   *
   * @param {Buffer} buffer - The buffer containing the color table.
   * @return {Color[]} An array of colors parsed from the buffer.
   */
  private parseColorTable(buffer: Buffer): Color[] {
    const colors: Color[] = [];

    for (let i = 0; i < buffer.length; i += 3) {
      const red = buffer[i];
      const green = buffer[i + 1];
      const blue = buffer[i + 2];

      const color: Color = {
        rgbValues: { r: red, g: green, b: blue },
        hexValue: {
          value:
            '#' + red.toString(16) + green.toString(16) + blue.toString(16),
        },
        labValues: this.convertRGBToLab(red, green, blue),
      };

      colors.push(color);
    }

    return colors;
  }

  /**
   * Parses the graphics control extension from the given buffer.
   *
   * @param {Buffer} buffer - The buffer containing the graphics control extension.
   * @return {GraphicsControlExtension} The parsed graphics control extension.
   */
  private parseGraphicsControlExtension(
    buffer: Buffer
  ): GraphicsControlExtension {
    const disposalMethod = (buffer[3] & 0b00011100) >> 2;
    const userInputFlag = Boolean(buffer[3] & 0b00000010);
    const transparentColorFlag = Boolean(buffer[3] & 0b00000001);
    const delayTime = buffer.readUInt16LE(4);
    const transparentColorIndex = buffer[6];
    return {
      disposalMethod,
      userInputFlag,
      transparentColorFlag,
      delayTime,
      transparentColorIndex,
    };
  }

  /**
   * Parses the logical screen descriptor from the given buffer.
   *
   * @param {Buffer} buffer - The buffer containing the logical screen descriptor.
   * @return {LogicalScreenDescriptor} - The parsed logical screen descriptor.
   */
  private parseLogicalScreenDescriptor(
    buffer: Buffer
  ): LogicalScreenDescriptor {
    const descriptorBuffer = buffer.subarray(6, 13);
    const width = descriptorBuffer.readUInt16LE(0);
    const height = descriptorBuffer.readUInt16LE(2);
    const globalColorTableFlag = Boolean(descriptorBuffer[4] & 0b10000000);
    const colorResolution = (descriptorBuffer[4] & 0b01110000) >> 4;
    const colorResolutionValue = Math.pow(2, colorResolution + 1);
    const sortFlag = Boolean(descriptorBuffer[4] & 0b00001000);
    const backgroundColorIndex = descriptorBuffer[5];
    const pixelAspectRatio = descriptorBuffer[6];

    return {
      width,
      height,
      globalColorTableFlag,
      colorResolution,
      colorResolutionValue,
      sortFlag,
      backgroundColorIndex,
      pixelAspectRatio,
    };
  }

  /**
   * Parses the header block from the given buffer.
   *
   * @param {Buffer} buffer - The buffer containing the header block.
   * @return {HeaderBlock} The parsed header block.
   */
  private parseHeaderBlock(buffer: Buffer): HeaderBlock {
    const signature: string = buffer.subarray(0, 3).toString();
    const version: string = buffer.subarray(3, 6).toString();
    const headerBlock: HeaderBlock = {
      signature,
      version,
    };
    return headerBlock;
  }

  /**
   * Loads a GIF file from the specified path and returns its binary data as a string.
   *
   * @param {string} gifPath - The path to the GIF file.
   * @return {Promise<string>} A promise that resolves with the binary data of the GIF file as a string.
   */
  private loadGif(gifPath: string): Buffer {
    const absolutePath = path.resolve(gifPath);
    try {
      const binaryData: Buffer = fs.readFileSync(absolutePath);
      return binaryData;
    } catch (error) {
      console.error(`Error loading GIF file: ${error}`);
      throw error;
    }
  }

  /**
   * Converts an RGB color to a LAB color.
   *
   * @param {number} r - The red component of the RGB color (0-255).
   * @param {number} g - The green component of the RGB color (0-255).
   * @param {number} b - The blue component of the RGB color (0-255).
   * @return {LabColor} The LAB color.
   */
  private convertRGBToLab(r: number, g: number, b: number): LabColor {
    // Convert RGB to XYZ
    const sr = r / 255;
    const sg = g / 255;
    const sb = b / 255;
    const rLinear = sr <= 0.04045 ? sr / 12.92 : ((sr + 0.055) / 1.055) ** 2.4;
    const gLinear = sg <= 0.04045 ? sg / 12.92 : ((sg + 0.055) / 1.055) ** 2.4;
    const bLinear = sb <= 0.04045 ? sb / 12.92 : ((sb + 0.055) / 1.055) ** 2.4;
    const x = rLinear * 0.4124 + gLinear * 0.3576 + bLinear * 0.1805;
    const y = rLinear * 0.2126 + gLinear * 0.7152 + bLinear * 0.0722;
    const z = rLinear * 0.0193 + gLinear * 0.1192 + bLinear * 0.9505;

    // Convert XYZ to LAB
    const xn = 0.95047;
    const yn = 1.0;
    const zn = 1.08883;
    const xN = x / xn;
    const yN = y / yn;
    const zN = z / zn;
    const f = (t: number) =>
      t > (6 / 29) ** 3 ? t ** (1 / 3) : (1 / 3) * (29 / 6) ** 2 * t + 4 / 29;

    const lValue = 116 * f(yN) - 16;
    const aValue = 500 * (f(xN) - f(yN));
    const bValue = 200 * (f(yN) - f(zN));

    return {
      l: lValue,
      a: aValue,
      b: bValue,
    } as LabColor;
  }
}
