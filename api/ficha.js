const { createHash, timingSafeEqual, randomUUID } = require('node:crypto');
const KEY = process.env.FICHA_STORAGE_KEY || 'ficha:vicente:v1';
const CAS = `
local raw = redis.call('GET', KEYS[1])
local version = ''
if raw then version = cjson.decode(raw).updated_at end
if version ~= ARGV[1] then return cjson.encode({conflict=true}) end
redis.call('SET', KEYS[1], ARGV[2])
return cjson.encode({ok=true})
`;
const digest = value => createHash('sha256').update(value).digest();
async function redis(command) {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  if (!url || !token || !process.env.FICHA_EDIT_PASSWORD) throw new Error('CONFIG');
  const response = await fetch(url, { method:'POST', headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'}, body:JSON.stringify(command), signal:AbortSignal.timeout(8000) });
  if (!response.ok) throw new Error('STORAGE');
  const result = await response.json();
  if (result.error) throw new Error('STORAGE');
  return result.result;
}
module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  const send = (status, value) => res.status(status).json(value);
  if (!['GET','POST'].includes(req.method)) { res.setHeader('Allow','GET, POST');return send(405,{error:'Método não permitido.'}); }
  if (!process.env.FICHA_EDIT_PASSWORD) return send(503,{error:'Configure o banco e FICHA_EDIT_PASSWORD na Vercel.'});
  try {
    if (req.method === 'GET') {
      const value = await redis(['GET',KEY]);
      return send(200,value ? JSON.parse(value) : {data:null,updated_at:null});
    }
    const password = req.headers['x-edit-password'];
    if (typeof password !== 'string' || !timingSafeEqual(digest(password),digest(process.env.FICHA_EDIT_PASSWORD))) return send(401,{error:'Senha de edição incorreta.'});
    let body = req.body;
    if (typeof body === 'string') { try { body=JSON.parse(body); } catch { return send(400,{error:'JSON inválido.'}); } }
    if (body?.action === 'auth') { await redis(['PING']);return send(200,{ok:true}); }
    if (!body || !Object.hasOwn(body,'expected_version') || !(body.expected_version===null || typeof body.expected_version==='string')) return send(400,{error:'Versão da ficha obrigatória. Atualize a página.'});
    const data=body.data;
    if (!data || Array.isArray(data) || !Number.isInteger(data.lvl) || data.lvl<1 || data.lvl>20 || !data.base || Array.isArray(data.base) || typeof data.base!=='object' || !Array.isArray(data.fe)) return send(400,{error:'Dados da ficha inválidos.'});
    if (JSON.stringify(data).length>500000) return send(413,{error:'A ficha excede o limite de tamanho.'});
    const record={data,updated_at:randomUUID()};
    const result=JSON.parse(await redis(['EVAL',CAS,1,KEY,body.expected_version||'',JSON.stringify(record)]));
    if (result.conflict) return send(409,{error:'A ficha foi alterada em outro aparelho. Escolha qual versão manter.'});
    return send(200,{updated_at:record.updated_at});
  } catch(error) {
    return send(503,{error:error.message==='CONFIG'?'Configure as variáveis do banco na Vercel.':'Armazenamento indisponível. Os dados locais foram preservados.'});
  }
};
