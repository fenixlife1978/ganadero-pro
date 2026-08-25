# GANADERO ERP PRO - Sistema Integral de Gestión Ganadera

Aplicación de escritorio para gestión completa de fincas ganaderas: animales, reproducción, producción, sanidad, finanzas, inventario y más.

## Características

- **Gestión de Animales**: Registro completo con ficha de vida (reseña), genealogía, movimientos
- **Reproducción**: Servicios, inseminaciones, partos, diagnósticos, destetes
- **Producción de Leche**: Control diario por turno, calidad, promedios
- **Sanidad**: Vacunaciones, desparasitaciones, tratamientos, costos
- **Pesajes**: Control de peso, ganancia diaria, condición corporal
- **Finanzas**: Ingresos, gastos, balance, categorías personalizables
- **Inventario**: Productos, medicamentos, insumos, control de vencimientos
- **Reportes**: Profesionales con encabezado de empresa, imprimibles
- **Configuración**: Parámetros editables (razas, categorías, estados)
- **Respaldos**: Exportar/Importar base de datos completa
- **Auditoría**: Historial de todas las acciones del sistema
- **Reset Sistema**: Borrado total irreversible con confirmación

## Tecnologías

- **Electron** - Framework de escritorio
- **SQLite (better-sqlite3)** - Base de datos local persistente
- **HTML/CSS/JS** - Interfaz de usuario
- **electron-builder** - Generación de instaladores .exe

## Instalación y Desarrollo

```bash
# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm start

# Compilar instalador (.exe)
npm run build

# Compilar versión DEMO (.exe)
npm run build:demo
```

## Estructura del Proyecto

```
ganadero_completo/
├── app/
│   └── index.html          # Aplicación principal (HTML/JS/CSS)
├── data/
│   └── ganadero.db         # Base de datos SQLite (auto-creada)
├── main.js                 # Proceso principal Electron
├── preload.js              # Puente seguro (IPC)
├── database.js             # Capa de acceso a SQLite
├── package.json            # Configuración y dependencias
├── .github/workflows/
│   └── build.yml           # GitHub Actions CI/CD
└── .gitignore
```

## GitHub Actions - Build Automático

El workflow `.github/workflows/build.yml` genera automáticamente:

1. **Instalador completo** (`GANADERO-ERP-PRO-Installer-x64.exe`) - Release tags `v*`
2. **Versión Demo** (`GANADERO-ERP-PRO-Demo-x64.exe`) - Con datos limitados/mododemo

Los artefactos se suben como releases en GitHub al hacer push de tags `v1.0.0`, `v2.0.0`, etc.

## Configuración Inicial

Al primer inicio:
- Se crea la base de datos SQLite en `data/ganadero.db`
- Se cargan datos de ejemplo (animales, hatos, potreros, etc.)
- Usuario admin por defecto: `admin` / `admin123`

## Reset de Sistema

En **Configuración → General → Zona de Peligro**:
- Botón "Reset Completo del Sistema"
- Requiere escribir `"CONFIRMAR RESET"` y contraseña `admin123`
- **IRREVERSIBLE**: Borra base de datos SQLite completa y restaura datos iniciales

## Monedas Soportadas

- USD (Dólar)
- Bs. (Bolívares)
- EUR (Euro)
- USDT (Tether)

## Requisitos

- Node.js 18+
- Windows 10/11 (para build .exe)
- Git (para CI/CD)

## Licencia

Proyecto privado - GANADERO ERP PRO v3.0.0