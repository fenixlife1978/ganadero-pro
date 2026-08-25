const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

let mainWindow;
let db;

const DATA_DIR = path.join(app.getPath('userData'), 'data');
const DB_PATH = path.join(DATA_DIR, 'ganadero.db');
const IS_DEMO = process.env.DEMO_MODE === 'true';

function initDatabase() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS config (key TEXT PRIMARY KEY, value TEXT);
    CREATE TABLE IF NOT EXISTS tags (id INTEGER PRIMARY KEY AUTOINCREMENT, tag_key TEXT, value TEXT);
    CREATE TABLE IF NOT EXISTS animales (id TEXT PRIMARY KEY, data TEXT);
    CREATE TABLE IF NOT EXISTS hatos (id TEXT PRIMARY KEY, data TEXT);
    CREATE TABLE IF NOT EXISTS reproduccion (id TEXT PRIMARY KEY, data TEXT);
    CREATE TABLE IF NOT EXISTS pesajes (id TEXT PRIMARY KEY, data TEXT);
    CREATE TABLE IF NOT EXISTS produccion (id TEXT PRIMARY KEY, data TEXT);
    CREATE TABLE IF NOT EXISTS sanidad (id TEXT PRIMARY KEY, data TEXT);
    CREATE TABLE IF NOT EXISTS potreros (id TEXT PRIMARY KEY, data TEXT);
    CREATE TABLE IF NOT EXISTS alimentacion (id TEXT PRIMARY KEY, data TEXT);
    CREATE TABLE IF NOT EXISTS maquinaria (id TEXT PRIMARY KEY, data TEXT);
    CREATE TABLE IF NOT EXISTS medicamentos (id TEXT PRIMARY KEY, data TEXT);
    CREATE TABLE IF NOT EXISTS inventario (id TEXT PRIMARY KEY, data TEXT);
    CREATE TABLE IF NOT EXISTS compras (id TEXT PRIMARY KEY, data TEXT);
    CREATE TABLE IF NOT EXISTS ventas (id TEXT PRIMARY KEY, data TEXT);
    CREATE TABLE IF NOT EXISTS clientes (id TEXT PRIMARY KEY, data TEXT);
    CREATE TABLE IF NOT EXISTS proveedores (id TEXT PRIMARY KEY, data TEXT);
    CREATE TABLE IF NOT EXISTS finanzas (id TEXT PRIMARY KEY, data TEXT);
    CREATE TABLE IF NOT EXISTS movimientos (id TEXT PRIMARY KEY, data TEXT);
    CREATE TABLE IF NOT EXISTS auditoria (id INTEGER PRIMARY KEY AUTOINCREMENT, data TEXT);
    CREATE TABLE IF NOT EXISTS documentos (id TEXT PRIMARY KEY, data TEXT);
    CREATE TABLE IF NOT EXISTS backups (id INTEGER PRIMARY KEY AUTOINCREMENT, data TEXT);
  `);
}

function loadAllData() {
  const tables = ['animales','hatos','reproduccion','pesajes','produccion','sanidad','potreros','alimentacion','maquinaria','medicamentos','inventario','compras','ventas','clientes','proveedores','finanzas','movimientos','documentos'];
  const data = {};
  tables.forEach(t => {
    const rows = db.prepare(`SELECT data FROM ${t}`).all();
    data[t] = rows.map(r => JSON.parse(r.data));
  });
  const audRows = db.prepare('SELECT data FROM auditoria ORDER BY id DESC').all();
  data.auditoria = audRows.map(r => JSON.parse(r.data));
  const bakRows = db.prepare('SELECT data FROM backups ORDER BY id DESC').all();
  data.backups = bakRows.map(r => JSON.parse(r.data));
  const tagsRows = db.prepare('SELECT tag_key, value FROM tags').all();
  data.tags = {};
  tagsRows.forEach(r => {
    if (!data.tags[r.tag_key]) data.tags[r.tag_key] = [];
    data.tags[r.tag_key].push(r.value);
  });
  const cfgRows = db.prepare('SELECT key, value FROM config').all();
  data.config = {};
  cfgRows.forEach(r => { try { data.config[r.key] = JSON.parse(r.value); } catch(e) { data.config[r.key] = r.value; } });
  return data;
}

function saveAllData(data) {
  const tables = ['animales','hatos','reproduccion','pesajes','produccion','sanidad','potreros','alimentacion','maquinaria','medicamentos','inventario','compras','ventas','clientes','proveedores','finanzas','movimientos','documentos'];
  const transaction = db.transaction(() => {
    tables.forEach(t => {
      if (!data[t]) return;
      db.prepare(`DELETE FROM ${t}`).run();
      const ins = db.prepare(`INSERT INTO ${t} (id, data) VALUES (?, ?)`);
      data[t].forEach(item => {
        const id = item.id || item.codigo || String(Date.now());
        ins.run(id, JSON.stringify(item));
      });
    });
    db.prepare('DELETE FROM auditoria').run();
    const insAud = db.prepare('INSERT INTO auditoria (data) VALUES (?)');
    (data.auditoria || []).forEach(a => insAud.run(JSON.stringify(a)));
    db.prepare('DELETE FROM backups').run();
    const insBak = db.prepare('INSERT INTO backups (data) VALUES (?)');
    (data.backups || []).forEach(b => insBak.run(JSON.stringify(b)));
    db.prepare('DELETE FROM tags').run();
    const insTag = db.prepare('INSERT INTO tags (tag_key, value) VALUES (?, ?)');
    if (data.tags) {
      Object.keys(data.tags).forEach(k => {
        data.tags[k].forEach(v => insTag.run(k, v));
      });
    }
    if (data.config) {
      const insCfg = db.prepare('INSERT OR REPLACE INTO config (key, value) VALUES (?, ?)');
      Object.keys(data.config).forEach(k => insCfg.run(k, JSON.stringify(data.config[k])));
    }
  });
  transaction();
}

function resetDatabase() {
  const transaction = db.transaction(() => {
    const tables = ['animales','hatos','reproduccion','pesajes','produccion','sanidad','potreros','alimentacion','maquinaria','medicamentos','inventario','compras','ventas','clientes','proveedores','finanzas','movimientos','documentos','auditoria','backups','tags','config'];
    tables.forEach(t => db.prepare(`DELETE FROM ${t}`).run());
  });
  transaction();
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: 'GANADERO ERP PRO',
    icon: path.join(__dirname, 'app', 'logo.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  mainWindow.setMenu(null);
  mainWindow.loadFile(path.join(__dirname, 'app', 'index.html'));
  if (IS_DEMO) mainWindow.setTitle('GANADERO ERP PRO - MODO DEMO');
}

app.whenReady().then(() => {
  initDatabase();
  createWindow();
  ipcMain.handle('db:load', () => loadAllData());
  ipcMain.handle('db:save', (event, data) => { saveAllData(data); return true; });
  ipcMain.handle('db:reset', () => { resetDatabase(); return true; });
  ipcMain.handle('dialog:openFile', async () => {
    const result = await dialog.showOpenDialog(mainWindow, { properties: ['openFile'], filters: [{ name: 'Archivos', extensions: ['*'] }] });
    if (result.canceled) return null;
    return result.filePaths[0];
  });
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
