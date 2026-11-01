import type Phaser from "phaser";
import { DanceRoom, danceMarkup } from "../dance/DanceRoom";
import { icon } from "./icons";
import { save } from "../systems/SaveManager";
import { audio } from "../systems/AudioManager";
import { t, worldT, bilingual, type CopyKey } from "../systems/LocalizationManager";
import { DEV } from "../config/Constants";
import { desktop } from "../platform/Platform";
import { LEVELS, FINAL_LEVEL, type LevelConfig } from "../levels/levels";
import { campaign, type LevelResult } from "../systems/ScoreManager";
import { AVATARS, UPGRADES, avatarById, powerSeconds } from "../systems/Economy";
import { avatarPreview } from "../utils/AvatarArt";
import { iconURL } from "../utils/FxArt";
import type { PickupKind } from "../entities/Collectible";
import type { Snapshot } from "../scenes/GameScene";
export type Screen =
  | "title"
  | "dance"
  | "menu"
  | "levels"
  | "shop"
  | "options"
  | "about"
  | "licenses"
  | "how"
  | "high"
  | "playing"
  | "pause"
  | "over"
  | "complete"
  | "victory";
const VERSION = "2.0.0";
const number = (n: number) => n.toLocaleString("en-US");
const ar = () => save.data.settings.language === "ar";
const name = (item: { ar: string; en: string }) => (ar() ? item.ar : item.en);
const coin = `<i class="coin-icon" aria-hidden="true"></i>`;
const stars = (count: number, max = 3) =>
  `<span class="stars" aria-label="${count} / ${max}">${Array.from({ length: max }, (_, i) => `<i class="${i < count ? "on" : ""}">${icon("starFill")}</i>`).join("")}</span>`;
const button = (key: CopyKey | string, action: string, ico = "arrow", kind = "") =>
  `<button class="btn ${kind}" data-action="${action}">${icon(ico)}<span>${key in COPY_KEYS ? t(key as CopyKey) : key}</span></button>`;
const COPY_KEYS: Record<string, true> = Object.fromEntries(
  ["start", "select", "options", "how", "high", "back", "resume", "restart", "menu", "next", "replay", "retry", "playAgain"].map((k) => [k, true]),
);
const logo = (size = "") =>
  `<h1 class="logo ${size}"><span class="logo-ar" lang="ar">دشداشة</span><span class="logo-en">DASH<i>✦</i></span></h1>`;

export class GameUI {
  dance?: DanceRoom;
  screen: Screen = "title";
  previous: Screen = "menu";
  onScreen?: (screen: Screen) => void;
  shopTab: "avatars" | "upgrades" = "avatars";
  shopPick = save.data.avatar;
  private layer: HTMLElement;
  private flyLayer: HTMLElement;
  private noticeEl: HTMLElement;
  private noticeTimer?: number;
  private result?: LevelResult;
  private lastState?: Snapshot;
  private deaths = 0;
  private shownScore = 0;
  private scoreFrame = 0;
  private lastHearts = 3;
  private textures?: Phaser.Textures.TextureManager;
  private previews = new Map<string, string>();
  private previewTimer?: number;
  private timers: number[] = [];
  private hoverAt = 0;
  private storageNotice = document.createElement("button");
  private recoveryPanel?: HTMLElement;
  constructor(private action: (action: string, value?: string) => void) {
    document.querySelector("#app")!.innerHTML = `<div class="stage"><div class="backdrop" aria-hidden="true"></div><section class="frame" aria-label="دشداشة Dash"><div id="phaser-game"></div><div class="vignette" aria-hidden="true"></div><div id="hit-flash" aria-hidden="true"></div><div id="ui-layer" inert></div><div id="fly-layer" aria-hidden="true"></div><div id="game-notice" role="status" aria-live="polite"></div><div class="boot" role="status">${logo("boot-logo")}<div class="boot-glass" aria-hidden="true"><i id="asset-progress"></i></div><strong>Brewing the tea…</strong><small lang="ar">نجهز الچاي…</small><span id="loading-percent">0%</span></div><div class="portrait-message"><span class="rotate-icon">⟳</span><strong>Rotate your device</strong><small>دوّر جهازك للعرض الأفقي</small><button data-action="portrait">${t("continuePortrait")}</button></div></section></div>`;
    this.layer = document.querySelector("#ui-layer")!;
    this.flyLayer = document.querySelector("#fly-layer")!;
    this.noticeEl = document.querySelector("#game-notice")!;
    if (matchMedia("(pointer: coarse)").matches || "ontouchstart" in window) document.documentElement.classList.add("touch");
    this.storageNotice.className = "storage-warning";
    this.storageNotice.dataset.action = "retry-save";
    this.storageNotice.setAttribute("role", "status");
    document.querySelector(".frame")!.append(this.storageNotice);
    window.addEventListener("save-status", () => this.storageStatus());
    this.storageStatus();
    document.addEventListener("click", (e) => {
      const b = (e.target as HTMLElement).closest<HTMLElement>("[data-action]");
      if (!b || b.hasAttribute("disabled")) return;
      e.preventDefault();
      this.action(b.dataset.action!, b.dataset.value);
    });
    document.addEventListener("pointerover", (e) => {
      if ((e as PointerEvent).pointerType !== "mouse") return;
      const b = (e.target as HTMLElement).closest("button");
      if (!b || b.disabled || b === (e.relatedTarget as HTMLElement)?.closest?.("button")) return;
      if (performance.now() - this.hoverAt > 60) { this.hoverAt = performance.now(); audio.play("hover"); }
    });
    document.addEventListener("input", (e) => {
      const el = e.target as HTMLInputElement;
      if (el.id === "volume") this.action("volume", el.value);
    });
    document.addEventListener("keydown", (e) => {
      if (this.recoveryPanel) {
        if (e.code === "Tab") {
          e.preventDefault();
          const buttons = Array.from(this.recoveryPanel.querySelectorAll<HTMLButtonElement>("button"));
          const i = buttons.indexOf(document.activeElement as HTMLButtonElement);
          buttons[(i + (e.shiftKey ? buttons.length - 1 : 1)) % buttons.length]?.focus();
        }
        return;
      }
      if (this.screen === "playing") return;
      if (this.screen === "title" && !e.repeat && !["Tab", "ShiftLeft", "ShiftRight", "MetaLeft", "AltLeft", "ControlLeft"].includes(e.code)) {
        e.preventDefault();
        this.action("title-start");
        return;
      }
      if (e.code === "Escape" && !e.repeat) {
        e.preventDefault();
        this.action("back");
        return;
      }
      if (!["ArrowDown", "ArrowUp", "ArrowLeft", "ArrowRight"].includes(e.code)) return;
      if (["INPUT", "SELECT", "CANVAS"].includes((e.target as HTMLElement)?.tagName)) return;
      e.preventDefault();
      const buttons = Array.from(this.layer.querySelectorAll<HTMLButtonElement>("button:not(:disabled)"));
      const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
      const direction = ["ArrowDown", "ArrowRight"].includes(e.code) ? 1 : -1;
      buttons[(index + direction + buttons.length) % buttons.length]?.focus();
    });
    this.chrome();
  }
  // ——— boot, recovery and chrome ———
  loading(progress: number) {
    const bar = document.querySelector<HTMLElement>("#asset-progress");
    if (bar) bar.style.height = `${progress * 100}%`;
    const label = document.querySelector("#loading-percent");
    if (label) label.textContent = `${Math.round(progress * 100)}%`;
  }
  private storageStatus() {
    this.storageNotice.hidden = save.storageAvailable;
    this.storageNotice.textContent = bilingual("ما قدرنا نحفظ تقدمك · حاول مرة ثانية", "Couldn’t save on this device · Retry");
    for (const el of document.querySelectorAll("[data-save-status]")) el.textContent = save.storageAvailable ? t("saved") : bilingual("التقدم غير محفوظ", "Progress is not saved");
  }
  loaded() {
    this.layer.removeAttribute("inert");
    const boot = document.querySelector<HTMLElement>(".boot");
    boot?.classList.add("done");
    window.setTimeout(() => boot?.remove(), 600);
    this.show(this.screen);
  }
  loadingError() {
    const panel = document.querySelector(".boot");
    if (panel)
      panel.innerHTML = `${logo("boot-logo")}<strong>Could not load the game</strong><small>Please try again. Your saved progress is safe.</small><button class="btn primary" data-action="reload">Retry</button>`;
    panel?.querySelector<HTMLButtonElement>("button")?.focus();
  }
  graphicsRecovery(ready: boolean, canContinue: boolean) {
    if (!this.recoveryPanel) {
      this.recoveryPanel = document.createElement("div");
      this.recoveryPanel.className = "graphics-recovery";
      this.recoveryPanel.setAttribute("role", "alertdialog");
      this.recoveryPanel.setAttribute("aria-modal", "true");
      this.recoveryPanel.setAttribute("aria-labelledby", "recovery-title");
      document.querySelector(".frame")!.append(this.recoveryPanel);
    }
    this.layer.inert = true;
    this.recoveryPanel.innerHTML = `<div class="card"><h2 id="recovery-title">${bilingual(ready ? "رجعت الصورة" : "توقفت الصورة لحظة", ready ? "Picture restored" : "A little interruption")}</h2><p>${bilingual(canContinue ? "وقفنا اللعبة بأمان. تقدمك ما تغير." : "أعد تحميل اللعبة للمتابعة. تقدمك المحفوظ موجود.", canContinue ? "Your game is safely paused. Nothing moves while the picture recovers." : "Reload to continue. Your saved progress is safe.")}</p><div class="card-actions">${ready && canContinue ? `<button class="btn primary" data-action="graphics-continue">${bilingual("متابعة", "Continue")}</button>` : ""}<button class="btn" data-action="reload">${bilingual("إعادة التحميل", "Reload · return to menu")}</button></div></div>`;
    this.recoveryPanel.querySelector<HTMLButtonElement>("button")?.focus();
  }
  clearGraphicsRecovery() {
    this.recoveryPanel?.remove();
    this.recoveryPanel = undefined;
    this.layer.inert = false;
    this.layer.querySelector<HTMLButtonElement>(".primary, .back-button")?.focus();
  }
  chrome() {
    document.documentElement.lang = ar() ? "ar" : "en";
    document.documentElement.dir = ar() ? "rtl" : "ltr";
    for (const el of document.querySelectorAll('[data-action="mute"]'))
      el.innerHTML = icon(save.data.settings.sfx || save.data.settings.music ? "sound" : "mute");
  }
  artwork(textures: Phaser.Textures.TextureManager) {
    this.textures = textures;
    const root = document.documentElement.style;
    for (const level of LEVELS)
      root.setProperty(`--level-art-${level.id}`, `url("${(textures.get(`scenery-${level.night ? "night-" : ""}${level.art}`).getSourceImage() as HTMLCanvasElement).toDataURL("image/webp", 0.8)}")`);
    const art = (key: string) => (textures.get(key).getSourceImage() as HTMLCanvasElement).toDataURL();
    root.setProperty("--tea-art", `url("${art("arcade-tea")}")`);
    root.setProperty("--golden-art", `url("${art("arcade-golden")}")`);
    root.setProperty("--coin-art", `url("${iconURL("coin")}")`);
    root.setProperty("--magnet-art", `url("${iconURL("magnet")}")`);
    root.setProperty("--shield-art", `url("${iconURL("shield")}")`);
    this.portrait();
  }
  /** Refreshes the equipped avatar's HUD portrait. */
  portrait() {
    if (!this.textures) return;
    document.documentElement.style.setProperty("--hero-portrait", `url("${avatarPreview(this.textures, save.data.avatar, "idle", true)}")`);
  }
  private preview(id: string, pose = "idle") {
    const key = `${id}:${pose}`;
    if (!this.previews.has(key) && this.textures) this.previews.set(key, avatarPreview(this.textures, id, pose));
    return this.previews.get(key) ?? "";
  }
  private clearTimers() {
    this.timers.forEach((id) => window.clearTimeout(id));
    this.timers = [];
    window.clearInterval(this.previewTimer);
    window.cancelAnimationFrame(this.scoreFrame);
  }
  private later(ms: number, fn: () => void) {
    this.timers.push(window.setTimeout(fn, ms));
  }

  /** Stage title card and iris reveal when a level begins. */
  stageIntro(level: LevelConfig) {
    const frame = document.querySelector(".frame")!;
    frame.querySelector(".iris")?.remove();
    frame.querySelector(".stage-intro")?.remove();
    if (save.data.settings.reducedMotion) return;
    const iris = document.createElement("div");
    iris.className = "iris";
    frame.append(iris);
    iris.addEventListener("animationend", () => iris.remove());
    const card = document.createElement("div");
    card.className = `stage-intro ${level.night ? "night" : ""}`;
    card.setAttribute("aria-hidden", "true");
    card.innerHTML = `<small>${level.night ? "☾" : "☀"} ${bilingual(`المرحلة ${level.id}`, `STAGE ${level.id}`)} · ${level.night ? bilingual("ليالي الكويت", "KUWAIT NIGHTS") : bilingual("النهار", "DAYTIME")}</small><strong lang="ar">${level.ar}</strong><span>${level.en}</span>`;
    frame.append(card);
    card.addEventListener("animationend", (e) => { if (e.animationName === "intro-out") card.remove(); });
  }
  show(screen: Screen, data?: { result?: LevelResult; state?: Snapshot; deaths?: number }) {
    this.dance?.destroy();
    this.dance = undefined;
    this.clearTimers();
    const focused = screen === this.screen ? (document.activeElement as HTMLElement)?.dataset.action : undefined;
    const focusedValue = screen === this.screen ? (document.activeElement as HTMLElement)?.dataset.value : undefined;
    if (screen !== this.screen) this.previous = this.screen;
    this.screen = screen;
    if (data?.result) this.result = data.result;
    if (data?.state) this.lastState = data.state;
    if (data?.deaths !== undefined) this.deaths = data.deaths;
    this.chrome();
    this.noticeEl.classList.remove("visible");
    this.layer.className = `view-${screen}`;
    delete this.layer.dataset.practice;
    this.layer.dir = screen === "playing" ? "ltr" : ar() ? "rtl" : "ltr";
    const render: Record<Screen, () => string> = {
      title: () => this.title(),
      dance: () => danceMarkup(),
      menu: () => this.menu(),
      levels: () => this.levels(),
      shop: () => this.shop(),
      options: () => this.options(),
      about: () => this.about(),
      licenses: () => this.panel(bilingual("التراخيص", "Licenses"), "DISHDASHA DASH", `<pre id="license-copy">Loading…</pre>`, "narrow"),
      how: () => this.how(),
      high: () => this.high(),
      playing: () => this.playing(),
      pause: () => this.pause(),
      over: () => this.over(),
      complete: () => this.complete(),
      victory: () => this.victory(),
    };
    this.layer.innerHTML = render[screen]();
    if (screen === "dance") this.dance = new DanceRoom(this.layer);
    if (screen === "licenses") {
      void fetch(`${import.meta.env.BASE_URL}third-party-licenses.txt`)
        .then((response) => { if (!response.ok) throw Error(); return response.text(); })
        .then((text) => this.licenseText(text), () => this.licenseText("Could not load the licenses. Please go back and try again."));
    }
    if (screen === "shop") this.animateShopPreview();
    if (screen === "complete" || screen === "victory") this.celebrate();
    this.storageStatus();
    if (screen === "playing") {
      this.shownScore = this.lastState?.score ?? 0;
      this.lastHearts = this.lastState?.hearts ?? 3;
      this.bindTouch();
      if (this.lastState) this.hud(this.lastState);
    } else {
      const selector = focused && /^[a-zA-Z-]+$/.test(focused)
        ? `[data-action="${focused}"]${focusedValue && /^[a-z0-9]+$/.test(focusedValue) ? `[data-value="${focusedValue}"]` : ""}`
        : ".primary, .back-button";
      // Focus at once so a controller or keyboard press right after a screen change lands on it.
      this.layer.querySelector<HTMLButtonElement>(selector)?.focus({ preventScroll: true });
      window.setTimeout(() => {
        if (!this.layer.contains(document.activeElement)) this.layer.querySelector<HTMLButtonElement>(selector)?.focus({ preventScroll: true });
      }, 60);
    }
    this.onScreen?.(screen);
  }
  // ——— shared pieces ———
  private wallet() {
    const total = Object.values(save.data.stars).reduce((a, b) => a + b, 0);
    return `<div class="wallet"><span class="pill star-pill">${icon("starFill")}<b>${total}</b><small>/${FINAL_LEVEL * 3}</small></span><span class="pill coin-pill" id="wallet-coins">${coin}<b>${number(save.data.coins)}</b></span></div>`;
  }
  private systemButtons() {
    return `<div class="system-buttons"><button class="icon-btn" data-action="language" aria-label="${bilingual("English", "العربية")}">${icon("globe")}<span>${ar() ? "EN" : "ع"}</span></button><button class="icon-btn" data-action="mute" aria-label="Toggle audio">${icon(save.data.settings.sfx || save.data.settings.music ? "sound" : "mute")}</button><button class="icon-btn" data-action="fullscreen" aria-label="${t("screen")}">${icon("fullscreen")}</button></div>`;
  }
  private topbar(title: string, subtitle = "") {
    return `<header class="topbar"><button class="back-button" data-action="back" aria-label="${t("back")}">${icon("back")}</button><div class="topbar-title"><h2>${title}</h2>${subtitle ? `<p>${subtitle}</p>` : ""}</div>${this.wallet()}</header>`;
  }
  private panel(title: string, subtitle: string, body: string, size = "") {
    return `<div class="overlay"><div class="card ${size}"><header class="card-head"><button class="back-button" data-action="back" aria-label="${t("back")}">${icon("back")}</button><div><h2>${title}</h2><p>${subtitle}</p></div></header><div class="card-body">${body}</div></div></div>`;
  }
  // ——— screens ———
  private title() {
    return `<div class="title-screen"><button class="title-hit primary" data-action="title-start" aria-label="${bilingual("ابدأ", "Start")}"></button>${logo("xl")}<p class="title-tag">${bilingual("مغامرة كويتية على السريع", "A little Kuwaiti adventure")}</p><div class="press-start"><span>${document.documentElement.classList.contains("touch") ? bilingual("المس للبدء", "Tap to start") : bilingual("اضغط أي زر", "Press any key")}</span></div><div class="title-foot"><span class="kuwait-flag"></span><span>صنع بحب، ونص استكانة چاي</span><span class="version">v${VERSION}</span></div></div>`;
  }
  private menu() {
    const avatar = avatarById(save.data.avatar);
    return `<div class="menu-screen"><header class="menu-top">${this.wallet()}${this.systemButtons()}</header><div class="menu-main">${logo()}<p class="menu-tag">${t("travel")}</p><button class="btn btn-play primary" data-action="start">${icon("play")}<span>${bilingual("العب", "Play")}</span></button><div class="menu-grid"><button class="btn btn-tile" data-action="levels">${icon("map")}<span>${bilingual("المراحل", "Levels")}</span></button><button class="btn btn-tile shop-tile" data-action="shop">${icon("shop")}<span>${bilingual("المتجر", "Shop")}</span>${this.affordable() ? `<b class="dot" aria-label="${bilingual("فيه شي تقدر تشتريه", "Something affordable")}"></b>` : ""}</button></div><button class="btn btn-dance" data-action="dance">${icon("music")}<span><strong>Go Dance</strong><small>${bilingual("سو حفلتك", "Make your own party")}</small></span></button></div><nav class="menu-dock"><button class="dock-btn" data-action="options">${icon("settings")}<span>${t("options")}</span></button><button class="dock-btn" data-action="high">${icon("trophy")}<span>${bilingual("السجل", "Records")}</span></button><button class="dock-btn" data-action="how">${icon("help")}<span>${bilingual("الطريقة", "How to")}</span></button></nav><button class="avatar-plate" data-action="shop"><span>${bilingual("شخصيتك", "Your runner")}</span><strong>${name(avatar)}</strong><small>${icon("shirt")} ${bilingual("غيّر", "Change")}</small></button></div>`;
  }
  private affordable() {
    return AVATARS.some((a) => !save.data.owned.includes(a.id) && a.price <= save.data.coins) ||
      UPGRADES.some((u) => save.data.upgrades[u.id] < 4 && u.prices[save.data.upgrades[u.id]] <= save.data.coins);
  }
  private levelCard(l: LevelConfig) {
    const record = save.data.levels[l.id];
    const unlocked = DEV.unlockAllLevels || l.id <= save.data.unlocked;
    return `<button class="level-card ${unlocked ? "" : "locked"} ${l.night ? "night" : ""}" data-action="level" data-value="${l.id}" ${unlocked ? "" : "disabled"} style="--accent:${l.accent};--art:var(--level-art-${l.id})"><span class="level-num">${l.id}</span><span class="level-art"></span><span class="level-info"><strong>${name(l)}</strong><small>${ar() ? l.en : l.ar}</small>${stars(save.data.stars[l.id] ?? 0)}<span class="level-best"><span>${t("best")}</span><b>${number(record?.score ?? 0)}</b></span><span class="level-gold ${record?.golden ? "found" : ""}"><i class="golden-icon"></i>${record?.golden ? t("found") : t("missing")}</span></span>${unlocked ? `<span class="level-go">${icon("play")}</span>` : `<span class="level-lock">${icon("lock")}</span>`}</button>`;
  }
  private levels() {
    const chapter = (night: boolean) => {
      const list = LEVELS.filter((l) => !!l.night === night);
      const earned = list.reduce((a, l) => a + (save.data.stars[l.id] ?? 0), 0);
      return `<section class="chapter ${night ? "night" : "day"}"><h3><span>${night ? "☾" : "☀"}</span>${night ? bilingual("الفصل ٢ · ليالي الكويت", "Chapter 2 · Kuwait Nights") : bilingual("الفصل ١ · من الفريج إلى العرس", "Chapter 1 · Neighborhood to Wedding")}<small>${icon("starFill")} ${earned}/${list.length * 3}</small></h3><div class="level-row">${list.map((l) => this.levelCard(l)).join("")}</div></section>`;
    };
    return `<div class="sub-screen levels-screen">${this.topbar(bilingual("المراحل", "Levels"), bilingual("فصلين · عشر مراحل", "Two chapters · ten stages"))}<div class="chapters">${chapter(false)}${chapter(true)}</div><p class="foot-note">${icon("starFill")} ${bilingual("نجمة للوصول · نجمة للدلة الذهبية · نجمة لـ٩٠٪ من الچاي", "1 star to finish · 1 for the golden dallah · 1 for 90% of the tea")} <span data-save-status></span></p></div>`;
  }
  private shop() {
    const tabs = `<div class="tabs" role="tablist"><button role="tab" aria-selected="${this.shopTab === "avatars"}" data-action="shop-tab" data-value="avatars">${icon("shirt")}${bilingual("الشخصيات", "Runners")}</button><button role="tab" aria-selected="${this.shopTab === "upgrades"}" data-action="shop-tab" data-value="upgrades">${icon("upgrade")}${bilingual("التطويرات", "Upgrades")}</button></div>`;
    return `<div class="sub-screen shop-screen">${this.topbar(bilingual("المتجر", "Shop"), bilingual("اجمع الكوينز بالمراحل", "Earn coins in every level"))}${tabs}${this.shopTab === "avatars" ? this.shopAvatars() : this.shopUpgrades()}</div>`;
  }
  private shopAvatars() {
    const pick = avatarById(this.shopPick);
    const owned = save.data.owned.includes(pick.id);
    const equipped = save.data.avatar === pick.id;
    const action = equipped
      ? `<button class="btn wide" disabled>${icon("check")}<span>${bilingual("لابسها", "Equipped")}</span></button>`
      : owned
        ? `<button class="btn wide primary" data-action="equip" data-value="${pick.id}">${icon("shirt")}<span>${bilingual("البس", "Equip")}</span></button>`
        : `<button class="btn wide primary buy ${pick.price > save.data.coins ? "short" : ""}" data-action="buy-avatar" data-value="${pick.id}">${coin}<span>${number(pick.price)}</span></button>`;
    return `<div class="shop-body"><div class="showcase" style="--trail:${pick.trail ? "#ffd75e" : "transparent"}"><div class="showcase-floor"></div><img id="showcase-img" src="${this.preview(pick.id)}" alt="${name(pick)}"/><strong>${name(pick)}</strong><small>${pick.trail ? bilingual("يترك أثر ذهبي ✦", "Leaves a golden trail ✦") : owned ? bilingual("عندك", "Owned") : bilingual("شخصية جديدة", "New outfit")}</small>${action}<p class="shop-msg" id="shop-msg" role="status"></p></div><div class="avatar-grid">${AVATARS.map((a) => {
      const has = save.data.owned.includes(a.id);
      return `<button class="avatar-card ${a.id === pick.id ? "picked" : ""} ${save.data.avatar === a.id ? "equipped" : ""}" data-action="pick-avatar" data-value="${a.id}" aria-pressed="${a.id === pick.id}"><img src="${this.preview(a.id)}" alt=""/><strong>${name(a)}</strong><span class="tag">${save.data.avatar === a.id ? `${icon("check")}${bilingual("لابسها", "On")}` : has ? bilingual("عندك", "Owned") : `${coin}${number(a.price)}`}</span></button>`;
    }).join("")}</div></div>`;
  }
  private shopUpgrades() {
    return `<div class="upgrade-list">${UPGRADES.map((u) => {
      const level = save.data.upgrades[u.id];
      const price = u.prices[level];
      return `<div class="upgrade-row"><i class="upgrade-icon ${u.id}-icon"></i><div class="upgrade-copy"><strong>${name(u)}</strong><small>${ar() ? u.arInfo : u.enInfo} · ${powerSeconds(u.id, level)}s${level < 4 ? ` → ${powerSeconds(u.id, level + 1)}s` : ""}</small><span class="pips">${[0, 1, 2, 3].map((i) => `<i class="${i < level ? "on" : ""}"></i>`).join("")}</span></div>${level < 4 ? `<button class="btn primary buy ${price > save.data.coins ? "short" : ""}" data-action="upgrade" data-value="${u.id}">${coin}<span>${number(price)}</span></button>` : `<span class="maxed">${bilingual("كامل", "MAX")}</span>`}</div>`;
    }).join("")}<p class="foot-note">${bilingual("التقط المغناطيس والدرع بالمراحل. التطوير يطوّل مدتهم.", "Pick up magnets and shields in levels. Upgrades make them last longer.")}</p><p class="shop-msg" id="shop-msg" role="status"></p></div>`;
  }
  private animateShopPreview() {
    if (this.shopTab !== "avatars" || save.data.settings.reducedMotion) return;
    // A looping run cycle sells the outfit better than a still pose.
    const frames = Array.from({ length: 8 }, (_, i) => this.preview(this.shopPick, `run-stride-${i}`));
    let i = 0;
    this.previewTimer = window.setInterval(() => {
      const img = document.querySelector<HTMLImageElement>("#showcase-img");
      if (img) img.src = frames[i++ % frames.length];
    }, 85);
  }
  shopMessage(text: string, good = false) {
    const el = document.querySelector<HTMLElement>("#shop-msg");
    if (!el) return;
    el.textContent = text;
    el.className = `shop-msg ${good ? "good" : "bad"}`;
    if (!good) document.querySelector(".buy")?.animate([{ transform: "translateX(0)" }, { transform: "translateX(-6px)" }, { transform: "translateX(6px)" }, { transform: "translateX(0)" }], { duration: 260 });
  }
  purchased() {
    this.confetti(document.querySelector(".showcase, .upgrade-list") as HTMLElement);
    this.shopMessage(bilingual("مبروك! ✦", "Unlocked! ✦"), true);
  }
  private options() {
    const s = save.data.settings;
    const toggle = (key: "music" | "sfx" | "reducedMotion" | "steadyView", label: string, hint = "") =>
      `<div class="setting-row"><label>${label}${hint ? `<small>${hint}</small>` : ""}</label><button class="toggle ${s[key] ? "enabled" : ""}" data-action="${key}" aria-pressed="${s[key]}"><span>${t(s[key] ? "on" : "off")}</span><i></i></button></div>`;
    return this.panel(t("options"), bilingual("على كيفك", "Make yourself comfortable"), `${toggle("music", `${icon("music")} ${t("music")}`)}${toggle("sfx", `${icon("sound")} ${t("sfx")}`)}<div class="setting-row volume-row"><label for="volume">${t("volume")}</label><input id="volume" type="range" min="0" max="100" value="${s.volume}"/><output id="volume-value">${s.volume}%</output></div>${toggle("reducedMotion", bilingual("تقليل المؤثرات", "Reduce effects"))}${toggle("steadyView", bilingual("منظر ثابت", "Steady view"), bilingual("خلفية ثابتة بدون اهتزاز", "Still skyline, no camera shake"))}<div class="setting-row"><label>${t("language")}</label><div class="segmented"><button data-action="set-language" data-value="ar" class="${s.language === "ar" ? "selected" : ""}">العربية</button><button data-action="set-language" data-value="en" class="${s.language === "en" ? "selected" : ""}">English</button></div></div><div class="setting-row"><label>${t("screen")}</label><button class="btn small" data-action="fullscreen">${icon("fullscreen")}<span>${t("screen")}</span></button></div><div class="card-actions"><button class="btn small" data-action="about">${bilingual("عن اللعبة والخصوصية", "About & privacy")}</button><button class="btn small danger" data-action="reset">${t("reset")}</button>${desktop ? `<button class="btn small" data-action="quit">${bilingual("إغلاق اللعبة", "Quit game")}</button>` : ""}</div><div id="reset-confirm"></div>`, "narrow");
  }
  confirmReset() {
    document.querySelector("#reset-confirm")!.innerHTML = `<div class="reset-confirm" role="alertdialog" aria-label="${bilingual("متأكد؟", "Reset progress?")}"><strong>${bilingual("متأكد؟", "Reset progress?")}</strong><p>${bilingual("بيروح تقدمك ونتايجك والكوينز والشخصيات.", "Your progress, scores, coins and outfits will be cleared.")}</p><button class="btn small danger" data-action="reset-yes">${t("yes")}</button><button class="btn small" data-action="reset-no">${t("no")}</button></div>`;
    document.querySelector<HTMLButtonElement>('[data-action="reset-no"]')?.focus();
  }
  private about() {
    return this.panel(bilingual("عن اللعبة والخصوصية", "About & privacy"), `DISHDASHA DASH · ${VERSION}`, `<div class="prose"><h3>${bilingual("مغامرة كويتية", "A Kuwaiti adventure")}</h3><p>${bilingual("من الفريج إلى العرس وليالي الكويت: عشر مراحل بفصلين، استكانات چاي، كوينز، ودلة ذهبية بكل مرحلة.", "From the neighborhood to the wedding and on into the night: ten stages in two chapters, tea and coins to collect, and a golden dallah in each stage.")}</p><h3>${bilingual("خصوصيتك", "Your privacy")}</h3><p>${bilingual("اللعبة ما فيها حسابات أو إعلانات أو مشتريات بفلوس حقيقية، وما تجمع أو تشارك معلومات شخصية. الكوينز تنكسب باللعب بس. التقدم والإعدادات تنحفظ على جهازك.", "The game has no accounts, ads, real-money purchases, analytics, or tracking, and does not collect or share personal data. Coins are earned only by playing. Progress and settings are stored on your device.")}</p><h3>${bilingual("الشكر والتقدير", "Credits")}</h3><p>${bilingual("رسومات أصلية مولدة بالذكاء الاصطناعي ومراجعة للعبة، مع أصوات وموسيقى مولدة برمجياً. مبنية باستخدام Phaser وCapacitor وElectron. الخطوط: Changa وSpace Grotesk.", "Original AI-generated artwork, reviewed and adapted for this game. Music and sound effects are synthesized in code. Built with Phaser, Capacitor, and Electron. Typefaces: Changa and Space Grotesk.")}</p><button class="btn small" data-action="licenses">${bilingual("تراخيص البرامج والخطوط", "Software & font licenses")}</button></div>`, "narrow");
  }
  licenseText(text: string) {
    const el = document.querySelector("#license-copy");
    if (el) el.textContent = text;
  }
  private how() {
    const tile = (ico: string, title: string, body: string, keys = "") => `<div class="how-tile"><span class="how-icon">${ico}</span><strong>${title}</strong><p>${body}</p>${keys ? `<div class="keys">${keys}</div>` : ""}</div>`;
    return this.panel(t("how"), bilingual("يلا شد حيلك!", "Jump high. Stay low."), `<div class="how-grid">${tile(icon("jump"), bilingual("نط · ونط مرة ثانية", "Jump · and jump again"), bilingual("ضغطة خفيفة نطة صغيرة، طوّل للأعلى. اضغط بالهوا لنطة ثانية!", "Tap to hop, hold to leap. Press again in the air for a double jump!"), "<kbd>SPACE</kbd><kbd>↑</kbd><kbd>W</kbd><kbd>A</kbd>")}${tile(icon("duck"), bilingual("انحنِ وانزل", "Duck & slam"), bilingual("اضغط مطوّل تحت المظلات. بالهوا يرجعك للأرض بسرعة.", "Hold under awnings. In the air it slams you down fast."), "<kbd>↓</kbd><kbd>S</kbd><kbd>B</kbd>")}${tile(`<i class="tea-icon big"></i>`, bilingual("كومبو الچاي", "Tea combos"), bilingual("اجمع بسرعة ورا بعض عشان تضاعف النقاط حتى ×٤.", "Collect in quick succession to multiply points up to ×4."))}${tile(`${coin}`, bilingual("كوينز ومتجر", "Coins & shop"), bilingual("الكوينز تفتح شخصيات وتطويرات بالمتجر.", "Coins unlock outfits and upgrades in the shop."))}${tile(`<i class="magnet-icon"></i><i class="shield-icon"></i>`, bilingual("مغناطيس ودرع", "Magnet & shield"), bilingual("المغناطيس يسحب الكوينز، والدرع يصد ضربة.", "The magnet pulls coins in; the shield blocks one hit."))}${tile(`<i class="golden-icon big"></i>`, bilingual("الدلة الذهبية", "Golden dallah"), bilingual("وحدة بكل مرحلة: +٥٠٠٠ ونجمة!", "One per stage: +5,000 and a star!"))}</div><div class="card-actions"><button class="btn small" data-action="practice">${bilingual("تدريب النط والانحناء", "Practice jump & duck")}</button>${button("start", "start", "play", "primary")}</div>`);
  }
  practice(step: "jump" | "duck" | "done", retry = false) {
    if (this.screen !== "playing") return;
    this.layer.dataset.practice = step;
    // Practice has its own pause button on the card.
    this.layer.querySelector(".hud .pause-button")?.remove();
    let card = this.layer.querySelector<HTMLElement>(".practice-card");
    if (!card) {
      card = document.createElement("div");
      card.className = "practice-card";
      this.layer.append(card);
    }
    card.dir = ar() ? "rtl" : "ltr";
    const title = step === "jump" ? bilingual("نط فوق الصندوق", "Jump over the box") : step === "duck" ? bilingual("اضغط مطوّل للانحناء", "Hold Duck under the awning") : bilingual("جاهز للمغامرة!", "Ready for the neighborhood!");
    const hint = step === "jump" ? bilingual("اضغط زر النط أو Space أو A. تقدر تنط مرة ثانية بالهوا.", "Press Jump, Space, or A. You can jump again in mid-air.") : step === "duck" ? bilingual("استمر بالضغط على ↓ أو S أو B لين تعدّي المظلة.", "Keep holding ↓, S, or B until you pass the awning.") : bilingual("تعلمت النط والانحناء. يلا نبدأ!", "You’ve got both moves. Time to collect some tea.");
    card.innerHTML = `<div role="status" aria-live="polite"><small>${step === "done" ? "✓" : `${step === "jump" ? "1" : "2"} / 2`} · ${bilingual("تدريب", "PRACTICE")}${retry ? ` · ${bilingual("حاول مرة ثانية", "Try again")}` : ""}</small><strong>${title}</strong><p>${hint}</p></div><div class="card-actions"><button class="btn small" data-action="pause" aria-label="${t("pause")}">${icon("pause")}</button><button class="btn small primary" data-action="${step === "done" ? "practice-finish" : "practice-skip"}">${step === "done" ? t("start") : bilingual("تخطي", "Skip")}</button></div>`;
    if (step === "done") card.querySelector<HTMLButtonElement>(".primary")?.focus();
  }
  private high() {
    return this.panel(bilingual("السجل", "Records"), bilingual("أبطال الدشداشة", "Dishdasha hall of fame"), `<div class="record-hero">${icon("trophy")}<div><small>${t("best")}</small><strong>${number(save.data.best)}</strong></div></div><div class="record-list">${LEVELS.map((l) => `<div><span class="record-num">${l.id}</span><span class="record-name">${name(l)}</span>${stars(save.data.stars[l.id] ?? 0)}<b>${number(save.data.levels[l.id]?.score ?? 0)}</b></div>`).join("")}</div><div class="card-actions">${button("start", "start", "play", "primary")}</div>`, "narrow");
  }
  // ——— in-game HUD ———
  private playing() {
    return `<div class="hud"><div class="hud-left"><div class="hud-portrait"><b id="lives">3</b></div><div class="hud-stack"><div id="hearts">${[0, 1, 2].map(() => `<span class="heart">${icon("heart")}</span>`).join("")}</div><div class="powerups"><span class="power magnet-power" id="magnet-power" hidden><i class="magnet-icon"></i><svg viewBox="0 0 36 36"><circle cx="18" cy="18" r="15.9" pathLength="100"/></svg></span><span class="power shield-power" id="shield-power" hidden><i class="shield-icon"></i><svg viewBox="0 0 36 36"><circle cx="18" cy="18" r="15.9" pathLength="100"/></svg></span></div></div></div><div class="hud-center"><strong id="score">0</strong><span class="combo" id="combo"></span></div><div class="hud-right"><span class="pill tea-pill" id="tea-pill"><i class="tea-icon"></i><b id="tea">0</b><small id="tea-total">/0</small><i class="golden-icon" id="golden-mark"></i></span><span class="pill coin-pill" id="coin-pill">${coin}<b id="coins">0</b></span><button class="icon-btn pause-button" data-action="pause" aria-label="${worldT("pause")}">${icon("pause")}</button></div><div class="route"><span class="route-label" id="level-label"></span><div class="route-track"><i class="route-fill" id="route-fill"></i><i class="route-check" id="route-check"></i><i class="route-gold" id="route-gold"></i><span class="route-runner" id="route-runner"></span></div><span class="route-flag">🏁</span></div></div><div class="touch-controls"><button id="duck-button" aria-label="${worldT("duck")}">${icon("duck")}</button><button id="jump-button" aria-label="${worldT("jump")}">${icon("jump")}<span>${worldT("jump")}</span></button></div><div class="key-hint">${bilingual("نط: Space · مرة ثانية بالهوا للنطة الثانية · انحناء: ↓", "Space jump · again in the air to double jump · ↓ duck")}</div>`;
  }
  hud(state: Snapshot) {
    this.lastState = state;
    if (this.screen !== "playing") return;
    const $ = (id: string) => document.getElementById(id);
    if (state.score !== Math.round(this.shownScore) && !this.scoreFrame) this.rollScore();
    if (state.hearts !== this.lastHearts) {
      const hearts = $("hearts")!.children;
      for (let i = 0; i < 3; i++) hearts[i].classList.toggle("empty", i >= state.hearts);
      if (state.hearts < this.lastHearts) hearts[state.hearts]?.classList.add("break");
      else for (const h of hearts) h.classList.remove("break");
      this.lastHearts = state.hearts;
    }
    $("lives")!.textContent = `${state.lives}`;
    $("tea-total")!.textContent = `/${state.totalTea}`;
    $("golden-mark")!.classList.toggle("found", state.golden);
    // Counters that a flying pickup is heading to update when it lands.
    if (!this.flyLayer.querySelector(".fly-tea, .fly-golden")) $("tea")!.textContent = `${state.tea}`;
    if (!this.flyLayer.querySelector(".fly-coin")) $("coins")!.textContent = `${state.coins}`;
    const combo = $("combo")!;
    combo.textContent = state.combo >= 3 ? `${state.multiplier > 1 ? `×${state.multiplier}  ·  ` : ""}${state.combo} COMBO` : "";
    combo.dataset.level = `${state.multiplier}`;
    for (const kind of ["magnet", "shield"] as const) {
      const el = $(`${kind}-power`)!;
      el.hidden = state[kind] <= 0;
      el.style.setProperty("--left", `${state[kind] * 100}`);
    }
    $("level-label")!.textContent = `${LEVELS[state.level - 1].ar} · ${state.level}`;
    $("route-fill")!.style.width = `${state.progress * 100}%`;
    $("route-runner")!.style.insetInlineStart = `${state.progress * 100}%`;
    $("route-check")!.style.insetInlineStart = `${state.checkpoint * 100}%`;
    const gold = $("route-gold")!;
    gold.style.insetInlineStart = `${state.goldenAt * 100}%`;
    gold.hidden = state.goldenAt < 0;
    gold.classList.toggle("found", state.golden);
  }
  private rollScore() {
    const step = () => {
      const target = this.lastState?.score ?? 0;
      const el = document.getElementById("score");
      if (!el) { this.scoreFrame = 0; return; }
      this.shownScore += (target - this.shownScore) * 0.22;
      if (Math.abs(target - this.shownScore) < 1) this.shownScore = target;
      el.textContent = number(Math.round(this.shownScore));
      this.scoreFrame = this.shownScore === target ? 0 : requestAnimationFrame(step);
    };
    this.scoreFrame = requestAnimationFrame(step);
  }
  /** A pickup flies from its spot in the world into its HUD counter. */
  collect(kind: PickupKind, x: number, y: number) {
    if (this.screen !== "playing") return;
    const targetId = kind === "coin" ? "coin-pill" : kind === "tea" || kind === "golden" ? "tea-pill" : `${kind}-power`;
    const target = document.getElementById(targetId);
    if (!target || this.flyLayer.childElementCount > 40) return;
    const frame = this.flyLayer.getBoundingClientRect();
    const end = target.getBoundingClientRect();
    const sx = x - frame.left, sy = y - frame.top;
    const ex = end.left - frame.left + Math.min(end.height, end.width) / 2, ey = end.top - frame.top + end.height / 2;
    const el = document.createElement("i");
    el.className = `fly fly-${kind}`;
    this.flyLayer.append(el);
    const calm = save.data.settings.reducedMotion;
    const mid = `translate(${sx + (ex - sx) * 0.3}px, ${sy - frame.height * 0.12}px) scale(1.5)`;
    el.animate(
      calm
        ? [{ transform: `translate(${ex}px, ${ey}px) scale(1)`, opacity: 0 }, { opacity: 1, offset: 0.3, transform: `translate(${ex}px, ${ey}px) scale(1)` }, { transform: `translate(${ex}px, ${ey}px) scale(1)`, opacity: 0 }]
        : [{ transform: `translate(${sx}px, ${sy}px) scale(1)` }, { transform: mid, offset: 0.35 }, { transform: `translate(${ex}px, ${ey}px) scale(.7)` }],
      { duration: kind === "golden" ? 900 : 520, easing: "cubic-bezier(.4,0,.7,1)" },
    ).onfinish = () => {
      el.remove();
      target.classList.remove("bump");
      void target.offsetWidth;
      target.classList.add("bump");
      if (this.lastState && this.screen === "playing") {
        if (kind === "coin" && !this.flyLayer.querySelector(".fly-coin")) document.getElementById("coins")!.textContent = `${this.lastState.coins}`;
        if ((kind === "tea" || kind === "golden") && !this.flyLayer.querySelector(".fly-tea, .fly-golden")) document.getElementById("tea")!.textContent = `${this.lastState.tea}`;
      }
    };
  }
  hit(shielded: boolean) {
    const flash = document.getElementById("hit-flash")!;
    flash.className = "";
    void flash.offsetWidth;
    flash.className = shielded ? "shield" : "hurt";
  }
  private bindTouch() {
    for (const control of ["jump", "duck"]) {
      const el = document.querySelector<HTMLButtonElement>(`#${control}-button`)!;
      el.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        e.stopPropagation();
        el.setPointerCapture(e.pointerId);
        el.classList.add("held");
        this.action(`${control}-down`, `${control}-button:${e.pointerId}`);
      });
      for (const type of ["pointerup", "pointercancel", "lostpointercapture"])
        el.addEventListener(type, (e) => {
          e.preventDefault();
          el.classList.remove("held");
          this.action(`${control}-up`, `${control}-button:${(e as PointerEvent).pointerId}`);
        });
    }
  }
  notice(text: string, duration = 1900) {
    window.clearTimeout(this.noticeTimer);
    this.noticeEl.textContent = text;
    this.noticeEl.classList.remove("visible");
    void this.noticeEl.offsetWidth;
    this.noticeEl.classList.add("visible");
    this.noticeTimer = window.setTimeout(() => this.noticeEl.classList.remove("visible"), duration);
  }
  // ——— pause and results ———
  private pause() {
    return `<div class="overlay dim"><div class="card compact"><div class="card-badge">${icon("pause")}</div><h2 class="big-title">${bilingual("موقفين شوي", "Paused")}</h2><p>${bilingual("خذ لك استكانة، ونكمل", "A quick tea break")}</p><div class="stack">${button("resume", "resume", "play", "primary wide")}${button("restart", "restart", "restart", "wide")}${button("options", "options", "settings", "wide")}${button("menu", "menu", "map", "wide")}</div></div></div>`;
  }
  private statRow(label: string, value: string, extra = "") {
    return `<div class="stat"><span>${label}</span><strong>${value}</strong>${extra}</div>`;
  }
  private over() {
    const s = this.lastState!;
    return `<div class="overlay dim"><div class="card result lose"><div class="ribbon">${bilingual("خلصت المحاولات", "GAME OVER")}</div><h2 class="big-title">${bilingual("راحت عليك", "One more try?")}</h2><p>${bilingual("الچاي يبرد... بس لا تستسلم!", "The tea is getting cold… give it another go!")}</p><div class="stats">${this.statRow(t("score"), number(s.score))}${this.statRow(bilingual("الچاي", "Tea"), `${s.tea}<small>/${s.totalTea}</small>`)}${this.statRow(bilingual("كوينز", "Coins"), `${coin}+${s.coins}`)}${this.statRow(t("deaths"), `${this.deaths}`)}</div><p class="best-line">${icon("trophy")} ${t("best")} <b>${number(save.data.best)}</b></p><div class="row-actions">${button("retry", "restart", "restart", "primary")}${button(bilingual("المتجر", "Shop"), "shop", "shop")}${button("menu", "menu", "map")}</div></div></div>`;
  }
  private complete() {
    const r = this.result!;
    const level = LEVELS[r.id - 1];
    const newBest = r.score >= (save.data.levels[r.id]?.score ?? 0);
    return `<div class="overlay dim"><div class="card result win"><div class="ribbon">${bilingual(`المرحلة ${r.id} خلصت`, `LEVEL ${r.id} CLEAR`)}</div><div class="result-stars">${[0, 1, 2].map((i) => `<i class="result-star" data-earned="${i < r.stars}">${icon("starFill")}</i>`).join("")}</div><h2 class="big-title">${bilingual("كفو!", "Well played!")}</h2><p>${bilingual(level.finish, ["The neighborhood is cheering you on!", "Shopping done. Next stop: the souq!", "Through the market and on to the desert!", "The wedding is just around the corner!", "You made it to the wedding! But the night is young…", "A lovely evening in the neighborhood!", "Made it before the co-op closed!", "Dinner in the souq, under the lanterns!", "The campfire is just ahead!", "A thousand congratulations!"][r.id - 1] ?? "")}</p><div class="stats">${this.statRow(t("score"), `<span data-count="${r.score}">0</span>`, newBest ? `<em class="new-best">${bilingual("رقم قياسي!", "NEW BEST")}</em>` : "")}${this.statRow(bilingual("الچاي", "Tea"), `${r.tea}<small>/${r.totalTea}</small>`, r.perfect ? `<em>${t("perfect")}</em>` : "")}${this.statRow(bilingual("كوينز", "Coins"), `${coin}+<span data-count="${r.coins + r.coinBonus}">0</span>`, `<em>${bilingual("منها بونص", "incl. bonus")} ${r.coinBonus}</em>`)}${this.statRow(t("golden"), r.golden ? `<i class="golden-icon"></i> ${t("found")}` : t("missing"))}</div><div class="row-actions">${button("next", "next", "arrow", "primary")}${button("replay", "restart", "restart")}${button(bilingual("المتجر", "Shop"), "shop", "shop")}</div></div></div>`;
  }
  private victory() {
    const results = [...campaign.results.values()];
    const total = campaign.total();
    const tea = results.reduce((a, b) => a + b.tea, 0);
    const golden = Object.values(save.data.levels).filter((l) => l.golden).length;
    const starCount = Object.values(save.data.stars).reduce((a, b) => a + b, 0);
    return `<div class="overlay dim"><div class="card result win victory"><div class="ribbon">${bilingual("دشداشة داش · خلصت!", "DISHDASHA DASH COMPLETE")}</div><div class="trophy-burst">${icon("trophy")}</div><h2 class="big-title">${bilingual("مبروك يا بطل!", "You made it!")}</h2><p>${t("travel")}</p><div class="stats">${this.statRow(t("total"), `<span data-count="${total}">0</span>`)}${this.statRow(bilingual("الچاي", "Tea"), `${tea}`)}${this.statRow(t("golden"), `${golden}<small>/${FINAL_LEVEL}</small>`)}${this.statRow(bilingual("النجوم", "Stars"), `${starCount}<small>/${FINAL_LEVEL * 3}</small>`)}</div><div class="row-actions">${button("playAgain", "start", "play", "primary")}${button("select", "levels", "map")}${button("menu", "menu", "back")}</div></div></div>`;
  }
  /** Staggered star pops, rolling numbers and confetti on a results card. */
  private celebrate() {
    const calm = save.data.settings.reducedMotion;
    document.querySelectorAll<HTMLElement>(".result-star").forEach((star, i) => {
      if (calm) { star.classList.add("shown"); return; }
      this.later(450 + i * 380, () => {
        star.classList.add("shown");
        if (star.dataset.earned === "true") audio.play("star", i * 4);
      });
    });
    document.querySelectorAll<HTMLElement>("[data-count]").forEach((el) => {
      const target = Number(el.dataset.count);
      if (calm) { el.textContent = number(target); return; }
      const start = performance.now() + 300;
      let lastTick = 0;
      const step = (now: number) => {
        const p = Math.min(1, Math.max(0, (now - start) / 1100));
        el.textContent = number(Math.round(target * (1 - (1 - p) ** 3)));
        if (p > 0 && p < 1 && now - lastTick > 70) { lastTick = now; audio.play("tick"); }
        if (p < 1 && el.isConnected) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
    this.later(200, () => this.confetti(document.querySelector(".card.result") as HTMLElement));
  }
  /** Lightweight HTML confetti for menus (the world uses Phaser particles). */
  confetti(anchor?: HTMLElement | null) {
    if (!anchor || save.data.settings.reducedMotion) return;
    const frame = this.flyLayer.getBoundingClientRect();
    const box = anchor.getBoundingClientRect();
    const colors = ["#ffc93c", "#e5484d", "#3fb5a3", "#ffffff", "#6aa6ff", "#f28fb5"];
    for (let i = 0; i < 46; i++) {
      const bit = document.createElement("i");
      bit.className = "confetti";
      bit.style.background = colors[i % colors.length];
      this.flyLayer.append(bit);
      const x = box.left - frame.left + box.width / 2, y = box.top - frame.top + box.height * 0.2;
      const dx = (Math.random() - 0.5) * box.width * 1.4, dy = -frame.height * (0.12 + Math.random() * 0.2);
      bit.animate([
        { transform: `translate(${x}px, ${y}px) rotate(0deg)`, opacity: 1 },
        { transform: `translate(${x + dx * 0.7}px, ${y + dy}px) rotate(${Math.random() * 360}deg)`, opacity: 1, offset: 0.35 },
        { transform: `translate(${x + dx}px, ${y + frame.height * 0.5}px) rotate(${Math.random() * 900}deg)`, opacity: 0 },
      ], { duration: 1600 + Math.random() * 900, easing: "cubic-bezier(.2,.6,.4,1)" }).onfinish = () => bit.remove();
    }
  }
}
