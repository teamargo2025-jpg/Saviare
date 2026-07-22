# Saviare

Catálogo web profesional para Saviare, una tienda online de productos biodegradables, orgánicos y de cuidado personal. Esta primera versión no procesa ventas desde la web: presenta productos y dirige consultas a WhatsApp. La arquitectura queda preparada para crecer hacia e-commerce.

## Tecnologías

- HTML5
- CSS3
- JavaScript ES6+
- Vite

## Instalación

```bash
npm install
```

## Ejecutar en desarrollo

```bash
npm run dev
```

Vite mostrará una URL local para revisar el sitio.

## Crear build de producción

```bash
npm run build
```

El resultado se genera en `dist/`.

## Despliegue en GitHub Pages

1. Ejecuta `npm run build`.
2. Sube el proyecto a GitHub.
3. En GitHub, entra a `Settings > Pages`.
4. Selecciona la rama y carpeta de publicación que uses para Pages.
5. Si publicas desde `dist/`, usa una acción de GitHub Pages o copia el build a la rama de publicación.

El archivo `vite.config.js` usa `base: './'` para que las rutas funcionen correctamente en GitHub Pages.

## Agregar productos

Edita `src/data/productos.json` y agrega un objeto con esta estructura:

```json
{
  "id": 7,
  "nombre": "Nuevo producto",
  "slug": "nuevo-producto",
  "categoria": "Jabones",
  "precio": 0,
  "descripcion": "Descripción breve del producto.",
  "beneficios": ["Beneficio 1", "Beneficio 2"],
  "ingredientes": ["Ingrediente 1"],
  "modoUso": "Instrucciones de uso.",
  "imagenPrincipal": "nuevo-producto.webp",
  "imagenes": ["nuevo-producto.webp"],
  "destacado": false,
  "activo": true
}
```

Usa `activo: false` para ocultar un producto sin eliminarlo.

## Cambiar imágenes

Guarda las imágenes en `src/assets/productos/` y referencia el nombre del archivo desde `productos.json`.

Recomendación para producción:

- Usa formato WebP.
- Mantén nombres en minúsculas y sin espacios.
- Optimiza cada imagen antes de subirla.
- Conserva proporciones cercanas a 4:3 para tarjetas y 1:1 para detalle.

## Modificar categorías

Edita `src/data/categorias.json`. Los productos se filtran por el texto de `categoria`, así que el valor usado en productos debe coincidir con el nombre de la categoría.

## Actualizar información de empresa

Edita `src/data/configuracion.json` para cambiar:

- Nombre de empresa
- Eslogan
- WhatsApp
- Correo
- Redes sociales
- Horario
- Textos de Nosotros
- Compromiso ambiental

## Cambiar el logo

El placeholder está en `src/assets/logo/logo-placeholder.svg`. Cuando tengas el logo final, colócalo en esa carpeta y actualiza el componente de marca si deseas usar imagen en lugar de texto.

## Estructura

```text
Saviare/
├── public/
├── src/
│   ├── assets/
│   ├── components/
│   ├── css/
│   ├── js/
│   ├── data/
│   └── utils/
├── index.html
├── catalogo.html
├── producto.html
├── nosotros.html
├── contacto.html
├── package.json
├── vite.config.js
└── README.md
```

## Preparación para crecimiento

El proyecto separa datos, componentes, vistas y estilos. Esto permite incorporar después carrito, favoritos, inventario, dashboard, login, pasarelas de pago, blog o comentarios sin reescribir la base visual del catálogo.
