import { AudioBufferLoader } from '../../src/browser.js';

// Load through filesystem
{
  const loader = new AudioBufferLoader();

  // string argument
  const buffer = await loader.load('assets/sample-1.wav');
  console.log(buffer);

  // array argument
  const buffers = await loader.load(['assets/sample-1.wav', 'assets/sample-2.wav']);
  console.log(buffers);
}
