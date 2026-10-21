import {writeFile,mkdir} from 'node:fs/promises';
import {create,label,toggle,serialize} from '../core.js';
await mkdir(new URL('./fixtures/',import.meta.url),{recursive:true});
let s=create('Exact CRLF\r\n🧠 café e\u0301\r\nsame\nsame\n<img src=x onerror=alert(1)>');s=label(s,1,'action');s=toggle(s,1);
await writeFile(new URL('./fixtures/valid.json',import.meta.url),serialize(s));
await writeFile(new URL('./fixtures/invalid.json',import.meta.url),'{"version":1,"source":"abc","segments":[]}');
