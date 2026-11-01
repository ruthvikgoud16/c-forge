-- 2F.9 Shared token-bucket rate limits. Additive. Does not rewrite 001–013.
-- No SUPERUSER / BYPASSRLS. Runtime has EXECUTE only; no table grants.

CREATE TABLE IF NOT EXISTS rate_limit_buckets (
  bucket text NOT NULL,
  subject_hash bytea NOT NULL,
  tokens numeric NOT NULL,
  last_refill timestamptz NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (bucket, subject_hash),
  CONSTRAINT rate_limit_tokens_nonneg CHECK (tokens >= 0),
  CONSTRAINT rate_limit_hash_len CHECK (octet_length(subject_hash) = 32)
);

CREATE INDEX IF NOT EXISTS rate_limit_buckets_updated_at_idx
  ON rate_limit_buckets (updated_at);

ALTER TABLE rate_limit_buckets ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE rate_limit_buckets FROM PUBLIC;
REVOKE ALL ON TABLE rate_limit_buckets FROM cforge, cforge_app, cforge_student, cforge_faculty, cforge_migrator;

CREATE OR REPLACE FUNCTION academy_rate_limit_take(
  p_bucket text,
  p_subject_hash bytea,
  p_capacity integer,
  p_window_ms integer
)
RETURNS TABLE (allowed boolean, retry_after_sec integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  now_ts timestamptz := clock_timestamp();
  rec record;
  elapsed_ms numeric;
  refill numeric;
  available numeric;
  wait_ms numeric;
BEGIN
  IF p_bucket IS NULL OR p_bucket = ''
     OR p_subject_hash IS NULL OR octet_length(p_subject_hash) <> 32
     OR p_capacity IS NULL OR p_capacity < 1
     OR p_window_ms IS NULL OR p_window_ms < 1 THEN
    allowed := false;
    retry_after_sec := 1;
    RETURN NEXT;
    RETURN;
  END IF;

  DELETE FROM public.rate_limit_buckets
   WHERE updated_at < now_ts - interval '24 hours';

  INSERT INTO public.rate_limit_buckets (bucket, subject_hash, tokens, last_refill, updated_at)
  VALUES (p_bucket, p_subject_hash, p_capacity::numeric, now_ts, now_ts)
  ON CONFLICT (bucket, subject_hash) DO NOTHING;

  SELECT b.tokens, b.last_refill
    INTO rec
    FROM public.rate_limit_buckets b
   WHERE b.bucket = p_bucket AND b.subject_hash = p_subject_hash
   FOR UPDATE;

  elapsed_ms := GREATEST(0, EXTRACT(EPOCH FROM (now_ts - rec.last_refill)) * 1000);
  refill := (p_capacity::numeric / p_window_ms::numeric) * elapsed_ms;
  available := LEAST(p_capacity::numeric, rec.tokens + refill);

  IF available >= 1 THEN
    UPDATE public.rate_limit_buckets
       SET tokens = available - 1,
           last_refill = now_ts,
           updated_at = now_ts
     WHERE bucket = p_bucket AND subject_hash = p_subject_hash;
    allowed := true;
    retry_after_sec := 0;
  ELSE
    UPDATE public.rate_limit_buckets
       SET tokens = available,
           last_refill = now_ts,
           updated_at = now_ts
     WHERE bucket = p_bucket AND subject_hash = p_subject_hash;
    allowed := false;
    wait_ms := (1 - available) * (p_window_ms::numeric / p_capacity::numeric);
    retry_after_sec := GREATEST(1, CEIL(wait_ms / 1000.0)::integer);
  END IF;

  RETURN NEXT;
END;
$$;

REVOKE ALL ON FUNCTION academy_rate_limit_take(text, bytea, integer, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION academy_rate_limit_take(text, bytea, integer, integer)
  TO cforge_app, cforge_faculty;
