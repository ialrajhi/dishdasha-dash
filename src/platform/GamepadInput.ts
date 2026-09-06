/** Standard browser/Android controller mapping. Jump/menu actions use edges; duck is a held action that survives scene input resets. */
export class GamepadInput {
  private previous = new Map<number, boolean[]>();
  private navigationAt = 0;
  private navigation = 0;
  private connected = false;
  private ducking = new Set<number>();
  constructor(private hooks: {
    playing: () => boolean;
    ready: () => boolean;
    foreground: () => boolean;
    action: (name: string, value?: string) => void;
  }) {
    requestAnimationFrame(this.poll);
    window.addEventListener('gamepaddisconnected', () => {
      for (const index of this.previous.keys()) { hooks.action('jump-up', `gamepad:${index}`); hooks.action('duck-up', `gamepad:${index}`); }
      this.ducking.clear();
      this.previous.clear();
      if (hooks.playing()) hooks.action('pause');
    });
  }
  private poll = (now: number) => {
    const pads = Array.from(navigator.getGamepads?.() ?? []).filter((p): p is Gamepad => !!p && p.mapping === 'standard');
    this.connected = pads.length > 0;
    document.body.classList.toggle('controller-connected', this.connected);
    for (const pad of pads.slice(0, 1)) {
      const before = this.previous.get(pad.index) ?? [];
      const pressed = pad.buttons.map(b => b.pressed);
      const down = (n: number) => pressed[n] && !before[n];
      if (this.hooks.foreground() && !document.hidden && document.hasFocus()) {
        if (this.hooks.ready() && this.hooks.playing()) {
          if (down(9)) this.hooks.action('pause');
          else if (down(0)) this.hooks.action('jump-down', `gamepad:${pad.index}`);
          if (!pressed[0] && before[0]) this.hooks.action('jump-up', `gamepad:${pad.index}`);
          const duck = pressed[1] || pressed[13] || pad.axes[1] > .6;
          if (duck) { this.ducking.add(pad.index); this.hooks.action('duck-down', `gamepad:${pad.index}`); }
          if (!duck && this.ducking.delete(pad.index)) this.hooks.action('duck-up', `gamepad:${pad.index}`);
        } else {
          if (this.ducking.delete(pad.index)) this.hooks.action('duck-up', `gamepad:${pad.index}`);
          const scope = document.querySelector('.asset-loading') ?? document.querySelector('[role="alertdialog"]') ?? document.querySelector('#ui-layer');
          const items = Array.from(scope?.querySelectorAll<HTMLElement>('button:not(:disabled), input') ?? []).filter(el => el.getClientRects().length);
          const retry = document.querySelector<HTMLElement>('.storage-warning:not([hidden])');
          if (this.hooks.ready() && retry && !document.querySelector('[role="alertdialog"]')) items.push(retry);
          const direction = pressed[13] || pad.axes[1] > .6 ? 1 : pressed[12] || pad.axes[1] < -.6 ? -1 : 0;
          const horizontal = pressed[15] || pad.axes[0] > .6 ? 1 : pressed[14] || pad.axes[0] < -.6 ? -1 : 0;
          const nav = direction || horizontal;
          if (nav && (nav !== this.navigation || now >= this.navigationAt)) {
            const active = document.activeElement as HTMLElement;
            if (horizontal && active instanceof HTMLInputElement && active.type === 'range') {
              active.value = String(Math.max(0, Math.min(100, Number(active.value) + horizontal * 5)));
              active.dispatchEvent(new Event('input', { bubbles: true }));
            } else {
              const index = items.indexOf(active);
              items[(index + nav + items.length) % items.length]?.focus();
            }
            this.navigationAt = now + (nav !== this.navigation ? 350 : 150);
          }
          this.navigation = nav;
          if (down(1) || down(9)) this.hooks.action(document.querySelector('[role="alertdialog"]') ? 'reset-no' : 'back');
          else if (down(0)) {
            const target = document.activeElement as HTMLElement;
            if (items.includes(target) && target.tagName === 'BUTTON') target.click();
            else items[0]?.focus();
          }
        }
      }
      this.previous.set(pad.index, pressed);
    }
    requestAnimationFrame(this.poll);
  };
}
