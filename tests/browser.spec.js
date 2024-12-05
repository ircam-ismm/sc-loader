import {
  execSync,
  exec,
} from 'node:child_process';
import {
  sleep
} from '@ircam/sc-utils';

// bundle test file
execSync(`esbuild tests/test.browser.js --bundle --format=esm --outfile=tests/test.browser.bundle.js`);
// launch server
const childServer = exec('serve ./tests/');
await sleep(1);
// open in browser
execSync('open http://127.0.0.1:3000');
// kill server once test are done
await sleep(4);
childServer.kill('SIGKILL');

