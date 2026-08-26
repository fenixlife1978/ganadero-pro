const path = require('path');
const fs = require('fs');

class GanaderoDB {
  constructor(dbInstance) {
    this.db = dbInstance;
  }

  loadAll() {
    const tables = ['animales','hatos','reproduccion','pesajes','produccion','sanidad','potreros','alimentacion','maquinaria','medicamentos','inventario','compras','ventas','clientes','proveedores','finanzas','movimientos','documentos'];
    const data = {};
    tables.forEach(t => {
      const rows = this.db.prepare(`SELECT data FROM ${t}`).all();
      data[t] = rows.map(r => JSON.parse(r.data));
    });
    const audRows = this.db.prepare('SELECT data FROM auditoria ORDER BY id DESC').all();
    data.auditoria = audRows.map(r => JSON.parse(r.data));
    const bakRows = this.db.prepare('SELECT data FROM backups ORDER BY id DESC').all();
    data.backups = bakRows.map(r => JSON.parse(r.data));
    const tagsRows = this.db.prepare('SELECT tag_key, value FROM tags').all();
    data.tags = {};
    tagsRows.forEach(r => {
      if (!data.tags[r.tag_key]) data.tags[r.tag_key] = [];
      data.tags[r.tag_key].push(r.value);
    });
    const cfgRows = this.db.prepare('SELECT key, value FROM config').all();
    data.config = {};
    cfgRows.forEach(r => { try { data.config[r.key] = JSON.parse(r.value); } catch(e) { data.config[r.key] = r.value; } });
    return data;
  }

  saveAll(data) {
    const tables = ['animales','hatos','reproduccion','pesajes','produccion','sanidad','potreros','alimentacion','maquinaria','medicamentos','inventario','compras','ventas','clientes','proveedores','finanzas','movimientos','documentos'];
    const transaction = this.db.transaction(() => {
      tables.forEach(t => {
        if (!data[t]) return;
        this.db.prepare(`DELETE FROM ${t}`).run();
        const ins = this.db.prepare(`INSERT INTO ${t} (id, data) VALUES (?, ?)`);
        data[t].forEach(item => {
          const id = item.id || item.codigo || String(Date.now());
          ins.run(id, JSON.stringify(item));
        });
      });
      this.db.prepare('DELETE FROM auditoria').run();
      const insAud = this.db.prepare('INSERT INTO auditoria (data) VALUES (?)');
      (data.auditoria || []).forEach(a => insAud.run(JSON.stringify(a)));
      this.db.prepare('DELETE FROM backups').run();
      const insBak = this.db.prepare('INSERT INTO backups (data) VALUES (?)');
      (data.backups || []).forEach(b => insBak.run(JSON.stringify(b)));
      this.db.prepare('DELETE FROM tags').run();
      const insTag = this.db.prepare('INSERT INTO tags (tag_key, value) VALUES (?, ?)');
      if (data.tags) {
        Object.keys(data.tags).forEach(k => {
          data.tags[k].forEach(v => insTag.run(k, v));
        });
      }
      if (data.config) {
        const insCfg = this.db.prepare('INSERT OR REPLACE INTO config (key, value) VALUES (?, ?)');
        Object.keys(data.config).forEach(k => insCfg.run(k, JSON.stringify(data.config[k])));
      }
    });
    transaction();
  }

  resetAll() {
    const tables = ['animales','hatos','reproduccion','pesajes','produccion','sanidad','potreros','alimentacion','maquinaria','medicamentos','inventario','compras','ventas','clientes','proveedores','finanzas','movimientos','documentos','auditoria','backups','tags','config'];
    const transaction = this.db.transaction(() => {
      tables.forEach(t => this.db.prepare(`DELETE FROM ${t}`).run());
    });
    transaction();
  }
}

module.exports = GanaderoDB;
