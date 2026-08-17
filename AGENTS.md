<!-- LOVABLE:BEGIN -->

> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

The

<!-- LOVABLE:END -->

## Database migrations

Standing permission: agents may apply migrations in `supabase/migrations/` to
the remote Supabase project without asking each time. Writing new migration
files and running `supabase db push` are both pre-approved.

Two conditions on that permission:

- **Target the project in `.env.local`.** `NEXT_PUBLIC_SUPABASE_URL` is the
  source of truth for which project the app talks to. `supabase/config.toml`
  has pointed at a different ref in the past, so confirm the two agree before
  pushing rather than trusting `config.toml`.
- **Forward-only.** `db push` applies pending migrations. Do not run
  `db reset`, drop tables, or otherwise destroy existing data — that is a
  separate decision and still needs to be asked about.

Credentials are not checked into the repo. `supabase db push` needs either a
prior `supabase login`, or `SUPABASE_ACCESS_TOKEN` plus the database password
in the environment.

## Row-level security

Every table has RLS enabled, and the app relies on it as the real authorization
boundary — server actions run with the *user's* JWT, not the service role. When
adding a server action that reads or writes a new table, check that a policy
actually permits it. A missing policy fails silently as an empty result or a
`42501`, which is easy to mistake for a bug in the query.
