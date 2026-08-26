# LotesVillaMaria

Base inicial del sistema administrativo para la venta y gestión de lotes.

## Estado actual

- Frontend React + Vite con identidad visual Villa María adaptada del proyecto de referencia.
- Estructura original por módulos conservada.
- Login visual temporal para el único usuario Administrador.
- Dashboard y módulos con datos de muestra para validar diseño antes de conectar MongoDB.
- Backend Node.js + Express conservado como base.
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

## Módulos preparados

Dashboard, Clientes, Lotes, Ventas, Cuotas, Pagos, Facturas, Maquinaria y Horas trabajadas.

Los datos visibles actualmente son únicamente datos de muestra para revisar el diseño.
