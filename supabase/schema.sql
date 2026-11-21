-- Skema yang DIBUTUHKAN backend (Anggota 2). Anggota 3 boleh menambah kolom/index,
-- tetapi nama tabel/kolom di bawah ini dipakai langsung oleh server/repositories/supabase.ts.
create extension if not exists "pgcrypto";

create table if not exists users (
  id                uuid primary key default gen_random_uuid(),
  name              text not null check (char_length(name) between 2 and 80),
  username          text not null unique check (username = lower(username)),
  email             text not null unique check (email = lower(email)),
  password_hash     text not null,                       -- bcrypt, TIDAK pernah dikirim ke klien
  role              text not null check (role in ('peserta','mentor')),
  avatar_url        text,
  track             text check (track in ('Frontend','Backend','UI/UX','Data')),
  cohort            text,
  status            text not null default 'aktif' check (status in ('aktif','perlu_bimbingan','selesai')),
  total_modules     int  not null default 20 check (total_modules >= 0),
  completed_modules int  not null default 0  check (completed_modules >= 0 and completed_modules <= greatest(total_modules, completed_modules)),
  mentor_notes      text,
  mentor_id         uuid references users(id) on delete set null,
  joined_at         timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create table if not exists activity_categories (
  id             uuid primary key default gen_random_uuid(),
  name           text not null check (char_length(name) between 2 and 40),
  description    text,
  default_points int  not null default 0 check (default_points between 0 and 10000),
  is_active      boolean not null default true,
  created_at     timestamptz not null default now()
);
create unique index if not exists activity_categories_name_ci on activity_categories (lower(name));

-- Total poin = SUM(points) per user. Tidak ada kolom total_points agar tidak pernah tidak sinkron.
create table if not exists point_entries (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references users(id) on delete cascade,
  category_id uuid not null references activity_categories(id) on delete restrict,
  title       text not null check (char_length(title) between 2 and 120),
  points      int  not null check (points <> 0 and points between -10000 and 100000),
  notes       text,
  awarded_by  uuid references users(id) on delete set null,
  created_at  timestamptz not null default now()
);
create index if not exists point_entries_user_idx     on point_entries (user_id, created_at desc);
create index if not exists point_entries_category_idx on point_entries (category_id);

-- Keamanan akses data: backend memakai SERVICE ROLE KEY (melewati RLS).
-- RLS diaktifkan TANPA policy => anon/authenticated key tidak bisa membaca apa pun langsung dari klien.
alter table users                enable row level security;
alter table activity_categories  enable row level security;
alter table point_entries        enable row level security;
