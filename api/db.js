const GanaderoDB = require('../database');

function send(res, status, body) {
  res.status(status).json(body);
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return send(res, 405, { ok: false, error: 'Método no permitido.' });

  let db;
  try {
    const { action, data, password } = req.body || {};
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
      const configured = process.env.GANADERO_ADMIN_PASSWORD;
      if (!configured || String(password || '') !== configured) {
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
