-- Adaptaly Beta Database Schema
-- Run this SQL in your Supabase SQL editor to create the required tables

-- Summaries table (stores AI-generated summaries)
CREATE TABLE IF NOT EXISTS summaries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  word_count INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Flashcards table (stores AI-generated flashcards)
CREATE TABLE IF NOT EXISTS flashcards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  summary_id UUID REFERENCES summaries(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  hint TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_summaries_document_id ON summaries(document_id);
CREATE INDEX IF NOT EXISTS idx_flashcards_document_id ON flashcards(document_id);
CREATE INDEX IF NOT EXISTS idx_flashcards_summary_id ON flashcards(summary_id);
CREATE INDEX IF NOT EXISTS idx_flashcards_order ON flashcards(document_id, order_index);

-- Row Level Security (RLS) policies
ALTER TABLE summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;

-- Summaries policies
CREATE POLICY "Users can view their own summaries" ON summaries
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM documents 
      WHERE documents.id = summaries.document_id 
      AND documents.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own summaries" ON summaries
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM documents 
      WHERE documents.id = summaries.document_id 
      AND documents.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own summaries" ON summaries
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM documents 
      WHERE documents.id = summaries.document_id 
      AND documents.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own summaries" ON summaries
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM documents 
      WHERE documents.id = summaries.document_id 
      AND documents.user_id = auth.uid()
    )
  );

-- Flashcards policies  
CREATE POLICY "Users can view their own flashcards" ON flashcards
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM documents 
      WHERE documents.id = flashcards.document_id 
      AND documents.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own flashcards" ON flashcards
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM documents 
      WHERE documents.id = flashcards.document_id 
      AND documents.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own flashcards" ON flashcards
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM documents 
      WHERE documents.id = flashcards.document_id 
      AND documents.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own flashcards" ON flashcards
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM documents 
      WHERE documents.id = flashcards.document_id 
      AND documents.user_id = auth.uid()
    )
  );

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_summaries_updated_at 
  BEFORE UPDATE ON summaries 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_flashcards_updated_at 
  BEFORE UPDATE ON flashcards 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();