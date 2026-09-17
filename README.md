# MateShop

Landing de bienvenida para el personalizador de MateShop. La experiencia presenta un mate generado con Canvas 2D, interacción sutil con cursor y una transición hacia el flujo de personalización existente.

## Requisitos

- Node.js 20 o superior
- npm 10 o superior

## Desarrollo local

```bash
npm install
npm run dev
```

La aplicación se abrirá en la URL que indique Vite, normalmente `http://localhost:5173`.

## Scripts

```bash
npm run dev
npm run build
npm run lint
npm run preview
```

`npm run build` genera la versión de producción en `dist/`.

## Variables de entorno

Actualmente la aplicación no requiere variables de entorno. Si se agregan en el futuro, se debe partir de `.env.example` y nunca versionar archivos `.env` con valores privados.

## Stack

- React
- TypeScript
- Vite
- Canvas 2D
