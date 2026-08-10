alter table pedidos
  add column comprobante_url text;

insert into storage.buckets (id, name, public)
values ('comprobantes', 'comprobantes', false)
on conflict (id) do nothing;

create policy "comprobantes_storage_select_admin" on storage.objects
  for select using (bucket_id = 'comprobantes' and is_admin());

create policy "comprobantes_storage_write_admin" on storage.objects
  for insert with check (bucket_id = 'comprobantes' and is_admin());

create policy "comprobantes_storage_delete_admin" on storage.objects
  for delete using (bucket_id = 'comprobantes' and is_admin());
