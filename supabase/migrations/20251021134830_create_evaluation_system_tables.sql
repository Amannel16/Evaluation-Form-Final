/*
  # Evaluation System Database Schema

  ## Overview
  This migration creates the complete database structure for the Evaluation Form application.
  
  ## New Tables
  
  ### 1. training_sessions
  Stores information about training programs and batches.
  - `id` (uuid, primary key) - Unique identifier for each training session
  - `training_id` (text) - Custom training identifier
  - `batch_id` (text) - Batch identifier
  - `training_name` (text) - Name of the training program
  - `instructor_name` (text) - Name of the instructor
  - `description` (text) - Description of the training
  - `start_date` (date) - Training start date
  - `end_date` (date) - Training end date
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Record update timestamp
  
  ### 2. evaluations
  Stores evaluation responses from participants.
  - `id` (uuid, primary key) - Unique identifier for each evaluation
  - `training_session_id` (uuid, foreign key) - Links to training_sessions table
  - `participant_name` (text) - Name of the participant (optional)
  - `participant_email` (text) - Email of the participant (optional)
  - `ratings` (jsonb) - Array of rating question responses
  - `open_ended_responses` (jsonb) - Array of text responses
  - `sources` (jsonb) - Array of source selections
  - `additional_comments` (text) - Additional feedback
  - `submitted_at` (timestamptz) - Submission timestamp
  - `created_at` (timestamptz) - Record creation timestamp
  
  ## Security
  - Enable RLS on all tables
  - Public can insert evaluations (for form submissions)
  - Public can read training sessions (to display form context)
  - Authenticated users can read all evaluations (for admin dashboard)
  
  ## Indexes
  - Index on training_session_id for faster evaluation queries
  - Index on training_id and batch_id for filtering
*/

-- Create training_sessions table
CREATE TABLE IF NOT EXISTS training_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  training_id text NOT NULL,
  batch_id text NOT NULL,
  training_name text NOT NULL,
  instructor_name text NOT NULL DEFAULT '',
  description text DEFAULT '',
  start_date date,
  end_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(training_id, batch_id)
);

-- Create evaluations table
CREATE TABLE IF NOT EXISTS evaluations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  training_session_id uuid NOT NULL REFERENCES training_sessions(id) ON DELETE CASCADE,
  instructor_name text DEFAULT '',
  course text DEFAULT '',
  course_date date, -- Added course_date field
  ratings jsonb NOT NULL DEFAULT '[]'::jsonb,
  open_ended_responses jsonb NOT NULL DEFAULT '[]'::jsonb,
  sources jsonb NOT NULL DEFAULT '[]'::jsonb,
  additional_comments text DEFAULT '',
  submitted_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_evaluations_training_session 
  ON evaluations(training_session_id);

CREATE INDEX IF NOT EXISTS idx_training_sessions_identifiers 
  ON training_sessions(training_id, batch_id);

-- Enable Row Level Security
ALTER TABLE training_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for training_sessions
CREATE POLICY "Anyone can view training sessions"
  ON training_sessions FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert training sessions"
  ON training_sessions FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update training sessions"
  ON training_sessions FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete training sessions"
  ON training_sessions FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for evaluations
CREATE POLICY "Anyone can submit evaluations"
  ON evaluations FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view all evaluations"
  ON evaluations FOR SELECT
  TO authenticated
  USING (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for training_sessions
CREATE TRIGGER update_training_sessions_updated_at
  BEFORE UPDATE ON training_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add suggestions column to evaluations table
ALTER TABLE evaluations 
ADD COLUMN IF NOT EXISTS suggestions JSONB DEFAULT '[]'::jsonb;

-- Add a comment to describe the column
COMMENT ON COLUMN evaluations.suggestions IS 'Array of recommended individuals who would benefit from the training. Each object contains name, phone, and email fields.';

-- Optional: Create an index for better query performance
CREATE INDEX IF NOT EXISTS idx_evaluations_suggestions ON evaluations USING GIN (suggestions);