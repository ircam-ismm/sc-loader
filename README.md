# sc-loader

_Work in progress_

Unified assets loaders between node and browser

## Install

```
npm install --save @ircam/sc-loader
```

## Usage

```js
import { AudioBufferLoader } from '@ircam/sc-loader';

new Loader({ sampleRate, baseUrl });

// load one file
const buffer = await loader.load(filename);

// load array
const buffers = await loader.load([filename, filename, filename]);
loader.get(0);

// load key pathname pairs
const buffers = await loader.load({  });
loader.get('key');

// get last loaded values
loader.getValues();
```

## Notes

### Objectives

- [ ] works seamlessly between node and the browser
- [ ] able to load many type of files?
  + [ ] AudioBuffers
  + [ ] JSON
  + [ ] raw text
  + [ ] binary format (i.e. midi files)
  + [ ] optionnaly: Images (define what to do in node: ignore, return a blob ?)
  --> cf component `sc-drag-n-drop`
- [ ] should be able to load files locally on the filesystem for node
  + if fs.exists(filename) { loadThis() } else { fetchFromRemoteServer() }

### To check

- https://github.com/developit/unfetch/tree/master/packages/isomorphic-unfetch
- https://github.com/developit/unfetch 
  + interesting to check to integration test using `vm` https://nodejs.org/api/vm.html)

## License

[BSD-3-Clause](./LICENSE)
