# SecondBrain

Mini plataforma de cursos internos.

## Rodar local

```bash
npm install
npm run install:all
npm run build
npm start
```

App: `http://localhost:4000`

Admin inicial:

- usuário: `Rafael`
- senha: `99637716`

## Funções

- login por usuário
- admin cria usuários
- admin cria cursos
- admin cria módulos
- admin cria aulas
- aula via YouTube ou Google Drive
- resumo por aula
- avaliação por estrelas
- sugestão dos usuários
- painel admin de sugestões

## Links de aula

YouTube:

```text
https://www.youtube.com/watch?v=ID
```

Google Drive:

```text
https://drive.google.com/file/d/ID/view
```

## Deploy

Frontend: GitHub Pages via `.github/workflows/pages.yml`.

Backend: Supabase Edge Function em `deploy/supabase`.

API configurada:

```text
https://euxcyhewlpehhgybymnv.supabase.co/functions/v1/api
```
