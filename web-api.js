const GanaderoDB = require('./database');

module.exports = async function(req, res) {
  const action = String(req.query.action || '');
  let db;
  try {
    db = new GanaderoDB();
    await db.init();

    if (action === 'load') {
      const data = await db.loadAll();
      return res.status(200).json({ data });
    }

    if (action === 'save') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
      await db.saveAll(body.data || {});
      return res.status(200).json({ ok: true });
    }

    return res.status(400).json({ error: 'Acción no válida.' });
  } catch (error) {
    return res.status(500).json({ error: 'Error de conexión con la base de datos.' });
  } finally {
    try { if (db) await db.close(); } catch {}
  }
};
