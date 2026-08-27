# LotesVillaMaria

Base inicial del sistema administrativo para la venta y gestión de lotes.

## Estado actual

- Frontend React + Vite con identidad visual Villa María adaptada del proyecto de referencia.
- Estructura original por módulos conservada.
- Login visual temporal para el único usuario Administrador.
- Dashboard y módulos pendientes conservan datos de muestra mientras se desarrollan.
- **Clientes ya está conectado a MongoDB con CRUD completo.**
- Backend Node.js + Express organizado por módulos.
- Base de datos objetivo: `LotesVillaMaria` en MongoDB.

## Acceso temporal de interfaz

- Usuario: `admin`
- Contraseña: `Admin123*`

> Este acceso es solo para navegar la maqueta visual. Al desarrollar el módulo de autenticación se reemplazará por JWT + MongoDB.

## Ejecutar frontend

```bash
cd frontend
npm install
npm run dev
```

## Ejecutar backend

Copia `.env.example` como `.env`, verifica que MongoDB esté iniciado y ejecuta:

```bash
cd backend
npm install
npm run dev
```

## Módulos

### Clientes — funcional

- Crear cliente
- Listar y buscar clientes
- Editar cliente
- Eliminar cliente
- Documento único
- Estado Activo/Inactivo
- Datos de contacto y observaciones
- API: `/api/clientes`
- Colección MongoDB: `clientes`

### Pendientes

Dashboard, Lotes, Ventas, Cuotas, Pagos, Facturas, Maquinaria y Horas trabajadas continuarán desarrollándose módulo por módulo.
