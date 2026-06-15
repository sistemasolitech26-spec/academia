# Academia Olitech v2.2 - Passo a passo

## Login padrão
Usuário: `olitech`  
Senha: `051309`

## GitHub
1. Extraia o ZIP.
2. Crie um repositório no GitHub, exemplo: `academia-olitech`.
3. Envie todos os arquivos da pasta extraída.
4. Clique em Commit changes.

## Supabase
1. Crie um projeto no Supabase.
2. Abra SQL Editor.
3. Copie todo o conteúdo do arquivo `schema.sql`.
4. Cole no SQL Editor e clique em Run.
5. Vá em Project Settings > API.
6. Copie `Project URL` e `anon public key`.

## Render
1. Clique em New + > Web Service.
2. Conecte o repositório GitHub.
3. Configure:
   - Build Command: `npm install`
   - Start Command: `npm start`
4. Em Environment Variables, adicione:
   - `NODE_VERSION=20.18.1`
   - `SUPABASE_URL=seu_link_do_supabase`
   - `SUPABASE_ANON_KEY=sua_chave_anon`
   - `APP_VERSION=2.0.0`
5. Clique em Create Web Service.

## Observação
A v2.2 funciona em modo localStorage se o Supabase não for configurado. Com Supabase configurado, o sistema fica preparado para evoluir para persistência online completa.
