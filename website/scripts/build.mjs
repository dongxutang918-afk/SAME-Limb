import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const portable=fileURLToPath(new URL('../../tools/node-v22.23.2-win-x64/node.exe',import.meta.url));
const binary=process.platform==='win32'&&existsSync(portable)?portable:process.execPath;
const cli=fileURLToPath(new URL('../node_modules/vinext/dist/cli.js',import.meta.url));
const child=spawn(binary,[cli,'build'],{stdio:'inherit',cwd:fileURLToPath(new URL('..',import.meta.url)),windowsHide:true});
child.on('error',e=>{console.error(e);process.exitCode=1;});
child.on('exit',code=>{process.exitCode=code??1;});
