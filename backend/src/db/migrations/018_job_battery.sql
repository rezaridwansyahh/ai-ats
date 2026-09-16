BEGIN;
ALTER TABLE core_job ADD COLUMN assessment_battery battery_type NULL;
COMMIT;
