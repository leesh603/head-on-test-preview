import {readdirSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
const files=readdirSync(new URL('../tests/',import.meta.url)).filter(f=>f.endsWith('.test.mjs')).map(f=>new URL('../tests/'+f,import.meta.url).pathname.replace(/^\/([A-Z]:)/,'$1'));
const result=spawnSync(process.execPath,['--test',...files.map(f=>decodeURIComponent(f))],{stdio:'inherit'});
if(result.error)throw result.error;
process.exit(result.status??1);
