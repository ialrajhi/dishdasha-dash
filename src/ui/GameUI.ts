import { icon } from "./icons";
import { save } from "../systems/SaveManager";
import { t, bilingual, type CopyKey } from "../systems/LocalizationManager";
import { DEV } from "../config/Constants";
import { LEVELS } from "../levels/levels";
import { campaign, type LevelResult } from "../systems/ScoreManager";
import type { Snapshot } from "../scenes/GameScene";
export type Screen =
  | "menu"
  | "levels"
  | "options"
  | "how"
  | "high"
  | "playing"
  | "pause"
  | "over"
  | "complete"
  | "victory";
const number = (n: number) => n.toLocaleString("en-US");
const button = (key: CopyKey, action: string, ico = "arrow", primary = false) =>
  `<button class="game-button ${primary ? "primary" : ""}" data-action="${action}"><span class="button-icon">${icon(ico)}</span><span>${t(key)}</span>${icon("arrow")}</button>`;
export class GameUI {
  screen: Screen = "menu";
  previous: Screen = "menu";
  private layer: HTMLElement;
  private noticeEl: HTMLElement;
  private noticeTimer?: number;
  private result?: LevelResult;
  private lastState?: Snapshot;
  private deaths = 0;
  private displayedScore = 0;
  constructor(private action: (action: string, value?: string) => void) {
    document.querySelector("#app")!.innerHTML =
      `<div class="arcade-shell"><header class="shell-header"><a class="wordmark" href="#" data-action="menu"><span class="brand-square">د</span><span>دشداشة <b>DASH</b></span></a><div class="header-caption"><span class="live-dot"></span> SMALL DISHDASHA. BIG ADVENTURE.</div><nav class="header-controls"><button data-action="language" class="language-button" aria-label="Change language"></button><span class="divider"></span><button data-action="mute" aria-label="Toggle audio">${icon("sound")}</button><button data-action="fullscreen" aria-label="Fullscreen">${icon("fullscreen")}</button></nav></header><section class="game-cabinet" aria-label="دشداشة Dash"><div id="phaser-game"></div><div class="screen-texture" aria-hidden="true"></div><div id="ui-layer" inert></div><div class="asset-loading" role="status"><span class="loading-title">دشداشة <b>DASH</b></span><strong>نجهز الفريج…</strong><small>GETTING THE NEIGHBORHOOD READY</small><div class="loading-track"><i id="asset-progress"></i></div><span id="loading-percent">0%</span></div><div id="game-notice" role="status" aria-live="polite"></div><div class="portrait-message"><span>لف التلفون 📱↔️</span><small>Landscape feels better</small><button data-action="portrait">كمل جذي</button></div><div class="cabinet-corner tl"></div><div class="cabinet-corner tr"></div><div class="cabinet-corner bl"></div><div class="cabinet-corner br"></div></section><footer class="shell-footer"><div class="control-guide"><kbd>SPACE</kbd><span id="control-copy"></span><span class="footer-dot">·</span><kbd>ESC</kbd><span id="pause-copy"></span></div><div class="footer-signature"><span class="kuwait-flag"></span><span>صنع بحب، ونص استكانة چاي</span></div><div class="version">ARCADE EDITION</div></footer></div>`;
    this.layer = document.querySelector("#ui-layer")!;
    this.noticeEl = document.querySelector("#game-notice")!;
    document.addEventListener("click", (e) => {
      const b = (e.target as HTMLElement).closest<HTMLElement>("[data-action]");
      if (!b || b.hasAttribute("disabled")) return;
      e.preventDefault();
      this.action(b.dataset.action!, b.dataset.value);
    });
    document.addEventListener("input", (e) => {
      const el = e.target as HTMLInputElement;
      if (el.id === "volume") this.action("volume", el.value);
    });
    document.addEventListener("keydown", (e) => {
      if (this.screen === "playing") return;
      if (e.code === "Escape") {
        e.preventDefault();
        this.action("back");
        return;
      }
      if (!["ArrowDown", "ArrowUp", "ArrowLeft", "ArrowRight"].includes(e.code))
        return;
      if ((e.target as HTMLElement)?.tagName === "INPUT") return;
      e.preventDefault();
      const buttons = Array.from(
        this.layer.querySelectorAll<HTMLButtonElement>("button:not(:disabled)"),
      );
      const index = buttons.indexOf(
        document.activeElement as HTMLButtonElement,
      );
      const direction = ["ArrowDown", "ArrowRight"].includes(e.code) ? 1 : -1;
      buttons[(index + direction + buttons.length) % buttons.length]?.focus();
    });
    this.chrome();
  }
  loading(progress: number) {
    const bar = document.querySelector<HTMLElement>("#asset-progress");
    if (bar) bar.style.width = `${progress * 100}%`;
    const label = document.querySelector("#loading-percent");
    if (label) label.textContent = `${Math.round(progress * 100)}%`;
  }
  loaded() {
    this.layer.removeAttribute("inert");
    document.querySelector(".asset-loading")?.remove();
  }
  loadingError() {
    const panel = document.querySelector(".asset-loading");
    if (panel)
      panel.innerHTML = `<strong>ما اكتمل التحميل</strong><small>Check your connection and try again.</small><button class="small-button" data-action="reload">حاول مرة ثانية · Retry</button>`;
  }
  chrome() {
    const ar = save.data.settings.language === "ar";
    document.documentElement.lang = ar ? "ar" : "en";
    document.documentElement.dir = ar ? "rtl" : "ltr";
    document.querySelector(".language-button")!.textContent = ar
      ? "EN / عربي"
      : "عربي / EN";
    document.querySelector('[data-action="mute"]')!.innerHTML = icon(
      save.data.settings.sfx || save.data.settings.music ? "sound" : "mute",
    );
    document.querySelector("#control-copy")!.textContent = bilingual(
      "نط · طول الضغطة يطوّل النطة",
      "JUMP · HOLD TO JUMP HIGHER",
    );
    document.querySelector("#pause-copy")!.textContent = t("pause");
    document.querySelector(".portrait-message button")!.textContent =
      t("continuePortrait");
  }
  artwork(textures: import("phaser").Textures.TextureManager) {
    for (const level of LEVELS) {
      document.documentElement.style.setProperty(
        `--level-art-${level.id}`,
        `url("/assets/arcade/${level.theme}.png")`,
      );
    }
    const source = textures
      .get("hero-idle")
      .getSourceImage() as HTMLCanvasElement;
    document.documentElement.style.setProperty(
      "--runner-icon",
      `url("${source.toDataURL()}")`,
    );
    const portrait = document.createElement("canvas");
    portrait.width = 100;
    portrait.height = 100;
    portrait
      .getContext("2d")!
      .drawImage(source, 61, 24, 78, 72, 0, 0, 100, 100);
    document.documentElement.style.setProperty(
      "--hero-portrait",
      `url("${portrait.toDataURL()}")`,
    );
  }

  show(
    screen: Screen,
    data?: { result?: LevelResult; state?: Snapshot; deaths?: number },
  ) {
    this.screen = screen;
    if (data?.result) this.result = data.result;
    if (data?.state) this.lastState = data.state;
    if (data?.deaths !== undefined) this.deaths = data.deaths;
    this.chrome();
    this.noticeEl.classList.remove("visible");
    this.layer.className = `view-${screen}`;
    this.layer.dir = save.data.settings.language === "ar" ? "rtl" : "ltr";
    const render: Record<Screen, () => string> = {
      menu: () => this.menu(),
      levels: () => this.levels(),
      options: () => this.options(),
      how: () => this.how(),
      high: () => this.high(),
      playing: () => this.playing(),
      pause: () => this.pause(),
      over: () => this.over(),
      complete: () => this.complete(),
      victory: () => this.victory(),
    };
    this.layer.innerHTML = render[screen]();
    if (screen === "playing") this.bindTouch();
    else
      window.setTimeout(
        () =>
          this.layer
            .querySelector<HTMLButtonElement>(".primary, .back-button")
            ?.focus({ preventScroll: true }),
        60,
      );
  }
  private heading(title: string, subtitle: string) {
    return `<div class="panel-heading"><button class="back-button" data-action="back" aria-label="${t("back")}">${icon("back")}</button><div><h1>${title}</h1><p>${subtitle}</p></div><span class="small-mark">د / D</span></div>`;
  }
  private menu() {
    return `<div class="main-menu"><div class="menu-copy"><div class="eyebrow"><span></span> ${bilingual("مغامرة كويتية على السريع", "A LITTLE KUWAITI ADVENTURE")}</div><h1 class="game-title"><span lang="ar">دشداشة</span><strong>DASH<span class="title-spark">✦</span></strong></h1><p class="menu-tagline">${t("travel")} <span>✦</span></p><div class="menu-buttons">${button("start", "start", "play", true)}${button("select", "levels", "map")}<div class="menu-secondary"><button data-action="options">${icon("settings")}${t("options")}</button><button data-action="how">${icon("help")}${t("how")}</button></div></div><button class="high-score-link" data-action="high">${icon("trophy")}<span>${t("high")}</span><strong>${number(save.data.best).padStart(6, "0")}</strong></button></div><div class="menu-stamp"><span class="stamp-star">✦</span><span>يلا!<small>شد حيلك</small></span></div><div class="level-route"><span class="route-active">01</span><i></i><span>02</span><i></i><span>03</span><i></i><span>04</span><i></i><span>05</span><small>${t("campaign")}</small></div><span class="menu-coordinate"><span class="kuwait-flag"></span> KUWAIT · ALWAYS A GOOD STAGE</span></div>`;
  }
  private levels() {
    return `<div class="full-panel">${this.heading(t("select"), t("travel"))}<div class="level-cards">${LEVELS.map(
      (l) => {
        const record = save.data.levels[l.id];
        const unlocked = DEV.unlockAllLevels || l.id <= save.data.unlocked;
        return `<button class="level-card ${unlocked ? "unlocked" : "locked"}" data-action="level" data-value="${l.id}" ${unlocked ? "" : "disabled"} style="--level-accent:${l.accent}"><div class="level-art art-${l.id}"><span class="level-num">0${l.id}</span><span class="level-art-symbol">${["⌂", "▤", "۞", "△", "✦"][l.id - 1]}</span><span class="level-lock">${icon(unlocked ? "play" : "lock")}</span></div><div class="level-card-info"><h2>${save.data.settings.language === "ar" ? l.ar : l.en}</h2><small>${save.data.settings.language === "ar" ? l.en : l.ar}</small><div class="level-score"><span>${t("best")}</span><b>${number(record?.score ?? 0)}</b></div><div class="level-score"><span>${icon("tea")} ${t("bestTea")}</span><b>${record?.tea ?? 0}</b></div><div class="gold-status ${record?.golden ? "found" : ""}">${icon("star")} ${record?.golden ? t("found") : t("missing")}</div></div></button>`;
      },
    ).join(
      "",
    )}</div><div class="panel-foot"><span>${icon("lock")} ${bilingual("خلص المرحلة عشان تفتح اللي بعدها", "Finish a level to unlock the next")}</span><span>${t("saved")}</span></div></div>`;
  }
  private options() {
    const s = save.data.settings;
    return `<div class="modal-wrap"><div class="modal options-modal">${this.heading(t("options"), bilingual("على كيفك", "Make yourself comfortable"))}<div class="setting-row"><label>${icon("sound")} ${t("music")}</label><button class="toggle ${s.music ? "enabled" : ""}" data-action="music" aria-pressed="${s.music}">${t(s.music ? "on" : "off")}<i></i></button></div><div class="setting-row"><label>${icon("tea")} ${t("sfx")}</label><button class="toggle ${s.sfx ? "enabled" : ""}" data-action="sfx" aria-pressed="${s.sfx}">${t(s.sfx ? "on" : "off")}<i></i></button></div><div class="setting-row volume-row"><label for="volume">${t("volume")}</label><input id="volume" type="range" min="0" max="100" value="${s.volume}"/><output id="volume-value">${s.volume}%</output></div><div class="setting-row"><label>${t("screen")}</label><button class="small-button" data-action="fullscreen">${icon("fullscreen")} ${t("screen")}</button></div><div class="setting-row"><label>${t("language")}</label><div class="segmented"><button data-action="set-language" data-value="ar" class="${s.language === "ar" ? "selected" : ""}">العربية</button><button data-action="set-language" data-value="en" class="${s.language === "en" ? "selected" : ""}">English</button></div></div><button class="reset-button" data-action="reset">${t("reset")}</button><div id="reset-confirm"></div></div></div>`;
  }
  confirmReset() {
    document.querySelector("#reset-confirm")!.innerHTML =
      `<div class="reset-confirm" role="alertdialog" aria-label="متأكد؟"><strong>متأكد؟</strong><p>${bilingual("بيروح تقدمك ونتايجك المحفوظة.", "Your saved progress and scores will be cleared.")}</p><button data-action="reset-yes">${t("yes")}</button><button data-action="reset-no">${t("no")}</button></div>`;
    document
      .querySelector<HTMLButtonElement>('[data-action="reset-no"]')
      ?.focus();
  }
  private how() {
    return `<div class="modal-wrap"><div class="modal how-modal">${this.heading(t("how"), "يلا شد حيلك!")}<div class="how-intro">${bilingual("الريّال يركض بروحه. عليك بس تنط!", "He runs automatically. You just jump!")}</div><div class="how-grid"><div><span class="how-icon">${icon("jump")}</span><h2>${bilingual("نطة صغيرة، نطة كبيرة", "A little hop. A big leap.")}</h2><p>${bilingual("اضغط ضغطة خفيفة لنطة صغيرة، أو طول الضغطة عشان تنط أعلى.", "Tap for a short hop. Hold a little longer to jump higher.")}</p><div class="key-row"><kbd>SPACE</kbd><kbd>↑</kbd><kbd>W</kbd></div></div><div><span class="how-icon tea-color">${icon("tea")}</span><h2>${bilingual("لا تنسى الچاي", "Don’t forget the tea")}</h2><p>${bilingual("كل استكانة +١٠٠. الدلة الذهبية +٥٠٠٠. جمّع كل الچاي وخذ بونص +٢٠٠٠!", "Each tea is +100. A golden dallah is +5,000. Collect every tea for a +2,000 bonus!")}</p></div><div><span class="how-icon heart-color">${icon("heart")}</span><h2>${bilingual("ثلاث قلوب، ثلاث فرص", "Three hearts. Three lives.")}</h2><p>${bilingual("نط فوق العربانة والدلة! إذا طحت ترد من آخر نقطة وصلت لها.", "Jump over carts and dallahs. If you fall, return to your latest checkpoint.")}</p></div></div><div class="how-bottom"><span>${icon("jump")} ${t("touch")}</span><span><kbd>ESC</kbd> ${t("pause")}</span></div>${button("start", "start", "play", true)}</div></div>`;
  }
  private high() {
    return `<div class="modal-wrap"><div class="modal high-modal">${this.heading(t("high"), bilingual("أبطال الدشداشة", "Dishdasha hall of fame"))}<div class="big-trophy">${icon("trophy")}</div><strong class="record-number">${number(save.data.best)}</strong><p class="record-label">${t("best")}</p><div class="record-list">${LEVELS.map((l) => `<div><span><i>0${l.id}</i>${save.data.settings.language === "ar" ? l.ar : l.en}</span><b>${number(save.data.levels[l.id]?.score ?? 0)}</b><span class="tea-color">${save.data.levels[l.id]?.golden ? "★" : "☆"}</span></div>`).join("")}</div>${button("start", "start", "play", true)}</div></div>`;
  }
  private playing() {
    return `<div class="hud"><div class="hud-brand"><b lang="ar">دشداشة<span>DASH</span></b><span class="kuwait-flag"></span></div><div class="hud-health"><div id="hearts"></div><div class="health-line"><span class="lives-icon" aria-hidden="true"></span><span id="lives">× 3</span><div class="tea-counter"><span class="tea-art" aria-hidden="true"></span><strong id="tea">0 / 0</strong><span id="golden">☆</span></div></div></div><div class="hud-score"><small>${t("score")}</small><strong id="score">0000000</strong></div><div class="hud-right"><div class="hud-level" id="level-label"></div><small class="stage-motto">KUWAIT · ALWAYS A GOOD STAGE</small></div><button class="pause-button" data-action="pause" aria-label="${t("pause")}">${icon("pause")}</button><div class="progress-track"><div id="level-progress"></div></div></div><div class="game-bottom"><span id="level-tip">${t("touch")}</span><button id="jump-button" aria-label="${t("jump")}">${icon("jump")}<span>${t("jump")}</span></button></div>`;
  }
  hud(state: Snapshot) {
    this.lastState = state;
    if (this.screen !== "playing") return;
    this.displayedScore += Math.max(
      1,
      Math.ceil((state.score - this.displayedScore) * 0.25),
    );
    if (this.displayedScore > state.score) this.displayedScore = state.score;
    document.querySelector("#score")!.textContent = Math.round(
      this.displayedScore,
    )
      .toString()
      .padStart(7, "0");
    document.querySelector("#hearts")!.innerHTML = [0, 1, 2]
      .map(
        (i) =>
          `<span class="heart ${i >= state.hearts ? "empty" : ""}">${icon("heart")}</span>`,
      )
      .join("");
    document.querySelector("#lives")!.textContent = `× ${state.lives}`;
    document.querySelector("#tea")!.textContent =
      `${state.tea} / ${state.totalTea}`;
    document.querySelector("#golden")!.textContent = state.golden ? "★" : "☆";
    const l = LEVELS[state.level - 1];
    document.querySelector("#level-label")!.textContent =
      `${save.data.settings.language === "ar" ? "المرحلة" : "LEVEL"} ${state.level} · ${save.data.settings.language === "ar" ? l.ar : l.en}`;
    (document.querySelector("#level-progress") as HTMLElement).style.width =
      `${state.progress * 100}%`;
  }
  private bindTouch() {
    const button = document.querySelector<HTMLButtonElement>("#jump-button")!;
    button.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      e.stopPropagation();
      button.setPointerCapture(e.pointerId);
      this.action("jump-down");
    });
    for (const type of ["pointerup", "pointercancel", "lostpointercapture"])
      button.addEventListener(type, (e) => {
        e.preventDefault();
        this.action("jump-up");
      });
  }
  notice(text: string, duration = 1900) {
    window.clearTimeout(this.noticeTimer);
    this.noticeEl.textContent = text;
    this.noticeEl.classList.add("visible");
    this.noticeTimer = window.setTimeout(
      () => this.noticeEl.classList.remove("visible"),
      duration,
    );
  }
  private pause() {
    return `<div class="modal-wrap pause-wrap"><div class="modal compact-modal"><div class="modal-symbol">Ⅱ</div><h1>موقفين شوي</h1><p>${bilingual("خذ لك استكانة، ونكمل", "A quick tea break")}</p><div class="stack-buttons">${button("resume", "resume", "play", true)}${button("restart", "restart", "back")}${button("options", "options", "settings")}${button("menu", "menu", "map")}</div></div></div>`;
  }
  private stats(
    score: number,
    tea: number,
    totalTea: number,
    golden: boolean,
    deaths: number,
  ) {
    return `<div class="stats-grid"><div><span>${t("score")}</span><strong>${number(score)}</strong></div><div><span>${t("tea")}</span><strong>${tea}<small> / ${totalTea}</small></strong></div><div><span>${t("golden")}</span><strong class="golden-stat">${golden ? "★" : "☆"} <small>${golden ? t("found") : t("missing")}</small></strong></div><div><span>${t("deaths")}</span><strong>${deaths}</strong></div></div>`;
  }
  private over() {
    const s = this.lastState!;
    return `<div class="modal-wrap"><div class="modal result-modal"><div class="result-eyebrow">GAME OVER</div><h1>راحت عليك 😭</h1><p>${bilingual("الچاي يبرد... بس لا تستسلم!", "The tea is getting cold… give it another go!")}</p>${this.stats(s.score, s.tea, s.totalTea, s.golden, this.deaths)}<p class="best-line">${icon("trophy")} ${t("best")} <b>${number(save.data.best)}</b></p><div class="result-buttons">${button("retry", "restart", "play", true)}${button("select", "levels", "map")}${button("menu", "menu", "back")}</div></div></div>`;
  }
  private complete() {
    const r = this.result!;
    return `<div class="modal-wrap"><div class="modal result-modal"><div class="result-eyebrow">LEVEL 0${r.id} COMPLETE</div><h1>كفو! 👏</h1><p>${LEVELS[r.id - 1].finish}</p>${this.stats(r.score, r.tea, r.totalTea, r.golden, r.deaths)}<div class="bonus-line">${r.perfect ? `${t("perfect")} +2,000 · ` : ""}${bilingual("بونص الوصول والقلوب والمحاولات", "Finish, hearts & lives bonus")} <b>+${number(r.bonus)}</b></div><div class="result-buttons">${button("next", "next", "arrow", true)}${button("replay", "restart", "back")}${button("select", "levels", "map")}</div></div></div>`;
  }
  private victory() {
    const results = [...campaign.results.values()];
    const total = campaign.total();
    const tea = results.reduce((a, b) => a + b.tea, 0);
    const golden = Object.values(save.data.levels).filter(
      (l) => l.golden,
    ).length;
    const best = [...results].sort((a, b) => b.score - a.score)[0];
    return `<div class="modal-wrap victory-wrap"><div class="modal victory-modal"><div class="victory-stars">✦ ★ ✦</div><div class="result-eyebrow">دشداشة DASH COMPLETE</div><h1>مبروك يا بطل! 🇰🇼</h1><p>من الفريج إلى العرس 😎</p><div class="victory-total"><span>${t("total")}</span><strong>${number(total)}</strong></div><div class="victory-stats"><div><strong>${tea}</strong><span>${t("tea")}</span></div><div><strong>${golden}<small>/5</small></strong><span>${t("golden")}</span></div><div><strong>${campaign.deaths}</strong><span>${t("deaths")}</span></div><div><strong>${best ? LEVELS[best.id - 1].ar : "—"}</strong><span>${t("bestLevel")}</span></div></div><div class="result-buttons">${button("playAgain", "start", "play", true)}${button("select", "levels", "map")}${button("menu", "menu", "back")}</div></div></div>`;
  }
}
