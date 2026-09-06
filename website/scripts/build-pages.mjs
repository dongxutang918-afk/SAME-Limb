import {spawn} from 'node:child_process';
import {readdir,mkdir,readFile,writeFile,copyFile,rename} from 'node:fs/promises';
import {resolve,relative,dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('..',import.meta.url));
const prefix='/SAME-Limb';
const child=spawn(process.execPath,[join(root,'scripts/build.mjs')],{cwd:root,stdio:'inherit',windowsHide:true,env:{...process.env,NEXT_PUBLIC_BASE_PATH:prefix}});
const code=await new Promise((done,reject)=>{child.on('error',reject);child.on('exit',done);});
if(code!==0)process.exit(code??1);
const input=join(root,'dist/client'),output=join(root,'pages-export');
// Retain previous generated output locally so a rebuild cannot leave stale files.
try { await rename(output,join(root,'dist',`previous-pages-export-${Date.now()}`)); }
catch(error) { if(error.code!=='ENOENT')throw error; }
await mkdir(output,{recursive:true});
async function walk(folder){const found=[];for(const item of await readdir(folder,{withFileTypes:true})){const path=join(folder,item.name);if(item.isDirectory())found.push(...await walk(path));else found.push(path);}return found;}
const destinations=new Map();
for(const file of await walk(input)){
 let path=relative(input,file).replaceAll('\\','/');
 // Vinext writes prefixed routes and chunks under SAME-Limb; Pages supplies that mount point.
 if(path.startsWith('SAME-Limb/'))path=path.slice('SAME-Limb/'.length);
 if(destinations.has(path)){
  if(!(await readFile(destinations.get(path))).equals(await readFile(file)))throw new Error('Conflicting exported paths: '+path);
  continue;
 }
 destinations.set(path,file);const target=resolve(output,path);
 if(!target.startsWith(resolve(output)+ (process.platform==='win32'?'\\':'/')))throw new Error('Invalid export path');
 await mkdir(dirname(target),{recursive:true});await copyFile(file,target);
}
await writeFile(join(output,'.nojekyll'),'');
const html=await readFile(join(output,'index.html'),'utf8');
if(!html.includes('Synchronized AMG and EMG Dataset'))throw new Error('Missing website homepage');
for(const match of html.matchAll(/(?:src|href)="(\/[^"#?]*)(?:[?#][^"]*)?"/g)){
 const url=match[1];if(!url.startsWith(prefix+'/'))throw new Error('Unprefixed local URL: '+url);
 const path=decodeURIComponent(url.slice(prefix.length+1));
 if(path&&!destinations.has(path)&&!destinations.has(path+'index.html'))throw new Error('Missing referenced asset: '+url);
}
console.log(`GitHub Pages artifact ready: ${output} (${destinations.size+1} files)`);
