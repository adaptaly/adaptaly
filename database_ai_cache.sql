-- AI Cache and Usage Tracking Tables
-- Add these to your Supabase database to enable AI response caching and usage monitoring

-- AI response cache table
CREATE TABLE IF NOT EXISTS ai_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cache_key VARCHAR(64) NOT NULL UNIQUE,
  model VARCHAR(50) NOT NULL,
  temperature DECIMAL(3,2) NOT NULL,
  input_hash VARCHAR(64) NOT NULL,
  response TEXT NOT NULL,
  prompt_tokens INTEGER,
  completion_tokens INTEGER,
  total_tokens INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast cache lookups
CREATE INDEX IF NOT EXISTS idx_ai_cache_key ON ai_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_ai_cache_created_at ON ai_cache(created_at);

-- Usage logging table
CREATE TABLE IF NOT EXISTS usage_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  model VARCHAR(50) NOT NULL,
  operation VARCHAR(100) NOT NULL,
  prompt_tokens INTEGER NOT NULL,
  completion_tokens INTEGER NOT NULL,
  total_tokens INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for usage analytics
CREATE INDEX IF NOT EXISTS idx_usage_logs_created_at ON usage_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_usage_logs_model ON usage_logs(model);

-- Row Level Security (if needed)
-- ALTER TABLE ai_cache ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE usage_logs ENABLE ROW LEVEL SECURITY;

-- Auto-update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_ai_cache_updated_at BEFORE UPDATE ON ai_cache 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Optional: Create view for usage analytics
CREATE OR REPLACE VIEW v_usage_stats AS
SELECT 
  model,
  operation,
  DATE(created_at) as date,
  COUNT(*) as request_count,
  SUM(prompt_tokens) as total_prompt_tokens,
  SUM(completion_tokens) as total_completion_tokens,
  SUM(total_tokens) as total_tokens,
  AVG(total_tokens) as avg_tokens_per_request
FROM usage_logs 
GROUP BY model, operation, DATE(created_at)
ORDER BY date DESC, model, operation;