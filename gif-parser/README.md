gif-parser

`gif-parser` is a Node.js package that provides a simple API for parsing GIF files. It can be used to extract information about the GIF file, including its dimensions, color table, and image frames.

## Installation

To install `gif-parser`, use npm:

```bash
npm install @mikesven/gif-parser
```

## Usage

To use `gif-parser`, import the `GIF` class and create a new instance with the path to the GIF file

```typescript
import { GifParser } from '../src';

export const main = async () => {
  const gif = new GifParser({
    filePath: './demo/image1.gif',
  });

  //bin value
  console.log('[BIN VALUE]', gif.getBinValue());

  //header block
  console.log('[HEADER BLOCK]', JSON.stringify(gif.getHeaderBlock()));

  //logical screen descriptor
  console.log(
    '[LOGICAL SCREEN DESCRIPTOR]',
    JSON.stringify(gif.getLogicalScreenDescriptor())
  );

  //global color table
  console.log(
    '[GLOBAL COLOR TABLE]',
    JSON.stringify(gif.getGlobalColorTable())
  );

  // graphics control extension
  console.log(
    '[GRAPHICS CONTROL EXTENSION]',
    JSON.stringify(gif.getGraphicsControlExtension())
  );

  // get images
  console.log('[IMAGES]', JSON.stringify(gif.getImages()));
  console.log('[IMAGES]', JSON.stringify(gif.getImages().length));
};

main().then(() => {
  console.log('Done');
});
```

## API

`Color`

The `Color` type represents a color in the GIF file. It has the following properties:

- `rgbValues`: An object with the red, green, and blue values of the color as numbers between 0 and 255.
- `labValues`: An object with the lightness, green-red, and blue-yellow values of the color in the CIELAB color space.
- `hexValue`: An object with the hexadecimal representation of the color as a string.

### `Image`

The `Image` type represents an image frame in the GIF file. It has the following properties:

- `left`: The left position of the image in pixels.
- `top`: The top position of the image in pixels.
- `width`: The width of the image in pixels.
- `height`: The height of the image in pixels.
- `imageData`: A `Buffer` object containing the image data
