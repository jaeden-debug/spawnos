# SpawnOS V1 — Database Reference

## Tables

### profiles
Extends Supabase `auth.users`. Auto-created on signup via database trigger.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key, references auth.users |
| email | TEXT | Synced from auth |
| display_name | TEXT | Set at signup or editable |
| avatar_url | TEXT | Optional profile photo |
| created_at | TIMESTAMPTZ | Auto |
| updated_at | TIMESTAMPTZ | Auto trigger |

---

### fish
Core fish registry. Every fish belongs to exactly one user.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| user_id | UUID | References auth.users |
| name | TEXT | Required |
| sex | TEXT | male / female / unknown |
| species | TEXT | Default: betta |
| strain | TEXT | Breeding line name |
| tail_type | TEXT | halfmoon, plakat, etc. |
| color_base | TEXT | red, blue, koi, etc. |
| pattern_type | TEXT | solid, marble, koi, galaxy, etc. |
| scale_type | TEXT | normal, dragon-scale, metallic, etc. |
| finnage | TEXT | low / average / strong / show-quality |
| body_type | TEXT | weak / average / strong / show-quality |
| eye_color | TEXT | Optional |
| traits | JSONB | health_score, aggression_level, fertility_confidence, etc. |
| genotype_notes | TEXT | Known genetics notes |
| breeder_notes | TEXT | Personal breeder notes |
| rarity_score | NUMERIC | Calculated by scoringEngine |
| estimated_value_range | TEXT | e.g. "$25–$75 CAD" |
| photo_url | TEXT | Direct URL or Supabase Storage URL |
| birth_date | DATE | Optional |
| acquired_date | DATE | Optional |
| status | TEXT | active / retired / sold / deceased |

---

### pairs
Breeding pair records. Each pair references a male and female fish.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| user_id | UUID | References auth.users |
| male_id | UUID | References fish |
| female_id | UUID | References fish |
| pair_name | TEXT | Custom name or auto-generated |
| goal | TEXT | Breeding goal description |
| compatibility_score | NUMERIC | 0–100, calculated at pair creation |
| predicted_outcomes | JSONB | Full PredictionOutput object |
| value_potential | JSONB | Tier + score |
| notes | TEXT | |
| status | TEXT | planned / active / spawned / retired |

---

### spawns
Individual spawn tracking records.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| user_id | UUID | References auth.users |
| pair_id | UUID | References pairs |
| spawn_date | DATE | When spawning occurred |
| hatch_date | DATE | When fry hatched |
| estimated_eggs | INTEGER | |
| estimated_hatched | INTEGER | |
| current_fry_count | INTEGER | Updated over time |
| survival_rate | NUMERIC | Calculated: current_fry / estimated_hatched * 100 |
| stage | TEXT | eggs / wrigglers / free-swimming / growout / jarring / juvenile / sold |
| notes | TEXT | |

---

### spawn_logs
Dated log entries within a spawn.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | |
| user_id | UUID | |
| spawn_id | UUID | References spawns |
| log_date | DATE | Required |
| fry_count | INTEGER | Current count at this log entry |
| water_temp | NUMERIC | In °F |
| feeding_notes | TEXT | |
| water_change_notes | TEXT | |
| health_notes | TEXT | |
| photos | JSONB | Array of photo URLs |
| notes | TEXT | General notes |

---

### lineage_links
Parent-child relationships between fish.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | |
| user_id | UUID | |
| parent_fish_id | UUID | References fish |
| child_fish_id | UUID | References fish |
| relationship | TEXT | father / mother / offspring |
| spawn_id | UUID | Optional spawn reference |

**Unique constraint:** (user_id, parent_fish_id, child_fish_id) — prevents duplicate links.

---

### fish_notes
Notes attached to individual fish profiles.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | |
| user_id | UUID | |
| fish_id | UUID | References fish |
| note_type | TEXT | health / growth / breeding / trait / general |
| title | TEXT | Required |
| content | TEXT | Required |
| photos | JSONB | Optional photo URLs |

---

### calculator_runs
Saved calculator sessions for history and auditing.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | |
| user_id | UUID | |
| calculator_type | TEXT | e.g. "trait", "value", "match" |
| input_data | JSONB | Calculator inputs |
| output_data | JSONB | Prediction results |

---

## Relationships

```
auth.users
  └── profiles (1:1)
  └── fish (1:many)
  └── pairs (1:many)
       └── spawns (1:many)
            └── spawn_logs (1:many)
  └── lineage_links (1:many)
  └── fish_notes (1:many)
  └── calculator_runs (1:many)

fish ←→ pairs (male_id, female_id)
fish ←→ lineage_links (parent_fish_id, child_fish_id)
fish ←→ fish_notes
pairs ←→ spawns
spawns ←→ spawn_logs
spawns ←→ lineage_links (optional spawn_id)
```

---

## Row Level Security

Every table has RLS enabled. All policies follow the pattern:

```sql
auth.uid() = user_id   -- for fish, pairs, spawns, etc.
auth.uid() = id        -- for profiles
```

Users cannot access, modify, or delete any data that does not belong to them.

---

## Storage (fish-photos bucket)

Bucket name: `fish-photos`
Access: Public (for photo display)
Path convention: `fish-photos/{user_id}/{fish_id}/{timestamp}.{ext}`

Upload policy:
```sql
auth.uid()::text = (storage.foldername(name))[1]
```

---

## Indexes

All `user_id` columns are indexed. Foreign keys are indexed. Common filter columns (status, sex, stage, tail_type, pattern_type) are indexed for fast filtering.
