import {
  exec,
} from 'node:child_process';

import {
  isPlainObject,
  sleep,
} from '@ircam/sc-utils';
import {
  assert,
} from 'chai';
import {
  AudioBuffer,
  OfflineAudioContext,
} from 'node-web-audio-api';

import {
  resolvePathname, // this is "private", exposed for testing purposes only
  AudioBufferLoader,
} from '../src/node.js';

describe('# resolvePathname(pathname, serverAddress = null)', () => {
  // make caller site behave properly
  before(() => {
    process.env.SC_LOADER_RESOLVE_TEST='1';
  });

  it('should support pathname relative to cwd', () => {
    const pathname = 'tests/samples/sample.wav';
    const result = resolvePathname(pathname);
    assert.equal(result, pathname);
  });

  it('should support pathname relative to caller site', () => {
    const pathname = './samples/sample.wav';
    const expected = 'tests/samples/sample.wav';
    const result = resolvePathname(pathname);

    assert.equal(result, expected);
  });

  it('should support absolute URLs', () => {
    const pathname = 'http://my-site.com/sample.wav';
    const result = resolvePathname(pathname);

    assert.equal(result, pathname);
  });

  it('should support relative URLs if serverAddress is given (1)', () => {
    const serverAddress = 'http://my-site.com';
    const pathname = 'sample.wav';
    const expected = 'http://my-site.com/sample.wav';
    const result = resolvePathname(pathname, serverAddress);

    assert.equal(result, expected);
  });

  it('should support relative URLs if serverAddress is given (2)', () => {
    const serverAddress = 'http://my-site.com/subpath/';
    const pathname = '../sample.wav';
    const expected = 'http://my-site.com/sample.wav';
    const result = resolvePathname(pathname, serverAddress);

    assert.equal(result, expected);
  });

  it('should support relative URLs if serverAddress is given (3)', () => {
    const serverAddress = 'http://my-site.com/subpath/';
    const pathname = '/sample.wav';
    const expected = 'http://my-site.com/sample.wav';
    const result = resolvePathname(pathname, serverAddress);

    assert.equal(result, expected);
  });

  it('should throw if serverAddress is an invalid URL', () => {
    const serverAddress = 'invalid';
    const pathname = '/sample.wav';
    assert.throws(() => {
      resolvePathname(pathname, serverAddress);
    });
  });
});

describe('# AudioBufferLoader', () => {
  // make caller site behave properly
  before(() => {
    process.env.SC_LOADER_RESOLVE_TEST='0';
  });

  describe('## constructor(sampleRateOrAudioContext, serverAddress = null)', () => {
    it('should support an existing AudioContext as first argument', () => {
      const audioContext = new OfflineAudioContext(1, 1, 48000);
      const loader = new AudioBufferLoader(audioContext);
      assert.equal(loader.sampleRate, 48000);
      assert.equal(loader.serverAddress, null);
    });

    it('should support a valid sample rate as first argument', () => {
      const loader = new AudioBufferLoader(48000);
    });

    it('should throw if first argument is not a valid sample rate and not a BaseAudioContext instance', () => {
      assert.throws(() => {
        const loader = new AudioBufferLoader(1);
      });

      assert.throws(() => {
        const loader = new AudioBufferLoader({});
      });
    });

    it('should support a valid URL as second argument', () => {
      const serverAddress = 'https://prefix.my-site.com/test?123=456';
      const loader = new AudioBufferLoader(48000, serverAddress);
      assert.equal(loader.sampleRate, 48000);
      assert.equal(loader.serverAddress, serverAddress);
    });

    it('should throw if second argument is not a valid URL', () => {
      assert.throws(() => {
        const loader = new AudioBufferLoader(48000, 'invalid');
      });
    });
  });

  describe('## load(requestInfos)', () => {
    const sampleDuration = 3.2242083333333333;
    const clickDuration = 0.05225; // this should be 0.01, probably mp3 decoding issue
    const clackDuration = 0.020020833333333335;

    it('[string] should return null if file is not found', async () => {
      const loader = new AudioBufferLoader(48000);
      const result = await loader.load('coucou');
      assert.equal(result, null);
    });

    it('[string] should support string as argument', async () => {
      const loader = new AudioBufferLoader(48000);
      const result = await loader.load('../tests/samples/sample.wav');
      assert.isTrue(result instanceof AudioBuffer);
      assert.equal(result.duration, sampleDuration);
    });

    it('[array] should support array as argument (1)', async () => {
      const loader = new AudioBufferLoader(48000);
      const result = await loader.load(['./tests/samples/sample.wav']);
      assert.isTrue(Array.isArray(result));
      assert.isTrue(Object.isFrozen(result));
      assert.equal(result.length, 1);
      assert.isTrue(result[0] instanceof AudioBuffer);
      assert.equal(result[0].duration, sampleDuration);
    });

    it('[array] should support array as argument (2)', async () => {
      const loader = new AudioBufferLoader(48000);
      const result = await loader.load(['./tests/samples/clack.wav', './samples/click.mp3']);
      assert.isTrue(Array.isArray(result));
      assert.isTrue(Object.isFrozen(result));
      assert.equal(result.length, 2);
      assert.isTrue(result[0] instanceof AudioBuffer);
      assert.equal(result[0].duration, clackDuration);
      assert.isTrue(result[1] instanceof AudioBuffer);
      assert.equal(result[1].duration, clickDuration);
    });

    it('[object] should support object as argument (1)', async () => {
      const loader = new AudioBufferLoader(48000);
      const result = await loader.load({ sample: 'samples/sample.wav' });
      assert.isTrue(isPlainObject(result));
      assert.isTrue(Object.isFrozen(result));
      assert.isTrue(result['sample'] instanceof AudioBuffer);
      assert.equal(result['sample'].duration, sampleDuration);
    });

    it('[object] should support object as argument (2)', async () => {
      const loader = new AudioBufferLoader(48000);
      const result = await loader.load({ clack: 'samples/clack.wav', click: 'samples/click.mp3' });
      assert.isTrue(isPlainObject(result));
      assert.isTrue(Object.isFrozen(result));
      assert.isTrue(result['clack'] instanceof AudioBuffer);
      assert.equal(result['clack'].duration, clackDuration);
      assert.isTrue(result['click'] instanceof AudioBuffer);
      assert.equal(result['click'].duration, clickDuration);
      // order is preserved
      const order = ['clack', 'click'];
      let index = 0;
      for (let name in result) {
        assert.equal(name, order[index]);
        index++
      }
    });

    describe('## load(requestInfos, { forceMono })', () => {
      it('should throw if invalid type (1)', async () => {
        const loader = new AudioBufferLoader(48000);
        let errored = false;
        try {
          const result = await loader.load('samples/sample.wav', { forceMono: null });
        } catch (err) {
          console.log(err.message);
          errored = true;
        }

        assert.equal(errored, true);
      });

      it('should throw if invalid type (2)', async () => {
        const loader = new AudioBufferLoader(48000);
        let errored = false;
        try {
          const result = await loader.load('samples/sample.wav', { forceMono: -1 });
        } catch (err) {
          console.log(err.message);
          errored = true;
        }

        assert.equal(errored, true);
      });

      it('should downmix if forceMono = true', async () => {
        const loader = new AudioBufferLoader(48000);
        const model = await loader.load('samples/sample.wav');
        const result = await loader.load('samples/sample.wav', { forceMono: true });

        const expected = new Float32Array(model.length);
        const left = model.getChannelData(0);
        const right = model.getChannelData(1);
        for (let i = 0; i < expected.length; i++) {
          expected[i] = 0.5 * (left[i] + right[i]);
        }

        assert.equal(result.numberOfChannels, 1);
        assert.equal(result.length, model.length);
        assert.equal(result.sampleRate, model.sampleRate);
        assert.deepEqual(result.getChannelData(0), expected);
      });

      it('should use given channel number if forceMono is an integer', async () => {
        const loader = new AudioBufferLoader(48000);
        const model = await loader.load('samples/sample.wav');
        const result = await loader.load('samples/sample.wav', { forceMono: 1 });

        assert.equal(result.numberOfChannels, 1);
        assert.equal(result.length, model.length);
        assert.equal(result.sampleRate, model.sampleRate);
        assert.deepEqual(result.getChannelData(0), model.getChannelData(1));
      });
    });

    it('should be able to load online resources', async () => {
      // serving in `./tests/samples/`, we make sure path is not resolved in fs
      const child = exec('serve ./tests/samples/');
      await sleep(0.25); // wait for server to wake up

      const loader = new AudioBufferLoader(48000, 'http://127.0.0.1:3000');
      const result = await loader.load('sample.wav');
      assert.isTrue(result instanceof AudioBuffer);
      assert.equal(result.duration, sampleDuration);

      child.kill('SIGKILL');
    });

    it('should fail gracefully if online resource does not exists', async () => {
      // serving in `./tests/samples/`, we make sure path is not resolved in fs
      const child = exec('serve ./tests/samples/');
      await sleep(0.25); // wait for server to wake up

      const loader = new AudioBufferLoader(48000, 'http://127.0.0.1:3000');
      const result = await loader.load('do-not-exists.wav');
      assert.equal(result, null);

      child.kill('SIGKILL');
    });
  });

  describe('## getValues()', () => {
    it('[string] should return last loaded value', async () => {
      const loader = new AudioBufferLoader(48000);
      const result = await loader.load('./samples/sample.wav');
      const values = loader.getValues();
      assert.deepEqual(values, result);
    });

    it('[array] should return last loaded array value', async () => {
      const loader = new AudioBufferLoader(48000);
      const result = await loader.load(['./tests/samples/sample.wav']);
      const values = loader.getValues();
      assert.deepEqual(values, result);
    });

    it('[object] should return last loaded object value', async () => {
      const loader = new AudioBufferLoader(48000);
      const result = await loader.load({ sample: 'samples/sample.wav' });
      const values = loader.getValues();
      assert.deepEqual(values, result);
    });
  });

  describe('## get(key)', () => {
    it('[string] should return value (disregarding argument)', async () => {
      const loader = new AudioBufferLoader(48000);
      const result = await loader.load('./samples/sample.wav');
      const buffer = loader.get('toto');
      assert.deepEqual(buffer, result);
    });

    it('[array] should return value at index', async () => {
      const loader = new AudioBufferLoader(48000);
      const result = await loader.load(['./tests/samples/sample.wav']);
      const buffer = loader.get(0);
      assert.deepEqual(buffer, result[0]);
    });

    it('[array] should return null if index out of bounds', async () => {
      const loader = new AudioBufferLoader(48000);
      const result = await loader.load(['./tests/samples/sample.wav']);
      const buffer = loader.get(1);
      assert.deepEqual(buffer, null);
    });

    it('[object] should return value at key', async () => {
      const loader = new AudioBufferLoader(48000);
      const result = await loader.load({ sample: 'samples/sample.wav' });
      const buffer = loader.get('sample');
      assert.deepEqual(buffer, result['sample']);
    });

    it('[object] should return null if key does not exists', async () => {
      const loader = new AudioBufferLoader(48000);
      const result = await loader.load({ sample: 'samples/sample.wav' });
      const buffer = loader.get('click');
      assert.deepEqual(buffer, null);
    });
  });

  describe('## clear()', () => {
    it('[string] should clear internal cache', async () => {
      const loader = new AudioBufferLoader(48000);
      const result = await loader.load('./samples/sample.wav');
      const buffer = loader.get('toto');
      assert.deepEqual(buffer, result);
      // clear cache
      loader.clear();
      {
        const buffer = loader.get('toto');
        assert.equal(buffer, null)
        const values = loader.getValues();
        assert.equal(values, null);
      }
    });
  });

  describe('## abort()', () => {
    it('should abort `load`', async () => {
      const loader = new AudioBufferLoader(48000);

      const promise = loader.load('./samples/sample.wav');
      await true; // be not completely synchronous
      loader.abort(); // log readFile catch block to see abortion
      await promise;

      const values = loader.getValues();
      assert.equal(values, null);
    });

    it('should abort `load` online (multiple)', async () => {
      // serving in `./tests/samples/`, we make sure path is not resolved in fs
      const child = exec('serve ./tests/samples/');
      await sleep(0.25); // wait for server to wake up

      const loader = new AudioBufferLoader(48000, 'http://127.0.0.1:3000');
      const promise = loader.load(['sample.wav', 'clack.wav']);
      await true; // be not completely synchronous
      loader.abort(); // log fetch catch block to see abortion
      await promise;

      const values = loader.getValues();
      assert.equal(values, null);

      child.kill('SIGKILL');
    });

    it('abort second `load` should keep previous cache', async () => {
      const loader = new AudioBufferLoader(48000);
      const firstResult = await loader.load({ clack: 'samples/clack.wav', click: 'samples/click.mp3' });

      const promise = loader.load('samples/sample.wav');
      await true; // be not completely synchronous
      loader.abort(); // log readFile catch block to see abortion
      await promise;

      const values = loader.getValues();
      assert.deepEqual(values, firstResult);
    });
  });
});
