const crypto = require('crypto');
const GanaderoDB = require('../database');

const ADMIN_USER = 'admin';
const SESSION_TTL = 60 * 60 * 8;

function send(res, status, body) {
  res.status(status).json(body);
}

function configuredPassword() {
  return String(process.env.GANADERO_ADMIN_PASSWORD || '');
}

function sessionSecret() {
  return crypto
    .createHash('sha256')
    .update('ganadero-pro-session:')
    .update(configuredPassword())
    .digest();
}

function sign(value) {
  return crypto.createHmac('sha256', sessionSecret()).update(value).digest('base64url');
}

function createSession() {
  const payload = Buffer.from(JSON.stringify({
    user: ADMIN_USER,
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL
  })).toString('base64url');
  return payload + '.' + sign(payload);
}

function verifySession(req) {
  const cookies = String(req.headers.cookie || '')
    .split(';')
    .map(part => part.trim())
    .filter(Boolean);

  const raw = cookies.find(part => part.startsWith('ganadero_session='));
  if (!raw) return false;

  const token = decodeURIComponent(raw.slice('ganadero_session='.length));
  const [payload, signature] = token.split('.');
  if (!payload || !signature) return false;

  const expected = sign(payload);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false;

  try {
    const session = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return session.user === ADMIN_USER && Number(session.exp) > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

function setSessionCookie(res, token) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  res.setHeader('Set-Cookie', `ganadero_session=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_TTL}${secure}`);
}

function clearSessionCookie(res) {
  res.setHeader('Set-Cookie', 'ganadero_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0');
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return send(res, 405, { ok: false, error: 'Método no permitido.' });

  const body = req.body || {};
  const { action, data, username, password } = body;

  if (action === 'login') {
    const configured = configuredPassword();
    if (!configured) return send(res, 503, { ok: false, error: 'El administrador semilla no está configurado.' });

    if (String(username || '').trim().toLowerCase() !== ADMIN_USER || String(password || '') !== configured) {
      return send(res, 401, { ok: false, error: 'Usuario o contraseña incorrectos.' });
    }

    setSessionCookie(res, createSession());
    return send(res, 200, { ok: true, user: ADMIN_USER });
  }

  if (action === 'session') {
    return send(res, 200, { ok: true, authenticated: verifySession(req), user: ADMIN_USER });
  }

  if (action === 'logout') {
    clearSessionCookie(res);
    return send(res, 200, { ok: true });
  }

  if (!verifySession(req)) {
    return send(res, 401, { ok: false, error: 'Sesión no autorizada.' });
  }

  let db;
  try {
    db = new GanaderoDB();
    await db.init();

    if (action === 'load') {
      const result = await db.loadAll();
      await db.close();
      return send(res, 200, { ok: true, data: result });
    }

    if (action === 'save') {
      await db.saveAll(data || {});
      await db.close();
      return send(res, 200, { ok: true });
    }

    if (action === 'reset') {
      if (String(password || '') !== configuredPassword()) {
        await db.close();
        return send(res, 401, { ok: false, error: 'Contraseña de administrador incorrecta.' });
      }
      await db.resetAll();
      await db.close();
      return send(res, 200, { ok: true });
    }

    await db.close();
    return send(res, 400, { ok: false, error: 'Acción no válida.' });
  } catch (error) {
    console.error('Ganadero API:', error);
    try { if (db) await db.close(); } catch {}
    return send(res, 500, { ok: false, error: error.message || 'Error interno.' });
  }
};
