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
        admin: 'admin.html'
      }
    }
  }
});
