-- Adicionar coluna de pagamento na tabela indicacoes
alter table indicacoes add column if not exists comissao_paga boolean default false;
alter table indicacoes add column if not exists comissao_paga_em timestamptz;
alter table indicacoes add column if not exists comissao_valor numeric(10,2);
