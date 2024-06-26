# sc-loader

Load `AudioBuffer` in Node.js (cf. [node-web-audio-api](https://www.npmjs.com/package/node-web-audio-api)) and the Browser with a unified interface

## Install

```
npm install --save @ircam/sc-loader
```

## Usage

```js
import { AudioBufferLoader } from '@ircam/sc-loader';

const audioContext = new AudioContext();
const loader = new AudioBufferLoader(audioContext);
// load one file
const buffer = await loader.load('path/to/file.wav');
const src = audioContext.createBufferSource();
src.buffer = buffer;
src.connect(audioContext.destination);
src.start();
```

## API

<!-- api -->
<!-- Generated by documentation.js. Update this documentation by updating the source code. -->

### Table of Contents

*   [AudioBufferLoader][1]
    *   [Parameters][2]
    *   [Examples][3]
    *   [sampleRate][4]
    *   [serverAddress][5]
    *   [load][6]
    *   [get][7]
    *   [getValues][8]
    *   [abort][9]
    *   [clear][10]

## AudioBufferLoader

The `AudioBufferLoader` interface allows to load `AudioBuffer` in Node.js
and the Browser with a unified interface.

### Parameters

*   `sampleRateOrAudioContext` **(AudioContext | [number][11])** An exisiting AudioContext
    instance or a valid sample rate. Loaded audio buffers will be resampled to
    the given sample rate or audio context sample rate
*   `serverAddress` **[string][12]** Optional server address URL to use
    for loading the audio files. (optional, default `null`)

### Examples

```javascript
import { AudioBufferLoader } from '@ircam/sc-loader';
// import { AudioContext } from 'node-web-audio-api';

const audioContext = new AudioContext()
const loader = new AudioBufferLoader(audioContext);
// load one file
const buffer = await loader.load('path/to/file.wav');
```

### sampleRate

Sample rate of loader and decoded audio buffers

### serverAddress

Optional server address URL to use for loading the audio files.

### load

Load audio buffers.

In the browser, the given path to the audio files are resolved as following:

*   if serverAddress is null, rely on default fetch behavior
*   if serverAddress is not null, try to create an URL from pathname and serverAddress

In Node.js,

*   load from filesystem relative to `process.cwd()`
*   load from filesystem relative to caller site
*   load from network if an absolute URL is given
*   if `serverAddress` is given and all other strategies failed, try to build
    a valid URL from `pathname` and `serverAddress`, and try to load from network

Calling this function will erase the cache from previous `load` call.

Returns `null` if aborted

#### Parameters

*   `requestInfos` **([string][12] | [array][13]<[string][12]> | [object][14]<[string][12], [string][12]>)** List of
    sound file to load, the returned value structure will match the strcuture
    of the argument. If the sound file could not be load (e.g. file not found or
    decoding error) the slot will be set to `null`.

#### Examples

```javascript
// load single file
const buffer = await loader.load('path/to/file.wav');
// load array
const buffers = await loader.load(['file1.wav', 'file2.mp3', 'ile3.wav']);
// load object
const buffers = await loader.load({ file1: 'file1.wav' });
```

Returns **(AudioBuffer | [array][13]\<AudioBuffer> | [object][14]<[string][12], AudioBuffer>)**&#x20;

### get

Get an AudioBuffer from cache according the its key or index.

If the cache is a single `AudioBuffer`, it will be returned disregarding
the given key.

#### Parameters

*   `key` &#x20;
*   `null-null` **([number][11] | [string][12])** Key to the AudioBuffer

#### Examples

```javascript
// load and get single file
await loader.load('path/to/file.wav');
const buffer = loader.get();
// load array and get file at index
await loader.load(['file1.wav', 'file2.mp3', 'ile3.wav']);
const buffer = loader.get(0);
// load object and get file by key
await loader.load({ file1: 'file1.wav' });
const buffer = loader.get('file1');
```

Returns **AudioBuffer**&#x20;

### getValues

Get full cache of the loader.

#### Examples

```javascript
const buffers = await loader.load(['file1.wav', 'file2.mp3', 'ile3.wav']);
const cache = loader.getValues(0);
console.log(buffers === cache);
```

Returns **(AudioBuffer | [array][13]\<AudioBuffer> | [object][14]<[string][12], AudioBuffer>)**&#x20;

### abort

Abort an ongoing `load` call.

The cache from previous `load` call will be preserved.

#### Examples

```javascript
const promise = loader.load(['file1.wav', 'file2.mp3', 'ile3.wav']);
await true;
loader.abort();
const result = await promise;
console.log(result === null);
```

Returns **(AudioBuffer | [array][13]\<AudioBuffer> | [object][14]<[string][12], AudioBuffer>)**&#x20;

### clear

Clear the cache.

#### Examples

```javascript
const buffers = await loader.load(['file1.wav', 'file2.mp3', 'ile3.wav']);
loader.clear();
const cache = loader.getValues();
console.log(cache === null);
```

[1]: #audiobufferloader

[2]: #parameters

[3]: #examples

[4]: #samplerate

[5]: #serveraddress

[6]: #load

[7]: #get

[8]: #getvalues

[9]: #abort

[10]: #clear

[11]: https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number

[12]: https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String

[13]: https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array

[14]: https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object

<!-- apistop -->

## Development notes

### Running the tests

```
npm run test
```

### TODOS

- [ ] make a diff between each load call to keep already loaded buffers from cache

Provides loaders for other type of files?
+ [ ] AudioBuffers
+ [ ] JSON
+ [ ] raw text
+ [ ] binary format (i.e. midi files)

## License

[BSD-3-Clause](./LICENSE)
