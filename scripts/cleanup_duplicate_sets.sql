-- Script to remove duplicate sets before applying unique constraint
-- Keeps the LATEST entry (by id) for each (session_id, exercise_id, set_number) combination

-- First, identify duplicates
WITH duplicates AS (
    SELECT id,
           session_id,
           exercise_id,
           set_number,
           ROW_NUMBER() OVER (
               PARTITION BY session_id, exercise_id, set_number
               ORDER BY id DESC
           ) as row_num
    FROM sets
)
DELETE FROM sets
WHERE id IN (
    SELECT id FROM duplicates WHERE row_num > 1
);

-- Verify no duplicates remain
SELECT session_id, exercise_id, set_number, COUNT(*) as cnt
FROM sets
GROUP BY session_id, exercise_id, set_number
HAVING COUNT(*) > 1;
