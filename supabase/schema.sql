-- A coller dans Supabase > SQL Editor > Run
create extension if not exists pgcrypto;
create type app_role as enum ('contributor','admin');

create table profiles (
  id uuid primary key references auth.users on delete cascade,
  username text unique,
  role app_role not null default 'contributor',
  suspended boolean not null default false,
  created_at timestamptz not null default now()
);
create table categories (id text primary key, label text not null, color text not null, icon text not null);
insert into categories values
 ('smoke','Smoke','#9aa0a6','S'),('flash','Flash','#f5d90a','F'),('grenade','Grenade','#4caf50','G'),
 ('frag','Frag','#e53935','X'),('molotov','Molotov','#ff6d00','M'),('attaque','Attaque','#ff3d3d','A'),
 ('defense','Défense','#2196f3','D'),('sniper','Sniper','#ab47bc','N'),('entree','Entrée','#26c6da','E'),
 ('position','Position','#8d6e63','P'),('autre','Autre','#78909c','?');

create table lineups (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references profiles(id) on delete cascade,
  category_id text not null references categories(id),
  title text not null check (char_length(title) between 3 and 100),
  description text check (char_length(description) <= 500),
  keywords text[] not null default '{}',
  map_x real not null check (map_x between 0 and 1),
  map_y real not null check (map_y between 0 and 1),
  map_version text not null default 'v2b-2d',
  pos_x real, pos_y real, pos_z real, model_version text,
  views_count int not null default 0,
  status text not null default 'published' check (status in ('published','removed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on lineups (status, created_at desc);
create index on lineups (category_id);
create index on lineups (author_id);

create table lineup_media (
  id uuid primary key default gen_random_uuid(),
  lineup_id uuid not null references lineups(id) on delete cascade,
  path text not null, kind text not null check (kind in ('image','video')),
  caption text, position int not null default 0, created_at timestamptz not null default now()
);
create table lineup_steps (
  id uuid primary key default gen_random_uuid(),
  lineup_id uuid not null references lineups(id) on delete cascade,
  position int not null, body text not null check (char_length(body) <= 1000)
);
create table reports (
  id uuid primary key default gen_random_uuid(),
  lineup_id uuid not null references lineups(id) on delete cascade,
  reporter_id uuid references profiles(id) on delete set null,
  reason text not null check (char_length(reason) between 3 and 500),
  handled boolean not null default false, created_at timestamptz not null default now()
);

create function handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin insert into profiles (id, username) values (new.id, split_part(new.email,'@',1) || '-' || substr(new.id::text,1,4)); return new; end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function handle_new_user();

create function is_admin() returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin' and not suspended) $$;
create function can_post() returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and not suspended) $$;

create function limit_posts() returns trigger language plpgsql as $$
begin
  if (select count(*) from lineups where author_id = new.author_id and created_at > now() - interval '1 hour') >= 10
  then raise exception 'Limite atteinte : 10 lineups par heure.'; end if;
  return new;
end $$;
create trigger lineups_rate_limit before insert on lineups for each row execute function limit_posts();

create function touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
create trigger lineups_touch before update on lineups for each row execute function touch_updated_at();

create function increment_views(p_id uuid) returns void language sql security definer set search_path = public as $$
  update lineups set views_count = views_count + 1 where id = p_id and status = 'published' $$;

alter table profiles enable row level security;
alter table categories enable row level security;
alter table lineups enable row level security;
alter table lineup_media enable row level security;
alter table lineup_steps enable row level security;
alter table reports enable row level security;

revoke update on profiles from authenticated, anon;
grant update (username) on profiles to authenticated;
create policy "profils lisibles" on profiles for select using (true);
create policy "modifier son profil" on profiles for update using (id = auth.uid()) with check (id = auth.uid());
create policy "categories lisibles" on categories for select using (true);
create policy "admin categories" on categories for all using (is_admin()) with check (is_admin());

create policy "lire publiees" on lineups for select using (status = 'published' or author_id = auth.uid() or is_admin());
create policy "publier" on lineups for insert to authenticated with check (author_id = auth.uid() and can_post() and status = 'published');
create policy "modifier la sienne" on lineups for update to authenticated using (author_id = auth.uid() and can_post()) with check (author_id = auth.uid() and status = 'published');
create policy "supprimer la sienne" on lineups for delete to authenticated using (author_id = auth.uid());
create policy "admin lineups" on lineups for all to authenticated using (is_admin()) with check (is_admin());

create policy "lire medias" on lineup_media for select using (exists (select 1 from lineups l where l.id = lineup_id and (l.status = 'published' or l.author_id = auth.uid() or is_admin())));
create policy "gerer ses medias" on lineup_media for all to authenticated using (exists (select 1 from lineups l where l.id = lineup_id and l.author_id = auth.uid())) with check (exists (select 1 from lineups l where l.id = lineup_id and l.author_id = auth.uid()));
create policy "admin medias" on lineup_media for all to authenticated using (is_admin()) with check (is_admin());
create policy "lire etapes" on lineup_steps for select using (exists (select 1 from lineups l where l.id = lineup_id and (l.status = 'published' or l.author_id = auth.uid() or is_admin())));
create policy "gerer ses etapes" on lineup_steps for all to authenticated using (exists (select 1 from lineups l where l.id = lineup_id and l.author_id = auth.uid())) with check (exists (select 1 from lineups l where l.id = lineup_id and l.author_id = auth.uid()));
create policy "admin etapes" on lineup_steps for all to authenticated using (is_admin()) with check (is_admin());

create policy "signaler" on reports for insert with check (reporter_id is null or reporter_id = auth.uid());
create policy "admin lit signalements" on reports for select to authenticated using (is_admin());
create policy "admin traite signalements" on reports for update to authenticated using (is_admin()) with check (is_admin());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('lineup-media','lineup-media', true, 52428800,
 array['image/jpeg','image/png','image/webp','image/gif','video/mp4','video/webm'])
on conflict (id) do nothing;
create policy "upload dans son dossier" on storage.objects for insert to authenticated
  with check (bucket_id = 'lineup-media' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "supprimer ses fichiers" on storage.objects for delete to authenticated
  using (bucket_id = 'lineup-media' and ((storage.foldername(name))[1] = auth.uid()::text or is_admin()));

-- Premier admin (apres t'etre inscrit sur le site) :
-- update profiles set role = 'admin' where id = (select id from auth.users where email = 'TON@EMAIL');
