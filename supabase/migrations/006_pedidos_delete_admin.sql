create policy "pedidos_delete_admin" on pedidos
  for delete using (is_admin());
