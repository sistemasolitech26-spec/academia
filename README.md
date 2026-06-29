# Academia V3 Profissional - Olitech

Sistema de academia/aluno com CRUD completo de treinos, exercícios e alunos.

## Login padrão

- Usuário: `olitech`
- Senha: `051309`

O usuário administrador é criado automaticamente na primeira execução. Se já existir, a senha é atualizada para `051309`.

## Principais correções desta versão

- Botões Adicionar, Salvar, Editar e Excluir funcionando para treinos.
- Botões Adicionar, Salvar, Editar e Excluir funcionando para exercícios.
- Exercícios vinculados ao treino com dia A/B/C/D/E, séries, repetições, carga, descanso, calorias, vídeo e observações.
- Banco SQLite inicial com `schema.sql`.
- Mais de 2.000 exercícios gerados automaticamente na primeira execução.
- Tela responsiva para computador e celular.

## Rodar localmente

```bash
npm install
npm start
```

Depois acesse:

```text
http://localhost:3000
```

## Variáveis opcionais

Copie `.env.example` para `.env` se quiser alterar porta, banco ou segredo JWT.

```text
PORT=3000
JWT_SECRET=troque-este-segredo
DB_FILE=./db/academia.sqlite
```
