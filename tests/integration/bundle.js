// ../../node_modules/@ircam/sc-utils/src/is-browser.js
var isBrowser = new Function("try {return this===window;}catch(e){ return false;}");

// ../../node_modules/@ircam/sc-gettime/src/browser.js
var usePerf = globalThis.performance && globalThis.performance.now;
var start = usePerf ? performance.now() : Date.now();
if (!globalThis.crossOriginIsolated) {
  console.warn(`[@ircam/sc-gettime] Your page is not Cross Origin Isolated. The accuracy of the clock may be reduced by the User-Agent to prevent finger-printing
(see: https://web.dev/coop-coep/ for more informations)`);
}

// ../../node_modules/is-plain-obj/index.js
function isPlainObject(value) {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const prototype = Object.getPrototypeOf(value);
  return (prototype === null || prototype === Object.prototype || Object.getPrototypeOf(prototype) === null) && !(Symbol.toStringTag in value) && !(Symbol.iterator in value);
}

// ../../node_modules/@ircam/sc-utils/src/is-plain-object.js
function isPlainObject2(val) {
  return isPlainObject(val);
}

// ../../node_modules/@ircam/sc-utils/src/is-string.js
function isString(val) {
  return typeof val === "string" || val instanceof String;
}

// ../../node_modules/url-join/lib/url-join.js
function normalize(strArray) {
  var resultArray = [];
  if (strArray.length === 0) {
    return "";
  }
  if (typeof strArray[0] !== "string") {
    throw new TypeError("Url must be a string. Received " + strArray[0]);
  }
  if (strArray[0].match(/^[^/:]+:\/*$/) && strArray.length > 1) {
    var first = strArray.shift();
    strArray[0] = first + strArray[0];
  }
  if (strArray[0].match(/^file:\/\/\//)) {
    strArray[0] = strArray[0].replace(/^([^/:]+):\/*/, "$1:///");
  } else {
    strArray[0] = strArray[0].replace(/^([^/:]+):\/*/, "$1://");
  }
  for (var i = 0; i < strArray.length; i++) {
    var component = strArray[i];
    if (typeof component !== "string") {
      throw new TypeError("Url must be a string. Received " + component);
    }
    if (component === "") {
      continue;
    }
    if (i > 0) {
      component = component.replace(/^[\/]+/, "");
    }
    if (i < strArray.length - 1) {
      component = component.replace(/[\/]+$/, "");
    } else {
      component = component.replace(/[\/]+$/, "/");
    }
    resultArray.push(component);
  }
  var str = resultArray.join("/");
  str = str.replace(/\/(\?|&|#[^!])/g, "$1");
  var parts = str.split("?");
  str = parts.shift() + (parts.length > 0 ? "?" : "") + parts.join("&");
  return str;
}
function urlJoin() {
  var input;
  if (typeof arguments[0] === "object") {
    input = arguments[0];
  } else {
    input = [].slice.call(arguments);
  }
  return normalize(input);
}

// ../../src/browser.js
var contexts = /* @__PURE__ */ new Map();
async function loadAudioBuffer(pathname, sampleRate = 48e3) {
  if (!contexts.has(sampleRate)) {
    const context2 = new OfflineAudioContext(1, 1, sampleRate);
    contexts.set(sampleRate, context2);
  }
  const response = await fetch(pathname);
  const arrayBuffer = await response.arrayBuffer();
  const context = contexts.get(sampleRate);
  const audioBuffer = await context.decodeAudioData(arrayBuffer);
  return audioBuffer;
}
var AudioBufferLoader = class {
  constructor({
    sampleRate = 48e3,
    baseUrl = ""
  } = {}) {
    this.sampleRate = sampleRate;
    this.baseUrl = baseUrl;
  }
  async load(list) {
    if (Array.isArray(list)) {
      const promises = list.map((filename) => {
        const pathname = urlJoin(this.baseUrl, filename);
        return loadAudioBuffer(pathname, this.sampleRate);
      });
      return Promise.all(promises);
    } else if (isPlainObject2(list)) {
      throw new Error(`[AudioBufferLoader] Invalid argument, object is not supported yet`);
    } else if (isString(list)) {
      const filename = list;
      const pathname = urlJoin(this.baseUrl, filename);
      return loadAudioBuffer(pathname, this.sampleRate);
    } else {
      throw new TypeError(`[AudioBufferLoader] Invalid argument`);
    }
  }
};

// main.js
{
  const loader = new AudioBufferLoader();
  const buffer = await loader.load("assets/sample-1.wav");
  console.log(buffer);
  const buffers = await loader.load(["assets/sample-1.wav", "assets/sample-2.wav"]);
  console.log(buffers);
}
