import { describe, expect, it } from 'vitest';
import { readParty } from '../src/dance/DanceData';
describe('saved dance arrangements', () => {
  it('accepts only known characters and clamps malformed positions and settings', () => {
    const party = readParty({track:99,dancers:[{kind:'unknown'}, {kind:'cat', x:Infinity, y:-10, dance:'bad',flip:true}]});
    expect(party.track).toBe(5); expect(party.calm).toBe(true);
    expect(party.dancers).toEqual([{id:1,kind:'cat',x:.5,y:.3,dance:'sway',flip:true}]);
  });
  it('bounds party size and preserves original moves on reload', () => {
    const party = readParty({dancers:Array.from({length:100},()=>({kind:'robot',x:.4,y:.8,dance:'twist'}))});
    expect(party.dancers).toHaveLength(24); expect(new Set(party.dancers.map(d=>d.id)).size).toBe(24);
    expect(party.dancers[0].dance).toBe('twist');
  });
});
