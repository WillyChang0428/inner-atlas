/* 六合一人格測驗：計分核心（瀏覽器使用；也可在 Node 中 require 做測試）。
   規則：原始作答 × 帶正負號權重；MBTI 各軸兩端題組分開計算後平均；結果四捨五入到小數一位。 */
(function (root) {
  const isNode = typeof module === 'object' && module.exports;
  const ITEMS = isNode ? require('./items.js') : root.INNER_ITEMS;
  const VERSION = 'v3';
  const AXES = [['EI','E','I','外向','內向','透過互動與外在活動充電，習慣邊說邊想。','透過獨處與內在反思充電，習慣想清楚再說。'],
   ['SN','S','N','實感','直覺','關注具體事實、經驗與當下細節。','關注可能性、模式與未來的意義。'],
   ['TF','T','F','思考','情感','決策時重視邏輯一致與客觀標準。','決策時重視人的感受與價值觀。'],
   ['JP','J','P','判斷','感知','喜歡事先規劃、按部就班完成。','喜歡保留彈性，隨情況調整。'],
   ['AT','A','T','自信','敏感','對自己的決定較有把握，壓力下相對穩定。','對成果要求高、常自我檢視，也因此較容易感到壓力。']];
  const POLE = {E:['EI',0],I:['EI',1],S:['SN',0],N:['SN',1],T:['TF',0],F:['TF',1],J:['JP',0],P:['JP',1],A_assertive:['AT',0],T_turbulent:['AT',1]};
  function score(ans, skipEcr) {
    const acc = {}, mb = {};
    for (const it of ITEMS) {
      const r = ans[it.id]; if (!r) continue;
      for (const [t, d, w] of it.m) {
        if (t === 'ecr' && skipEcr) continue;
        const agree = (r - 1) / 4;
        if (t === 'mbti') {
          let [ax, side] = POLE[d]; if (w < 0) side = 1 - side;
          const toward0 = side === 0 ? agree : 1 - agree;
          const g = ((mb[ax] ??= [{n:0,d:0},{n:0,d:0}]))[side];
          g.n += toward0 * Math.abs(w); g.d += Math.abs(w);
        } else {
          const s = w > 0 ? agree : 1 - agree;
          const o = ((acc[t] ??= {})[d] ??= {n:0, d:0});
          o.n += s * Math.abs(w); o.d += Math.abs(w);
        }
      }
    }
    const out = {};
    const r1 = x => Math.round(x * 10) / 10;
    for (const t in acc) { out[t] = {}; for (const d in acc[t]) out[t][d] = r1(acc[t][d].n / acc[t][d].d * 100); }
    out.mbti = {};
    for (const ax in mb) { const gs = mb[ax].filter(g => g.d > 0).map(g => g.n / g.d); out.mbti[ax] = r1(gs.reduce((a, b) => a + b, 0) / gs.length * 100); }
    return out;
  }
  function derive(sc) {
    const code = AXES.slice(0, 4).map(a => sc.mbti[a[0]] > 50 ? a[1] : a[2]).join('') + '-' + (sc.mbti.AT > 50 ? 'A' : 'T');
    const disc = Object.entries(sc.disc).sort((a, b) => b[1] - a[1]);
    const ri = 'RIASEC'.split('').map(k => [k, sc.riasec[k]]).sort((a, b) => b[1] - a[1]);
    let ecr = null;
    if (sc.ecr) { const hiA = sc.ecr['焦慮'] > 50, hiV = sc.ecr['逃避'] > 50; ecr = hiA && hiV ? '恐懼逃避型' : hiA ? '焦慮型' : hiV ? '逃避型' : '安全型'; }
    return {code, disc: disc[0][0] + '-' + disc[1][0], dMain: disc[0][0], dSub: disc[1][0], ri3: ri.slice(0, 3).map(x => x[0]).join(''), riTop: ri.slice(0, 3).map(x => x[0]), ecr};
  }
  const api = {ITEMS, AXES, POLE, VERSION, score, derive};
  if (isNode) module.exports = api; else root.InnerScoring = api;
})(typeof self !== 'undefined' ? self : this);
