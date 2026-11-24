// 計分規則的自動檢查：npm test
const assert = require('assert');
const {ITEMS, score, derive} = require('../assets/scoring.js');

const all = v => Object.fromEntries(ITEMS.map(i => [i.id, v]));
const flat = sc => Object.entries(sc).flatMap(([t, o]) => Object.entries(o).map(([k, v]) => [`${t}.${k}`, v]));

assert.strictEqual(ITEMS.length, 104, '題數應為 104');
assert.strictEqual(ITEMS.reduce((n, i) => n + i.m.length, 0), 244, '計分映射應為 244');

// 全部選「普通」：每個維度都是 50%
for (const [k, v] of flat(score(all(3), false))) assert.strictEqual(v, 50, `${k} 應為 50，實際 ${v}`);

// 全部選「蠻符合」或「非常符合」：MBTI 兩端平衡，五軸都維持 50%
for (const v of [4, 5]) for (const [ax, p] of Object.entries(score(all(v), false).mbti)) assert.strictEqual(p, 50, `全選 ${v} 時 MBTI ${ax} 應為 50`);

// 跨測驗方向：Q13「用尖銳的話刺傷別人」越同意，DISC 支配型越高、親和性越低
const a = all(3); a.Q13 = 5;
const s13 = score(a, false);
assert(s13.disc.D > 50 && s13.big5.A < 50, 'Q13 方向錯誤');

// Q02「話不多」越同意：外向性下降、MBTI 偏內向、DISC 影響型下降
const b = all(3); b.Q02 = 5;
const s02 = score(b, false);
assert(s02.big5.E < 50 && s02.mbti.EI < 50 && s02.disc.I < 50, 'Q02 方向錯誤');

// 略過依附段：沒有 ecr 結果，其他照常
const sk = score(all(4), true);
assert(!sk.ecr && sk.big5 && sk.riasec, '略過依附段時不應有 ecr');

// 依附切點：50% 以下為安全型
assert.strictEqual(derive(score(all(3), false)).ecr, '安全型');

console.log('計分檢查全部通過');
