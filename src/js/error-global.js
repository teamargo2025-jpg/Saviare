// Red de seguridad para errores que se escapan de un try/catch.
//
// Sin esto, un fallo inesperado deja la pantalla a medio pintar sin
// ningun mensaje: el usuario cree que la app se colgo y nosotros nunca
// nos enteramos. Esto le avisa que puede recargar y deja el detalle en
// la consola para poder rastrearlo despues.

const MENSAJE = 'Algo falló en la página. Recarga para continuar.';

let yaAvisado = false;

const mostrarAviso = () => {
  if (yaAvisado || !document.body) return;
  yaAvisado = true;

  const aviso = document.createElement('div');
  aviso.className = 'error-global';
  aviso.setAttribute('role', 'alert');

  const texto = document.createElement('span');
  texto.textContent = MENSAJE;

  const boton = document.createElement('button');
  boton.type = 'button';
  boton.textContent = 'Recargar';
  boton.addEventListener('click', () => window.location.reload());

  aviso.append(texto, boton);
  document.body.appendChild(aviso);
};

export const instalarRedDeErrores = () => {
  // Solo errores de script: los ErrorEvent. Una imagen rota dispara un
  // Event comun y no deberia alarmar a nadie.
  window.addEventListener('error', (evento) => {
    if (!(evento instanceof ErrorEvent)) return;
    console.error('[error no capturado]', evento.error ?? evento.message);
    mostrarAviso();
  });

  window.addEventListener('unhandledrejection', (evento) => {
    console.error('[promesa sin catch]', evento.reason);
    mostrarAviso();
  });
};
