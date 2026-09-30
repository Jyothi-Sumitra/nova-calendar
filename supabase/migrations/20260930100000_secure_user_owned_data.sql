-- Secure NOVA application data by binding every row to a Supabase Auth user.
-- Applied to the NOVA Calendar Supabase project.

delete from public.events
where user_id = '00000000-0000-0000-0000-000000000001';

alter table public.events alter column user_id set not null;
alter table public.events add constraint events_user_id_fkey foreign key (user_id) references auth.users(id) on delete cascade;

alter table public.notes add column if not exists user_id uuid;
alter table public.notes alter column user_id set not null;
alter table public.notes add constraint notes_user_id_fkey foreign key (user_id) references auth.users(id) on delete cascade;

alter table public.todos add column if not exists user_id uuid;
alter table public.todos alter column user_id set not null;
alter table public.todos add constraint todos_user_id_fkey foreign key (user_id) references auth.users(id) on delete cascade;

alter table public.habits add column if not exists user_id uuid;
alter table public.habits alter column user_id set not null;
alter table public.habits add constraint habits_user_id_fkey foreign key (user_id) references auth.users(id) on delete cascade;

alter table public.events enable row level security;
alter table public.notes enable row level security;
alter table public.todos enable row level security;
alter table public.habits enable row level security;
alter table public.users enable row level security;

create policy "Users can read own events" on public.events for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users can insert own events" on public.events for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users can update own events" on public.events for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users can delete own events" on public.events for delete to authenticated using ((select auth.uid()) = user_id);

create policy "Users can read own notes" on public.notes for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users can insert own notes" on public.notes for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users can update own notes" on public.notes for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users can delete own notes" on public.notes for delete to authenticated using ((select auth.uid()) = user_id);

create policy "Users can read own todos" on public.todos for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users can insert own todos" on public.todos for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users can update own todos" on public.todos for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users can delete own todos" on public.todos for delete to authenticated using ((select auth.uid()) = user_id);

create policy "Users can read own habits" on public.habits for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users can insert own habits" on public.habits for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users can update own habits" on public.habits for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users can delete own habits" on public.habits for delete to authenticated using ((select auth.uid()) = user_id);

-- public.users is legacy and unused by Supabase Auth. RLS is intentionally enabled
-- without policies so its password_hash column is not exposed through the Data API.
