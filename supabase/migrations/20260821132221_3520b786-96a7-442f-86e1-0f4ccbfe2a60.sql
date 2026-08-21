create type public.app_role as enum ('admin');
create type public.studio_role as enum ('ketua','sekretaris','anggota');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Anggota',
  email text,
  avatar_url text,
  studio_role public.studio_role not null default 'anggota',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "profiles readable by authenticated" on public.profiles for select to authenticated using (true);
create policy "profiles insert own" on public.profiles for insert to authenticated with check (id = auth.uid());
create policy "profiles update own" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create policy "roles readable by authenticated" on public.user_roles for select to authenticated using (true);

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create or replace function public.guard_studio_role()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.studio_role is distinct from old.studio_role and not public.has_role(auth.uid(), 'admin') then
    new.studio_role := old.studio_role;
  end if;
  new.updated_at := now();
  return new;
end;
$$;
create trigger profiles_guard_role before update on public.profiles
for each row execute function public.guard_studio_role();

create or replace function public.ensure_profile(_display_name text default null, _avatar_url text default null)
returns public.profiles language plpgsql security definer set search_path = public as $$
declare
  _uid uuid := auth.uid();
  _email text := coalesce(auth.jwt() ->> 'email', '');
  _row public.profiles;
begin
  if _uid is null then
    raise exception 'not authenticated';
  end if;

  insert into public.profiles (id, display_name, email, avatar_url)
  values (_uid, coalesce(nullif(_display_name, ''), split_part(_email, '@', 1), 'Anggota'), _email, _avatar_url)
  on conflict (id) do update
    set email = excluded.email,
        avatar_url = coalesce(public.profiles.avatar_url, excluded.avatar_url)
  returning * into _row;

  if lower(_email) = 'syariefnirwana35@gmail.com' then
    insert into public.user_roles (user_id, role) values (_uid, 'admin')
    on conflict (user_id, role) do nothing;
  end if;

  return _row;
end;
$$;
grant execute on function public.ensure_profile(text, text) to authenticated;

create or replace function public.set_studio_role(_user_id uuid, _role public.studio_role)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.has_role(auth.uid(), 'admin') then
    raise exception 'forbidden';
  end if;
  update public.profiles set studio_role = _role, updated_at = now() where id = _user_id;
end;
$$;
grant execute on function public.set_studio_role(uuid, public.studio_role) to authenticated;

create table public.notes (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null default '',
  created_by uuid not null references auth.users(id) on delete cascade,
  last_edited_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.notes to authenticated;
grant all on public.notes to service_role;
alter table public.notes enable row level security;
create policy "notes readable by authenticated" on public.notes for select to authenticated using (true);
create policy "notes insert own" on public.notes for insert to authenticated with check (created_by = auth.uid());
create policy "notes update by authenticated" on public.notes for update to authenticated using (true) with check (true);
create policy "notes delete by owner or admin" on public.notes for delete to authenticated
  using (created_by = auth.uid() or public.has_role(auth.uid(), 'admin'));
create index notes_created_at_idx on public.notes (created_at desc);

create table public.note_revisions (
  id uuid primary key default gen_random_uuid(),
  note_id uuid not null references public.notes(id) on delete cascade,
  editor_id uuid not null references auth.users(id) on delete cascade,
  action text not null default 'updated',
  title text not null,
  content text not null default '',
  summary text,
  created_at timestamptz not null default now()
);
grant select, insert on public.note_revisions to authenticated;
grant all on public.note_revisions to service_role;
alter table public.note_revisions enable row level security;
create policy "revisions readable by authenticated" on public.note_revisions for select to authenticated using (true);
create policy "revisions insert own" on public.note_revisions for insert to authenticated with check (editor_id = auth.uid());
create index note_revisions_note_idx on public.note_revisions (note_id, created_at desc);

create policy "note images read" on storage.objects for select to authenticated using (bucket_id = 'note-images');
create policy "note images upload" on storage.objects for insert to authenticated with check (bucket_id = 'note-images');