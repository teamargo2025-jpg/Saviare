// Política de privacidad y Términos, escritos sobre lo que la tienda
// hace REALMENTE hoy: qué datos pide, dónde quedan y a quién se le
// reclama. Nada de texto copiado de otra web — un documento que
// promete algo que el sistema no cumple es peor que no tenerlo.
//
// Marco: Ley 29733 de Protección de Datos Personales del Perú y su
// reglamento (D.S. 003-2013-JUS).
//
// ⚠️ Lo que va entre [CORCHETES] tiene que completarlo el dueño antes
// de publicar: son datos registrales que el código no puede inventar.

import { setupCart } from './cart-ui.js';
import { pageShell, setupNavigation } from './components.js';

export const ULTIMA_ACTUALIZACION = '10 de setiembre de 2026';

// Datos registrales del responsable. Mientras digan [COMPLETAR], la
// página muestra un aviso visible para que no se publique así por
// descuido.
export const RESPONSABLE = {
  razonSocial: '[COMPLETAR: razón social o nombre completo del titular]',
  ruc: '[COMPLETAR: RUC o DNI]',
  domicilio: '[COMPLETAR: domicilio legal en Arequipa, Perú]'
};

const faltanDatos = (obj) => Object.values(obj).some((v) => v.includes('[COMPLETAR'));

const avisoBorrador = () => faltanDatos(RESPONSABLE)
  ? `<p class="legal-aviso">
       <strong>Pendiente antes de publicar:</strong> completar razón social, RUC y domicilio
       legal en <code>src/js/legal.js</code>. Sin esos datos, el documento no identifica al
       responsable y no cumple la Ley 29733.
     </p>`
  : '';

const bloque = (titulo, cuerpo) => `
  <section class="legal-bloque">
    <h2>${titulo}</h2>
    ${cuerpo}
  </section>
`;

export const renderPrivacidad = async (config) => {
  document.querySelector('#app').innerHTML = pageShell(config, 'privacidad', `
    <section class="page-hero compact">
      <span class="eyebrow">Legal</span>
      <h1>Política de privacidad</h1>
      <p>Última actualización: ${ULTIMA_ACTUALIZACION}</p>
    </section>

    <article class="legal">
      ${avisoBorrador()}

      ${bloque('Quién es responsable de tus datos', `
        <p>
          ${RESPONSABLE.razonSocial} (RUC ${RESPONSABLE.ruc}), con domicilio en
          ${RESPONSABLE.domicilio}, es responsable del banco de datos personales de
          ${config.empresa}. Para cualquier consulta sobre tus datos podés escribir a
          <a href="mailto:${config.correo}">${config.correo}</a> o al WhatsApp
          ${config.telefono}.
        </p>
      `)}

      ${bloque('Qué datos recogemos, y solo esos', `
        <p>Únicamente los que hacen falta para venderte y entregarte un producto:</p>
        <ul>
          <li><strong>Tu nombre y tu número de WhatsApp</strong>, cuando nos enviás un pedido.</li>
          <li><strong>El detalle del pedido</strong>: qué productos elegiste y cualquier
              indicación que nos escribas (por ejemplo, una dirección de entrega).</li>
          <li><strong>El comprobante de pago</strong>, si nos enviás la captura de tu
              transferencia o Yape. La guardamos como constancia de la operación.</li>
          <li><strong>Tu reseña</strong>, si decidís dejar una: el nombre que escribas ahí
              queda visible en público junto al producto.</li>
        </ul>
        <p>
          No te pedimos DNI, ni dirección exacta salvo que vos la escribas para el envío, ni
          datos de tarjeta: el pago se hace por fuera de esta web, en tu propia app del banco
          o billetera. <strong>Nunca vemos ni almacenamos los datos de tu tarjeta.</strong>
        </p>
      `)}

      ${bloque('Para qué los usamos', `
        <ul>
          <li>Preparar, cobrar y entregar tu pedido.</li>
          <li>Responderte por WhatsApp o correo sobre ese pedido.</li>
          <li>Llevar el registro de ventas que exige la contabilidad del negocio.</li>
        </ul>
        <p>
          No usamos tus datos para publicidad, no armamos perfiles de consumo y
          <strong>no vendemos ni cedemos tu información a terceros</strong> para que te
          contacten.
        </p>
      `)}

      ${bloque('Dónde se guardan', `
        <p>
          En <strong>Supabase</strong>, el proveedor de base de datos que usamos, cuyos
          servidores están fuera del Perú. Esto implica un flujo transfronterizo de datos:
          al enviarnos un pedido estás aceptando ese almacenamiento. El acceso está
          restringido por contraseña y solo lo tiene el equipo de ${config.empresa}.
        </p>
        <p>
          Conservamos los pedidos y comprobantes mientras dure la relación comercial y por
          el plazo que la ley exige guardar comprobantes. Después se eliminan.
        </p>
      `)}

      ${bloque('Cookies: no usamos', `
        <p>
          Esta web <strong>no instala cookies de rastreo ni publicidad</strong>, y no tiene
          Google Analytics, Meta Pixel ni nada parecido. Por eso no vas a ver un cartel de
          cookies: no habría nada que consentir.
        </p>
        <p>
          Lo único que guardamos en tu navegador es <strong>tu carrito de compras</strong>,
          en el almacenamiento local del propio dispositivo, para que no se te borre si
          cerrás la pestaña. Esa información no sale de tu celular y podés eliminarla
          vaciando el carrito o borrando los datos del sitio.
        </p>
        <p>
          Si en el futuro medimos visitas, será con una herramienta que no usa cookies ni
          identifica personas, y lo diremos acá.
        </p>
      `)}

      ${bloque('Tus derechos', `
        <p>
          La Ley 29733 te da derecho a <strong>acceder</strong> a tus datos, a
          <strong>rectificarlos</strong> si están mal, a <strong>cancelarlos</strong> y a
          <strong>oponerte</strong> a que los usemos. Para ejercer cualquiera de ellos
          escribinos a <a href="mailto:${config.correo}">${config.correo}</a>; te
          respondemos dentro de los plazos que fija la ley.
        </p>
        <p>
          Si considerás que no te atendimos bien, podés reclamar ante la Autoridad Nacional
          de Protección de Datos Personales del Ministerio de Justicia.
        </p>
      `)}

      ${bloque('Menores de edad', `
        <p>
          Esta tienda está pensada para mayores de 18 años. No recogemos datos de menores a
          sabiendas; si detectamos uno, lo eliminamos.
        </p>
      `)}

      ${bloque('Cambios en esta política', `
        <p>
          Si cambiamos algo, actualizamos la fecha del encabezado. Los cambios de fondo los
          avisamos también por nuestras redes.
        </p>
      `)}
    </article>
  `);
  setupNavigation();
  setupCart(config);
};

export const renderTerminos = async (config) => {
  document.querySelector('#app').innerHTML = pageShell(config, 'terminos', `
    <section class="page-hero compact">
      <span class="eyebrow">Legal</span>
      <h1>Términos y condiciones</h1>
      <p>Última actualización: ${ULTIMA_ACTUALIZACION}</p>
    </section>

    <article class="legal">
      ${avisoBorrador()}

      ${bloque('Quiénes somos', `
        <p>
          ${config.empresa} es una tienda online operada por ${RESPONSABLE.razonSocial}
          (RUC ${RESPONSABLE.ruc}). Atendemos ${config.horario.toLowerCase()}.
          ${config.direccion}.
        </p>
      `)}

      ${bloque('Cómo funciona una compra', `
        <p>
          Esta web es un <strong>catálogo</strong>: acá elegís los productos y armás tu
          pedido, y el pedido se cierra por WhatsApp con una persona del equipo. El pedido
          que enviás desde el carrito es una <strong>solicitud</strong>, no una compra
          confirmada.
        </p>
        <p>
          La compra queda confirmada cuando te respondemos confirmando disponibilidad,
          precio final y forma de entrega. Hasta ese momento no hay obligación de ninguna
          de las dos partes.
        </p>
      `)}

      ${bloque('Precios y disponibilidad', `
        <p>
          Los precios están en soles (S/) e incluyen impuestos. Pueden cambiar sin aviso
          previo, pero <strong>nunca después</strong> de que te confirmamos un pedido: el
          precio que te confirmamos es el que pagás.
        </p>
        <p>
          El stock que ves es el que tenemos cargado en el sistema. Puede pasar que un
          producto se agote entre que lo pedís y lo confirmamos; en ese caso te avisamos y
          no te cobramos nada.
        </p>
      `)}

      ${bloque('Pagos', `
        <p>
          El pago se hace por transferencia, Yape u otro medio que acordemos por WhatsApp.
          <strong>El cobro no ocurre dentro de esta web</strong>, así que nunca te vamos a
          pedir el número de tu tarjeta ni tus claves acá ni por chat. Si alguien lo hace en
          nombre de ${config.empresa}, no somos nosotros.
        </p>
      `)}

      ${bloque('Entregas', `
        <p>
          Coordinamos la entrega por WhatsApp según tu ubicación. Los plazos que te demos
          son estimados y de buena fe: dependen de la disponibilidad y del servicio de
          reparto.
        </p>
      `)}

      ${bloque('Cambios y devoluciones', `
        <p>
          Si el producto llega dañado, vencido o no es el que pediste, escribinos dentro de
          las <strong>48 horas</strong> de recibido con una foto y lo cambiamos o te
          devolvemos el dinero, sin vueltas.
        </p>
        <p>
          Por su naturaleza, los productos de cuidado personal e higiene
          <strong>abiertos o usados</strong> no se aceptan de vuelta, salvo defecto de
          fábrica.
        </p>
      `)}

      ${bloque('Reseñas y contenido de usuarios', `
        <p>
          Si dejás una reseña, sos responsable de lo que escribís. Podemos no publicar o
          retirar reseñas con insultos, datos personales de terceros, spam o contenido
          ajeno al producto.
        </p>
      `)}

      ${bloque('Uso del contenido', `
        <p>
          Las fotos, textos y el nombre ${config.empresa} son de la marca. Podés
          compartirlos citándonos, pero no usarlos para vender por tu cuenta.
        </p>
      `)}

      ${bloque('Responsabilidad', `
        <p>
          Los productos que vendemos son de cuidado personal y bienestar;
          <strong>no son medicamentos</strong> y no reemplazan una consulta médica. Si
          tenés una condición de salud, alergias o estás embarazada, consultá con un
          profesional antes de usarlos.
        </p>
        <p>
          Hacemos lo posible por que la web esté siempre disponible y con información
          correcta, pero puede haber interrupciones o errores de carga. Si un dato del
          catálogo está mal, vale el que te confirmamos por WhatsApp.
        </p>
      `)}

      ${bloque('Ley aplicable', `
        <p>
          Estos términos se rigen por las leyes del Perú, incluido el Código de Protección y
          Defensa del Consumidor (Ley 29571). Ante un reclamo, escribinos primero a
          <a href="mailto:${config.correo}">${config.correo}</a>: casi todo se resuelve
          hablando.
        </p>
      `)}
    </article>
  `);
  setupNavigation();
  setupCart(config);
};
