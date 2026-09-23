# Guia de teste local — Portal + Anfitrião API

Roteiro para rodar o portal ligado à API na sua máquina e testar cadastro,
aprovação, login e as demais telas.

## 1. Subir a API

Na pasta `anfitriao_api` (detalhes no README de lá):

```bash
poetry install
cp .env.example .env        # preencha MongoDB, Firebase e as variáveis abaixo
poetry run uvicorn app.main:app --reload --port 8000
```

Variáveis da API que o portal precisa:

```
FIREBASE_WEB_API_KEY=AIza...            # Console Firebase → Configurações do projeto → Geral
PORTAL_URL=http://localhost:3000
PORTAL_PROXY_SECRET=<o mesmo valor do portal>
CORS_ORIGINS=http://localhost:3000
```

Crie o primeiro admin (equipe):

```bash
poetry run python -m scripts.criar_admin --email voce@anfitriaocontabilidade.com.br --nome "Seu Nome"
```

> **Sem Firebase real?** Use o emulador: `firebase emulators:start --only auth
> --project demo-anfitriao` e, no `.env` da API, `FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099`
> + `FIREBASE_WEB_API_KEY=qualquer-coisa`. Os e-mails (verificação/redefinição)
> não são enviados; os links aparecem em
> `http://127.0.0.1:9099/emulator/v1/projects/demo-anfitriao/oobCodes`.

## 2. Subir o portal

```bash
cp .env.example .env.local   # API_URL=http://localhost:8000/api/v1 e PORTAL_PROXY_SECRET
npm install
npm run dev                  # http://localhost:3000
```

## 3. Roteiro de teste

1. **Cadastro** — em `/cadastro`, crie uma conta (perfil "Os dois"). Você volta ao
   login com o aviso "Cadastro recebido".
2. **Pendente** — tente entrar com essa conta: aparece "Seu cadastro está em análise".
3. **Aprovação** — entre com o admin, vá em **Clientes** → "Cadastros aguardando
   aprovação" → **Aprovar** (dá para ajustar o perfil antes).
4. **Login do cliente** — saia e entre com a conta aprovada. A Home mostra
   "Nenhum imóvel cadastrado".
5. **Imóveis** — cadastre um imóvel próprio e um "de terceiro" (marque "Administro
   este imóvel para outra pessoa"). Edite um deles.
6. **Estoque / Checklist** — adicione um item e marque itens do checklist (a nota
   vem da API).
7. **Perfil** — altere o endereço; troque a senha (as outras sessões são encerradas).
8. **Sair** — depois do logout, a sessão antiga não vale mais na API.
9. **Esqueci minha senha** — peça o link, abra-o (e-mail real ou lista do emulador)
   e defina a nova senha em `/redefinir-senha`.
10. **Desativar** — como admin, em Clientes → Editar cadastro → "Acesso ao portal:
    Desativado". O cliente é desconectado na próxima página e não consegue entrar.

Esse mesmo roteiro foi automatizado com Playwright (40 verificações) contra a API
real + emulador do Firebase Auth durante a integração (2026-09-23).
