import {
  assert,
} from 'chai';
import {
  isPlainObject,
  sleep,
} from '@ircam/sc-utils';
import {
  resolvePathname, // this is "private", exposed for testing purposes only
  AudioBufferLoader,
} from '../src/browser.js';

describe('# resolvePathname(pathname, serverAddress = null)', () => {
  it('should support relative URLs', () => {
    const pathname = './sample.wav';
    const result = resolvePathname(pathname);

    assert.equal(result, pathname);
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
    const sampleDuration = '3.224';
    const clickDuration = '0.010'; // '0.052'; mp3 issue in rust
    const clackDuration = '0.020';

    it('[string] should support string as argument', async () => {
      const loader = new AudioBufferLoader(48000);
      const result = await loader.load('samples/sample.wav');
      assert.isTrue(result instanceof AudioBuffer);
      assert.equal(result.duration.toFixed(3), sampleDuration);
    });

    it('[array] should support array as argument (1)', async () => {
      const loader = new AudioBufferLoader(48000);
      const result = await loader.load(['./samples/sample.wav']);
      assert.isTrue(Array.isArray(result));
      assert.isTrue(Object.isFrozen(result));
      assert.equal(result.length, 1);
      assert.isTrue(result[0] instanceof AudioBuffer);
      assert.equal(result[0].duration.toFixed(3), sampleDuration);
    });

    it('[array] should support array as argument (2)', async () => {
      const loader = new AudioBufferLoader(48000);
      const result = await loader.load(['samples/clack.wav', './samples/click.mp3']);
      assert.isTrue(Array.isArray(result));
      assert.isTrue(Object.isFrozen(result));
      assert.equal(result.length, 2);
      assert.isTrue(result[0] instanceof AudioBuffer);
      assert.equal(result[0].duration.toFixed(3), clackDuration);
      assert.isTrue(result[1] instanceof AudioBuffer);
      assert.equal(result[1].duration.toFixed(3), clickDuration);
    });

    it('[object] should support object as argument (1)', async () => {
      const loader = new AudioBufferLoader(48000);
      const result = await loader.load({ sample: 'samples/sample.wav' });
      assert.isTrue(isPlainObject(result));
      assert.isTrue(Object.isFrozen(result));
      assert.isTrue(result['sample'] instanceof AudioBuffer);
      assert.equal(result['sample'].duration.toFixed(3), sampleDuration);
    });

    it('[object] should support object as argument (2)', async () => {
      const loader = new AudioBufferLoader(48000);
      const result = await loader.load({ clack: 'samples/clack.wav', click: 'samples/click.mp3' });
      assert.isTrue(isPlainObject(result));
      assert.isTrue(Object.isFrozen(result));
      assert.isTrue(result['clack'] instanceof AudioBuffer);
      assert.equal(result['clack'].duration.toFixed(3), clackDuration);
      assert.isTrue(result['click'] instanceof AudioBuffer);
      assert.equal(result['click'].duration.toFixed(3), clickDuration);
      // order is preserved
      const order = ['clack', 'click'];
      let index = 0;
      for (let name in result) {
        assert.equal(name, order[index]);
        index++;
      }
    });

    it('should fail gracefully if online resource does not exists', async () => {
      const loader = new AudioBufferLoader(48000, 'http://127.0.0.1:3000');
      const result = await loader.load('do-not-exists.wav');
      assert.equal(result, null);
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
      const result = await loader.load(['./samples/sample.wav']);
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
      const result = await loader.load(['/samples/sample.wav']);
      const buffer = loader.get(0);
      assert.deepEqual(buffer, result[0]);
    });

    it('[array] should return null if index out of bounds', async () => {
      const loader = new AudioBufferLoader(48000);
      const result = await loader.load(['/samples/sample.wav']);
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
    it('[string] should abort `load` (1)', async () => {
      const loader = new AudioBufferLoader(48000);

      const promise = loader.load('./samples/sample.wav');
      await true; // be not completely synchronous
      loader.abort(); // log readFile catch block to see abortion
      await promise;

      const values = loader.getValues();
      assert.equal(values, null);
    });

    it('[array] should abort `load` (2)', async () => {
      const loader = new AudioBufferLoader(48000, 'http://127.0.0.1:3000');
      const promise = loader.load(['sample.wav', 'clack.wav']);
      await true; // be not completely synchronous
      loader.abort(); // log fetch catch block to see abortion
      await promise;

      const values = loader.getValues();
      assert.equal(values, null);
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

