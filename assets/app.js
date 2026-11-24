/* Inner Atlas 心象研究所：六合一人格測驗前端。計分邏輯在 scoring.js，題庫在 items.js。 */
{
const ITEMS = window.INNER_ITEMS;
const {score, derive, AXES, VERSION} = window.InnerScoring;
// 是否蒐集作答資料：在 assets/config.js 設定。預設關閉，作答只保存在填答者的瀏覽器。
const COLLECT = !!(window.INNER_CONFIG && window.INNER_CONFIG.collect === true);
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pct = v => Math.round(v);
const lvl = v => v <= 35 ? 'l' : v >= 65 ? 'h' : 'm';
const LV = {l:'低', m:'中', h:'高'};

/* ---------- names & texts ---------- */
const B5 = {E:'外向性',A:'親和性',C:'盡責性',N:'神經質',O:'開放性'};
const B5T = {
 E:{h:['從人群中獲得能量，主動、反應快，容易帶動氣氛。','可能較少留白思考，長時間獨處容易覺得悶。'],l:['能量來自獨處與小圈子，說話前會先想清楚，擅長深度專注。','在需要主動表現的場合，容易被低估。'],m:['能在熱鬧與安靜之間切換，視場合調整社交能量。','需要留意自己真正想要的社交份量，而不只是配合場合。']},
 A:{h:['重視和諧，願意體諒與協助別人，讓人感到安心。','容易把別人的需求放在前面，難以拒絕或表達不滿。'],l:['直接、獨立，敢於提出不同意見，不輕易被情緒左右判斷。','在意見交流時，可能讓人覺得不夠溫暖。'],m:['能體諒別人，也保有自己的立場。','在衝突中有時會猶豫要先顧關係還是先講道理。']},
 C:{h:['有計畫、重細節、說到做到，是可靠的執行者。','對自己與他人要求高，計畫被打亂時容易焦躁。'],l:['彈性、隨性，能在混亂中臨場發揮。','長期目標與細節容易被擱置，需要外在提醒。'],m:['重要的事會規劃，小事則保留彈性。','在壓力大時，規律感可能先被犧牲。']},
 N:{h:['對情緒與風險訊號敏銳，常能預先察覺問題。','壓力大時容易消耗，反覆擔心尚未發生的事。'],l:['情緒穩定、抗壓，遇事能保持冷靜。','可能低估風險，或較難體會別人的焦慮。'],m:['多數時候穩定，遇到重大壓力才會明顯波動。','留意壓力累積的早期訊號，及早調節。']},
 O:{h:['好奇、想像力豐富，喜歡新觀點與抽象思考。','面對重複性的例行事務，容易失去耐心。'],l:['務實、腳踏實地，偏好熟悉且驗證過的做法。','面對全新的做法，可能較保留、需要時間接受。'],m:['願意嘗試新事物，但會先確認它實際可行。','有時會在創新與穩妥之間來回權衡。']}
};
const ADJ = {E:['外向熱絡','沉靜內斂'],A:['溫和體貼','直率獨立'],C:['踏實有序','彈性隨興'],N:['敏銳細膩','沉穩淡定'],O:['好奇多想','務實穩健']};
const HX = {H:'誠實謙遜',E_hex:'情緒性',X:'外向性',A:'寬容性',C:'盡責性',O:'開放性'};
const HXT = {
 H:{h:'真誠、公平，不靠操弄取得利益，對名利看得較淡。需要時也要練習為自己爭取。',l:'懂得爭取資源、表現自己，在競爭環境中有企圖心。留意在關係裡別讓人覺得有算計。',m:'大致重視公平，但在利益或地位面前會權衡現實。'},
 E_hex:{h:'情感豐富、同理心強，遇到壓力時較需要他人支持。',l:'獨立、不易被恐懼或擔憂影響，情感表達較內斂。',m:'能感受他人情緒，也能適度保持距離。'},
 X:{h:'自在社交、樂於表達，喜歡成為互動的一份子。',l:'偏好安靜與小圈子，不需要成為焦點。',m:'社交能量適中，看場合決定投入程度。'},
 A:{h:'包容、有耐心，不輕易對人生氣或記恨。',l:'對不合理的事容易不耐煩，會直接表達不滿。',m:'多數時候有耐心，被觸及底線時會明確反應。'},
 C:{h:'有條理、重紀律，做事謹慎周全。',l:'隨性、彈性，較少被規則綁住。',m:'在需要時能有條理地完成任務。'},
 O:{h:'對知識、藝術與新觀念充滿好奇。',l:'偏好具體、實際與熟悉的事物。',m:'對新事物保持開放，但不會為新而新。'}
};
const DS = {D:'支配型',I:'影響型',S:'穩健型',C:'謹慎型'};
const DST = {
 D:['目標導向、決策快，勇於承擔與挑戰。','壓力下可能顯得強勢、沒耐心。','和他溝通：直接給重點與選項。'],
 I:['熱情、善於表達與說服，能帶動團隊氣氛。','壓力下可能過度樂觀、忽略細節。','和他溝通：給予舞台與認可，搭配清楚的追蹤機制。'],
 S:['可靠、有耐心，重視團隊和諧與穩定步調。','壓力下可能隱忍不說、抗拒突然的改變。','和他溝通：提前告知變動，給他消化的時間。'],
 C:['重視品質、數據與流程，分析嚴謹。','壓力下可能過度追求完美，讓決策變慢。','和他溝通：提供完整資料與明確標準。']};
const ECRT = {
 '安全型':['能自在親近，也能保有自我；信任伴侶，衝突時較能直接溝通。','持續用具體的話表達欣賞與需求，安全感也需要日常維護。'],
 '焦慮型':['重視連結，對關係中的變化很敏銳，常需要確認自己被愛。','不安時先辨認情緒，用「我感覺…我需要…」表達，而不是追問或試探；也建立關係以外的支持來源。'],
 '逃避型':['重視獨立與個人空間，親密靠得太近時會想退開。','練習在小事上分享感受；需要空間時，告訴伴侶你何時會回來。'],
 '恐懼逃避型':['渴望親密又害怕受傷，可能在靠近與退開之間擺盪。','放慢節奏，與伴侶約定安全的溝通方式；若困擾明顯，可以考慮找諮商師陪伴。']};
const RS = {R:'實作型',I:'研究型',A:'藝術型',S:'社會型',E:'企業型',C:'常規型'};
const RST = {
 R:['喜歡動手、操作工具與機械，重視看得見的成果。','具體、實際、可以動手的環境','工程技術、機電維修、土木營建、餐飲廚藝、物理治療、農林園藝'],
 I:['喜歡探究原理、分析資料，解決複雜問題。','重視思考與專業、允許深入鑽研的環境','研究人員、資料分析、軟體工程、醫療、藥學、實驗室'],
 A:['喜歡創作與自我表達，偏好非制式、能發揮風格的工作。','開放、彈性、重視原創的環境','設計、寫作編輯、攝影影像、音樂表演、內容創作、建築'],
 S:['喜歡教導、助人與合作，從他人的成長中得到成就感。','以人為核心、重視溝通與關懷的環境','教育、諮商輔導、社工、護理、人資培訓、職能治療'],
 E:['喜歡領導、說服與經營，追求成果與影響力。','講求目標、競爭與決策的環境','業務、創業、行銷企劃、專案管理、法律、經營管理'],
 C:['喜歡規則清楚、資料精確的工作，擅長維持秩序。','流程明確、分工清楚、重視精確的環境','會計財務、行政管理、稽核、品管、資料庫管理、物流']};
const MODS = [
 ['大五人格','IPIP-50',' 外向、親和、盡責、神經質、開放五個面向，是全站的性格基礎。','<polygon points="12,3 21,9.5 17.5,20 6.5,20 3,9.5"/><polygon points="12,8 16,11 14.5,16 9.5,16 8,11"/>'],
 ['16 型人格','大五推估＋補強題','以百分比呈現五條光譜，接近 50% 時標示為彈性雙棲。','<rect x="3" y="3" width="7.5" height="7.5" rx="1.5"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5"/>'],
 ['HEXACO 六大人格','HEXACO-60（H 軸）','在大五之外補上「誠實謙遜」，看見待人處事的真誠度。','<polygon points="12,2.5 20.5,7.25 20.5,16.75 12,21.5 3.5,16.75 3.5,7.25"/><path d="M12 8v8M8.5 12h7"/>'],
 ['DISC 職場風格','自編職場題＋大五','區分日常性格與職場行為，找出主風格與輔風格。','<circle cx="12" cy="12" r="9"/><path d="M12 3v18M3 12h18"/>'],
 ['親密關係依附','ECR-12','以焦慮與逃避兩軸，對應四種依附型態與相處建議。','<circle cx="9" cy="12" r="6"/><circle cx="15" cy="12" r="6"/>'],
 ['霍蘭德職涯興趣','O*NET 改編','六種興趣類型組成你的三碼，對應工作環境與職業方向。','<path d="M4 8h16v11H4z"/><path d="M9 8V5h6v3M4 13h16"/>']];
document.getElementById('mods').innerHTML = MODS.map(m => `<div class="mod"><div class="ico"><svg viewBox="0 0 24 24">${m[3]}</svg></div><span class="src">${m[1]}</span><h3>${m[0]}</h3><p>${m[2]}</p></div>`).join('');

/* ---------- order & pages ---------- */
const byId = Object.fromEntries(ITEMS.map(i => [i.id, i]));
const rr = (arr, key) => { const b = new Map(); arr.forEach(i => { const k = key(i); if (!b.has(k)) b.set(k, []); b.get(k).push(i); }); const out = []; const qs = [...b.values()]; while (qs.some(q => q.length)) qs.forEach(q => q.length && out.push(q.shift())); return out; };
const chunk = (arr, n) => { const out = []; let s = 0; for (let k = 0; k < n; k++) { const len = Math.ceil((arr.length - s) / (n - k)); out.push(arr.slice(s, s + len)); s += len; } return out; };
const part1 = rr(ITEMS.filter(i => !['ECR-12依附','RIASEC職涯'].includes(i.g)), i => i.g === '核心大五' ? i.m[0][1] : i.g);
const part2 = rr(ITEMS.filter(i => i.g === 'ECR-12依附'), i => i.m[0][1]);
const part3 = rr(ITEMS.filter(i => i.g === 'RIASEC職涯'), i => i.m[0][1]);
const PAGES = [...chunk(part1, 10).map(q => ({s:1, q})), ...chunk(part2, 2).map(q => ({s:2, q})), ...chunk(part3, 3).map(q => ({s:3, q}))];
const SEC = {1:'第一段・性格與職場', 2:'第二段・親密關係', 3:'第三段・職涯興趣'};
const NUM = {}; [...part1, ...part2, ...part3].forEach((i, k) => NUM[i.id] = k + 1);

function insights(sc, dv) {
  const b = sc.big5, out = [];
  if (b.E <= 35 && sc.disc.I >= 60) out.push(['內向，但具目的性的影響力', `大五外向性 ${pct(b.E)}%，DISC 影響型卻有 ${pct(sc.disc.I)}%。你未必享受社交，但在工作需要時，能有意識地發揮說服力與感染力。`]);
  if (b.E >= 65 && sc.disc.I <= 40) out.push(['私下熱絡，職場收斂', `大五外向性 ${pct(b.E)}%，但職場影響型只有 ${pct(sc.disc.I)}%。你在生活中外放，在工作上則傾向先把事情做好，再談表現。`]);
  if (sc.ecr) {
    const a = sc.ecr['焦慮'];
    if (a > 50 && b.N >= 65) out.push(['不安感不只出現在感情裡', `依附焦慮 ${pct(a)}%，神經質 ${pct(b.N)}% 也偏高。這份擔心比較像整體的壓力反應，照顧好日常的情緒調節，對關係也會有幫助。`]);
    else if (a > 50 && b.N < 50) out.push(['平時穩定，唯獨在感情中較不安', `神經質只有 ${pct(b.N)}%，依附焦慮卻有 ${pct(a)}%。你的不安是針對親密關係的，值得和伴侶聊聊什麼樣的回應能讓你安心。`]);
    else if (a <= 50 && b.N >= 65) out.push(['生活壓力大，但在感情中相對安心', `神經質 ${pct(b.N)}%，依附焦慮只有 ${pct(a)}%。親密關係可能正是你的安全基地。`]);
  }
  const H = sc.hexaco.H;
  if (H >= 65 && b.A >= 65) out.push(['值得信賴的長期夥伴型', `誠實謙遜 ${pct(H)}%，親和性 ${pct(b.A)}%。你的友善出於真誠，而非出於策略，容易建立長久的信任。`]);
  else if (H >= 65 && b.A <= 35) out.push(['直率而真誠', `親和性 ${pct(b.A)}% 偏低，誠實謙遜卻有 ${pct(H)}%。你說話直接，但不會操弄別人，熟了之後很值得信任。`]);
  else if (H <= 35 && b.A >= 65) out.push(['親和中帶著現實考量', `親和性 ${pct(b.A)}%，誠實謙遜 ${pct(H)}%。你擅長讓人舒服，也懂得爭取利益，留意別讓人覺得友善帶有目的。`]);
  const near = AXES.filter(a => Math.abs(sc.mbti[a[0]] - 50) <= 5);
  if (near.length) out.push(['彈性雙棲的面向', `${near.map(a => `${a[3]}／${a[4]}`).join('、')}接近 50%，代表你會隨情境切換，而不是測驗不準。對應的大五分數通常也落在中間區段。`]);
  const t = dv.riTop, C = b.C;
  let car;
  if (t.includes('E') && sc.disc.D >= 60) car = ['適合開創與管理', `職涯三碼含企業型，加上 DISC 支配型 ${pct(sc.disc.D)}%，你有推動事情、承擔決策的動能，適合創業、業務開發或團隊管理。`];
  else if ((t.includes('I') || t.includes('A')) && C >= 60) car = ['適合專業深耕', `興趣偏向${t.includes('I') ? '研究' : '藝術'}型，盡責性 ${pct(C)}% 讓你能長期鑽研，適合往專業技術或創作領域深耕。`];
  else if (t.includes('S') && sc.disc.S >= 60) car = ['適合培育與支持角色', `社會型興趣搭配穩健型 ${pct(sc.disc.S)}%，你適合教育、輔導、人資等需要耐心陪伴的角色。`];
  else car = ['職涯方向的組合', `你的三碼 ${dv.ri3} 以${RS[t[0]]}為首。盡責性 ${pct(C)}%、DISC ${dv.disc} 型，可作為選擇工作節奏與團隊角色的參考。`];
  out.push(car);
  return out;
}
function portrait(sc, dv, who = '你') {
  const ex = Object.keys(B5).map(k => [k, sc.big5[k] - 50]).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]));
  const adj = ex.filter(e => Math.abs(e[1]) >= 12).slice(0, 2).map(e => ADJ[e[0]][e[1] > 0 ? 0 : 1]);
  const head = (adj.length ? adj.join('、') : '各面向相當均衡') + '的' + who;
  return `${head}，職場上以「${DS[dv.dMain]}」為主，${dv.ecr ? `在親密關係中接近「${dv.ecr}」，` : ''}職涯興趣以「${RS[dv.riTop[0]]}」為首。`;
}

/* ---------- state ---------- */
const KEY = 'innerAtlas.' + VERSION + '.';
const store = {
  get(k) { try { return JSON.parse(localStorage.getItem(KEY + k)); } catch (e) { return null; } },
  set(k, v) { try { localStorage.setItem(KEY + k, JSON.stringify(v)); } catch (e) {} },
  del(k) { try { localStorage.removeItem(KEY + k); } catch (e) {} }
};
const sess = {
  get(k) { try { return sessionStorage.getItem(KEY + k); } catch (e) { return null; } },
  set(k, v) { try { v == null ? sessionStorage.removeItem(KEY + k) : sessionStorage.setItem(KEY + k, v); } catch (e) {} }
};
let S = {ans:{}, page:-1, skipEcr:false, age:'', gender:''};
let RESULT = null, SAMPLE = false, saveNote = '', API = false;
const ownResult = () => RESULT;
const toast = (m, stay) => { const t = $('#toast'); t.textContent = m; t.classList.add('on'); clearTimeout(toast.h); if (!stay) toast.h = setTimeout(() => t.classList.remove('on'), 2400); };
const persist = () => store.set('draft', S);
function rid() {
  let id = store.get('rid');
  if (!id) { id = crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2, 12); store.set('rid', id); }
  return id;
}
async function api(path, opt = {}) {
  const res = await fetch('/api/' + path, {method: opt.method || 'GET', headers: {'content-type': 'application/json', ...(opt.headers || {})}, body: opt.body ? JSON.stringify(opt.body) : undefined});
  let data = null; try { data = await res.json(); } catch (e) {}
  if (!res.ok) { const err = new Error((data && data.error) || res.statusText); err.status = res.status; throw err; }
  return data;
}
const READY = COLLECT ? api('health').then(d => { API = !!(d && d.db); }).catch(() => { API = false; }) : Promise.resolve();
/* ---------- quiz ---------- */
const OPT = ['非常不符合','不太符合','普通','蠻符合','非常符合'];
function renderQuiz() {
  const body = $('#qBody'), n = Object.keys(S.ans).length;
  $('#qCnt').textContent = `${n} / ${ITEMS.length}`;
  $('#qBar').style.width = (n / ITEMS.length * 100) + '%';
  $('#hint').textContent = '';
  if (S.page < 0) {
    $('#qTitle').textContent = '作答前';
    const lead = `<p>接下來共 104 題，請依「平常的自己」選擇最符合的程度：1 非常不符合，5 非常符合。進度會自動保留在這個瀏覽器。</p>`;
    body.innerHTML = `<div class="intro"><h3>開始之前</h3>${lead}` + (COLLECT ? `
      <div class="form"><label for="age">年齡區間（選填）<select id="age">${['','18 歲以下','18–24','25–34','35–44','45–54','55 以上'].map(v => `<option value="${v}"${S.age === v ? ' selected' : ''}>${v || '不填'}</option>`).join('')}</select></label>
      <label for="gender">性別（選填）<select id="gender">${['','女','男','其他／不願透露'].map(v => `<option value="${v}"${S.gender === v ? ' selected' : ''}>${v || '不填'}</option>`).join('')}</select></label></div>
      <label class="consent" for="consent"><input type="checkbox" id="consent"${S.consent ? ' checked' : ''}><span>我同意將這次的作答與分數，以隨機產生的匿名代號提供本站做統計研究。不勾選也能正常作答與查看報告，資料只會留在你的瀏覽器。</span></label></div>`
      : `<p>你的作答與結果只會保存在這個瀏覽器，本站不會蒐集或上傳任何資料。</p></div>`);
    if (COLLECT) {
      $('#age').onchange = e => { S.age = e.target.value; persist(); };
      $('#gender').onchange = e => { S.gender = e.target.value; persist(); };
      $('#consent').onchange = e => { S.consent = e.target.checked; persist(); };
    }
    $('#prev').hidden = true; $('#next').textContent = n ? '繼續作答' : '開始作答'; return;
  }
  const P = PAGES[S.page], secPages = PAGES.filter(p => p.s === P.s), idx = secPages.indexOf(P) + 1;
  $('#qTitle').textContent = `${SEC[P.s]}（${idx}/${secPages.length}）`;
  $('#prev').hidden = false;
  let intro = '';
  if (P.s === 2 && idx === 1) intro = `<div class="intro"><h3>關於親密關係</h3><p>以下題目請想像你的伴侶或親密對象作答。若目前沒有伴侶，請依過去的親密關係，或你通常在親密關係中的樣子作答。</p><p><button class="btn ghost" id="skipEcr" type="button">${S.skipEcr ? '已略過，改為作答' : '略過這一段'}</button></p></div>`;
  if (P.s === 3 && idx === 1) intro = `<div class="intro"><h3>關於職涯興趣</h3><p>請依「你有多想做這類事情」作答，而不是「你有多擅長」。</p></div>`;
  const disabled = P.s === 2 && S.skipEcr;
  body.innerHTML = intro + `<div class="qlist"${disabled ? ' style="opacity:.4;pointer-events:none"' : ''}>${P.q.map(it => `<div class="q" id="q-${it.id}"><div class="qt"><span class="qn">第 ${NUM[it.id]} 題</span>${esc(it.t)}</div>
    <div class="opts" role="radiogroup" aria-label="第 ${NUM[it.id]} 題">${[1,2,3,4,5].map(v => `<button type="button" class="opt" role="radio" aria-checked="${S.ans[it.id] === v}" aria-label="${OPT[v-1]}" data-q="${it.id}" data-v="${v}">${v}</button>`).join('')}</div>
    <div class="ends"><span>非常不符合</span><span>非常符合</span></div></div>`).join('')}</div>`;
  const sk = $('#skipEcr'); if (sk) sk.onclick = () => { S.skipEcr = !S.skipEcr; persist(); renderQuiz(); };
  $('#next').textContent = S.page === PAGES.length - 1 ? '完成並查看報告' : '下一頁';
}
$('#qBody').addEventListener('click', e => {
  const b = e.target.closest('.opt'); if (!b) return;
  const q = b.dataset.q; S.ans[q] = +b.dataset.v; persist();
  b.parentNode.querySelectorAll('.opt').forEach(o => o.setAttribute('aria-checked', o === b));
  const card = b.closest('.q'); card.classList.remove('miss');
  const n = Object.keys(S.ans).length; $('#qCnt').textContent = `${n} / ${ITEMS.length}`; $('#qBar').style.width = (n / ITEMS.length * 100) + '%';
  const nx = card.nextElementSibling; if (nx && !S.ans[nx.id.slice(2)] && window.innerWidth < 900) nx.scrollIntoView({behavior:'smooth', block:'center'});
});
$('#prev').onclick = () => { S.page--; persist(); renderQuiz(); scrollTo(0, 0); };
$('#next').onclick = async () => {
  if (S.page >= 0) {
    const P = PAGES[S.page];
    const miss = (P.s === 2 && S.skipEcr) ? [] : P.q.filter(i => !S.ans[i.id]);
    if (miss.length) { miss.forEach(i => $('#q-' + i.id).classList.add('miss')); $('#q-' + miss[0].id).scrollIntoView({behavior:'smooth', block:'center'}); $('#hint').textContent = `還有 ${miss.length} 題未作答`; return; }
  }
  if (S.page === PAGES.length - 1) return finish();
  S.page++; persist(); renderQuiz(); scrollTo(0, 0);
};
async function finish() {
  const ans = {...S.ans}; if (S.skipEcr) ITEMS.filter(i => i.g === 'ECR-12依附').forEach(i => delete ans[i.id]);
  const sc = score(ans, S.skipEcr);
  const ok = COLLECT && !!S.consent;
  RESULT = {at: new Date().toISOString(), v: VERSION, ans, sc, skipEcr: S.skipEcr, age: ok ? S.age : '', gender: ok ? S.gender : '', consent: ok};
  SAMPLE = false; store.set('last', RESULT);
  S = {ans:{}, page:-1, skipEcr:false, age:RESULT.age, gender:RESULT.gender, consent:RESULT.consent}; persist();
  saveNote = ok ? '正在儲存…' : localNote(); location.hash = 'report'; route();
  await saveRemote(RESULT); if (location.hash === '#report') renderReport();
}
function localNote() { return COLLECT ? '你沒有勾選同意，結果只保存在這個瀏覽器。' : '你的作答只保存在這個瀏覽器，本站不會蒐集。'; }
async function saveRemote(r) {
  if (!r.consent) { saveNote = localNote(); return; }
  await READY;
  if (!API) { saveNote = '這個網站沒有連接資料庫，結果只保存在這個瀏覽器。'; return; }
  try {
    const d = await api('submit', {method: 'POST', body: {consent: true, respondentId: rid(), at: r.at, version: r.v, age: r.age, gender: r.gender, skipEcr: r.skipEcr, ans: r.ans}});
    r.id = d.id; store.set('last', r); saveNote = '已儲存到本站資料庫。';
  } catch (e) { saveNote = '儲存失敗，結果先保存在這個瀏覽器。'; }
}

/* ---------- charts ---------- */
const ROs = [];
const DRAW = {};
const paintFig = (el, fn) => { const W = el.clientWidth, H = el.clientHeight, sv = el.querySelector('svg'); if (!W || !H) return; sv.setAttribute('viewBox', `0 0 ${W} ${H}`); sv.innerHTML = fn(W, H); };
const TX = 'font-family="Noto Sans TC,PingFang TC,Microsoft JhengHei,sans-serif" fill="#4a3a30" stroke="#f1ece5" stroke-width="4" stroke-linejoin="round" paint-order="stroke"';
function radar(el, keys, names, vals) {
  const paint = (W, H) => {
    const n = keys.length, narrow = W < 420;
    const R = Math.min(W / 2 - (narrow ? 76 : 96), H / 2 - 40), cx = W / 2, cy = H / 2, fs = narrow ? 13 : 14;
    const pt = (i, v) => { const a = -Math.PI / 2 + i * 2 * Math.PI / n; return [cx + Math.cos(a) * R * v / 100, cy + Math.sin(a) * R * v / 100]; };
    const poly = v => keys.map((k, i) => pt(i, typeof v === 'number' ? v : v[k]).join(',')).join(' ');
    let s = [100, 65, 35].map(v => `<polygon points="${poly(v)}" fill="${v === 100 ? '#e4dcd1' : 'none'}" stroke="#b8ab9c" stroke-dasharray="${v === 100 ? '' : '4 4'}"/>`).join('');
    s += keys.map((k, i) => { const [x, y] = pt(i, 100); return `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="#b8ab9c"/>`; }).join('');
    s += `<polygon points="${poly(vals)}" fill="rgba(194,123,87,.3)" stroke="#c27b57" stroke-width="2.5" stroke-linejoin="round"/>`;
    s += keys.map((k, i) => { const [x, y] = pt(i, vals[k]); return `<circle cx="${x}" cy="${y}" r="4.5" fill="#c27b57"/>`; }).join('');
    s += keys.map((k, i) => { const a = -Math.PI / 2 + i * 2 * Math.PI / n, c = Math.cos(a), x = cx + c * (R + 14), y = cy + Math.sin(a) * (R + 14) + (Math.sin(a) > .3 ? 14 : Math.sin(a) < -.3 ? -6 : 5);
      const anc = Math.abs(c) < .2 ? 'middle' : c > 0 ? 'start' : 'end', tw = names[k].length * fs + 26;
      const xx = anc === 'start' ? Math.min(x, W - 6 - tw) : anc === 'end' ? Math.max(x, 6 + tw) : x;
      return `<text ${TX} x="${xx}" y="${y}" text-anchor="${anc}" font-size="${fs}"><tspan font-weight="700">${esc(names[k])}</tspan><tspan dx="5" fill="#a9623f" font-weight="700">${pct(vals[k])}</tspan></text>`; }).join('');
    return s;
  };
  DRAW[el.id] = paint;
  const draw = () => paintFig(el, paint);
  const ro = new ResizeObserver(draw); ro.observe(el); ROs.push(ro);
}
function quad(el, anx, av) {
  const paint = (W, H) => {
    const m = 40, w = W - m - 16, h = H - m - 16, x0 = m, y0 = 16;
    const X = v => x0 + v / 100 * w, Y = v => y0 + (1 - v / 100) * h;
    const fills = [['安全型', 0, 0], ['逃避型', 50, 0], ['焦慮型', 0, 50], ['恐懼逃避型', 50, 50]];
    let s = fills.map(([n, ax, ay], i) => `<rect x="${X(ax)}" y="${Y(ay + 50)}" width="${w / 2}" height="${h / 2}" fill="${i % 3 === 0 ? '#e4dcd1' : '#d7cdc0'}"/>`).join('');
    s += fills.map(([n, ax, ay]) => { const right = ax > 0, top = ay > 0; return `<text ${TX} x="${right ? X(100) - 10 : X(0) + 10}" y="${top ? Y(100) + 22 : Y(0) - 10}" text-anchor="${right ? 'end' : 'start'}" font-size="14" font-weight="700">${n}</text>`; }).join('');
    s += `<line x1="${X(50)}" y1="${y0}" x2="${X(50)}" y2="${y0 + h}" stroke="#8a7a6b" stroke-dasharray="4 4"/><line x1="${x0}" y1="${Y(50)}" x2="${x0 + w}" y2="${Y(50)}" stroke="#8a7a6b" stroke-dasharray="4 4"/>`;
    s += `<text ${TX} x="${x0 + w / 2}" y="${H - 8}" text-anchor="middle" font-size="13">逃避 →</text><text ${TX} transform="translate(16 ${y0 + h / 2}) rotate(-90)" text-anchor="middle" font-size="13">焦慮 →</text>`;
    s += `<circle cx="${X(av)}" cy="${Y(anx)}" r="16" fill="rgba(194,123,87,.25)"/><circle cx="${X(av)}" cy="${Y(anx)}" r="7" fill="#c27b57"/>`;
    return s;
  };
  DRAW[el.id] = paint;
  const draw = () => paintFig(el, paint);
  const ro = new ResizeObserver(draw); ro.observe(el); ROs.push(ro);
}
const rows = (keys, names, vals, top) => `<div class="rows">${keys.map(k => `<div class="row${top && top.includes(k) ? ' top' : ''}"><b>${names[k]}</b><div class="tr"><i style="width:${vals[k]}%"></i></div><span class="v">${pct(vals[k])}</span><span class="lv ${lvl(vals[k])}">${LV[lvl(vals[k])]}</span></div>`).join('')}</div>`;

/* ---------- report ---------- */
function renderReport() {
  ROs.splice(0).forEach(r => r.disconnect());
  const el = $('#rBody'), shared = SHOW === 'shared';
  if (shared && !SHARED) { el.innerHTML = `<div class="empty"><h2>分享的報告</h2><p style="margin-top:10px">${esc(sharedMsg)}</p><div class="actions"><a class="btn acc" href="#home">認識這個測驗</a></div></div>`; return; }
  const RESULT = shared ? SHARED : ownResult();
  if (!RESULT) { el.innerHTML = `<div class="empty"><h2>還沒有報告</h2><p style="margin-top:10px">完成 104 題後，這裡會出現你的六大測驗報告。</p><div class="actions"><a class="btn acc" href="#quiz">開始作答</a><button class="btn ghost" type="button" id="eSample">看範例報告</button></div></div>`; $('#eSample').onclick = showSample; return; }
  const sc = RESULT.sc, dv = derive(sc), b = sc.big5, d = new Date(RESULT.at), who = shared ? (RESULT.name || '對方') : '你';
  const when = `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  const b5top = Object.keys(B5).sort((x, y) => Math.abs(b[y] - 50) - Math.abs(b[x] - 50))[0];
  const tags = [['大五最突出', `${B5[b5top]} ${LV[lvl(b[b5top])]}`], ['16 型人格', dv.code], ['誠實謙遜', `${LV[lvl(sc.hexaco.H)]}（${pct(sc.hexaco.H)}%）`], ['DISC 職場', `${dv.disc} 型`], ['依附類型', dv.ecr || '已略過'], ['職涯三碼', dv.ri3]];
  const ins = insights(sc, dv);
  const ax = AXES.map(a => { const v = sc.mbti[a[0]], win0 = v > 50, flex = Math.abs(v - 50) <= 5, x = 100 - v;
    return `<div class="ax"><div class="p${win0 ? ' win' : ''}"><b>${a[1]}</b>${a[3]}<em>${pct(v)}%</em></div><div class="at"><i style="left:${Math.min(x, 50)}%;width:${Math.abs(50 - x)}%"></i></div><div class="p r${win0 ? '' : ' win'}"><b>${a[2]}</b>${a[4]}<em>${pct(100 - v)}%</em></div></div>`; }).join('');
  const axCards = AXES.map(a => { const v = sc.mbti[a[0]], flex = Math.abs(v - 50) <= 5, w0 = v > 50;
    return `<div class="cd"><h3>${a[3]}／${a[4]}<small>${flex ? '高度彈性雙棲' : (w0 ? a[1] : a[2]) + ' ' + pct(w0 ? v : 100 - v) + '%'}</small></h3><p>${flex ? `兩端相當接近：${a[5].replace('。', '')}；也${a[6]}` : (w0 ? a[5] : a[6])}</p></div>`; }).join('');
  el.innerHTML = `
  <div id="rCard"><div class="ticket"><div class="main">
    <div class="pdf-only brandline"><span class="mark">Inner Atlas</span><span>心象研究所・六合一人格測驗</span></div>
    <div class="tk-top"><span>${SAMPLE && !shared ? '<span class="sample">範例報告・模擬作答</span>' : shared ? '分享的報告' : '綜合報告'}</span><span class="tk-no">${when}</span></div>
    <h1>${esc(who)}的六合一報告</h1>
    <p class="portrait">${portrait(sc, dv, esc(who))}</p>
    <div class="tags">${tags.map(t => `<div class="tag"><span>${t[0]}</span><b>${esc(t[1])}</b></div>`).join('')}</div>
    <div class="pdf-only cardfoot"><span>大五・16 型・HEXACO・DISC・依附・霍蘭德</span><span>僅供自我探索參考</span></div>
  </div><div class="stub">
    ${shared ? `<h3>想認識自己？</h3><p>${esc(who)}在心象研究所完成了六合一人格測驗。你也可以花 15 分鐘試試看。</p>
    <a class="btn acc" href="#home">我也要測</a>
    <button class="btn ghost" type="button" id="exPdf">下載 PDF 報告</button>
    <button class="btn ghost" type="button" id="exCard">下載摘要圖卡</button>` : `<h3>匯出與分享</h3><p>${esc(SAMPLE ? '這是模擬作答產生的範例，不會儲存，也無法建立分享連結。' : saveNote)}</p>
    <button class="btn" type="button" id="exPdf">下載 PDF 報告</button>
    <button class="btn ghost" type="button" id="exCard">下載摘要圖卡</button>
    ${SAMPLE ? '' : `<button class="btn ghost" type="button" id="shrOpen" aria-expanded="false">分享連結</button>
    <div class="shr" id="shrBox" hidden>
      <label for="shrName">顯示名稱（選填）<input id="shrName" maxlength="20" placeholder="例如：小安"></label>
      <button class="btn" type="button" id="shrGo">產生連結</button>
      <div id="shrOut" hidden><label for="shrUrl">分享連結<input id="shrUrl" readonly></label>
        <div class="actions" style="margin-top:8px"><button class="btn ghost" type="button" id="shrCopy">複製連結</button></div></div>
      <p id="shrMsg">分數與顯示名稱直接寫在連結裡，本站不會儲存。拿到連結的人都能看到，傳出後無法收回。</p>
    </div>`}
    <a class="btn acc" href="#quiz" id="again">重新作答</a>`}
  </div></div></div>
  <div class="jump" id="jump">${[['s-ov','綜合總覽'],['s-b5','大五人格'],['s-mb','16 型人格'],['s-hx','HEXACO'],['s-ds','DISC'],['s-ec','依附類型'],['s-ri','職涯興趣']].map(j => `<button type="button" data-j="${j[0]}">${j[1]}</button>`).join('')}</div>

  <div class="sec" id="s-ov"><div class="sec-h"><h2>跨測驗交叉亮點</h2><p>把不同測驗放在一起看，才看得出的反差</p></div><div class="ins">${ins.map(i => `<div class="cd"><h3>${i[0]}</h3><p>${i[1]}</p></div>`).join('')}</div></div>

  <div class="sec" id="s-b5"><div class="sec-h"><h2>大五人格</h2><p>低 ≤35%・中 36–64%・高 ≥65%，高低皆有優勢與盲點</p></div>
    <div class="two"><div class="fig" id="fB5"><svg></svg></div>${rows(Object.keys(B5), B5, b)}</div>
    <div class="cards">${Object.keys(B5).map(k => { const L = lvl(b[k]), t = B5T[k][L]; return `<div class="cd"><h3>${B5[k]}<small>${LV[L]}・${pct(b[k])}%</small></h3><p><b>優勢</b>　${t[0]}</p><p><b>留意</b>　${t[1]}</p></div>`; }).join('')}</div></div>

  <div class="sec" id="s-mb"><div class="sec-h"><h2>16 型人格</h2><p>由大五相關題推估，非官方 MBTI®；45–55% 為彈性雙棲</p></div>
    <div class="two"><div><div class="big">${dv.code}</div><p style="margin-top:12px;color:var(--ink2)">百分比代表傾向的強度。越接近 50%，越可能隨情境切換；超過 65% 才是穩定的偏好。</p></div><div class="axes">${ax}</div></div>
    <div class="cards">${axCards}</div></div>

  <div class="sec" id="s-hx"><div class="sec-h"><h2>HEXACO 六大人格</h2><p>重點在大五沒有的「誠實謙遜」</p></div>
    <div class="two"><div class="fig" id="fHX"><svg></svg></div><div>${rows(Object.keys(HX), HX, sc.hexaco, ['H'])}
    <div class="cd" style="margin-top:18px;border-left:4px solid var(--acc)"><h3>誠實謙遜 H<small>${LV[lvl(sc.hexaco.H)]}・${pct(sc.hexaco.H)}%</small></h3><p>${HXT.H[lvl(sc.hexaco.H)]}</p></div></div></div>
    <div class="cards">${Object.keys(HX).filter(k => k !== 'H').map(k => `<div class="cd"><h3>${HX[k]}<small>${LV[lvl(sc.hexaco[k])]}・${pct(sc.hexaco[k])}%</small></h3><p>${HXT[k][lvl(sc.hexaco[k])]}</p></div>`).join('')}</div></div>

  <div class="sec" id="s-ds"><div class="sec-h"><h2>DISC 職場風格</h2><p>取最高為主風格、次高為輔風格</p></div>
    <div class="two"><div><div class="big">${dv.disc}</div><p style="margin-top:12px">${DS[dv.dMain]}為主，${DS[dv.dSub]}為輔。聚焦你在團隊溝通、決策速度與壓力下的工作反應。</p></div>${rows(['D','I','S','C'], DS, sc.disc, [dv.dMain, dv.dSub])}</div>
    <div class="cards">${[dv.dMain, dv.dSub].map((k, i) => `<div class="cd"><h3>${DS[k]}<small>${i ? '輔風格' : '主風格'}・${pct(sc.disc[k])}%</small></h3><p><b>特色</b>　${DST[k][0]}</p><p><b>壓力下</b>　${DST[k][1]}</p><p>${DST[k][2]}</p></div>`).join('')}</div></div>

  <div class="sec" id="s-ec"><div class="sec-h"><h2>親密關係依附</h2><p>焦慮與逃避各以 50% 為界，超過即視為偏高</p></div>
    ${sc.ecr ? `<div class="two"><div class="fig" id="fEC"><svg></svg></div><div><div class="big" style="font-size:clamp(36px,5vw,52px)">${dv.ecr}</div>
      <div class="rows" style="margin:18px 0">${['焦慮','逃避'].map(k => `<div class="row"><b>依附${k}</b><div class="tr"><i style="width:${sc.ecr[k]}%"></i></div><span class="v">${pct(sc.ecr[k])}</span><span class="lv ${sc.ecr[k] > 50 ? 'h' : 'l'}">${sc.ecr[k] > 50 ? '偏高' : '偏低'}</span></div>`).join('')}</div>
      <div class="cd"><p><b>關係模式</b>　${ECRT[dv.ecr][0]}</p><p><b>練習建議</b>　${ECRT[dv.ecr][1]}</p></div></div></div>` : `<p>${esc(who)}略過了這一段，所以沒有依附類型的結果。</p>`}</div>

  <div class="sec" id="s-ri"><div class="sec-h"><h2>霍蘭德職涯興趣</h2><p>前三高組成你的三碼；測的是興趣，不是能力</p></div>
    <div class="two"><div class="fig" id="fRI"><svg></svg></div><div><div class="big">${dv.riTop.join('-')}</div><p style="margin:12px 0 18px">${dv.riTop.map(k => RS[k]).join('、')}</p>${rows('RIASEC'.split(''), RS, sc.riasec, dv.riTop)}</div></div>
    <div class="cards">${dv.riTop.map((k, i) => `<div class="cd"><h3>${RS[k]}<small>第 ${i + 1} 碼・${pct(sc.riasec[k])}%</small></h3><p>${RST[k][0]}</p><p><b>適合環境</b>　${RST[k][1]}</p><p><b>職業方向</b>　${RST[k][2]}</p></div>`).join('')}</div></div>`;
  radar($('#fB5'), Object.keys(B5), B5, b);
  radar($('#fHX'), Object.keys(HX), HX, sc.hexaco);
  radar($('#fRI'), 'RIASEC'.split(''), RS, sc.riasec);
  if (sc.ecr) quad($('#fEC'), sc.ecr['焦慮'], sc.ecr['逃避']);
  $('#jump').onclick = e => { const t = e.target.closest('[data-j]'); if (t) document.getElementById(t.dataset.j).scrollIntoView({behavior:'smooth'}); };
  const stem = `心象研究所_六合一報告_${String(RESULT.at).slice(0, 10)}`;
  $('#exPdf').onclick = () => exportFile('pdf', stem);
  CUR = {R: RESULT, who, when};
  $('#exCard').onclick = () => exportFile('card', stem);
  if ($('#shrOpen')) wireShare(RESULT);
}
function showSample() {
  let sd = 20260524; const rnd = () => (sd = sd * 16807 % 2147483647) / 2147483647;
  const lean = {'big5:E':-.9,'big5:A':.9,'big5:C':.7,'big5:N':.4,'big5:O':1,'hexaco:H':.9,'disc:D':-.4,'disc:I':.9,'disc:S':.6,'disc:C':.3,'ecr:焦慮':.7,'ecr:逃避':-.6,'riasec:R':-1,'riasec:I':.6,'riasec:A':1,'riasec:S':.9,'riasec:E':-.3,'riasec:C':0,'mbti:T':-.5,'mbti:P':.3,'mbti:S':-.6};
  const ans = {};
  for (const it of ITEMS) {
    const [t, dn, w] = it.m.find(m => m[0] !== 'mbti') || it.m[0];
    const l = (lean[t + ':' + dn] ?? 0) * Math.sign(w);
    ans[it.id] = Math.max(1, Math.min(5, Math.round(3 + l * 1.4 + (rnd() - .5) * 1.6)));
  }
  RESULT = {at: new Date().toISOString(), v: VERSION, ans, sc: score(ans, false), skipEcr: false, age: '', gender: ''};
  SAMPLE = true; location.hash = 'report'; route();
}

/* ---------- export ---------- */
const IDS = ITEMS.map(i => i.id);
function toCsv(list) {
  const sk = {big5: Object.keys(B5), mbti: AXES.map(a => a[0]), hexaco: Object.keys(HX), disc: ['D','I','S','C'], ecr: ['焦慮','逃避'], riasec: 'RIASEC'.split('')};
  const head = ['匿名代號','作答時間','題庫版本','年齡區間','性別','略過依附', ...IDS, ...Object.entries(sk).flatMap(([t, ks]) => ks.map(k => t === 'mbti' ? `mbti_${k}(${k[0]}%)` : `${t}_${k}`)), '16型','DISC型','依附類型','職涯三碼'];
  const q = v => { const s = String(v ?? ''); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
  const lines = list.map(({uid: u, r}) => { const dv = derive(r.sc); return [u, r.at, r.v, r.age, r.gender, r.skipEcr ? 1 : 0, ...IDS.map(i => r.ans[i] ?? ''), ...Object.entries(sk).flatMap(([t, ks]) => ks.map(k => r.sc[t] && r.sc[t][k] != null ? r.sc[t][k].toFixed(1) : '')), dv.code, dv.disc, dv.ecr || '', dv.ri3].map(q).join(','); });
  return '﻿' + [head.map(q).join(','), ...lines].join('\n');
}
function save(name, data) {
  const type = name.endsWith('.csv') ? 'text/csv;charset=utf-8' : name.endsWith('.json') ? 'application/json' : '';
  const blob = data instanceof Blob ? data : new Blob([data], {type});
  const url = URL.createObjectURL(blob), a = document.createElement('a');
  a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
  toast('已下載');
}
/* ---------- PDF / image / share ---------- */
const LIBS = ['assets/vendor/html2canvas.min.js', 'assets/vendor/jspdf.umd.min.js'];
const LOADED = {};
const loadJs = src => LOADED[src] ??= new Promise((ok, no) => { const t = document.createElement('script'); t.src = src; t.onload = ok; t.onerror = () => { delete LOADED[src]; no(new Error('load')); }; document.head.appendChild(t); });
const shot = (node, img) => window.html2canvas(node, {scale: 2, windowWidth: 1100, backgroundColor: img ? '#3b2a22' : '#f1ece5', logging: false,
  onclone: d => { const scd = d.getElementById('shareCard'); if (scd) scd.style.left = '0'; d.documentElement.classList.add('pdf'); if (img) d.documentElement.classList.add('img'); d.querySelectorAll('.fig').forEach(f => { if (!DRAW[f.id]) return; const im = d.createElement('img'); im.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:contain'; im.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="1040" height="720" viewBox="0 0 520 360">${DRAW[f.id](520, 360)}</svg>`); f.querySelector('svg').replaceWith(im); }); }});
let busy = false;
async function buildPdf() {
  const {jsPDF} = window.jspdf, doc = new jsPDF({unit: 'mm', format: 'a4'});
  const PW = 210, PH = 297, M = 12, CW = PW - 2 * M, GAP = 5, BOT = PH - M - 4;
  const bg = () => { doc.setFillColor(241, 236, 229); doc.rect(0, 0, PW, PH, 'F'); };
  const add = (cv, y, h) => doc.addImage(cv.toDataURL('image/jpeg', .9), 'JPEG', M, y, CW, h);
  bg(); let y = M;
  const blocks = [$('#rCard'), ...document.querySelectorAll('#rBody .sec')];
  for (let k = 0; k < blocks.length; k++) {
    toast(`正在產生 PDF（${k + 1}/${blocks.length}）…`, true);
    const c = await shot(blocks[k]), pxmm = c.width / CW, h = c.height / pxmm;
    if (y + h > BOT && y > M) { doc.addPage(); bg(); y = M; }
    if (h <= BOT - M) { add(c, y, h); y += h + GAP; continue; }
    let off = 0;
    while (off < c.height) {
      const hp = Math.min(c.height - off, Math.floor((BOT - y) * pxmm)), part = document.createElement('canvas');
      part.width = c.width; part.height = hp; part.getContext('2d').drawImage(c, 0, off, c.width, hp, 0, 0, c.width, hp);
      add(part, y, hp / pxmm); off += hp; y += hp / pxmm + GAP;
      if (off < c.height) { doc.addPage(); bg(); y = M; }
    }
  }
  const n = doc.getNumberOfPages();
  for (let i = 1; i <= n; i++) { doc.setPage(i); doc.setFontSize(8); doc.setTextColor(106, 90, 77); doc.text(`Inner Atlas  |  ${i} / ${n}`, PW / 2, PH - 6, {align: 'center'}); }
  return doc.output('blob');
}
let CUR = null;
function cardHtml() {
  const {R: r, who, when} = CUR, sc = r.sc, dv = derive(sc);
  const bars = (keys, names, vals, top) => keys.map(k => `<div class="sc-r${top.includes(k) ? ' top' : ''}"><span>${names[k]}</span><div class="sc-t"><i style="width:${vals[k]}%"></i></div><span class="sc-v">${pct(vals[k])}%</span></div>`).join('');
  const topOf = (vals, n) => Object.keys(vals).sort((a, b) => vals[b] - vals[a]).slice(0, n);
  const mod = (title, tag, body) => `<div class="sc-m"><div class="sc-mh"><b>${title}</b>${tag ? `<em>${tag}</em>` : ''}</div>${body}</div>`;
  const axes = AXES.map(a => { const v = sc.mbti[a[0]], x = 100 - v, w0 = v > 50;
    return `<div class="sc-a"><span class="${w0 ? 'w' : ''}">${a[1]} ${a[3]} ${pct(v)}</span><div class="sc-at"><i style="left:${Math.min(x, 50)}%;width:${Math.abs(50 - x)}%"></i></div><span class="r ${w0 ? '' : 'w'}">${pct(100 - v)} ${a[4]} ${a[2]}</span></div>`; }).join('');
  const ecr = sc.ecr ? bars(['焦慮','逃避'], {'焦慮':'依附焦慮','逃避':'依附逃避'}, sc.ecr, []) + `<p class="sc-note">${ECRT[dv.ecr][0]}</p>` : `<p class="sc-note">${esc(who)}略過了這一段。</p>`;
  return `<div class="sc-in">
    <div class="sc-top"><div><span class="mark">Inner Atlas</span><small>心象研究所・六合一人格測驗</small></div><span class="sc-date">${when}</span></div>
    <div class="sc-h">${esc(who)}的六合一報告</div>
    <p class="sc-p">${portrait(sc, dv, esc(who))}</p>
    <div class="sc-grid">
      ${mod('大五人格', '', bars(Object.keys(B5), B5, sc.big5, topOf(sc.big5, 1)))}
      ${mod('16 型人格', dv.code, axes)}
      ${mod('HEXACO 六大人格', '', bars(Object.keys(HX), HX, sc.hexaco, ['H']))}
      ${mod('DISC 職場風格', dv.disc, bars(['D','I','S','C'], DS, sc.disc, [dv.dMain, dv.dSub]) + `<p class="sc-note">${DS[dv.dMain]}為主、${DS[dv.dSub]}為輔：${DST[dv.dMain][0]}</p>`)}
      ${mod('親密關係依附', dv.ecr || '已略過', ecr)}
      ${mod('霍蘭德職涯興趣', dv.riTop.join('-'), bars('RIASEC'.split(''), RS, sc.riasec, dv.riTop))}
    </div>
    <div class="sc-f"><span>大五・16 型・HEXACO・DISC・依附・霍蘭德</span><span>僅供自我探索參考</span></div></div>`;
}
async function exportFile(kind, stem) {
  if (busy) return; busy = true;
  const btn = $({pdf: '#exPdf', card: '#exCard'}[kind]), label = btn.textContent; btn.disabled = true; btn.textContent = '產生中…';
  try {
    toast('正在準備…', true);
    await Promise.all(kind === 'pdf' ? LIBS.map(loadJs) : [loadJs(LIBS[0])]);
    if (document.fonts && document.fonts.ready) await document.fonts.ready;
    let blob, name;
    if (kind === 'pdf') { blob = await buildPdf(); name = `${stem}.pdf`; }
    else {
      let c;
      { const el = $('#shareCard'); el.innerHTML = cardHtml(); c = await shot(el, true); el.innerHTML = ''; name = `${stem}_摘要圖卡.png`; }
      blob = await new Promise(r => c.toBlob(r, 'image/png'));
    }
    toast('檔案已產生');
    await save(name, blob);
  } catch (e) { toast('產生失敗，請確認網路連線後再試一次'); }
  finally { busy = false; btn.disabled = false; btn.textContent = label; }
}
// 分享連結：把各維度分數與顯示名稱編碼進網址，不需要資料庫。
// 格式（位元組）：版本 1｜旗標（bit0 略過依附）｜作答時間（2020 年起的分鐘數，3 bytes）｜28 個分數 ×10（各 2 bytes）｜顯示名稱 UTF-8
const SKEYS = [['big5', ['E','A','C','N','O']], ['mbti', ['EI','SN','TF','JP','AT']], ['hexaco', ['H','E_hex','X','A','C','O']], ['disc', ['D','I','S','C']], ['ecr', ['焦慮','逃避']], ['riasec', ['R','I','A','S','E','C']]];
const EPOCH = Date.UTC(2020, 0, 1);
const b64u = bytes => btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const unb64u = t => Uint8Array.from(atob(t.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((t.length + 3) % 4)), c => c.charCodeAt(0));
function encodeShare(r, name) {
  const min = Math.max(0, Math.min(16777215, Math.round((Date.parse(r.at) - EPOCH) / 6e4) || 0));
  const out = [1, r.skipEcr ? 1 : 0, min >> 16 & 255, min >> 8 & 255, min & 255];
  for (const [t, ks] of SKEYS) for (const k of ks) { const v = Math.max(0, Math.min(1000, Math.round(((r.sc[t] && r.sc[t][k]) ?? 50) * 10))); out.push(v >> 8, v & 255); }
  out.push(...new TextEncoder().encode(name.slice(0, 20)));
  return b64u(out);
}
function decodeShare(t) {
  const b = unb64u(t);
  if (b[0] !== 1 || b.length < 61) throw new Error('bad');
  const skip = !!(b[1] & 1), min = b[2] * 65536 + b[3] * 256 + b[4], sc = {};
  let i = 5;
  for (const [tt, ks] of SKEYS) { const o = {}; for (const k of ks) { o[k] = (b[i] * 256 + b[i + 1]) / 10; i += 2; } if (!(tt === 'ecr' && skip)) sc[tt] = o; }
  let name = ''; try { name = new TextDecoder('utf-8', {fatal: true}).decode(b.slice(i)); } catch (e) {}
  return cleanShared({at: new Date(EPOCH + min * 6e4).toISOString(), version: VERSION, skipEcr: skip, sc, name});
}
function wireShare(R0) {
  const box = $('#shrBox'), out = $('#shrOut');
  $('#shrOpen').onclick = () => { box.hidden = !box.hidden; $('#shrOpen').setAttribute('aria-expanded', String(!box.hidden)); };
  $('#shrGo').onclick = async () => {
    $('#shrUrl').value = location.origin + location.pathname + '#r-' + encodeShare(R0, $('#shrName').value.trim());
    out.hidden = false;
    try { await navigator.clipboard.writeText($('#shrUrl').value); toast('已複製分享連結'); } catch (e) { $('#shrUrl').select(); toast('連結已產生，請手動複製'); }
  };
  $('#shrCopy').onclick = async () => { try { await navigator.clipboard.writeText($('#shrUrl').value); toast('已複製分享連結'); } catch (e) { $('#shrUrl').select(); toast('請手動複製連結'); } };
}
const num = v => { const n = Number(v); return Number.isFinite(n) ? Math.max(0, Math.min(100, n)) : 50; };
function cleanShared(x) {
  const keys = Object.fromEntries(SKEYS);
  const sc = {};
  for (const t in keys) { if (t === 'ecr' && (x.skipEcr || !x.sc || !x.sc.ecr)) continue; sc[t] = {}; keys[t].forEach(k => sc[t][k] = num(x.sc && x.sc[t] && x.sc[t][k])); }
  const at = isNaN(Date.parse(x.at)) ? new Date().toISOString() : new Date(x.at).toISOString();
  return {at, v: String(x.version || ''), sc, skipEcr: !sc.ecr, name: String(x.name || '').replace(/[\u0000-\u001f]/g, '').slice(0, 20)};
}
let SHOW = null, SHARED = null, sharedMsg = '';
function loadShared(h) {
  SHARED = null;
  try { SHARED = decodeShare(h); } catch (e) { sharedMsg = '這個分享連結不完整或已損壞，請向對方再要一次。'; }
  renderReport();
}

/* ---------- admin ---------- */
let ALL = [];
const panel = h => `<div class="sec" style="margin-top:0">${h}</div>`;
async function renderAdmin(msg) {
  const el = $('#aBody');
  if (!COLLECT) { el.innerHTML = `<div class="empty"><h2>資料管理</h2><p style="margin-top:10px">本站目前沒有開啟資料蒐集，所以沒有作答資料。若要開啟，請見專案 README 的「開啟資料蒐集」。</p></div>`; return; }
  await READY;
  if (!API) { el.innerHTML = `<div class="empty"><h2>資料管理</h2><p style="margin-top:10px">這個網站沒有連接資料庫，所以沒有可管理的作答資料。設定方式請見專案的 README。</p></div>`; return; }
  const pw = sess.get('admin');
  if (!pw) {
    el.innerHTML = panel(`<h2>資料管理</h2><form id="admForm" class="form" style="max-width:520px;grid-template-columns:minmax(0,1fr) auto;align-items:end">
      <label for="admPw">管理密碼<input id="admPw" type="password" autocomplete="current-password" required style="min-height:46px;border-radius:10px;border:1.5px solid var(--line);background:var(--paper);padding:0 12px;font-size:16px"></label>
      <button class="btn" type="submit">登入</button></form><p class="status" id="admMsg">${esc(msg || '請輸入部署時設定的 ADMIN_PASSWORD。')}</p>`);
    $('#admForm').onsubmit = e => { e.preventDefault(); sess.set('admin', $('#admPw').value); renderAdmin(); };
    return;
  }
  el.innerHTML = panel('<p>讀取中…</p>');
  try {
    const rows = []; let before = '';
    do {
      const d = await api('admin?limit=1000' + (before ? '&before=' + encodeURIComponent(before) : ''), {headers: {'x-admin-password': pw}});
      rows.push(...(d.rows || [])); before = d.next || '';
      if (before) el.innerHTML = panel(`<p>讀取中…已取得 ${rows.length} 筆</p>`);
    } while (before);
    ALL = rows.map(x => ({uid: x.respondentId, r: {at: x.takenAt || x.createdAt, v: x.version, age: x.age, gender: x.gender, skipEcr: x.skipEcr, ans: x.answers || {}, sc: x.scores}})).filter(x => x.r.sc);
  } catch (e) {
    if (e.status === 401) { sess.set('admin', null); return renderAdmin('密碼不正確，請再試一次。'); }
    el.innerHTML = panel(`<p>讀取失敗：${esc(e.message)}</p>`); return;
  }
  $('#adminLink').hidden = false;
  const people = new Set(ALL.map(x => x.uid)).size, skipped = ALL.filter(x => x.r.skipEcr).length;
  const avg = k => ALL.length ? pct(ALL.reduce((s, x) => s + x.r.sc.big5[k], 0) / ALL.length) : '–';
  el.innerHTML = panel(`<div class="sec-h"><h2>作答資料</h2><div class="actions"><button class="btn" id="exCsv" type="button">匯出全部 CSV</button><button class="btn ghost" id="exJson" type="button">匯出 JSON</button><button class="btn ghost" id="reAdm" type="button">重新整理</button><button class="btn ghost" id="outAdm" type="button">登出</button></div></div>
    <div class="kpis"><div><span>作答人數</span><b>${people}</b></div><div><span>作答次數</span><b>${ALL.length}</b></div><div><span>略過依附段</span><b>${skipped}</b></div><div><span>平均外向性</span><b>${avg('E')}</b></div><div><span>平均神經質</span><b>${avg('N')}</b></div></div>
    ${ALL.length ? `<div class="scroll"><table><thead><tr><th>作答時間</th><th>匿名代號</th><th>年齡</th><th>性別</th><th>16 型</th><th>DISC</th><th>依附</th><th>三碼</th><th>H</th></tr></thead><tbody>${ALL.slice(0, 200).map(({uid: u, r}) => { const dv = derive(r.sc); return `<tr><td>${esc(String(r.at).slice(0, 16).replace('T', ' '))}</td><td>${esc(String(u).slice(0, 8))}</td><td>${esc(r.age || '–')}</td><td>${esc(r.gender || '–')}</td><td>${esc(dv.code)}</td><td>${esc(dv.disc)}</td><td>${esc(dv.ecr || '略過')}</td><td>${esc(dv.ri3)}</td><td>${pct(r.sc.hexaco.H)}</td></tr>`; }).join('')}</tbody></table></div><p class="status">表格顯示最新 200 筆；匯出包含全部 ${ALL.length} 筆的 104 題原始作答與各維度分數。</p>` : '<p>還沒有人完成測驗。</p>'}`);
  const stamp = new Date().toISOString().slice(0, 10);
  $('#exCsv').onclick = () => save(`心象研究所_全部作答_${stamp}.csv`, toCsv(ALL));
  $('#exJson').onclick = () => save(`心象研究所_全部作答_${stamp}.json`, JSON.stringify(ALL, null, 1));
  $('#reAdm').onclick = () => renderAdmin();
  $('#outAdm').onclick = () => { sess.set('admin', null); $('#adminLink').hidden = true; renderAdmin(); };
}

/* ---------- routing & boot ---------- */
function route() {
  const h = location.hash.slice(1), sh = /^r-[A-Za-z0-9_-]{60,400}$/.test(h);
  SHOW = sh ? 'shared' : null;
  const v = sh ? 'report' : ['home','quiz','report','admin'].includes(h) ? h : 'home';
  document.querySelectorAll('.view').forEach(s => s.classList.toggle('on', s.id === 'v-' + v));
  document.querySelectorAll('#links a').forEach(a => a.dataset.v === v && !sh ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current'));
  if (v === 'quiz') renderQuiz();
  if (sh) loadShared(h.slice(2)); else if (v === 'report') renderReport();
  if (v === 'admin') renderAdmin();
  scrollTo(0, 0);
}
addEventListener('hashchange', route);
$('#ctaSample').onclick = showSample;
const d0 = store.get('draft'); if (d0 && d0.ans) S = d0;
const l0 = store.get('last'); if (l0 && l0.sc) { RESULT = l0; saveNote = '這是你在這個瀏覽器的最近一次結果。'; }
$('#dataNote').textContent = COLLECT
  ? '開始作答前可以選擇是否同意提供資料。同意的話，作答與分數會以隨機產生的匿名代號存入本站資料庫，只有網站管理者能檢視，用於統計研究；不同意也能正常作答。'
  : '你的作答與結果只會保存在這個瀏覽器，本站不會蒐集或上傳任何資料。可以下載 PDF 報告與摘要圖卡留存。';
if (sess.get('admin')) $('#adminLink').hidden = false;
route();

}
