export const CAST = [
  ['hero', 'Bu Dash', 'بو داش'], ['woman', 'Noura', 'نورة'], ['boy', 'Hamad', 'حمد'], ['girl', 'Dana', 'دانة'],
  ['cat', 'Mishmish', 'مشمش'], ['dallah', 'Disco Dallah', 'دلة الديسكو'], ['grandpa', 'Yousef', 'يوسف'], ['abaya', 'Maryam', 'مريم'],
  ['robot', 'Bleep', 'بيب'], ['alien', 'Lulu', 'لولو'], ['drummer', 'Salem', 'سالم'], ['fox', 'Fennec', 'فنك'],
] as const;
export const DANCES = [
  ['sway', 'Sway', 'تمايل'], ['shuffle', 'Chest shuffle', 'خطوات خفيفة'], ['bounce', 'Bounce', 'نطنطة'],
  ['hands', 'Hands up', 'إيدك فوق'], ['twist', 'Low shimmy', 'هزّة خفيفة'], ['disco', 'Disco knees', 'ديسكو'],
  ['crossstep', 'Cross-step', 'خطوة متقاطعة'], ['sweep', 'Side sweep', 'لوّح بإيدك'], ['clap', 'Overhead clap', 'تصفيق'],
  ['robot', 'Robot groove', 'رقصة الروبوت'], ['kick', 'Toe-kick swing', 'ركلة خفيفة'],
] as const;
export type Dancer = { id: number; kind: string; x: number; y: number; dance: string; flip: boolean };
export type Party = { dancers: Dancer[]; track: number; calm: boolean };
export const emptyParty = (): Party => ({ dancers: [], track: 0, calm: true });
const clamp = (v: unknown, min: number, max: number, fallback: number) => typeof v === 'number' && Number.isFinite(v) ? Math.max(min, Math.min(max, v)) : fallback;
export function readParty(raw: any): Party {
  return {
    track: Math.floor(clamp(raw?.track, 0, 5, 0)), calm: raw?.calm !== false,
    dancers: (Array.isArray(raw?.dancers) ? raw.dancers : []).slice(0, 24).filter((d: any) => CAST.some(c => c[0] === d?.kind)).map((d: any, i: number) => ({
      id: i + 1, kind: d.kind, x: clamp(d.x, .07, .93, .5), y: clamp(d.y, .3, .94, .7),
      dance: DANCES.some(m => m[0] === d.dance) ? d.dance : 'sway', flip: d.flip === true,
    })),
  };
}
