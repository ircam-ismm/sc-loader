import path from 'node:path';
import { URL, pathToFileURL } from 'node:url';
import { default as fs, promises as fsPromises } from 'node:fs';
import http from 'node:http';
import https from 'node:https';

import { isPlainObject, isString } from '@ircam/sc-utils';
import { OfflineAudioContext } from 'node-web-audio-api';
import { temporaryFileTask } from 'tempy';

const contexts = new Map();

export async function loadAudioBuffer(pathname, sampleRate = 48000) {
  if (!contexts.has(sampleRate)) {
    const context = new OfflineAudioContext(1, 1, sampleRate);
    contexts.set(sampleRate, context);
  }

  const context = contexts.get(sampleRate);

  // try load from file system
  if (fs.existsSync(pathname)) {
    const rawBuffer = await fsPromises.readFile(pathname);
    return context.decodeAudioData(rawBuffer.buffer);
  // try load from network
  } else {
    return new Promise((resolve, reject) => {
      const extension = path.extname(pathname).replace(/^\./, ''); // remove leading '.'
      const protocol = new URL(pathname).protocol.replace(/:$/, ''); // remove trailing ":"
      const http_ = protocol === 'http' ? http : https;

      temporaryFileTask(async (tempfile) => {
        return new Promise(async (resolveTask, _reject) => {
          const file = fs.createWriteStream(tempfile);

          const request = http_.get(pathname, { rejectUnauthorized: false }, (response) => {
            const { statusCode } = response;
            if (statusCode !== 200) {
              reject(new Error(`File not found`));
            }

            response.pipe(file);
            // after download completed close filestream
            file.on("finish", async () => {
              file.close();

              const rawBuffer = await fsPromises.readFile(tempfile);
              const audioBuffer = await context.decodeAudioData(rawBuffer.buffer);

              resolve(audioBuffer);
              resolveTask(); // clean tmp file
            });
          });
        });
      }, { extension });
    });
  }
}

// @todo - review so that it more smart...
// Should check if file exist in fs before concatenating `baseUrl`
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
        const pathname = path.join(this.baseUrl, filename);
        return loadAudioBuffer(pathname, this.sampleRate);
      });

      return Promise.all(promises);
    } else if (isPlainObject(list)) {
      throw new Error(`[AudioBufferLoader] Invalid argument, object is not supported yet`);
    } else if (isString(list)) {
      const filename = list;
      const pathname = path.join(this.baseUrl, filename);
      return loadAudioBuffer(pathname, this.sampleRate);
    } else {
      throw new TypeError(`[AudioBufferLoader] Invalid argument`);
    }
  }
}
