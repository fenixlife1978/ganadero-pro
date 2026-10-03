const { createClient } = require('@libsql/client');

module.exports = async function(req, res) {
  res.setHeader('Cache-Control','no-store');
  const db=createClient({url:process.env.TURSO_DATABASE_URL,authToken:process.env.TURSO_AUTH_TOKEN});
  try {
    const action=String(req.query.action||'');
    if(action==='load' && req.method==='GET'){
      const tables=['animales','hatos','reproduccion','pesajes','produccion','sanidad','potreros','alimentacion','maquinaria','medicamentos','inventario','compras','ventas','clientes','proveedores','finanzas','movimientos','documentos'];
      const results=await db.batch([...tables.map(t=>({sql:'SELECT id,data FROM '+t})),{sql:'SELECT id,data FROM auditoria ORDER BY id DESC'},{sql:'SELECT id,data FROM backups ORDER BY id DESC'},{sql:'SELECT tag_key,value FROM tags'},{sql:'SELECT key,value FROM config'}]);
      const data={}; tables.forEach((t,i)=>data[t]=results[i].rows.map(r=>JSON.parse(r.data)));
      data.auditoria=results[tables.length].rows.map(r=>JSON.parse(r.data));
      data.backups=results[tables.length+1].rows.map(r=>JSON.parse(r.data));
      data.tags={}; results[tables.length+2].rows.forEach(r=>(data.tags[r.tag_key]??=[]).push(r.value));
      data.config={}; results[tables.length+3].rows.forEach(r=>{try{data.config[r.key]=JSON.parse(r.value)}catch{data.config[r.key]=r.value}});
      return res.status(200).json({data});
    }
    return res.status(405).json({error:'Método no permitido.'});
  } finally { db.close(); }
};
