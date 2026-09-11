// Baja una copia de todos los datos de la base y los guarda como JSON,
// una tabla por archivo.
//
// Por que asi y no con pg_dump: pg_dump necesita la cadena de conexion
// de Postgres, que Supabase esconde tres niveles adentro de su panel y
// exige elegir bien entre tres variantes parecidas. Esto solo necesita
// dos datos que estan juntos en una sola pantalla.
//
// Que respalda y que no:
//   - Los DATOS: todo lo que no se puede volver a escribir a mano
//     (socios, movimientos, cierres, pedidos, productos).
//   - La ESTRUCTURA no hace falta respaldarla: tablas, funciones y
//     politicas RLS ya viven versionadas en supabase/schema.sql y
//     supabase/migrations/. Ese es el respaldo del esquema.
//   - Las CUENTAS de acceso las administra Supabase aparte y no entran.
//
// Para restaurar: crear un proyecto nuevo, correr schema.sql y las
// migraciones en orden, y volver a cargar estos JSON.

const URL_BASE = process.env.SUPABASE_URL;
const CLAVE = process.env.SUPABASE_SERVICE_KEY;
const DESTINO = 'copia';

if (!URL_BASE || !CLAVE) {
  console.error('Faltan SUPABASE_URL o SUPABASE_SERVICE_KEY.');
  process.exit(1);
}

const { mkdir, readdir, readFile, writeFile } = await import('node:fs/promises');

const cabeceras = {
  apikey: CLAVE,
  Authorization: `Bearer ${CLAVE}`
};

// La lista de tablas sale del esquema versionado y no de una lista
// escrita a mano: asi una tabla que se agregue en una migracion entra
// sola en la copia. Una lista fija siempre se olvida de actualizar
// justo la tabla que despues hace falta recuperar.
const tablasDelEsquema = async () => {
  const archivos = [];
  for (const dir of ['supabase', 'supabase/migrations']) {
    try {
      const entradas = await readdir(dir);
      archivos.push(...entradas.filter((f) => f.endsWith('.sql')).map((f) => `${dir}/${f}`));
    } catch (error) {
      // La carpeta puede no existir en algun proyecto; no es un fallo.
    }
  }

  const tablas = new Set();
  for (const archivo of archivos) {
    const sql = await readFile(archivo, 'utf8');
    for (const m of sql.matchAll(/create\s+table\s+(?:if\s+not\s+exists\s+)?([a-z_][a-z0-9_]*)/gi)) {
      tablas.add(m[1]);
    }
  }
  return [...tablas].sort();
};

// Ademas se le pregunta a la propia API, por si hay alguna tabla creada
// a mano en el panel que nunca paso por una migracion. Con algunas
// claves este endpoint viene restringido: si no contesta, se sigue con
// las del esquema y se avisa, en vez de abortar la copia entera.
const tablasDeLaApi = async () => {
  try {
    const respuesta = await fetch(`${URL_BASE}/rest/v1/`, { headers: cabeceras });
    if (!respuesta.ok) return null;
    const spec = await respuesta.json();
    return Object.keys(spec.definitions ?? spec.components?.schemas ?? {});
  } catch (error) {
    return null;
  }
};

const listarTablas = async () => {
  const delEsquema = await tablasDelEsquema();
  const deLaApi = await tablasDeLaApi();

  if (deLaApi === null) {
    console.log('  (la API no quiso listar sus tablas; se usan las del esquema versionado)\n');
    return delEsquema;
  }

  const soloEnLaApi = deLaApi.filter((t) => !delEsquema.includes(t));
  if (soloEnLaApi.length) {
    console.log(`  Ojo: estas tablas existen en la base pero no en el esquema del repo: ${soloEnLaApi.join(', ')}\n`);
  }
  return [...new Set([...delEsquema, ...deLaApi])].sort();
};

// De a mil filas: sin paginar, una tabla grande se corta en silencio en
// el limite que tenga puesto el servidor.
const TAMANO_PAGINA = 1000;

const bajarTabla = async (tabla) => {
  const filas = [];
  for (let desde = 0; ; desde += TAMANO_PAGINA) {
    const hasta = desde + TAMANO_PAGINA - 1;
    const respuesta = await fetch(`${URL_BASE}/rest/v1/${tabla}?select=*`, {
      headers: { ...cabeceras, Range: `${desde}-${hasta}`, 'Range-Unit': 'items' }
    });
    if (respuesta.status === 401 || respuesta.status === 403) {
      // Sintoma clasico de haber cargado la clave publica en vez de la
      // de servicio: las tablas abiertas al publico se leen bien y las
      // protegidas por RLS devuelven 401. La copia saldria a medias sin
      // que nadie lo note, asi que se dice con todas las letras.
      throw new Error(
        `${tabla}: HTTP ${respuesta.status}. La clave no puede leer esta tabla.\n` +
        '  Casi seguro se cargo la clave publica (anon / publishable) en vez de la de\n' +
        '  servicio (service_role / secret). La de servicio es la unica que pasa por\n' +
        '  encima de RLS y ve todo.'
      );
    }
    if (!respuesta.ok) throw new Error(`${tabla}: HTTP ${respuesta.status}`);
    const pagina = await respuesta.json();
    filas.push(...pagina);
    if (pagina.length < TAMANO_PAGINA) break;
  }
  return filas;
};

await mkdir(DESTINO, { recursive: true });

const tablas = await listarTablas();
if (!tablas.length) throw new Error('La base no devolvio ninguna tabla. Algo esta mal en la conexion.');

let totalFilas = 0;
const resumen = [];

for (const tabla of tablas) {
  const filas = await bajarTabla(tabla);
  await writeFile(`${DESTINO}/${tabla}.json`, JSON.stringify(filas, null, 2));
  totalFilas += filas.length;
  resumen.push({ tabla, filas: filas.length });
  console.log(`  ${tabla.padEnd(28)} ${String(filas.length).padStart(6)} filas`);
}

await writeFile(
  `${DESTINO}/_resumen.json`,
  JSON.stringify({ fecha: new Date().toISOString(), tablas: resumen, totalFilas }, null, 2)
);

console.log(`\n  ${tablas.length} tablas, ${totalFilas} filas en total.`);

// Una copia vacia se guarda igual y parece que todo salio bien. Es la
// forma mas facil de creer que hay respaldo y no tenerlo, asi que se
// falla a proposito.
if (totalFilas === 0) {
  console.error('\nERROR: no se bajo ni una fila. Revisar la clave antes de confiar en esta copia.');
  process.exit(1);
}
