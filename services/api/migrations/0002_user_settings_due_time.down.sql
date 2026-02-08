ALTER TABLE user_settings
    DROP COLUMN IF EXISTS due_minute_local,
    DROP COLUMN IF EXISTS due_hour_local;

