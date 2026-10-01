import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
const preview=process.argv.includes('--preview');
const root=resolve(fileURLToPath(new URL('..',import.meta.url)),preview?'dist':'.'),port=Number(process.env.PORT||(preview?4174:4173)),host=process.env.HOST||'127.0.0.1';
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.webmanifest':'application/manifest+json','.json':'application/json'};
const server=http.createServer(async(req,res)=>{try{const path=decodeURIComponent(new URL(req.url,'http://local').pathname);if(path.includes('\0'))throw new Error('Invalid path');const relative=path==='/'?'index.html':path.slice(1);const publicAsset=['icons/','manifest.webmanifest','sw.js'].some(p=>relative.startsWith(p));const base=publicAsset&&!preview?resolve(root,'public'):root;const file=resolve(base,relative);if(!file.startsWith(base+sep)||(!publicAsset&&!relative.startsWith('src/')&&relative!=='index.html')){res.writeHead(404);res.end('Not found');return;}if(!(await stat(file)).isFile())throw new Error('Not a file');res.writeHead(200,{'Content-Type':types[extname(file)]||'application/octet-stream','Cache-Control':'no-cache','X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin'});res.end(await readFile(file));}catch{res.writeHead(404);res.end('Not found');}});
server.listen(port,host,()=>console.log(`a little less → http://${host}:${port}`));
