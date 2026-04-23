-- Check actual column names in comment_reactions table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'comment_reactions' 
ORDER BY ordinal_position;