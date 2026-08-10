alter table productos
  add column stock_minimo integer not null default 5 check (stock_minimo >= 0);
