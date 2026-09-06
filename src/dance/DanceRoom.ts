import { CAST, DANCES, readParty, type Dancer, type Party } from './DanceData';
import { DanceRig } from './DanceRig';
import { DanceMusic, TRACKS } from './DanceMusic';
import { save } from '../systems/SaveManager';
import { bilingual as bi } from '../systems/LocalizationManager';

const art = (kind: string) => `${import.meta.env.BASE_URL}assets/dance/rig-${kind}.webp`;
export function danceMarkup() {
  return `<section class="dance-room" aria-label="Go Dance">
    <header class="dance-header"><button class="back-button" data-action="back" aria-label="Back to menu">←</button><div><h1>GO DANCE <span lang="ar">يلا نرقص</span></h1><p>${bi('حط شخصياتك وخلّ الحفلة تبدأ', 'Your little corner of chaos.')}</p></div><span class="dance-count">0 / 24</span></header>
    <div class="dance-toolbar"><label>${bi('الموسيقى', 'Track')} <select id="dance-track">${TRACKS.map((t, i) => `<option value="${i}">${i + 1}. ${bi(t.ar, t.name)} · ${t.bpm} BPM</option>`).join('')}</select></label><button id="dance-play" aria-pressed="true">Ⅱ ${bi('وقف الحفلة', 'Pause party')}</button><button id="dance-sound" aria-pressed="${save.data.settings.music}">${bi('الموسيقى', 'Music')}: ${save.data.settings.music ? 'On' : 'Off'}</button><button id="dance-calm" aria-pressed="true">${bi('حركة هادية', 'Gentle moves')}: On</button></div>
    <div class="dance-stage"><canvas id="dance-canvas" tabindex="0" aria-label="Dance floor. Select a character, then drag to move. Arrow keys move the selected dancer; Delete removes it."></canvas><div class="dance-empty"><span>✦</span><h2>${bi('الحفلة تنطرك', 'The floor is yours')}</h2><p>${bi('اسحب شخصية من تحت وحطها هني', 'Drag someone up here. Let the silliness begin.')}</p></div><div class="dance-stage-label" lang="ar">ليلة في الفريج</div><div class="dance-status" role="status" aria-live="polite"></div><button id="dance-retry" hidden>${bi('حمّل الشخصيات مرة ثانية', 'Retry character artwork')}</button></div>
    <div class="dance-editor"><strong id="dance-selected">${bi('اختار شخصية', 'Pick a dancer')}</strong><label>${bi('الرقصة', 'Move')} <select id="dance-move" disabled>${DANCES.map(d => `<option value="${d[0]}">${bi(d[2], d[1])}</option>`).join('')}</select></label><button id="dance-flip" disabled>↔ ${bi('اقلب', 'Flip')}</button><button id="dance-copy" disabled>＋ ${bi('نسخة', 'Clone')}</button><button id="dance-remove" disabled>− ${bi('شيل', 'Remove')}</button><button id="dance-clear">${bi('فضّي المكان', 'Clear floor')}</button><button id="dance-undo" disabled>↶ ${bi('تراجع', 'Undo')}</button></div>
    <footer class="dance-cast"><div class="dance-cast-heading"><strong>${bi('الشلة', 'THE GUEST LIST')}</strong><span>${bi('اسحب أو اضغط للإضافة · تنحفظ على جهازك', 'Drag or tap to add · Saved on this device')}</span></div><div class="dance-roster">${CAST.map(c => `<button class="dance-guest" data-guest="${c[0]}" disabled aria-label="Add ${c[1]}"><span class="dance-portrait"></span><span>${bi(c[2], c[1])}</span></button>`).join('')}</div></footer>
  </section>`;
}
export class DanceRoom {
  party: Party = readParty(save.data.party);
  selected?: number;
  playing = true;
  private previous?: Party;
  private root: HTMLElement;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private music = new DanceMusic();
  private images = new Map<string, HTMLImageElement>();
  private rigs = new Map<string, DanceRig>();
  private abort = new AbortController();
  private raf = 0;
  private elapsed = 0;
  private last = 0;
  private drag?: { pointer: number; guest?: string; dancer?: number; x: number; y: number; moved: boolean; startX: number; startY: number; offsetX: number; offsetY: number };
  private destroyed = false;
  private observer: ResizeObserver;
  constructor(root: HTMLElement) {
    this.root = root; this.canvas = root.querySelector('#dance-canvas')!; this.ctx = this.canvas.getContext('2d')!;
    const signal = this.abort.signal;
    root.addEventListener('pointerdown', this.down, { signal });
    root.addEventListener('pointermove', this.move, { signal });
    root.addEventListener('pointerup', this.up, { signal });
    root.addEventListener('pointercancel', this.cancel, { signal });
    this.canvas.addEventListener('keydown', this.key, { signal });
    root.addEventListener('click', this.click, { signal });
    root.addEventListener('change', this.change, { signal });
    document.addEventListener('visibilitychange', this.background, { signal });
    window.addEventListener('blur', this.background, { signal });
    this.observer = new ResizeObserver(() => this.resize()); this.observer.observe(this.canvas);
    (root.querySelector('#dance-track') as HTMLSelectElement).value = String(this.party.track);
    this.refresh(); void this.load(); void this.music.start(this.party.track);
    this.raf = requestAnimationFrame(this.frame);
  }
  private async load() {
    this.status(bi('نجهز الشلة…', 'Getting the guests ready…'));
    const results = await Promise.allSettled(CAST.map(async c => {
      if (this.images.has(c[0])) return;
      const img = new Image(); img.src = art(c[0]); await img.decode();
      if (!this.destroyed) { this.images.set(c[0], img);
        const rig = new DanceRig(img); this.rigs.set(c[0], rig);
        const portrait = document.createElement('canvas'); portrait.width = 192; portrait.height = 192;
        const pc = portrait.getContext('2d')!; pc.translate(96,184); pc.scale(165,165); rig.draw(pc,c[0],'sway',0,true,true);
        const el = this.root.querySelector(`[data-guest="${c[0]}"] .dance-portrait`) as HTMLElement;
        el.style.backgroundImage = `url('${portrait.toDataURL()}')`;
        (this.root.querySelector(`[data-guest="${c[0]}"]`) as HTMLButtonElement).disabled = false; }
    }));
    if (this.destroyed) return;
    const failed = results.some(r => r.status === 'rejected');
    (this.root.querySelector('#dance-retry') as HTMLButtonElement).hidden = !failed;
    this.status(failed ? bi('بعض الشخصيات ما تحمّلت. جرب مرة ثانية.', 'Some guests could not load. Retry to bring everyone in.') : '');
  }
  private status(text: string) { this.root.querySelector('.dance-status')!.textContent = text; }
  private resize() {
    const rect = this.canvas.getBoundingClientRect();
    const ratio = Math.min(devicePixelRatio || 1, 2);
    this.canvas.width = Math.max(1, Math.round(rect.width * ratio)); this.canvas.height = Math.max(1, Math.round(rect.height * ratio));
  }
  private point(e: PointerEvent) {
    const r = this.canvas.getBoundingClientRect();
    return { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height };
  }
  private inside(e: PointerEvent) { const p = this.point(e); return p.x >= 0 && p.x <= 1 && p.y >= 0 && p.y <= 1; }
  private down = (e: PointerEvent) => {
    if (e.button !== 0 || this.drag) return;
    const guest = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-guest]');
    if (guest && !guest.disabled) {
      e.preventDefault(); this.drag = { pointer: e.pointerId, guest: guest.dataset.guest, x: e.clientX, y: e.clientY, moved: false, startX: e.clientX, startY: e.clientY, offsetX: 0, offsetY: 0 };
      this.root.setPointerCapture(e.pointerId); guest.classList.add('dragging'); return;
    }
    if (e.target !== this.canvas) return;
    e.preventDefault(); this.canvas.focus(); const p = this.point(e);
    const size = this.size(); const w = this.canvas.width, h = this.canvas.height;
    const found = [...this.party.dancers].sort((a, b) => b.y - a.y || b.id - a.id).find(d => Math.abs(p.x - d.x) < size / w * .42 && p.y >= d.y - size / h * .95 && p.y <= d.y + .025);
    this.selected = found?.id; this.refresh();
    if (found) { this.remember(); this.drag = { pointer: e.pointerId, dancer: found.id, x: e.clientX, y: e.clientY, moved: false, startX: e.clientX, startY: e.clientY, offsetX: p.x - found.x, offsetY: p.y - found.y }; this.root.setPointerCapture(e.pointerId); }
  };
  private move = (e: PointerEvent) => {
    if (!this.drag || this.drag.pointer !== e.pointerId) return;
    if (Math.hypot(e.clientX - this.drag.startX, e.clientY - this.drag.startY) > 5) this.drag.moved = true;
    if (this.drag.dancer) { const d = this.party.dancers.find(d => d.id === this.drag!.dancer)!; const p = this.point(e); this.position(d, p.x - this.drag.offsetX, p.y - this.drag.offsetY); }
    this.drag.x = e.clientX; this.drag.y = e.clientY;
  };
  private up = (e: PointerEvent) => {
    if (!this.drag || this.drag.pointer !== e.pointerId) return;
    const d = this.drag;
    if (d.guest && (this.inside(e) || !d.moved)) {
      if (this.inside(e)) { const p = this.point(e); this.add(d.guest, p.x, p.y); }
      else this.add(d.guest);
    } else if (d.dancer) this.persist();
    this.cancel();
  };
  private cancel = () => {
    if (this.drag && this.root.hasPointerCapture(this.drag.pointer)) this.root.releasePointerCapture(this.drag.pointer);
    this.drag = undefined; this.root.querySelector('.dragging')?.classList.remove('dragging');
  };
  private position(d: Dancer, x: number, y: number) { d.x = Math.max(.07, Math.min(.93, x)); d.y = Math.max(.3, Math.min(.94, y)); }
  private remember() { this.previous = structuredClone(this.party); }
  add(kind: string, x?: number, y?: number) {
    if (x === undefined || y === undefined) {
      const slots = Array.from({ length: 24 }, (_, i) => ({ x: .13 + (i % 6) * .145, y: .45 + Math.floor(i / 6) * .155 }));
      const slot = slots.find(p => this.party.dancers.every(d => Math.hypot(p.x - d.x, p.y - d.y) > .11)) ?? slots[this.party.dancers.length % 24];
      x = slot.x; y = slot.y;
    }
    if (!this.images.has(kind)) return;
    if (this.party.dancers.length >= 24) { this.status(bi('المكان فل! شيل شخصية عشان تضيف غيرها.', 'Full house! Remove a dancer to invite someone else.')); return; }
    this.remember(); const id = Math.max(0, ...this.party.dancers.map(d => d.id)) + 1;
    const dancer = { id, kind, x, y, dance: DANCES[this.party.dancers.length % DANCES.length][0], flip: false };
    this.position(dancer, x, y); this.party.dancers.push(dancer); this.selected = id; this.persist(); this.status('');
  }
  private click = (e: MouseEvent) => {
    const button = (e.target as HTMLElement).closest<HTMLButtonElement>('button'); if (!button || button.disabled) return;
    // Keyboard activation also adds guests; pointer activation is handled on drop.
    if (button.dataset.guest && e.detail === 0) { this.add(button.dataset.guest); return; }
    const d = this.party.dancers.find(d => d.id === this.selected);
    switch (button.id) {
      case 'dance-play': this.playing = !this.playing; this.syncSound(); this.refresh(); break;
      case 'dance-sound': save.settings({ music: !save.data.settings.music }); this.syncSound(); this.refresh(); break;
      case 'dance-calm': this.remember(); this.party.calm = !this.party.calm; this.persist(); break;
      case 'dance-flip': if (d) { this.remember(); d.flip = !d.flip; this.persist(); } break;
      case 'dance-copy': if (d) { this.add(d.kind, d.x + .08, d.y + .03); const copy = this.party.dancers.find(c => c.id === this.selected); if (copy && copy.id !== d.id) { copy.dance = d.dance; copy.flip = d.flip; this.persist(); } } break;
      case 'dance-remove': this.remove(); break;
      case 'dance-clear': if (this.party.dancers.length) { this.remember(); this.party.dancers = []; this.selected = undefined; this.persist(); } break;
      case 'dance-undo': if (this.previous) { const current = structuredClone(this.party); this.party = this.previous; this.previous = current; this.selected = undefined; this.persist(); this.syncSound(); } break;
      case 'dance-retry': void this.load(); break;
    }
  };
  private change = (e: Event) => {
    const el = e.target as HTMLSelectElement;
    if (el.id === 'dance-track') { this.remember(); this.party.track = Number(el.value); this.elapsed = 0; this.persist(); this.syncSound(); }
    if (el.id === 'dance-move') { const d = this.party.dancers.find(d => d.id === this.selected); if (d) { this.remember(); d.dance = el.value; this.persist(); } }
  };
  private key = (e: KeyboardEvent) => {
    const d = this.party.dancers.find(d => d.id === this.selected); if (!d) return;
    if (e.key.startsWith('Arrow')) { e.preventDefault(); e.stopPropagation(); this.remember(); this.position(d, d.x + (e.key === 'ArrowRight' ? .02 : e.key === 'ArrowLeft' ? -.02 : 0), d.y + (e.key === 'ArrowDown' ? .025 : e.key === 'ArrowUp' ? -.025 : 0)); this.persist(); }
    if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); this.remove(); }
  };
  private remove() { if (!this.selected) return; this.remember(); this.party.dancers = this.party.dancers.filter(d => d.id !== this.selected); this.selected = undefined; this.persist(); }
  private persist() { save.data.party = structuredClone(this.party); save.persist(); this.refresh(); }
  private refresh() {
    const d = this.party.dancers.find(d => d.id === this.selected), c = CAST.find(c => c[0] === d?.kind);
    this.root.querySelector('.dance-count')!.textContent = `${this.party.dancers.length} / 24`;
    (this.root.querySelector('.dance-empty') as HTMLElement).hidden = this.party.dancers.length > 0;
    this.root.querySelector('#dance-selected')!.textContent = c ? bi(c[2], c[1]) : bi('اختار شخصية', 'Pick a dancer');
    for (const id of ['dance-move', 'dance-flip', 'dance-copy', 'dance-remove']) (this.root.querySelector(`#${id}`) as HTMLButtonElement).disabled = !d;
    if (d) (this.root.querySelector('#dance-move') as HTMLSelectElement).value = d.dance;
    (this.root.querySelector('#dance-track') as HTMLSelectElement).value = String(this.party.track);
    (this.root.querySelector('#dance-undo') as HTMLButtonElement).disabled = !this.previous;
    for (const [id, active, label] of [['dance-play', this.playing, this.playing ? bi('Ⅱ وقف الحفلة', 'Ⅱ Pause party') : bi('▶ كمل الحفلة', '▶ Resume party')], ['dance-calm', this.party.calm, `${bi('حركة هادية', 'Gentle moves')}: ${this.party.calm ? 'On' : 'Off'}`], ['dance-sound', save.data.settings.music, `${bi('الموسيقى', 'Music')}: ${save.data.settings.music ? 'On' : 'Off'}`]] as const) {
      const el = this.root.querySelector(`#${id}`)!; el.textContent = label; el.setAttribute('aria-pressed', String(active));
    }
  }
  syncSound() { if (this.playing && !document.hidden) void this.music.start(this.party.track); else this.music.stop(); this.refresh(); }
  suspend() { this.background(); }
  private background = () => { this.playing = false; this.cancel(); this.music.stop(); this.refresh(); };
  private size() { return Math.min(this.canvas.width * .14, this.canvas.height * .48); }
  private frame = (time: number) => {
    if (this.destroyed) return;
    if (this.playing && !document.hidden) this.elapsed += Math.min(50, this.last ? time - this.last : 0);
    this.last = time; this.draw(); this.raf = requestAnimationFrame(this.frame);
  };
  private draw() {
    const c = this.ctx, w = this.canvas.width, h = this.canvas.height; c.clearRect(0, 0, w, h); c.imageSmoothingEnabled = true;
    const beat = this.elapsed / (60000 / TRACKS[this.party.track].bpm), size = this.size();
    for (const d of [...this.party.dancers].sort((a, b) => a.y - b.y || a.id - b.id)) {
      const img = this.images.get(d.kind); if (!img) continue;
      const phase = beat + d.id * .17, gentle = this.party.calm || save.data.settings.reducedMotion;
      const moving = this.drag?.dancer === d.id;
      const x = d.x * w, y = d.y * h;
      c.save(); c.fillStyle = '#07171970'; c.beginPath(); c.ellipse(x, y, size * .22, size * .04, 0, 0, Math.PI * 2); c.fill();
      if (this.selected === d.id) { c.strokeStyle = '#ffd478'; c.lineWidth = Math.max(2, w / 500); c.beginPath(); c.ellipse(x, y, size * .3, size * .055, 0, 0, Math.PI * 2); c.stroke(); }
      c.translate(x,y); c.scale((d.flip ? -1 : 1) * size,size);
      this.rigs.get(d.kind)?.draw(c,d.kind,d.dance,phase,gentle,moving); c.restore();
    }
    if (this.drag?.guest) {
      const img = this.images.get(this.drag.guest), rect = this.canvas.getBoundingClientRect();
      if (img) { c.save(); c.globalAlpha = .65; c.translate((this.drag.x-rect.left)/rect.width*w,(this.drag.y-rect.top)/rect.height*h); c.scale(size,size); this.rigs.get(this.drag.guest)?.draw(c,this.drag.guest,'sway',0,true,true); c.restore(); }
    }
  }
  destroy() { this.destroyed = true; this.cancel(); cancelAnimationFrame(this.raf); this.abort.abort(); this.observer.disconnect(); this.music.destroy(); }
}
