// Dependency-free rendering of the app's own geometric orange mark.
import { deflateSync } from 'node:zlib';
import { writeFile, mkdir } from 'node:fs/promises';
const table=Array.from({length:256},(_,n)=>{for(let k=0;k<8;k++)n=n&1?0xedb88320^(n>>>1):n>>>1;return n>>>0;});
function crc(b){let n=0xffffffff;for(const x of b)n=table[(n^x)&255]^(n>>>8);return(n^0xffffffff)>>>0;}
function chunk(name,data){const type=Buffer.from(name),len=Buffer.alloc(4),sum=Buffer.alloc(4);len.writeUInt32BE(data.length);sum.writeUInt32BE(crc(Buffer.concat([type,data])));return Buffer.concat([len,type,data,sum]);}
function pixel(x,y){let c=[255,218,130];if((x-252)**2+(y-286)**2<127**2)c=[189,66,30];const a=(x-285)*.707+(y-132)*-.707,b=(x-285)*.707+(y-132)*.707;if(a*a/65**2+b*b/28**2<1)c=[72,93,55];if((x-204)**2+(y-226)**2<19**2&&(x-220)**2+(y-240)**2>24**2)c=[255,231,216];return c;}
function png(size){const raw=Buffer.alloc((size*3+1)*size);for(let y=0;y<size;y++){let p=y*(size*3+1);raw[p++]=0;for(let x=0;x<size;x++){const sum=[0,0,0];for(let sy=0;sy<2;sy++)for(let sx=0;sx<2;sx++){const c=pixel((x+(sx+.5)/2)*512/size,(y+(sy+.5)/2)*512/size);for(let k=0;k<3;k++)sum[k]+=c[k];}for(const c of sum)raw[p++]=Math.round(c/4);}}const ihdr=Buffer.alloc(13);ihdr.writeUInt32BE(size);ihdr.writeUInt32BE(size,4);ihdr[8]=8;ihdr[9]=2;return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',ihdr),chunk('IDAT',deflateSync(raw)),chunk('IEND',Buffer.alloc(0))]);}
await mkdir(new URL('../public/icons',import.meta.url),{recursive:true});
for(const [name,size] of [['icon-192.png',192],['icon-512.png',512],['maskable-512.png',512],['apple-touch-icon.png',180]])await writeFile(new URL('../public/icons/'+name,import.meta.url),png(size));
console.log('Created app icons.');
