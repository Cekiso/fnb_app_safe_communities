/*
# Fix learning_content age_band constraint to include adult

## Purpose
The CHECK constraint on learning_content.age_band only allows '6-9',
'10-13', '14-17'. We need to add 'adult' for adult educational articles.

## Changes
- Drop existing CHECK constraint
- Add new CHECK constraint including 'adult'
*/

ALTER TABLE learning_content DROP CONSTRAINT IF EXISTS learning_content_age_band_check;
ALTER TABLE learning_content ADD CONSTRAINT learning_content_age_band_check
  CHECK (age_band IN ('6-9', '10-13', '14-17', 'adult'));
