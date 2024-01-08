import { isPlainObject, isString } from '@ircam/sc-utils';
import urlJoin from 'url-join';

const contexts = new Map();

export async function loadAudioBuffer(pathname, sampleRate = 48000) {
  if (!contexts.has(sampleRate)) {
    const context = new OfflineAudioContext(1, 1, sampleRate);
    contexts.set(sampleRate, context);
  }

  const response = await fetch(pathname);
  const arrayBuffer = await response.arrayBuffer();

  const context = contexts.get(sampleRate);
  const audioBuffer = await context.decodeAudioData(arrayBuffer);

  return audioBuffer;
}

export class AudioBufferLoader {
  constructor({
    sampleRate = 48000,
    baseUrl = '',
  } = {}) {
    this.sampleRate = sampleRate;
    this.baseUrl = baseUrl;
  }

  async load(list) {
    if (Array.isArray(list)) {
      const promises = list.map(filename => {
        const pathname = urlJoin(this.baseUrl, filename);
        return loadAudioBuffer(pathname, this.sampleRate);
      });

      return Promise.all(promises);
    } else if (isPlainObject(list)) {
      throw new Error(`[AudioBufferLoader] Invalid argument, object is not supported yet`);
    } else if (isString(list)) {
      const filename = list;
      const pathname = urlJoin(this.baseUrl, filename);
      return loadAudioBuffer(pathname, this.sampleRate);
    } else {
      throw new TypeError(`[AudioBufferLoader] Invalid argument`);
    }
  }
}

