import {
  createProduct,
  deleteProduct,
  listAllCategories,
  listAllProducts,
  updateProduct,
  uploadProductImage
} from '../api.js';
import { slugify } from '../../../utils/slug.js';

const linesToArray = (value) =>
  value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

export const renderProductsView = async (container, setStatus) => {
  container.innerHTML = '<p class="empty-state">Cargando productos…</p>';

  const [products, categories] = await Promise.all([listAllProducts(), listAllCategories()]);

  if (!categories.length) {
    container.innerHTML = '<p class="empty-state">Crea primero una categoría en la pestaña Categorías antes de agregar productos.</p>';
    return;
  }

  let editingId = null;
  let pendingImagenes = [];

  container.innerHTML = `
    <div class="admin-toolbar">
      <button class="btn btn-primary" type="button" data-new-product>+ Nuevo producto</button>
    </div>
    <div class="admin-list">
      ${products.length ? products.map((product) => `
        <article class="detail-card admin-row">
          <img class="admin-thumb" src="${product.imagen_principal ?? ''}" alt="${product.nombre}" />
          <div class="admin-row-body">
            <div class="product-card-tags">
              <span class="pill">${product.categorias?.nombre ?? 'Sin categoría'}</span>
              ${product.activo ? '' : '<span class="pill pill-muted">Inactivo</span>'}
              ${product.disponible ? '' : '<span class="pill pill-muted">Agotado</span>'}
              ${product.destacado ? '<span class="pill">Destacado</span>' : ''}
            </div>
            <h3>${product.nombre}</h3>
            <p>${new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(product.precio)}</p>
          </div>
          <div class="admin-actions">
            <button class="btn btn-ghost" type="button" data-edit="${product.id}">Editar</button>
            <button class="btn btn-ghost" type="button" data-toggle-activo="${product.id}">${product.activo ? 'Desactivar' : 'Activar'}</button>
            <button class="btn btn-ghost" type="button" data-toggle-disponible="${product.id}">${product.disponible ? 'Marcar agotado' : 'Marcar disponible'}</button>
            <button class="btn btn-ghost" type="button" data-delete="${product.id}">Eliminar</button>
          </div>
        </article>
      `).join('') : '<p class="empty-state">Todavía no hay productos.</p>'}
    </div>
    <dialog class="admin-dialog" data-product-dialog>
      <form class="contact-form" data-product-form>
        <h2 data-product-dialog-title>Nuevo producto</h2>
        <label>Nombre<input data-p-nombre type="text" required maxlength="120" /></label>
        <label>Categoría
          <select data-p-categoria required>
            ${categories.map((category) => `<option value="${category.id}">${category.nombre}</option>`).join('')}
          </select>
        </label>
        <label>Precio (S/)<input data-p-precio type="number" min="0" step="0.10" required /></label>
        <label>Descripción<textarea data-p-descripcion rows="3" maxlength="400"></textarea></label>
        <label>Beneficios (uno por línea)<textarea data-p-beneficios rows="3"></textarea></label>
        <label>Ingredientes (uno por línea)<textarea data-p-ingredientes rows="3"></textarea></label>
        <label>Modo de uso<textarea data-p-modouso rows="2"></textarea></label>
        <label>Imagen principal<input data-p-imagen-principal type="file" accept="image/*" /></label>
        <div class="admin-thumb-row" data-p-imagen-principal-preview></div>
        <label>Agregar imágenes a la galería<input data-p-imagenes type="file" accept="image/*" multiple /></label>
        <div class="admin-thumb-row" data-p-imagenes-preview></div>
        <label class="admin-checkbox"><input data-p-destacado type="checkbox" /> Destacado</label>
        <label class="admin-checkbox"><input data-p-activo type="checkbox" /> Activo (visible en el catálogo)</label>
        <label class="admin-checkbox"><input data-p-disponible type="checkbox" /> Disponible (no agotado)</label>
        <div class="admin-dialog-actions">
          <button class="btn btn-ghost" type="button" data-product-cancel>Cancelar</button>
          <button class="btn btn-primary" type="submit" data-product-submit>Guardar</button>
        </div>
        <p class="status-message" data-product-form-status></p>
      </form>
    </dialog>
  `;

  const dialog = container.querySelector('[data-product-dialog]');
  const form = container.querySelector('[data-product-form]');
  const title = container.querySelector('[data-product-dialog-title]');
  const formStatus = container.querySelector('[data-product-form-status]');
  const galleryPreview = container.querySelector('[data-p-imagenes-preview]');
  const mainPreview = container.querySelector('[data-p-imagen-principal-preview]');

  const refresh = () => renderProductsView(container, setStatus);

  const renderGalleryPreview = () => {
    galleryPreview.innerHTML = pendingImagenes.map((url, index) => `
      <span class="admin-thumb-wrap">
        <img class="admin-thumb" src="${url}" alt="" />
        <button type="button" class="admin-thumb-remove" data-remove-imagen="${index}" aria-label="Quitar imagen">×</button>
      </span>
    `).join('');
    galleryPreview.querySelectorAll('[data-remove-imagen]').forEach((button) => {
      button.addEventListener('click', () => {
        pendingImagenes.splice(Number(button.dataset.removeImagen), 1);
        renderGalleryPreview();
      });
    });
  };

  const openDialog = (product = null) => {
    editingId = product?.id ?? null;
    pendingImagenes = product?.imagenes ? [...product.imagenes] : [];
    title.textContent = product ? 'Editar producto' : 'Nuevo producto';
    formStatus.textContent = '';
    form.querySelector('[data-p-nombre]').value = product?.nombre ?? '';
    form.querySelector('[data-p-categoria]').value = product?.categoria_id ?? categories[0].id;
    form.querySelector('[data-p-precio]').value = product?.precio ?? '';
    form.querySelector('[data-p-descripcion]').value = product?.descripcion ?? '';
    form.querySelector('[data-p-beneficios]').value = (product?.beneficios ?? []).join('\n');
    form.querySelector('[data-p-ingredientes]').value = (product?.ingredientes ?? []).join('\n');
    form.querySelector('[data-p-modouso]').value = product?.modo_uso ?? '';
    form.querySelector('[data-p-destacado]').checked = Boolean(product?.destacado);
    form.querySelector('[data-p-activo]').checked = product ? product.activo : true;
    form.querySelector('[data-p-disponible]').checked = product ? product.disponible : true;
    form.querySelector('[data-p-imagen-principal]').value = '';
    form.querySelector('[data-p-imagenes]').value = '';
    mainPreview.innerHTML = product?.imagen_principal
      ? `<img class="admin-thumb" src="${product.imagen_principal}" alt="" />`
      : '<span class="empty-state">Sin imagen todavía</span>';
    renderGalleryPreview();
    dialog.showModal();
  };

  container.querySelector('[data-new-product]').addEventListener('click', () => openDialog());
  container.querySelector('[data-product-cancel]').addEventListener('click', () => dialog.close());

  container.querySelectorAll('[data-edit]').forEach((button) => {
    button.addEventListener('click', () => {
      const product = products.find((item) => item.id === button.dataset.edit);
      openDialog(product);
    });
  });

  container.querySelectorAll('[data-delete]').forEach((button) => {
    button.addEventListener('click', async () => {
      if (!window.confirm('¿Eliminar este producto? Esta acción no se puede deshacer.')) return;
      try {
        await deleteProduct(button.dataset.delete);
        setStatus('Producto eliminado.');
        refresh();
      } catch (error) {
        setStatus('No se pudo eliminar el producto.', true);
      }
    });
  });

  container.querySelectorAll('[data-toggle-activo]').forEach((button) => {
    button.addEventListener('click', async () => {
      const product = products.find((item) => item.id === button.dataset.toggleActivo);
      await updateProduct(product.id, { activo: !product.activo });
      setStatus(`Producto ${product.activo ? 'desactivado' : 'activado'}.`);
      refresh();
    });
  });

  container.querySelectorAll('[data-toggle-disponible]').forEach((button) => {
    button.addEventListener('click', async () => {
      const product = products.find((item) => item.id === button.dataset.toggleDisponible);
      await updateProduct(product.id, { disponible: !product.disponible });
      setStatus(`Producto marcado como ${product.disponible ? 'agotado' : 'disponible'}.`);
      refresh();
    });
  });

  form.querySelector('[data-p-imagenes]').addEventListener('change', async (event) => {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) return;
    const nombre = form.querySelector('[data-p-nombre]').value.trim() || 'producto';
    formStatus.textContent = 'Subiendo imágenes…';
    try {
      const uploaded = await Promise.all(files.map((file) => uploadProductImage(file, slugify(nombre))));
      pendingImagenes.push(...uploaded);
      renderGalleryPreview();
      formStatus.textContent = '';
    } catch (error) {
      formStatus.textContent = 'No se pudieron subir una o más imágenes.';
    }
    event.target.value = '';
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const submitButton = form.querySelector('[data-product-submit]');
    submitButton.disabled = true;
    formStatus.textContent = '';

    try {
      const nombre = form.querySelector('[data-p-nombre]').value.trim();
      const mainFile = form.querySelector('[data-p-imagen-principal]').files[0];
      const existingProduct = editingId ? products.find((item) => item.id === editingId) : null;

      let imagenPrincipal = existingProduct?.imagen_principal ?? null;
      if (mainFile) {
        imagenPrincipal = await uploadProductImage(mainFile, slugify(nombre));
      }
      if (!imagenPrincipal && pendingImagenes.length) {
        imagenPrincipal = pendingImagenes[0];
      }

      const payload = {
        nombre,
        categoria_id: form.querySelector('[data-p-categoria]').value,
        precio: Number(form.querySelector('[data-p-precio]').value),
        descripcion: form.querySelector('[data-p-descripcion]').value.trim(),
        beneficios: linesToArray(form.querySelector('[data-p-beneficios]').value),
        ingredientes: linesToArray(form.querySelector('[data-p-ingredientes]').value),
        modo_uso: form.querySelector('[data-p-modouso]').value.trim(),
        imagen_principal: imagenPrincipal,
        imagenes: pendingImagenes,
        destacado: form.querySelector('[data-p-destacado]').checked,
        activo: form.querySelector('[data-p-activo]').checked,
        disponible: form.querySelector('[data-p-disponible]').checked
      };

      if (editingId) {
        await updateProduct(editingId, payload);
        setStatus('Producto actualizado.');
      } else {
        payload.slug = slugify(nombre);
        await createProduct(payload);
        setStatus('Producto creado.');
      }
      dialog.close();
      refresh();
    } catch (error) {
      formStatus.textContent = 'No se pudo guardar el producto. Revisa los campos e intenta de nuevo.';
    } finally {
      submitButton.disabled = false;
    }
  });
};
