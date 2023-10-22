import * as fs from 'fs';
import * as path from 'path';
import {
  GifTableReaderOptions,
  HeaderBlock,
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

  public constructor(protected readonly options: GifTableReaderOptions) {
    this.binValue = this.loadGif(options.filePath);
    this.headerBlock = this.parseHeaderBlock(this.binValue);
    this.logicalScreenDescriptor = this.parseLogicalScreenDescriptor(
      this.binValue
    );
    this.hasGlobalColorTable =
      this.logicalScreenDescriptor.globalColorTableFlag;
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
   * Parses the logical screen descriptor from the given buffer.
   *
   * @param {Buffer} buffer - The buffer containing the logical screen descriptor.
   * @return {LogicalScreenDescriptor} - The parsed logical screen descriptor.
   */
  private parseLogicalScreenDescriptor(
    buffer: Buffer
  ): LogicalScreenDescriptor {
    const descriptorBuffer = buffer.slice(6, 13);
    const width = descriptorBuffer.readUInt16LE(0);
    const height = descriptorBuffer.readUInt16LE(2);
    const globalColorTableFlag = Boolean(descriptorBuffer[4] & 0b10000000);
    const colorResolution = (descriptorBuffer[4] & 0b01110000) >> 4;
    const colorResolutionValue = 1 << colorResolution;
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
    const signature: string = buffer.slice(0, 3).toString();
    const version: string = buffer.slice(3, 6).toString();
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
}
