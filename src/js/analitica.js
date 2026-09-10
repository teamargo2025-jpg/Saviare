// Medición de visitas SIN cookies y sin identificar personas.
//
// Se eligió Cloudflare Web Analytics en vez de Google Analytics por una
// razón concreta: GA instala cookies y rastrea al visitante entre
// sitios, lo que obliga a pedir consentimiento con un cartel. Esta no
// pone ninguna cookie, así que la web sigue sin necesitar banner y la
// política de privacidad sigue siendo cierta.
//
// Da lo que hace falta para decidir: cuánta gente entra, desde qué
// país, con qué dispositivo y qué páginas mira. No da quién es cada
// uno, y está bien que no lo dé.
//
// Para activarla:
//   1. Entrar a dash.cloudflare.com → Web Analytics → Add a site.
//   2. Copiar el token que aparece (una cadena larga de letras y números).
//   3. Pegarlo en .env.production:  VITE_ANALYTICS_TOKEN=elTokenDeCloudflare
//   4. Volver a compilar y publicar.
//
// Sin token no se carga nada: en desarrollo no se ensucian los datos y
// la web no depende de un servicio externo para funcionar.

const TOKEN = import.meta.env.VITE_ANALYTICS_TOKEN;

export const instalarAnalitica = () => {
  if (!TOKEN) return;

  const script = document.createElement('script');
  script.defer = true;
  script.src = 'https://static.cloudflareinsights.com/beacon.min.js';
  script.dataset.cfBeacon = JSON.stringify({ token: TOKEN });
  document.head.appendChild(script);
};
