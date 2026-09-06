import Phaser from "phaser";
import "./style.css";
import "./arcade.css";
import "./dance/dance.css";
import { GameUI, type Screen } from "./ui/GameUI";
import { MenuScene } from "./scenes/MenuScene";
import { BootScene } from "./scenes/BootScene";
import { GameScene, type GameHooks } from "./scenes/GameScene";
import { save } from "./systems/SaveManager";
import { audio } from "./systems/AudioManager";
import { campaign } from "./systems/ScoreManager";
import { DEV, WIDTH, HEIGHT, RENDER_SCALE } from "./config/Constants";
import { initializePlatform, platformEvents, minimizeAndroid } from "./platform/Platform";
import { GamepadInput } from "./platform/GamepadInput";
await initializePlatform();
let currentLevel = 1;
let optionsReturn: Screen = "menu";
let assetsReady = false;
let foreground = true;
const ui = new GameUI(action);
const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: "phaser-game",
  width: WIDTH * RENDER_SCALE,
  height: HEIGHT * RENDER_SCALE,
  pixelArt: false,
  roundPixels: false,
  backgroundColor: "#529e9b",
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: WIDTH * RENDER_SCALE,
    height: HEIGHT * RENDER_SCALE,
  },
  physics: {
    default: "arcade",
    arcade: { gravity: { x: 0, y: 1000 }, debug: DEV.showHitboxes },
  },
  input: { activePointers: 3, keyboard: true },
  scene: [BootScene, MenuScene, GameScene],
  audio: { noAudio: true },
  render: { antialias: true },
  fps: { target: 60, forceSetTimeOut: false },
});
game.events.on("assets-ready", () => {
  assetsReady = true;
});
game.events.on("asset-progress", (progress: number) => ui.loading(progress));
game.events.on("asset-error", () => ui.loadingError());
game.events.on("art-ready", (textures: Phaser.Textures.TextureManager) => {
  ui.artwork(textures);
  ui.loaded();
});
const scene = () => game.scene.getScene("Game") as GameScene;
const hooks: GameHooks = {
  hud: (s) => ui.hud(s),
  notice: (text, duration) => {
    if (ui.screen === "playing") ui.notice(text, duration);
  },
  pause: () => pause(),
  over: (state, deaths) => {
    game.scene.pause("Game");
    audio.pause(true);
    ui.show("over", { state, deaths });
  },
  complete: (result) => {
    game.scene.pause("Game");
    audio.pause(false);
    ui.show(result.id === 5 ? "victory" : "complete", { result });
  },
};
function start(level = 1, reset = true) {
  if (!assetsReady) return;
  currentLevel = level;
  if (reset) campaign.reset();
  else campaign.results.delete(level);
  game.scene.stop("Menu");
  game.scene.stop("Game");
  ui.show("playing");
  audio.unlock();
  audio.pause(false);
  game.scene.start("Game", { level, hooks });
}
function menu(screen: Screen = "menu") {
  if (!assetsReady) return;
  game.scene.stop("Game");
  if (game.scene.isPaused("Menu")) game.scene.resume("Menu");
  if (!game.scene.isActive("Menu")) game.scene.start("Menu");
  audio.pause(false);
  ui.show(screen);
}
function pause() {
  if (ui.screen !== "playing") return;
  game.scene.pause("Game");
  scene().clearInput();
  audio.pause(true);
  audio.play("pause");
  ui.show("pause");
}
function resume() {
  ui.show("playing");
  scene().clearInput();
  game.scene.resume("Game");
  audio.pause(false);
  ui.hud(scene().snapshot());
}
function back() {
  if (document.querySelector('[role="alertdialog"]')) { ui.show("options"); return; }
  if (ui.screen === "about") { ui.show("options"); return; }
  if (ui.screen === "licenses") { ui.show("about"); return; }
  if (ui.screen === "options") {
    if (optionsReturn === "pause") ui.show("pause");
    else menu(optionsReturn);
  } else if (ui.screen === "pause") resume();
  else if (ui.screen !== "playing") menu();
}
async function fullscreen() {
  const desktop = (window as Window & { desktopGame?: { fullscreen: () => Promise<void> } }).desktopGame;
  if (desktop) { await desktop.fullscreen(); return; }
  const el = document.querySelector(".arcade-shell") as HTMLElement;
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else if (el.requestFullscreen) await el.requestFullscreen();
    else {
      document.querySelector(".game-cabinet")?.classList.toggle("expanded");
      ui.notice(
        save.data.settings.language === "ar"
          ? "كبرنا الشاشة"
          : "Expanded game view",
      );
    }
  } catch {
    ui.notice(
      save.data.settings.language === "ar"
        ? "ملء الشاشة مو متاح بهالمتصفح"
        : "Fullscreen is unavailable in this browser",
    );
  }
}
function action(name: string, value?: string) {
  if (name === "reload") {
    location.reload();
    return;
  }
  if (!assetsReady) return;
  if (!["jump-down", "jump-up", "duck-down", "duck-up", "volume"].includes(name)) {
    audio.unlock();
    audio.play("select");
  }
  switch (name) {
    case "retry-save":
      save.persist();
      break;
    case "start":
      start();
      break;
    case "level": {
      const id = Number(value);
      if (
        id >= 1 &&
        id <= 5 &&
        (DEV.unlockAllLevels || id <= save.data.unlocked)
      )
        start(id);
      break;
    }
    case "dance":
      game.scene.stop("Game");
      game.scene.pause("Menu");
      audio.pause(true);
      ui.show("dance");
      break;
    case "levels":
      menu("levels");
      break;
    case "menu":
      menu();
      break;
    case "how":
      ui.show("how");
      break;
    case "high":
      ui.show("high");
      break;
    case "options":
      optionsReturn = ui.screen;
      ui.show("options");
      break;
    case "about":
      ui.show("about");
      break;
    case "licenses":
      ui.show("licenses");
      break;
    case "quit":
      void (window as Window & { desktopGame?: { quit: () => Promise<void> } }).desktopGame?.quit();
      break;
    case "back":
      back();
      break;
    case "pause":
      pause();
      break;
    case "resume":
      resume();
      break;
    case "restart":
      start(currentLevel, false);
      break;
    case "next":
      start(Math.min(5, currentLevel + 1), false);
      break;
    case "jump-down":
      scene().pressJump(value ?? "button");
      break;
    case "jump-up":
      scene().releaseJump(value ?? "button");
      break;
    case "duck-down":
      scene().pressDuck(value ?? "button");
      break;
    case "duck-up":
      scene().releaseDuck(value ?? "button");
      break;
    case "music":
    case "sfx":
    case "reducedMotion":
    case "steadyView":
      save.settings({ [name]: !save.data.settings[name] });
      audio.sync();
      ui.show("options");
      break;
    case "volume":
      save.settings({ volume: Number(value) });
      audio.sync();
      document.querySelector("#volume-value")!.textContent = `${value}%`;
      break;
    case "language":
    case "set-language": {
      if (ui.screen === "playing") pause();
      save.settings({
        language:
          value === "ar" || value === "en"
            ? value
            : save.data.settings.language === "ar"
              ? "en"
              : "ar",
      });
      ui.show(ui.screen);
      break;
    }
    case "mute": {
      const muted = !save.data.settings.music && !save.data.settings.sfx;
      save.settings({ music: muted, sfx: muted });
      audio.sync();
      if (ui.screen === "dance") { audio.pause(true); ui.dance?.syncSound(); }
      ui.chrome();
      break;
    }
    case "fullscreen":
      void fullscreen();
      break;
    case "reset":
      ui.confirmReset();
      break;
    case "reset-yes":
      game.scene.stop("Game");
      optionsReturn = "menu";
      save.reset();
      campaign.reset();
      menu("options");
      break;
    case "reset-no":
      ui.show("options");
      break;
    case "portrait":
      document.querySelector(".portrait-message")?.classList.add("dismissed");
      break;
  }
}
ui.show("menu");
window.addEventListener('save-recovered', () => {
  if (ui.screen === 'playing') pause();
  else ui.show(ui.screen);
  audio.sync();
  ui.notice(save.data.settings.language === 'ar' ? 'استرجعنا تقدمك المحفوظ' : 'Restored your saved progress');
});
new GamepadInput({ playing: () => ui.screen === "playing", ready: () => assetsReady, foreground: () => foreground, action });
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    if (ui.screen === "playing") pause();
    audio.pause(true);
  } else if (!["pause", "options", "over", "dance"].includes(ui.screen))
    audio.pause(false);
});
window.addEventListener("blur", () => {
  foreground = false;
  if (ui.screen === "playing") pause();
  audio.pause(true);
});
window.addEventListener("focus", () => {
  foreground = true;
  if (!["pause", "over", "dance"].includes(ui.screen) && !document.hidden) audio.pause(false);
});
platformEvents(() => {
  foreground = false;
  ui.dance?.suspend();
  if (ui.screen === "playing") pause();
  audio.pause(true);
  save.persist();
}, () => {
  foreground = true;
  if (!["pause", "over", "dance"].includes(ui.screen)) audio.pause(false);
}, () => {
  if (ui.screen === "playing") pause();
  else if (ui.screen === "menu") minimizeAndroid();
  else back();
});
window.addEventListener("pagehide", () => save.persist());
if (import.meta.env.DEV) {
  if (DEV.startLevel) window.setTimeout(() => start(DEV.startLevel), 200);
  if (new URLSearchParams(location.search).has("testing")) {
    Object.assign(window, {
      __DASH__: {
        game,
        scene,
        ui,
        save,
        campaign,
        start,
        action,
        snapshot: () => scene().snapshot(),
      },
    });
  }
}
