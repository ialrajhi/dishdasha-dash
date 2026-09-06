import { save } from "./SaveManager";
const copy = {
  start: ["يلا نلعب", "Start game"],
  select: ["اختار المرحلة", "Level select"],
  options: ["الإعدادات", "Options"],
  how: ["شلون نلعب؟", "How to play"],
  high: ["أعلى نتيجة", "High score"],
  back: ["رجوع", "Back"],
  resume: ["نكمل؟", "Resume"],
  restart: ["من أول المرحلة", "Restart level"],
  menu: ["القائمة الرئيسية", "Main menu"],
  next: ["المرحلة التالية", "Next level"],
  replay: ["العب مرة ثانية", "Replay"],
  retry: ["حاول مرة ثانية", "Retry"],
  playAgain: ["يلا مرة ثانية", "Play again"],
  score: ["النقاط", "Score"],
  tea: ["استكانات چاي", "Tea collected"],
  golden: ["الدلة الذهبية", "Golden Dallah"],
  deaths: ["عدد الطيحات", "Deaths"],
  lives: ["المحاولات", "Lives"],
  music: ["الموسيقى", "Music"],
  sfx: ["الأصوات", "Sound effects"],
  volume: ["مستوى الصوت", "Volume"],
  screen: ["ملء الشاشة", "Fullscreen"],
  language: ["اللغة", "Language"],
  reset: ["امسح التقدم", "Reset progress"],
  yes: ["إي، امسح", "Yes, reset"],
  no: ["لا، خلّه", "No, keep it"],
  on: ["شغال", "On"],
  off: ["طافي", "Off"],
  found: ["لقيتها!", "Found!"],
  missing: ["دور عليها", "Missing"],
  locked: ["مقفلة", "Locked"],
  complete: ["خلصت المرحلة", "Level complete"],
  best: ["أفضل نتيجة", "Best score"],
  bestTea: ["أكثر چاي", "Best tea"],
  jump: ["نط!", "Jump!"],
  duck: ["انحناء", "Duck!"],
  level: ["المرحلة", "Level"],
  total: ["مجموع النقاط", "Total score"],
  bestLevel: ["أفضل مرحلة", "Best level"],
  continuePortrait: ["كمل جذي", "Continue anyway"],
  travel: ["من الفريج إلى العرس", "From the neighborhood to the wedding"],
  newBest: ["رقم قياسي يديد!", "New high score!"],
  saved: ["تقدمك محفوظ تلقائياً", "Progress saves automatically"],
  perfect: ["بونص كل الچاي!", "Perfect tea bonus!"],
  checkpoint: ["وصلت نص الطريج!", "Checkpoint reached!"],
  campaign: [
    "خمس مراحل. مغامرة كويتية.",
    "Five levels. One Kuwaiti adventure.",
  ],
  pause: ["وقف شوي", "Pause"],
  touch: ["نط فوق الحواجز · انحنِ تحت المظلة", "Jump over obstacles · duck under awnings"],
} as const;
export type CopyKey = keyof typeof copy;
export const t = (key: CopyKey) =>
  copy[key][save.data.settings.language === "ar" ? 0 : 1];
export const bilingual = (ar: string, en: string) =>
  save.data.settings.language === "ar" ? ar : en;

// The game world keeps its Kuwaiti voice independently of menu preferences.
export const worldT = (key: CopyKey) => copy[key][0];
