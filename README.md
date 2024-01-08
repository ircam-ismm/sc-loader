# `sc-loader`

_Work in progress_

general purpose loader for WebAudio and artistic applications

## Objectives

- works seamlessly between node and the browser
- able to load many type of files
  + AudioBuffers
  + JSON
  + raw text
  + binary format (i.e. midi files)
  + optionnaly: Images (define what to do in node: ignore, return a blob ?)
  --> cf component `sc-drag-n-drop`
- should be able to load files locally on the filesystem for node
  + if fs.exists(filename) { loadThis() } else { fetchFromRemoteServer() }
- should run properly in these different context
  + node: common.js module (`require`)
  + node: ecmascript module (`import`)
  + browser: common bundlers (e.g. webpack)
  + browser: umd (load as raw script, see https://unpkg.com/)
  + browser: `<script type="module">`

## API

```
const buffer = await loader.load(filename);

const buffers = await loader.load([filename, filename, filename]);
loader.get(0);

const buffers (= {}) = await loader.load({  });
loader.get('key');

await loader.load({  });

loader.getValues();

new Loader({ sampleRate, baseUrl });
```
  
## Architecture / dependancy tree


```
window.AudioContext           node-web-audio-api
      |                               |
      |------|           |------------|
             |           |
        isomorphic-webaudio-api
             |
             |  |---------------------- isomorphic-unfetch
             |  |
          sc-loader
```

## Examples / Documentation

- https://github.com/developit/microbundle
- https://github.com/developit/unfetch/tree/master/packages/isomorphic-unfetch
- https://github.com/developit/unfetch 
  + interesting to check to integration test using `vm` https://nodejs.org/api/vm.html)
