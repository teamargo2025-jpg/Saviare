import { createCategory, deleteCategory, listAllCategories, listAllProducts, updateCategory } from '../api.js';

export const renderCategoriesView = async (container, setStatus) => {
  container.innerHTML = '<p class="empty-state">Cargando categorías…</p>';

  const [categories, products] = await Promise.all([listAllCategories(), listAllProducts()]);
  const countByCategory = products.reduce((acc, product) => {
    const id = product.categoria_id;
    acc[id] = (acc[id] ?? 0) + 1;
    return acc;
  }, {});

  let editingId = null;

  container.innerHTML = `
    <div class="admin-toolbar">
      <button class="btn btn-primary" type="button" data-new-category>+ Nueva categoría</button>
    </div>
    <div class="admin-list">
      ${categories.length ? categories.map((category) => `
        <article class="detail-card admin-row">
          <div>
            <h3>${category.nombre}</h3>
            <p>${category.descripcion ?? ''}</p>
            <span class="pill">${countByCategory[category.id] ?? 0} productos</span>
          </div>
          <div class="admin-actions">
            <button class="btn btn-ghost" type="button" data-edit="${category.id}">Editar</button>
            <button class="btn btn-ghost" type="button" data-delete="${category.id}">Eliminar</button>
          </div>
        </article>
      `).join('') : '<p class="empty-state">Todavía no hay categorías.</p>'}
    </div>
    <dialog class="admin-dialog" data-category-dialog>
      <form class="contact-form" data-category-form>
        <h2 data-category-dialog-title>Nueva categoría</h2>
        <label>Nombre<input data-category-nombre type="text" required maxlength="60" /></label>
        <label>Descripción<textarea data-category-descripcion rows="3" maxlength="200"></textarea></label>
        <div class="admin-dialog-actions">
          <button class="btn btn-ghost" type="button" data-category-cancel>Cancelar</button>
          <button class="btn btn-primary" type="submit">Guardar</button>
        </div>
      </form>
    </dialog>
  `;

  const dialog = container.querySelector('[data-category-dialog]');
  const form = container.querySelector('[data-category-form]');
  const title = container.querySelector('[data-category-dialog-title]');
  const nombreInput = container.querySelector('[data-category-nombre]');
  const descripcionInput = container.querySelector('[data-category-descripcion]');

  const refresh = () => renderCategoriesView(container, setStatus);

  const openDialog = (category = null) => {
    editingId = category?.id ?? null;
    title.textContent = category ? 'Editar categoría' : 'Nueva categoría';
    nombreInput.value = category?.nombre ?? '';
    descripcionInput.value = category?.descripcion ?? '';
    dialog.showModal();
  };

  container.querySelector('[data-new-category]').addEventListener('click', () => openDialog());
  container.querySelector('[data-category-cancel]').addEventListener('click', () => dialog.close());

  container.querySelectorAll('[data-edit]').forEach((button) => {
    button.addEventListener('click', () => {
      const category = categories.find((item) => item.id === button.dataset.edit);
      openDialog(category);
    });
  });

  container.querySelectorAll('[data-delete]').forEach((button) => {
    button.addEventListener('click', async () => {
      if (!window.confirm('¿Eliminar esta categoría?')) return;
      try {
        await deleteCategory(button.dataset.delete);
        setStatus('Categoría eliminada.');
        refresh();
      } catch (error) {
        setStatus('No se puede eliminar: hay productos que usan esta categoría.', true);
      }
    });
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const payload = {
      nombre: nombreInput.value.trim(),
      descripcion: descripcionInput.value.trim()
    };
    try {
      if (editingId) {
        await updateCategory(editingId, payload);
        setStatus('Categoría actualizada.');
      } else {
        await createCategory(payload);
        setStatus('Categoría creada.');
      }
      dialog.close();
      refresh();
    } catch (error) {
      setStatus('No se pudo guardar la categoría. Verifica que el nombre no esté repetido.', true);
    }
  });
};
