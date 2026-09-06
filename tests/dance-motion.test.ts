import { describe, expect, it } from 'vitest';
import { dancePose, solveLeg } from '../src/dance/DanceMotion';
import { DANCES, readParty } from '../src/dance/DanceData';
const values = (pose: ReturnType<typeof dancePose>): number[] => Object.values(pose).flat() as number[];
describe('continuous dance joints', () => {
  it('keeps every move finite, continuous across loop boundaries and distinct', () => {
    const signatures = [];
    for (const [name] of DANCES) {
      const a = values(dancePose(name, 0)), b = values(dancePose(name, 2));
      a.forEach((v,i) => expect(v).toBeCloseTo(b[i], 5));
      let prior = a;
      for(let frame=1;frame<=240;frame++) {
        const next = values(dancePose(name,frame/120));
        next.forEach((v,i) => { expect(Number.isFinite(v)).toBe(true); expect(Math.abs(v-prior[i])).toBeLessThan(.12); });
        prior=next;
      }
      signatures.push(JSON.stringify(values(dancePose(name,.43))));
    }
    expect(new Set(signatures).size).toBe(DANCES.length);
  });
  it('pins both leg endpoints with correctly sized bones in reach', () => {
    const hip={x:.02,y:-.23},foot={x:.10,y:0};
    const knee=solveLeg(hip,foot,.15,.15,1);
    expect(Math.hypot(knee.x-hip.x,knee.y-hip.y)).toBeCloseTo(.15,5);
    expect(Math.hypot(knee.x-foot.x,knee.y-foot.y)).toBeCloseTo(.15,5);
  });
  it('removes saved chefs while preserving other guests and new moves', () => {
    const p=readParty({dancers:[{kind:'chef'},{kind:'boy',dance:'sweep'},{kind:'abaya',dance:'disco'}]});
    expect(p.dancers.map(d=>d.kind)).toEqual(['boy','abaya']);
    expect(p.dancers[1].dance).toBe('disco');
  });
});
