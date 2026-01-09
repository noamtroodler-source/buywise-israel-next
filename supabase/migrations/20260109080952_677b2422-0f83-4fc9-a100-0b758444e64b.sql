-- Add neighborhoods and response time to agents
ALTER TABLE agents 
ADD COLUMN IF NOT EXISTS neighborhoods_covered TEXT[] DEFAULT NULL,
ADD COLUMN IF NOT EXISTS response_time_hours INTEGER DEFAULT NULL;

-- Add comments for clarity
COMMENT ON COLUMN agents.neighborhoods_covered IS 'Array of city/area names this agent covers';
COMMENT ON COLUMN agents.response_time_hours IS 'Typical response time in hours';