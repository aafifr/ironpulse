# Product Requirement Document (PRD)

## Project Overview
* **Project Name:** IronPulse (Personal Gym & Bulking Companion)
* **Platform:** Mobile-first Web App (Responsive max-w-md)
* **Tech Stack:** Next.js 14 (App Router), Tailwind CSS, Supabase (PostgreSQL), Lucide Icons
* **Deployment:** Vercel

---

## Database Schema & Seed Data

Jalankan script SQL berikut pada Supabase SQL Editor:

create extension if not exists "uuid-ossp";

create table exercises (
  id uuid primary key default uuid_generate_v4(),
  session_type text not null check (session_type in ('A', 'B')),
  name text not null,
  target_muscle text not null,
  default_sets int default 3,
  target_reps text default '10-12',
  tips text,
  order_index int not null
);

create table workout_logs (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamp with time zone default now(),
  session_type text not null check (session_type in ('A', 'B')),
  notes text
);

create table set_logs (
  id uuid primary key default uuid_generate_v4(),
  workout_log_id uuid references workout_logs(id) on delete cascade,
  exercise_id uuid references exercises(id) on delete cascade,
  set_number int not null,
  weight_kg numeric not null default 0,
  reps_completed int not null default 0,
  is_completed boolean default false,
  created_at timestamp with time zone default now()
);

create table daily_nutrition (
  id uuid primary key default uuid_generate_v4(),
  date date unique default current_date,
  breakfast_done boolean default false,
  lunch_done boolean default false,
  gainer_done boolean default false,
  dinner_done boolean default false,
  water_ml int default 0,
  created_at timestamp with time zone default now()
);

create table weight_logs (
  id uuid primary key default uuid_generate_v4(),
  date date default current_date,
  weight_kg numeric(5,2) not null,
  notes text,
  created_at timestamp with time zone default now()
);

insert into exercises (session_type, name, target_muscle, default_sets, target_reps, tips, order_index) values
('A', 'Chest Press Machine', 'Dada', 3, '10-12', 'Duduk tegak, dorong pegangan ke depan sejajar dada.', 1),
('A', 'Lat Pulldown Machine', 'Punggung (Sayap)', 3, '10-12', 'Tarik palang ke dada atas, busungkan dada.', 2),
('A', 'Dumbbell Shoulder Press', 'Bahu Depan', 3, '10-12', 'Duduk senderan, dorong dumbbell lurus ke atas.', 3),
('A', 'Leg Press Machine', 'Paha Depan & Bokong', 3, '10-12', 'Kaki selebar bahu, dorong tanpa lock lutut kaku.', 4),
('A', 'Dumbbell Bicep Curl', 'Lengan Depan', 3, '12', 'Siku diam di samping badan, tekuk lengan ke atas.', 5),
('B', 'Seated Cable Row', 'Punggung Tengah', 3, '10-12', 'Duduk tegak, tarik pegangan ke arah perut bawah/pusar.', 1),
('B', 'Incline Press (Dumbbell/Machine)', 'Dada Bagian Atas', 3, '10-12', 'Bangku miring 30-45 derajat, dorong ke atas.', 2),
('B', 'Dumbbell Lateral Raise', 'Bahu Samping', 3, '12-15', 'Beban ringan (2-4 kg), angkat ke samping setinggi bahu.', 3),
('B', 'Leg Curl Machine', 'Paha Belakang', 3, '10-12', 'Mesin tekuk kaki posisi duduk atau tengkurap.', 4),
('B', 'Rope Tricep Pushdown', 'Lengan Belakang', 3, '12', 'Tarik tali ke bawah, rentangkan ujung tali di akhir.', 5);

---

## Feature Specifications & User Flow

### 1. Workout Engine & Logger
* **Deteksi Jadwal Otomatis:**
  * Hari Senin & Jumat memuat Sesi A.
  * Hari Rabu memuat Sesi B.
  * Hari Selasa, Kamis, Sabtu, & Minggu menampilkan status Rest Day beserta opsi tombol manual "Mulai Latihan".
* **Tampilan Gerakan:**
  * Menampilkan urutan gerakan berdasarkan kolom `order_index`.
  * Menampilkan target otot, rekomendasi reps, tips form, dan catatan beban sesi sebelumnya (`Previous Session Hint`).
* **Input Set Latihan:**
  * Menampilkan 3 baris input set per gerakan: Set #, Beban (kg), Repetisi, dan tombol Centang.
  * Menandai selesai (`is_completed = true`) langsung melakukan upsert ke tabel `set_logs`.
* **Rest Timer:**
  * Menyala otomatis saat set ditandai selesai.
  * Countdown 90 detik di floating bar bagian bawah.
  * Fitur tambahan tombol: `+30s` dan `Skip`.
  * Saat waktu 00:00: memicu getaran peramban (`navigator.vibrate`) dan sinyal audio oscillator (Web Audio API) tanpa berkas eksternal.

### 2. Nutrition & Hydration Tracker
* **Tracking Makanan:**
  * Checklist Sarapan (~18g protein).
  * Checklist Makan Siang (~35g protein).
  * Checklist Pro Gainer & Camilan (~25g protein).
  * Checklist Makan Malam (~30g protein).
  * Progress bar akumulatif menuju target 100g protein harian.
* **Tracking Air:**
  * Target volume harian 2.500 ml.
  * Tombol penambahan cepat `+250 ml` dan `+500 ml`.

### 3. Progress & Weight Logger
* **Evaluasi Berat Badan:**
  * Form input mingguan: Tanggal dan Berat Badan (kg).
  * Ringkasan progres: Berat awal (46 kg) dibanding berat terkini menuju target (52–55 kg).
  * Daftar riwayat penimbangan terurut mundur (terbaru ke terlama).

---

## UI/UX & Layout Architecture
* **Container:** `max-w-md mx-auto min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between`
* **Navigasi Bawah (Fixed Bottom Navbar):**
  * Tab 1: Sesi Latihan (`Dumbbell`)
  * Tab 2: Asupan Nutrisi (`Utensils`)
  * Tab 3: Evaluasi Berat Badan (`TrendingUp`)