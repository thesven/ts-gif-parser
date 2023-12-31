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
