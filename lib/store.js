// 資料儲存層。
// 有 DATABASE_URL（或 POSTGRES_URL）時使用 Postgres（建議 Vercel Marketplace 的 Neon）；
// 本機開發沒有設定資料庫時改用記憶體，重新啟動就會清空；
// 部署在 Vercel 卻沒設定資料庫時回傳 null，前端會改為「只存在瀏覽器」模式。

function memoryStore() {
  const g = (globalThis.__innerAtlasMemory ??= {responses: [], shares: new Map()});
  return {
    kind: 'memory',
    async addResponse(r) { g.responses.push({...r, createdAt: new Date().toISOString()}); },
    async listResponses(limit, before) { return g.responses.filter(r => !before || r.createdAt < before).slice(-limit).reverse(); },
    async getShare(id) { return g.shares.get(id) || null; },
    async putShare(s) { const old = g.shares.get(s.id); g.shares.set(s.id, {...s, createdAt: old ? old.createdAt : new Date().toISOString()}); },
    async deleteShare(id) { g.shares.delete(id); }
  };
}

function postgresStore(url) {
  const {neon} = require('@neondatabase/serverless');
  const sql = neon(url);
  let ready = null;
  const init = () => (ready ??= (async () => {
    await sql`CREATE TABLE IF NOT EXISTS responses (
      id text PRIMARY KEY,
      respondent_id text NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now(),
      taken_at timestamptz,
      version text,
      age text,
      gender text,
      skip_ecr boolean NOT NULL DEFAULT false,
      answers jsonb NOT NULL,
      scores jsonb NOT NULL)`;
    await sql`CREATE INDEX IF NOT EXISTS responses_created_idx ON responses (created_at DESC)`;
    await sql`CREATE TABLE IF NOT EXISTS shares (
      id text PRIMARY KEY,
      edit_token_hash text NOT NULL,
      name text,
      version text,
      skip_ecr boolean NOT NULL DEFAULT false,
      taken_at timestamptz,
      scores jsonb NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now())`;
  })().catch(e => { ready = null; throw e; }));
  const iso = v => (v == null ? null : new Date(v).toISOString());
  const obj = v => (typeof v === 'string' ? JSON.parse(v) : v);
  return {
    kind: 'postgres',
    async addResponse(r) {
      await init();
      await sql`INSERT INTO responses (id, respondent_id, taken_at, version, age, gender, skip_ecr, answers, scores)
        VALUES (${r.id}, ${r.respondentId}, ${r.takenAt}, ${r.version}, ${r.age}, ${r.gender}, ${r.skipEcr},
                ${JSON.stringify(r.answers)}::jsonb, ${JSON.stringify(r.scores)}::jsonb)`;
    },
    async listResponses(limit, before) {
      await init();
      const rows = before
        ? await sql`SELECT *, created_at::text AS cursor FROM responses WHERE created_at < ${before}::timestamptz ORDER BY created_at DESC LIMIT ${limit}`
        : await sql`SELECT *, created_at::text AS cursor FROM responses ORDER BY created_at DESC LIMIT ${limit}`;
      return rows.map(x => ({id: x.id, cursor: x.cursor, respondentId: x.respondent_id, createdAt: iso(x.created_at), takenAt: iso(x.taken_at),
        version: x.version, age: x.age, gender: x.gender, skipEcr: x.skip_ecr, answers: obj(x.answers), scores: obj(x.scores)}));
    },
    async getShare(id) {
      await init();
      const rows = await sql`SELECT * FROM shares WHERE id = ${id}`;
      const x = rows[0];
      return x ? {id: x.id, editTokenHash: x.edit_token_hash, name: x.name, version: x.version, skipEcr: x.skip_ecr,
        takenAt: iso(x.taken_at), scores: obj(x.scores), createdAt: iso(x.created_at)} : null;
    },
    async putShare(s) {
      await init();
      await sql`INSERT INTO shares (id, edit_token_hash, name, version, skip_ecr, taken_at, scores)
        VALUES (${s.id}, ${s.editTokenHash}, ${s.name}, ${s.version}, ${s.skipEcr}, ${s.takenAt}, ${JSON.stringify(s.scores)}::jsonb)
        ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, version = EXCLUDED.version, skip_ecr = EXCLUDED.skip_ecr,
          taken_at = EXCLUDED.taken_at, scores = EXCLUDED.scores, updated_at = now()`;
    },
    async deleteShare(id) {
      await init();
      await sql`DELETE FROM shares WHERE id = ${id}`;
    }
  };
}

let cached;
function getStore() {
  if (cached !== undefined) return cached;
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (url) cached = postgresStore(url);
  else cached = process.env.VERCEL ? null : memoryStore();
  return cached;
}

module.exports = {getStore};
