import { AudioBufferLoader } from '../../src/node.js';

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

// Load through network
// must launch `npx server` in tests directory, so that path does not exists in fs
{
  const loader = new AudioBufferLoader({
    baseUrl: `http://localhost:3000`,
  });

  // string argument
  const buffer = await loader.load('integration/assets/sample-1.wav');
  console.log(buffer);

  // array argument
  const buffers = await loader.load(['integration/assets/sample-1.wav', 'integration/assets/sample-2.wav']);
  console.log(buffers);
}
