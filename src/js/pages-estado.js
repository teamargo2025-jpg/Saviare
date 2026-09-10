// Las dos páginas que aparecen cuando algo sale del camino feliz:
// el pedido ya salió, o la dirección no existe. En ambos casos lo
// importante es lo mismo — decir qué pasó y ofrecer la salida.

import { setupCart } from './cart-ui.js';
import { pageShell, setupNavigation, whatsappLink } from './components.js';

export const renderGracias = async (config) => {
  document.querySelector('#app').innerHTML = pageShell(config, 'gracias', `
    <section class="estado-pagina">
      <span class="estado-emoji" aria-hidden="true">🌿</span>
      <span class="eyebrow">Pedido enviado</span>
      <h1>¡Gracias por tu pedido!</h1>
      <p class="estado-texto">
        Se abrió WhatsApp con el detalle de tu compra. <strong>Enviá ese mensaje</strong>
        para que podamos confirmarte disponibilidad, el total final y cómo te lo hacemos
        llegar.
      </p>

      <ol class="estado-pasos">
        <li><strong>Ahora:</strong> nos mandás el mensaje por WhatsApp.</li>
        <li><strong>Te respondemos</strong> confirmando el pedido y el total.</li>
        <li><strong>Coordinamos</strong> el pago y la entrega por el mismo chat.</li>
      </ol>

      <p class="estado-nota">
        ¿No se te abrió WhatsApp? Puede que el navegador lo haya bloqueado.
        Escribinos directo y te atendemos igual.
      </p>

      <div class="estado-acciones">
        <a class="btn btn-primary" href="${whatsappLink(config)}" target="_blank" rel="noreferrer">
          Abrir WhatsApp
        </a>
        <a class="btn btn-ghost" href="catalogo.html">Seguir viendo el catálogo</a>
      </div>

      <p class="estado-horario">Atendemos ${config.horario.toLowerCase()}.</p>
    </section>
  `);
  setupNavigation();
  setupCart(config);
};

export const renderNoEncontrado = async (config) => {
  document.querySelector('#app').innerHTML = pageShell(config, 'error404', `
    <section class="estado-pagina">
      <span class="estado-emoji" aria-hidden="true">🍃</span>
      <span class="eyebrow">Error 404</span>
      <h1>Esta página no existe</h1>
      <p class="estado-texto">
        El enlace puede estar mal escrito, o el producto que buscabas ya no está publicado.
        No es culpa tuya.
      </p>

      <div class="estado-acciones">
        <a class="btn btn-primary" href="catalogo.html">Ver el catálogo</a>
        <a class="btn btn-ghost" href="index.html">Ir al inicio</a>
      </div>

      <p class="estado-nota">
        Si llegaste acá desde un enlace nuestro, avisanos a
        <a href="mailto:${config.correo}">${config.correo}</a> y lo arreglamos.
      </p>
    </section>
  `);
  setupNavigation();
  setupCart(config);
};
