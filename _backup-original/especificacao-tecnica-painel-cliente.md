# Especificação técnica — Painel do Cliente (Anfitrião Gestão e Contabilidade)

## 1. Objetivo

Transformar o protótipo de demonstração já validado (dados fictícios, sem login real) em um sistema de produção: cada cliente da Anfitrião acessa com uma conta própria e enxerga apenas os seus dados — perfil, imóveis, faturamento/rentabilidade e situação fiscal.

Protótipo de referência (telas e fluxo já aprovados pelo usuário): `https://claude.ai/code/artifact/e3b87c8b-d8dd-4413-ad5f-6d283226bf76`

Este documento serve como ponto de partida para um desenvolvedor ou agência orçar e construir a versão real. Não é código pronto — é a definição do escopo, do modelo de dados e dos requisitos de segurança.

## 2. Por que isso não pode ser só um site estático

O site institucional (landing page + blog) é HTML estático: qualquer hospedagem simples resolve. O painel do cliente é diferente porque precisa de:

- Autenticação (login/senha ou magic link) por cliente, com sessão segura.
- Banco de dados com os dados de cada cliente, isolados uns dos outros (nenhum cliente pode ver dado de outro).
- Um servidor de aplicação (backend) que valide quem está pedindo o quê antes de entregar dados.
- Backups, controle de acesso e conformidade com a LGPD (dados fiscais e financeiros são dados sensíveis).

Nada disso existe em uma hospedagem de arquivos estáticos — exige uma aplicação web de verdade.

## 3. Escopo funcional (baseado no protótipo)

| Tela | Funcionalidade |
|---|---|
| **Login** | Autenticação do cliente (e-mail/senha ou link mágico). Recuperação de senha. |
| **Home** | Indicador de status: "Regular" ou "Pendência fiscal" (calculado a partir dos impostos em aberto). Resumo rápido do mês. |
| **Perfil** | Dados cadastrais do cliente — Pessoa Física ou Jurídica (nome/razão social, CPF/CNPJ, e-mail, telefone, endereço). Edição pelo próprio cliente. |
| **Imóveis** | Cadastro de imóveis do cliente: nome, endereço, tipo, plataformas de anúncio (Airbnb, Booking etc.), faturamento do mês, rentabilidade. Listar, adicionar, editar. |
| **Rentabilidade / Faturamento** | Gráfico de faturamento mensal (histórico) e ranking dos imóveis por desempenho. |
| **Impostos** | Lista de impostos/obrigações com vencimento e valor; marcação manual (ou automática, se integrado ao sistema interno da contabilidade) de pago/pendente; alerta visual quando há pendência. |

## 4. Papéis de acesso (a definir com o usuário)

- **Cliente**: vê e edita apenas os próprios dados (perfil e imóveis); vê (mas não edita) faturamento e impostos lançados pela contabilidade.
- **Administrador (equipe Anfitrião)**: lança/atualiza impostos e faturamento de todos os clientes, gerencia cadastros. Provavelmente precisa de um painel interno separado (fora do escopo deste documento, mas deve ser previsto na arquitetura).

⚠️ Pendência: confirmar se o cliente pode marcar imposto como pago sozinho, ou se isso deve ser sempre confirmado pela equipe da Anfitrião (mais seguro do ponto de vista contábil).

## 5. Modelo de dados (rascunho, baseado no protótipo)

```
Cliente
  id, tipo (PF|PJ), nome/razao_social, documento (CPF|CNPJ),
  email, telefone, endereco, criado_em

Imovel
  id, cliente_id (FK), nome, endereco, tipo,
  plataformas (lista: Airbnb, Booking, ...), 
  criado_em

FaturamentoMensal
  id, imovel_id (FK), mes_referencia, valor_bruto, rentabilidade

Imposto
  id, cliente_id (FK), nome, competencia, vencimento,
  valor, status (pago|pendente), pago_em, confirmado_por
```

Cada tabela com dados do cliente deve ter uma trava de acesso (Row Level Security ou equivalente) garantindo que uma consulta só retorna linhas do próprio `cliente_id` autenticado.

## 6. Arquitetura recomendada

Duas rotas possíveis, dependendo de orçamento/prazo/preferência do desenvolvedor:

**A. Plataforma gerenciada (mais rápida de construir e mais barata para manter no início)**
- Frontend: aplicação web (React/Next.js ou similar).
- Backend + banco de dados + autenticação: um provedor como Supabase ou Firebase, que já entrega login seguro, banco de dados com controle de acesso por linha, e hospedagem de API pronta.
- Hospedagem do frontend: Vercel, Netlify ou a própria hospedagem contratada, se suportar aplicações Node.js.

**B. Backend próprio (mais controle, mais trabalho de desenvolvimento e manutenção)**
- Frontend separado do backend.
- Backend customizado (Node.js, Python/Django, etc.) com banco de dados próprio (PostgreSQL, por exemplo) e autenticação implementada à mão (ou via biblioteca como Auth.js/NextAuth).
- Exige mais cuidado adicional com segurança, backups e escalabilidade — normalmente só compensa se o sistema crescer muito ou se integrar com sistemas internos da contabilidade.

Para o volume inicial de clientes da Anfitrião, a rota **A** tende a ser mais rápida de colocar em produção com segurança adequada.

## 7. Requisitos de segurança (não negociáveis)

- Senhas nunca em texto puro — hash com bcrypt/argon2 (ou delegado ao provedor de autenticação).
- Toda comunicação via HTTPS.
- Isolamento de dados por cliente (um cliente jamais deve conseguir acessar, via URL manipulada ou API, dados de outro).
- Dados fiscais/financeiros são dados sensíveis sob a LGPD — a Anfitrião, como controladora, deve ter política de privacidade publicada, retenção de dados definida e processo de resposta a incidentes.
- Backups regulares do banco de dados.
- Log de auditoria de alterações em dados sensíveis (quem marcou um imposto como pago, por exemplo).

## 8. Fases sugeridas

1. **Fundação**: autenticação real, cadastro/login de cliente, tela de Perfil funcional com banco de dados de verdade.
2. **Imóveis**: CRUD de imóveis vinculado ao cliente autenticado.
3. **Faturamento/Rentabilidade**: lançamento (pela equipe interna) e visualização (pelo cliente) do faturamento mensal, gráfico e ranking.
4. **Impostos**: lançamento e status de pendência, com o indicador de "Regular"/"Pendência fiscal" na Home.
5. **Painel interno da equipe**: interface para a equipe da Anfitrião lançar/atualizar dados dos clientes (necessário para as fases 3 e 4 funcionarem no dia a dia).
6. **Refinamentos**: notificações de vencimento, exportação de relatórios, etc.

## 9. O que este documento não cobre

- Orçamento e prazo — dependem do desenvolvedor/agência contratada e não são estimados aqui.
- Integração com sistemas contábeis internos da Anfitrião (se houver um sistema de gestão já em uso, ele deveria alimentar o faturamento/impostos automaticamente — vale investigar antes de começar o desenvolvimento).
- Design visual — reaproveitar os tokens de cor/tipografia já definidos no site (Fraunces + IBM Plex Sans/Mono, paleta em tons de azul) para manter a identidade.

---

*Documento de apoio para orçar/contratar o desenvolvimento do painel real. O protótipo em Artifact continua servindo como referência de telas, fluxo e conteúdo.*

