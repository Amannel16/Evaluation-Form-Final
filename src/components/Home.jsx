import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { trainingSessionService } from '../services/evaluationService';
import logo from '../assets/logo.png';
import './Home.css';

export default function Home() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [trainingSessions, setTrainingSessions] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterInstructor, setFilterInstructor] = useState('');
  const [filterTrainingName, setFilterTrainingName] = useState('');
  const [filterBatch, setFilterBatch] = useState('');
  const [formData, setFormData] = useState({
    training_id: '',
    batch_id: '',
    training_name: '',
    instructor_name: '',
    description: '',
    start_date: '',
    end_date: ''
  });

  useEffect(() => {
    loadTrainingSessions();
  }, []);

  const loadTrainingSessions = async () => {
    try {
      const sessions = await trainingSessionService.getAllTrainingSessions();
      setTrainingSessions(sessions);
    } catch (error) {
      console.error('Error loading training sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingSessionId) {
        // Update existing session
        await trainingSessionService.updateTrainingSession(editingSessionId, formData);
        setShowEditForm(false);
        setEditingSessionId(null);
      } else {
        // Create new session
        await trainingSessionService.createTrainingSession(formData);
        setShowCreateForm(false);
      }
      
      setFormData({
        training_id: '',
        batch_id: '',
        training_name: '',
        instructor_name: '',
        description: '',
        start_date: '',
        end_date: ''
      });
      await loadTrainingSessions();
    } catch (error) {
      console.error('Error saving training session:', error);
      alert('Failed to save training session. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (session) => {
    setFormData({
      training_id: session.training_id,
      batch_id: session.batch_id,
      training_name: session.training_name,
      instructor_name: session.instructor_name || '',
      description: session.description || '',
      start_date: session.start_date ? session.start_date.split('T')[0] : '',
      end_date: session.end_date ? session.end_date.split('T')[0] : ''
    });
    setEditingSessionId(session.id);
    setShowEditForm(true);
  };

  const handleCancelEdit = () => {
    setShowEditForm(false);
    setEditingSessionId(null);
    setFormData({
      training_id: '',
      batch_id: '',
      training_name: '',
      instructor_name: '',
      description: '',
      start_date: '',
      end_date: ''
    });
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this training session? This will also delete all associated evaluations.')) {
      return;
    }

    try {
      await trainingSessionService.deleteTrainingSession(id);
      await loadTrainingSessions();
    } catch (error) {
      console.error('Error deleting training session:', error);
      alert('Failed to delete training session.');
    }
  };

  const copyEvaluationLink = (sessionId) => {
    const link = `${window.location.origin}/evaluation/${sessionId}`;
    navigator.clipboard.writeText(link);
    alert('Evaluation link copied to clipboard!');
  };

  const handleLogout = async () => {
    await signOut();
    alert('Logged out successfully');
  };

  return (
    <div className="home-container">
      <div className="home-header">
        <div className="header-content">
          <div className="header-left">
            <div className="company-branding-home">
              <div className="company-logo-home">
                <img src={logo} alt="TradeEthiopia Group Logo" />
              </div>
              <div>
                <h2 className="company-name-home">TradeEthiopia Group</h2>
                <p className="company-tagline-home">Connecting Markets Empowering Business</p>
              </div>
            </div>
            <div className="page-title">
              <h1>Training Evaluation System</h1>
              <p>Manage training sessions and collect participant feedback</p>
            </div>
          </div>
          {user && (
            <div className="user-section">
              <span className="user-email">{user.email}</span>
              <button className="btn-logout" onClick={handleLogout}>
                Logout
              </button>
            </div>
          )}
        </div>
      </div>

      {user && (
        <div className="action-buttons">
          <button
            className="btn-primary"
            onClick={() => setShowCreateForm(true)}
          >
            Create New Training Session
          </button>
          <button
            className="btn-secondary"
            onClick={() => navigate('/admin')}
          >
            View Analytics Dashboard
          </button>
        </div>
      )}

      {!user && (
        <div className="guest-notice">
          <p>👋 Welcome! You can view and submit evaluations for training sessions below.</p>
          <button className="btn-login-link" onClick={() => navigate('/login')}>
            Admin Login →
          </button>
        </div>
      )}

      {showCreateForm && (
        <div className="modal-overlay" onClick={() => setShowCreateForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create New Training Session</h2>
              <button
                className="close-button"
                onClick={() => setShowCreateForm(false)}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit} className="create-form">
              <div className="form-group">
                <label htmlFor="training_name">Training Name *</label>
                <input
                  type="text"
                  id="training_name"
                  value={formData.training_name}
                  onChange={(e) => setFormData({ ...formData, training_name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="instructor_name">Instructor Name *</label>
                <input
                  type="text"
                  id="instructor_name"
                  value={formData.instructor_name}
                  onChange={(e) => setFormData({ ...formData, instructor_name: e.target.value })}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="training_id">Training ID *</label>
                  <input
                    type="text"
                    id="training_id"
                    value={formData.training_id}
                    onChange={(e) => setFormData({ ...formData, training_id: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="batch_id">Batch ID *</label>
                  <input
                    type="text"
                    id="batch_id"
                    value={formData.batch_id}
                    onChange={(e) => setFormData({ ...formData, batch_id: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows="3"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="start_date">Start Date</label>
                  <input
                    type="date"
                    id="start_date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="end_date">End Date</label>
                  <input
                    type="date"
                    id="end_date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setShowCreateForm(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-submit" disabled={loading}>
                  {loading ? 'Creating...' : 'Create Training Session'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditForm && (
        <div className="modal-overlay" onClick={handleCancelEdit}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Training Session</h2>
              <button
                className="close-button"
                onClick={handleCancelEdit}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit} className="create-form">
              <div className="form-group">
                <label htmlFor="edit_training_name">Training Name *</label>
                <input
                  type="text"
                  id="edit_training_name"
                  value={formData.training_name}
                  onChange={(e) => setFormData({ ...formData, training_name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="edit_instructor_name">Instructor Name *</label>
                <input
                  type="text"
                  id="edit_instructor_name"
                  value={formData.instructor_name}
                  onChange={(e) => setFormData({ ...formData, instructor_name: e.target.value })}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="edit_training_id">Training ID *</label>
                  <input
                    type="text"
                    id="edit_training_id"
                    value={formData.training_id}
                    onChange={(e) => setFormData({ ...formData, training_id: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="edit_batch_id">Batch ID *</label>
                  <input
                    type="text"
                    id="edit_batch_id"
                    value={formData.batch_id}
                    onChange={(e) => setFormData({ ...formData, batch_id: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="edit_description">Description</label>
                <textarea
                  id="edit_description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows="3"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="edit_start_date">Start Date</label>
                  <input
                    type="date"
                    id="edit_start_date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="edit_end_date">End Date</label>
                  <input
                    type="date"
                    id="edit_end_date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={handleCancelEdit}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-submit" disabled={loading}>
                  {loading ? 'Updating...' : 'Update Training Session'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="sessions-section">
        <h2>Training Sessions</h2>

        {!loading && trainingSessions.length > 0 && (
          <div className="filters-container">
            <div className="filter-group">
              <label htmlFor="filterInstructor">Instructor</label>
              <input
                type="text"
                id="filterInstructor"
                placeholder="Search by instructor..."
                value={filterInstructor}
                onChange={(e) => setFilterInstructor(e.target.value)}
                className="filter-input"
              />
            </div>
            <div className="filter-group">
              <label htmlFor="filterTrainingName">Training Name</label>
              <input
                type="text"
                id="filterTrainingName"
                placeholder="Search by training name..."
                value={filterTrainingName}
                onChange={(e) => setFilterTrainingName(e.target.value)}
                className="filter-input"
              />
            </div>
            <div className="filter-group">
              <label htmlFor="filterBatch">Batch</label>
              <input
                type="text"
                id="filterBatch"
                placeholder="Search by batch..."
                value={filterBatch}
                onChange={(e) => setFilterBatch(e.target.value)}
                className="filter-input"
              />
            </div>
          </div>
        )}

        {loading ? (
          <div className="loading">Loading training sessions...</div>
        ) : trainingSessions.length === 0 ? (
          <div className="empty-state">
            <p>No training sessions yet. Create one to get started!</p>
          </div>
        ) : (
          <>
            {(() => {
              const filteredSessions = trainingSessions.filter(session => {
                const matchesInstructor = filterInstructor === '' || 
                  (session.instructor_name && session.instructor_name.toLowerCase().includes(filterInstructor.toLowerCase()));
                const matchesTrainingName = filterTrainingName === '' || 
                  session.training_name.toLowerCase().includes(filterTrainingName.toLowerCase());
                const matchesBatch = filterBatch === '' || 
                  session.batch_id.toString().toLowerCase().includes(filterBatch.toLowerCase());
                return matchesInstructor && matchesTrainingName && matchesBatch;
              });

              if (filteredSessions.length === 0) {
                return (
                  <div className="empty-state">
                    <p>No training sessions match your filters. Try adjusting your search criteria.</p>
                  </div>
                );
              }

              return (
                <div className="sessions-grid">
                  {filteredSessions.map((session) => (
              <div key={session.id} className="session-card">
                <div className="session-header">
                  <h3>{session.training_name}</h3>
                  <div className="session-badges">
                    <span className="badge">ID: {session.training_id}</span>
                    <span className="badge">Batch: {session.batch_id}</span>
                  </div>
                </div>

                {session.instructor_name && (
                  <div className="session-instructor">
                    <span className="instructor-label">👨‍🏫 Instructor:</span>
                    <span className="instructor-name">{session.instructor_name}</span>
                  </div>
                )}

                {session.description && (
                  <p className="session-description">{session.description}</p>
                )}

                {(session.start_date || session.end_date) && (
                  <div className="session-dates">
                    {session.start_date && (
                      <span>Start: {new Date(session.start_date).toLocaleDateString()}</span>
                    )}
                    {session.end_date && (
                      <span>End: {new Date(session.end_date).toLocaleDateString()}</span>
                    )}
                  </div>
                )}

                <div className="session-actions">
                  <button
                    className="btn-link"
                    onClick={() => copyEvaluationLink(session.id)}
                  >
                    Copy Evaluation Link
                  </button>
                  <button
                    className="btn-link"
                    onClick={() => navigate(`/evaluation/${session.id}`)}
                  >
                    Open Form
                  </button>
                  {user && (
                    <>
                      <button
                        className="btn-edit"
                        onClick={() => handleEdit(session)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn-danger"
                        onClick={() => handleDelete(session.id)}
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </div>
                  ))}
                </div>
              );
            })()}
          </>
        )}
      </div>
    </div>
  );
}
