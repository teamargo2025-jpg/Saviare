alter table pedidos
  add column origen text not null default 'whatsapp'
  check (origen in ('whatsapp', 'qr'));
