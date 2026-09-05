import Phaser from "phaser";
import "./style.css";
import "./arcade.css";
import { GameUI, type Screen } from "./ui/GameUI";
import { MenuScene } from "./scenes/MenuScene";
import { BootScene } from "./scenes/BootScene";
import { GameScene, type GameHooks } from "./scenes/GameScene";
import { save } from "./systems/SaveManager";
import { audio } from "./systems/AudioManager";
import { campaign } from "./systems/ScoreManager";
import { DEV, WIDTH, HEIGHT } from "./config/Constants";
let currentLevel = 1;
let optionsReturn: Screen = "menu";
let assetsReady = false;
const ui = new GameUI(action);
const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: "phaser-game",
  width: WIDTH * 2,
  height: HEIGHT * 2,
  pixelArt: true,
  roundPixels: true,
  backgroundColor: "#529e9b",
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: WIDTH * 2,
    height: HEIGHT * 2,
  },
  physics: {
    default: "arcade",
    arcade: { gravity: { x: 0, y: 1000 }, debug: DEV.showHitboxes },
  },
  input: { activePointers: 3, keyboard: true },
  scene: [BootScene, MenuScene, GameScene],
  audio: { noAudio: true },
  render: { antialias: false },
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
  notice: (text, duration) => ui.notice(text, duration),
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
  if (ui.screen === "options") {
    if (optionsReturn === "pause") ui.show("pause");
    else menu(optionsReturn);
  } else if (ui.screen === "pause") resume();
  else if (ui.screen !== "playing") menu();
}
async function fullscreen() {
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
  if (!["jump-down", "jump-up", "volume"].includes(name)) {
    audio.unlock();
    audio.play("select");
  }
  switch (name) {
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
      scene().pressJump();
      break;
    case "jump-up":
      scene().releaseJump();
      break;
    case "music":
    case "sfx":
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
      save.reset();
      campaign.reset();
      ui.show("options");
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
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    if (ui.screen === "playing") pause();
    audio.pause(true);
  } else if (!["pause", "options", "over"].includes(ui.screen))
    audio.pause(false);
});
window.addEventListener("blur", () => {
  if (ui.screen === "playing") pause();
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
