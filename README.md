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

El build hace dos cosas: `vite build` empaqueta la aplicación, y después `scripts/prerender.mjs` escribe el HTML que necesitan los buscadores. Por eso el build **necesita las variables de Supabase**: sin ellas falla a propósito, en vez de publicar en silencio un sitio sin contenido indexable.

## Prerenderizado

El sitio se pinta desde JavaScript, así que el HTML que sale de Vite está vacío. Google ejecuta JavaScript, pero en una segunda pasada más lenta y menos fiable, y aquí además tendría que esperar una llamada a Supabase; el resultado habitual de eso es quedar indexado como página en blanco.

`scripts/prerender.mjs` rellena ese hueco después de cada build:

- Escribe en `index.html` y `catalogo.html` el texto real y un enlace a cada producto, para que el rastreador los descubra sin ejecutar nada.
- Genera una página por producto, `producto-<slug>.html`, con su título, descripción, canónica y datos estructurados `Product`.
- Regenera `sitemap.xml`. No se edita a mano: se sobrescribe en cada build.

El JavaScript arranca igual y repinta el contenido al cargar, así que el precio y el stock que ve una persona son siempre los de ahora, no los del último build.

Las URLs de producto son planas y no una subcarpeta porque los enlaces que genera el JS son relativos (`catalogo.html`) y un nivel más abajo apuntarían a la nada. Los enlaces antiguos, `producto.html?producto=<slug>`, siguen funcionando.

## Despliegue en GitHub Pages

Lo hace `.github/workflows/deploy.yml`, que compila y publica solo:

- **Al empujar a `main`.**
- **Cada madrugada**, a las 09:00 UTC. Esto existe porque el HTML publicado es una foto de lo que había en Supabase durante el build: un producto nuevo o un precio corregido desde el panel no llegan a Google hasta la siguiente publicación.
- **A mano**, con *Run workflow* en la pestaña Actions, cuando haga falta publicar un cambio en el momento.

El workflow necesita dos secretos del repositorio, en `Settings > Secrets and variables > Actions`: `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.

`vite.config.js` usa `base: '/Saviare/'`, que es la subcarpeta en la que GitHub Pages sirve el sitio. Si algún día pasa a tener dominio propio, hay que cambiar eso y la constante `SITIO` de `scripts/prerender.mjs`.

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
