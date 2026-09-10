import { defineConfig } from 'vite';

export default defineConfig({
  base: '/Saviare/',
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        catalogo: 'catalogo.html',
        producto: 'producto.html',
        nosotros: 'nosotros.html',
        contacto: 'contacto.html',
        privacidad: 'privacidad.html',
        terminos: 'terminos.html',
        gracias: 'gracias.html',
        error404: '404.html',
        admin: 'admin.html'
      }
    }
  }
});
