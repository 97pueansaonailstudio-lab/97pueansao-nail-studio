-- Run this entire file once in Supabase Dashboard > SQL Editor.
create table if not exists public.gallery_images (
  id uuid primary key default gen_random_uuid(),
  title text not null default 'ผลงานของเรา',
  image_path text not null unique,
  owner_id uuid not null references auth.users(id) default auth.uid(),
  created_at timestamptz not null default now()
);

alter table public.gallery_images enable row level security;

grant select on public.gallery_images to anon, authenticated;
grant insert, delete on public.gallery_images to authenticated;

create policy "Anyone can view gallery images"
  on public.gallery_images for select
  to anon, authenticated using (true);

create policy "Admins can add their own gallery images"
  on public.gallery_images for insert
  to authenticated with check (owner_id = auth.uid());

create policy "Admins can delete their own gallery images"
  on public.gallery_images for delete
  to authenticated using (owner_id = auth.uid());

insert into storage.buckets (id, name, public)
values ('gallery', 'gallery', true)
on conflict (id) do update set public = true;

create policy "Authenticated users can upload gallery files"
  on storage.objects for insert
  to authenticated with check (bucket_id = 'gallery' and owner_id = auth.uid());

create policy "Owners can delete their gallery files"
  on storage.objects for delete
  to authenticated using (bucket_id = 'gallery' and owner_id = auth.uid());
