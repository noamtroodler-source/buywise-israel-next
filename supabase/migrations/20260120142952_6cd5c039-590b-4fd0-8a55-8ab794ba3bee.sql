-- Add unique constraint on user_id to prevent duplicate agent profiles
ALTER TABLE agents
ADD CONSTRAINT agents_user_id_unique UNIQUE (user_id);