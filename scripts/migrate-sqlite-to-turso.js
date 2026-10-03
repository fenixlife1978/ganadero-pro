const Database = require('better-sqlite3');
const { createClient } = require('@libsql/client');
const path = require('path');

const TABLES = ['animales','hatos','reproduccion','pesajes','produccion','sanidad','potreros','alimentacion','maquinaria','medicamentos','inventario','compras','ventas','clientes','proveedores','finanzas','movimientos','documentos'];
const schema = "CREATE TABLE IF NOT EXISTS config (key TEXT PRIMARY KEY, value TEXT);\nCREATE TABLE IF NOT EXISTS tags (id INTEGER PRIMARY KEY AUTOINCREMENT, tag_key TEXT NOT NULL, value TEXT NOT NULL);\nCREATE TABLE IF NOT EXISTS animales (id TEXT PRIMARY KEY, data TEXT NOT NULL);\nCREATE TABLE IF NOT EXISTS hatos (id TEXT PRIMARY KEY, data TEXT NOT NULL);\nCREATE TABLE IF NOT EXISTS reproduccion (id TEXT PRIMARY KEY, data TEXT NOT NULL);\nCREATE TABLE IF NOT EXISTS pesajes (id TEXT PRIMARY KEY, data TEXT NOT NULL);\nCREATE TABLE IF NOT EXISTS produccion (id TEXT PRIMARY KEY, data TEXT NOT NULL);\nCREATE TABLE IF NOT EXISTS sanidad (id TEXT PRIMARY KEY, data TEXT NOT NULL);\nCREATE TABLE IF NOT EXISTS potreros (id TEXT PRIMARY KEY, data TEXT NOT NULL);\nCREATE TABLE IF NOT EXISTS alimentacion (id TEXT PRIMARY KEY, data TEXT NOT NULL);\nCREATE TABLE IF NOT EXISTS maquinaria (id TEXT PRIMARY KEY, data TEXT NOT NULL);\nCREATE TABLE IF NOT EXISTS medicamentos (id TEXT PRIMARY KEY, data TEXT NOT NULL);\nCREATE TABLE IF NOT EXISTS inventario (id TEXT PRIMARY KEY, data TEXT NOT NULL);\nCREATE TABLE IF NOT EXISTS compras (id TEXT PRIMARY KEY, data TEXT NOT NULL);\nCREATE TABLE IF NOT EXISTS ventas (id TEXT PRIMARY KEY, data TEXT NOT NULL);\nCREATE TABLE IF NOT EXISTS clientes (id TEXT PRIMARY KEY, data TEXT NOT NULL);\nCREATE TABLE IF NOT EXISTS proveedores (id TEXT PRIMARY KEY, data TEXT NOT NULL);\nCREATE TABLE IF NOT EXISTS finanzas (id TEXT PRIMARY KEY, data TEXT NOT NULL);\nCREATE TABLE IF NOT EXISTS movimientos (id TEXT PRIMARY KEY, data TEXT NOT NULL);\nCREATE TABLE IF NOT EXISTS auditoria (id INTEGER PRIMARY KEY AUTOINCREMENT, data TEXT NOT NULL);\nCREATE TABLE IF NOT EXISTS documentos (id TEXT PRIMARY KEY, data TEXT NOT NULL);\nCREATE TABLE IF NOT EXISTS backups (id INTEGER PRIMARY KEY AUTOINCREMENT, data TEXT NOT NULL);";
const source = process.argv[2] || path.join(process.env.APPDATA || '.', 'ganadero-pro', 'data', 'ganadero.db');
const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;
if (!url || !authToken) { console.error('Faltan TURSO_DATABASE_URL y TURSO_AUTH_TOKEN'); process.exit(1); }

const sqlite = new Database(source, { readonly: true });
const turso = createClient({url, authToken});

(async () => {
  await turso.batch(schema.split(';').filter(Boolean), 'write');
  for (const table of TABLES) {
    const rows = sqlite.prepare(`SELECT id,data FROM ${table}`).all();
    const statements = [`DELETE FROM ${table}`, ...rows.map(r => ({sql:`INSERT OR REPLACE INTO ${table}(id,data) VALUES(?,?)`,args:[r.id,r.data]}))];
    if (statements.length > 1) await turso.batch(statements, 'write');
    console.log(`${table}: ${rows.length}`);
  }
  for (const table of ['auditoria','backups']) {
    const rows = sqlite.prepare(`SELECT data FROM ${table} ORDER BY id`).all();
    await turso.batch([`DELETE FROM ${table}`, ...rows.map(r=>({sql:`INSERT INTO ${table}(data) VALUES(?)`,args:[r.data]}))], 'write');
    console.log(`${table}: ${rows.length}`);
  }
  const tags = sqlite.prepare('SELECT tag_key,value FROM tags').all();
  await turso.batch(['DELETE FROM tags', ...tags.map(r=>({sql:'INSERT INTO tags(tag_key,value) VALUES(?,?)',args:[r.tag_key,r.value]}))], 'write');
  const cfg = sqlite.prepare('SELECT key,value FROM config').all();
  await turso.batch(['DELETE FROM config', ...cfg.map(r=>({sql:'INSERT OR REPLACE INTO config(key,value) VALUES(?,?)',args:[r.key,r.value]}))], 'write');
  console.log('Migración SQLite -> Turso completada.');
  sqlite.close(); turso.close();
})().catch(err => { console.error(err); try{sqlite.close()}catch{} try{turso.close()}catch{} process.exit(1); });
