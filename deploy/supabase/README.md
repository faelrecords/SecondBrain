# Deploy Supabase

```bash
supabase link --project-ref euxcyhewlpehhgybymnv
supabase db push
supabase secrets set --env-file .env
supabase functions deploy api --no-verify-jwt
```

API:

```text
https://euxcyhewlpehhgybymnv.supabase.co/functions/v1/api
```
