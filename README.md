# Tablado Anita

Aplicação web para organizar as coreografias do **Grupo de Artes Nativas Anita Garibaldi**
no ENART (Encontro de Artes e Tradição Gaúcha): posições de cada integrante no tablado,
formações de cada dança, entrada e saída, visualização em 3D.

**Endereço:** https://oleodias.github.io/tablado-anita/ (acesso somente com login)

## Tecnologias

| Parte | Tecnologia | Para quê |
|---|---|---|
| Interface | React + TypeScript + Vite | telas da aplicação |
| Estilo | Tailwind CSS | visual; cores em `src/index.css` |
| Dados | Supabase (Postgres + Auth) | banco, login e permissões |
| Hospedagem | GitHub Pages | site gratuito, publicado automaticamente |
| 3D (próximas fases) | Three.js + React Three Fiber | tablado e dançarinos |

## Estrutura

```
src/
  main.tsx            ponto de entrada (rotas, login, cache de dados)
  App.tsx             decide qual tela mostrar (login, criar senha, app)
  index.css           cores e estilo global (troque aqui a identidade visual)
  components/         peças visuais reutilizáveis (botões, layout...)
  pages/              uma tela por arquivo
  lib/                conexão com o Supabase, login, utilidades
  domain/             regras do regulamento ENART (com testes)
  types/              tipos das tabelas do banco
supabase/
  migrations/         alterações do banco, em ordem (aplicar no SQL Editor)
  scripts/            comandos úteis (ex.: promover alguém a admin)
docs/                 guias de configuração e levantamento do tablado
.github/workflows/    publicação automática no GitHub Pages
```

## Telas

| Tela | Quem usa | O que faz |
|---|---|---|
| Início | todos | suas danças do ano, seu par, atalhos |
| Danças | todos | as 28 danças por bloco, filtro por ano (rodízio do regulamento) |
| Dança | todos (edição: professores) | tipo, observações e escalação (titular/reserva) com alerta de 8 a 12 pares |
| Integrantes | todos (edição: professores) | cadastro de dançarinos, busca e filtros |
| Pares | todos (edição: professores) | peão + prenda, número e cor do par |
| Acessos | admin | papel de cada conta e vínculo com o integrante |

## Rodando no seu computador

Pré-requisito: [Node.js 22](https://nodejs.org/).

```bash
npm install
```

```bash
npm run dev
```

Abra http://localhost:5173/tablado-anita/

Outros comandos:

| Comando | O que faz |
|---|---|
| `npm test` | roda os testes |
| `npm run lint` | procura problemas no código |
| `npm run build` | gera a versão de produção em `dist/` |

## Publicação

Toda alteração enviada para a branch `main` é publicada automaticamente pelo GitHub Actions
(veja a aba **Actions** do repositório).

## Permissões

| Papel | Pode |
|---|---|
| `admin` | tudo, inclusive mudar o papel das pessoas |
| `professor` | criar e editar integrantes, danças, formações |
| `dancarino` | visualizar |

As regras ficam no próprio banco (Row Level Security), então valem mesmo para quem tentar
acessar o banco por fora da aplicação. Não há cadastro aberto: contas são criadas por convite.

Guia completo: [docs/configuracao-supabase.md](docs/configuracao-supabase.md).
