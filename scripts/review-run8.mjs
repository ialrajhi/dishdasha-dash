import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {chromium} from '@playwright/test';
import {execFileSync} from 'node:child_process';

await mkdir('art/review',{recursive:true});
const sheet=(await readFile('public/assets/arcade/hero-run8-sheet.webp')).toString('base64');
const poses=['Left contact','Left compression','Passing','Right reach','Right contact','Right compression','Passing','Left reach'];
const html=`<!doctype html><html lang="en"><meta charset="utf-8"><title>Dishdasha Dash — run pose review</title>
<style>body{margin:0;background:#162b37;color:#f8edda;font:16px system-ui;text-align:center}canvas{max-width:100%;height:auto;display:block;margin:auto}label,button{margin:12px}button{padding:8px 16px}input{vertical-align:middle}p{color:#a6c1c6}</style>
<canvas width="960" height="480"></canvas><label>Playback <input id="fps" type="range" min="8" max="14" value="12"> <output>12 FPS</output></label><button id="pause">Pause / play</button><button id="next">Next pose</button><p>Static ground and camera. One sprite scale per preview. No scrolling, stretching or extra body transform.</p>
<script>
const sheet=new Image();sheet.src='data:image/webp;base64,${sheet}';
const canvas=document.querySelector('canvas'),c=canvas.getContext('2d'),names=${JSON.stringify(poses)};
let frame=0,fps=12,playing=true,last=0,elapsed=0;
function draw(){
 c.fillStyle='#162b37';c.fillRect(0,0,960,480);c.textAlign='center';c.fillStyle='#f8edda';c.font='bold 27px system-ui';c.fillText('Eight distinct running poses',480,50);
 c.fillStyle='#9fbdc2';c.font='16px system-ui';c.fillText('Enlarged pose check',310,90);c.fillText('Game-world size',744,90);
 c.strokeStyle='#83a99d';c.lineWidth=1;c.beginPath();c.moveTo(60,331);c.lineTo(900,331);c.stroke();
 for(const [x,scale] of [[310,.78],[744,.26]]){
   c.fillStyle='#0b1e2a';c.beginPath();c.ellipse(x,332,50*scale,9*scale,0,0,Math.PI*2);c.fill();
   c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';
   c.drawImage(sheet,frame%4*384,Math.floor(frame/4)*320,384,320,x-192*scale,331-318*scale,384*scale,320*scale);
 }
 c.fillStyle='#ffd277';c.font='bold 22px system-ui';c.fillText((frame+1)+' / 8 · '+names[frame],480,390);
 c.fillStyle='#9fbdc2';c.font='16px system-ui';c.fillText('Alternating legs · opposite arms · planted stance foot',480,430);
}
window.reviewFrame=(value)=>{playing=false;frame=value%8;draw()};
document.querySelector('#fps').oninput=e=>{fps=Number(e.target.value);document.querySelector('output').value=fps+' FPS'};
document.querySelector('#pause').onclick=()=>playing=!playing;
document.querySelector('#next').onclick=()=>{playing=false;frame=(frame+1)%8;draw()};
sheet.onload=()=>{window.artReady=true;requestAnimationFrame(function tick(t){if(last&&playing){elapsed+=t-last;while(elapsed>=1000/fps){elapsed-=1000/fps;frame=(frame+1)%8}}last=t;draw();requestAnimationFrame(tick)})};
</script>`;
await writeFile('art/review/run8-review.html',html);
const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
try {
 const page=await browser.newPage({viewport:{width:960,height:560},deviceScaleFactor:1});
 await page.setContent(html);await page.waitForFunction(()=>window.artReady);
 // A real-time clip of the stationary-ground review; frames are not interpolated or warped.
 const recording=await page.evaluate(async()=>{
   const canvas=document.querySelector('canvas'),chunks=[];
   const rec=new MediaRecorder(canvas.captureStream(60),{mimeType:'video/webm;codecs=vp9',videoBitsPerSecond:3000000});
   rec.ondataavailable=e=>chunks.push(e.data);const finished=new Promise(r=>rec.onstop=r);
   rec.start();await new Promise(r=>setTimeout(r,4000));rec.stop();await finished;
   const bytes=new Uint8Array(await new Blob(chunks).arrayBuffer());let binary='';for(const b of bytes)binary+=String.fromCharCode(b);
   return btoa(binary);
 });
 await writeFile('art/review/hero-run8-in-place.webm',Buffer.from(recording,'base64'));
 execFileSync(process.env.FFMPEG_PATH||'ffmpeg',['-hide_banner','-loglevel','error','-i','art/review/hero-run8-in-place.webm',
   '-c:v','libx264','-pix_fmt','yuv420p','-movflags','+faststart','-y','art/review/hero-run8-in-place.mp4']);
 for(let i=0;i<8;i++) {
   await page.evaluate(i=>window.reviewFrame(i),i);
   await page.locator('canvas').screenshot({path:'art/review/pose-'+(i+1)+'.png'});
 }
 console.log('Prepared stationary-ground review, four-second clip and eight rendered pose checks.');
} finally {await browser.close()}
