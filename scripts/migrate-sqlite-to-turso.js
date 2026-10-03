const fs = require('fs');
const initSqlJs = require('sql.js');
const { createClient } = require('@libsql/client');

const TABLES = ['animales','hatos','reproduccion','pesajes','produccion','sanidad','potreros','alimentacion','maquinaria','medicamentos','inventario','compras','ventas','clientes','proveedores','finanzas','movimientos','documentos'];

const schema = [
  'CREATE TABLE IF NOT EXISTS config (key TEXT PRIMARY KEY, value TEXT)',
  'CREATE TABLE IF NOT EXISTS tags (id INTEGER PRIMARY KEY AUTOINCREMENT, tag_key TEXT NOT NULL, value TEXT NOT NULL)',
  ...TABLES.map(t => `CREATE TABLE IF NOT EXISTS ${t} (id TEXT PRIMARY KEY, data TEXT NOT NULL)`),
  'CREATE TABLE IF NOT EXISTS auditoria (id INTEGER PRIMARY KEY AUTOINCREMENT, data TEXT NOT NULL)',
  'CREATE TABLE IF NOT EXISTS backups (id INTEGER PRIMARY KEY AUTOINCREMENT, data TEXT NOT NULL)'
];

const source = process.argv[2];
const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!source) {
  console.error('Indica la ruta exacta del ganadero.db como argumento.');
  process.exit(1);
}
if (!url || !authToken) {
  console.error('Faltan TURSO_DATABASE_URL y TURSO_AUTH_TOKEN.');
  process.exit(1);
}
if (!fs.existsSync(source)) {
  console.error(`No existe el archivo SQLite indicado: ${source}`);
  process.exit(1);
}

(async () => {
  const SQL = await initSqlJs({
    locateFile: file => require.resolve(`sql.js/dist/${file}`)
  });
  const sqlite = new SQL.Database(fs.readFileSync(source));
  const turso = createClient({ url, authToken });

  try {
    await turso.batch(schema, 'write');

    for (const table of TABLES) {
      const result = sqlite.exec(`SELECT id,data FROM ${table}`);
      const rows = result[0]?.values || [];
      const statements = [`DELETE FROM ${table}`, ...rows.map(([id, data]) => ({
        sql: `INSERT OR REPLACE INTO ${table}(id,data) VALUES(?,?)`,
        args: [String(id), String(data)]
      }))];
      await turso.batch(statements, 'write');
      console.log(`${table}: ${rows.length}`);
    }

    for (const table of ['auditoria', 'backups']) {
      const result = sqlite.exec(`SELECT data FROM ${table} ORDER BY id`);
      const rows = result[0]?.values || [];
      const statements = [`DELETE FROM ${table}`, ...rows.map(([data]) => ({
        sql: `INSERT INTO ${table}(data) VALUES(?)`,
        args: [String(data)]
      }))];
      await turso.batch(statements, 'write');
      console.log(`${table}: ${rows.length}`);
    }

    const tagsResult = sqlite.exec('SELECT tag_key,value FROM tags');
    const tags = tagsResult[0]?.values || [];
    await turso.batch([
      'DELETE FROM tags',
      ...tags.map(([tagKey, value]) => ({
        sql: 'INSERT INTO tags(tag_key,value) VALUES(?,?)',
        args: [String(tagKey), String(value)]
      }))
    ], 'write');
    console.log(`tags: ${tags.length}`);

    const cfgResult = sqlite.exec('SELECT key,value FROM config');
    const cfg = cfgResult[0]?.values || [];
    await turso.batch([
      'DELETE FROM config',
      ...cfg.map(([key, value]) => ({
        sql: 'INSERT OR REPLACE INTO config(key,value) VALUES(?,?)',
        args: [String(key), String(value)]
      }))
    ], 'write');
    console.log(`config: ${cfg.length}`);

    console.log('Migración SQLite -> Turso completada.');
  } finally {
    sqlite.close();
    turso.close();
  }
})().catch(err => {
  console.error('Migración fallida:', err);
  process.exit(1);
});
