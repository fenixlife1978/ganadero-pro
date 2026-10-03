# Migración Turso

La rama `turso-migration` cambia la fuente de verdad del ERP a Turso mediante `@libsql/client`. El renderer conserva `loadData/saveData` para minimizar cambios funcionales.

Variables requeridas: `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN` y `GANADERO_ADMIN_PASSWORD`. Turso recomienda URL y token mediante variables de entorno. La versión actual de `@libsql/client` es 0.18.0. 

Migración de la SQLite existente:
```bash
npm install
npm run migrate:turso -- "C:\ruta\a\ganadero.db"
```

Después de validar los conteos en Turso, la aplicación ya opera contra Turso y no abre SQLite para las operaciones normales.

La sincronización por ID evita el DELETE global de las tablas principales en cada guardado. Las tablas de auditoría/backups/tags todavía se reconstruyen desde el estado recibido y son el siguiente punto a normalizar.
