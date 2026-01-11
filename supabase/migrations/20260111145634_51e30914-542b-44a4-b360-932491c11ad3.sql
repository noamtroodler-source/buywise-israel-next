-- Add category and organization columns to favorites table
ALTER TABLE favorites 
ADD COLUMN IF NOT EXISTS category text DEFAULT 'considering',
ADD COLUMN IF NOT EXISTS ruled_out_reason text,
ADD COLUMN IF NOT EXISTS sort_order integer DEFAULT 0;

-- Add check constraint for category values
ALTER TABLE favorites 
ADD CONSTRAINT favorites_category_check 
CHECK (category IN ('final_list', 'considering', 'ruled_out'));

-- Create RLS policy for UPDATE (currently missing)
CREATE POLICY "Users can update their own favorites"
ON favorites FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);