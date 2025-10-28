import { supabase } from '../config/supabase';

export const evaluationService = {
  async submitEvaluation(evaluationData) {
    const { data, error } = await supabase
      .from('evaluations')
      .insert([evaluationData])
      .select();

    if (error) throw error;
    return data;
  },

  async getEvaluationsByTrainingSession(trainingSessionId) {
    const { data, error } = await supabase
      .from('evaluations')
      .select('*, training_sessions(*)')
      .eq('training_session_id', trainingSessionId)
      .order('submitted_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async getAllEvaluations() {
    const { data, error } = await supabase
      .from('evaluations')
      .select('*, training_sessions(*)')
      .order('submitted_at', { ascending: false });

    if (error) throw error;
    return data;
  }
};

export const trainingSessionService = {
  async createTrainingSession(sessionData) {
    const { data, error } = await supabase
      .from('training_sessions')
      .insert([sessionData])
      .select();

    if (error) throw error;
    return data;
  },

  async getTrainingSession(trainingId, batchId) {
    const { data, error } = await supabase
      .from('training_sessions')
      .select('*')
      .eq('training_id', trainingId)
      .eq('batch_id', batchId)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async getTrainingSessionById(id) {
    const { data, error } = await supabase
      .from('training_sessions')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async getAllTrainingSessions() {
    const { data, error } = await supabase
      .from('training_sessions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async updateTrainingSession(id, updates) {
    const { data, error } = await supabase
      .from('training_sessions')
      .update(updates)
      .eq('id', id)
      .select();

    if (error) throw error;
    return data;
  },

  async deleteTrainingSession(id) {
    const { error } = await supabase
      .from('training_sessions')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};
