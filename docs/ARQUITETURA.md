# Dois shells, uma aplicação

O portal Next.js é a única interface. A API FastAPI continua dona de autenticação, autorização e dados.

## Áreas

- `(cliente)` nas rotas `/`, `/imoveis`, `/financeiro` e demais telas do proprietário ou coanfitrião. Quem tem só o papel `admin` é enviado para `/admin`.
- `(admin)` em `/admin`. Quem não é `admin` é enviado para `/`.
- O middleware só verifica se o cookie `anf_sessao` existe. O papel é decidido no layout, depois do `GET /me`. A API recusa a mesma operação se o papel não permitir.

## Login

Quem tem `admin` entra em `/admin`. O parâmetro `next` só é honrado se aquele papel pode abrir o caminho.

## Módulos da fase 2

Fechamento, repasse, split, simulador fiscal, minutas de contrato e extrato em texto vivem na API (`app/domain` e `app/services/interno.py`). O navegador não calcula imposto nem chama modelo de linguagem.

Notificações in-app e configurações persistidas ficam fora desta entrega.
