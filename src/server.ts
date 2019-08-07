import { resolve as resolvePath } from 'path';
import * as MRE from '@microsoft/mixed-reality-extension-sdk';
import { log } from '@microsoft/mixed-reality-extension-sdk/built/log';

import { WhereInTheWorld } from './app';

// launch the app for new connections
const webhost = new MRE.WebHost({
	baseDir: resolvePath(__dirname, '..', 'public')
});
webhost.adapter.onConnection((context, params) => new WhereInTheWorld(context, params));
export { webhost };

process.on('uncaughtException', err => console.error('uncaughtException', err));
process.on('unhandledRejection', reason => console.error('unhandledRejection', reason));