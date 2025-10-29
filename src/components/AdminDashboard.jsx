import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { evaluationService, trainingSessionService } from '../services/evaluationService';
import * as XLSX from 'xlsx';
import './AdminDashboard.css';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [trainingSessions, setTrainingSessions] = useState([]);
  const [evaluations, setEvaluations] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [batchSearch, setBatchSearch] = useState('');

  useEffect(() => {
    loadTrainingSessions();
  }, []);

  useEffect(() => {
    if (selectedSession) {
      loadEvaluations(selectedSession);
    }
  }, [selectedSession]);

  const loadTrainingSessions = async () => {
    try {
      const sessions = await trainingSessionService.getAllTrainingSessions();
      setTrainingSessions(sessions);
      if (sessions.length > 0) {
        setSelectedSession(sessions[0].id);
      }
    } catch (error) {
      console.error('Error loading training sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadEvaluations = async (sessionId) => {
    setLoading(true);
    try {
      const data = await evaluationService.getEvaluationsByTrainingSession(sessionId);
      setEvaluations(data);
      calculateAnalytics(data);
    } catch (error) {
      console.error('Error loading evaluations:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateAnalytics = (evaluationData) => {
    if (evaluationData.length === 0) {
      setAnalytics(null);
      return;
    }

    const ratingCounts = {};
    const ratingValues = { excellent: 4, very_good: 3, good: 2, needs_improvement: 1 };
    const questionAverages = {};

    evaluationData.forEach(evaluation => {
      evaluation.ratings.forEach(rating => {
        const key = rating.question;
        if (!questionAverages[key]) {
          questionAverages[key] = { sum: 0, count: 0, group: rating.group };
        }
        const value = ratingValues[rating.rating] || 0;
        questionAverages[key].sum += value;
        questionAverages[key].count += 1;

        if (!ratingCounts[rating.rating]) {
          ratingCounts[rating.rating] = 0;
        }
        ratingCounts[rating.rating] += 1;
      });
    });

    const averages = Object.entries(questionAverages).map(([question, data]) => ({
      question,
      group: data.group,
      average: (data.sum / data.count).toFixed(2),
      count: data.count
    }));

    // Separate overall evaluation from information sources
    const overallEvaluationOptions = ['Excellent', 'Very Good', 'Good', 'Fair', 'Poor'];
    const overallEvaluationCounts = {};
    const sourceCounts = {};
    
    evaluationData.forEach(evaluation => {
      if (evaluation.sources && Array.isArray(evaluation.sources)) {
        evaluation.sources.forEach(source => {
          // Check if it's an overall evaluation rating
          if (overallEvaluationOptions.includes(source)) {
            overallEvaluationCounts[source] = (overallEvaluationCounts[source] || 0) + 1;
          } else {
            // It's an information source
            sourceCounts[source] = (sourceCounts[source] || 0) + 1;
          }
        });
      }
    });

    // Collect all suggestions
    const allSuggestions = [];
    evaluationData.forEach(evaluation => {
      if (evaluation.suggestions && Array.isArray(evaluation.suggestions)) {
        evaluation.suggestions.forEach(suggestion => {
          if (suggestion.name || suggestion.phone || suggestion.email) {
            allSuggestions.push(suggestion);
          }
        });
      }
    });

    setAnalytics({
      totalResponses: evaluationData.length,
      ratingCounts,
      questionAverages: averages,
      sourceCounts,
      overallEvaluationCounts,
      allSuggestions
    });
  };

  const getRatingLabel = (value) => {
    const labels = {
      excellent: 'Excellent',
      very_good: 'Very Good',
      good: 'Good',
      needs_improvement: 'Needs Improvement'
    };
    return labels[value] || value;
  };

  const getSourceLabel = (value) => {
    const labels = {
      facebook: 'Facebook',
      twitter: 'Twitter',
      linkedin: 'LinkedIn',
      instagram: 'Instagram',
      email: 'Email',
      colleague: 'Colleague/Friend Referral',
      website: 'Company Website',
      online_ad: 'Online Advertisement',
      blog: 'Blog Post/Article',
      webinar: 'Previous Webinar',
      conference: 'Conference/Event',
      search_engine: 'Search Engine',
      youtube: 'YouTube',
      podcast: 'Podcast',
      newsletter: 'Newsletter',
      other: 'Other'
    };
    return labels[value] || value;
  };

  const exportRecommendationsToExcel = () => {
    if (!analytics || !analytics.allSuggestions || analytics.allSuggestions.length === 0) {
      alert('No recommendations to export');
      return;
    }

    // Get the selected training session name
    const currentSession = trainingSessions.find(s => s.id === selectedSession);
    const sessionName = currentSession ? currentSession.training_name : 'Training';
    const date = new Date().toISOString().split('T')[0];

    // Create worksheet with empty array first
    const worksheet = XLSX.utils.aoa_to_sheet([]);

    // Add training name as title (merged cells)
    XLSX.utils.sheet_add_aoa(worksheet, [
      [`Training: ${sessionName}`],
      [`Export Date: ${date}`],
      [], // Empty row for spacing
      ['No.', 'Name', 'Phone Number', 'Email Address'] // Headers
    ], { origin: 'A1' });

    // Add data rows starting from row 5 (after title, date, empty row, and headers)
    const dataRows = analytics.allSuggestions.map((suggestion, index) => [
      index + 1,
      suggestion.name || '',
      suggestion.phone || '',
      suggestion.email || ''
    ]);
    XLSX.utils.sheet_add_aoa(worksheet, dataRows, { origin: 'A5' });

    // Set column widths
    worksheet['!cols'] = [
      { wch: 8 },  // No.
      { wch: 25 }, // Name
      { wch: 20 }, // Phone
      { wch: 30 }  // Email
    ];

    // Merge cells for training name title (A1:D1)
    worksheet['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } }, // Training name
      { s: { r: 1, c: 0 }, e: { r: 1, c: 3 } }  // Export date
    ];

    // Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Recommendations');

    // Generate filename
    const filename = `${sessionName}_Recommendations_${date}.xlsx`;

    // Download file
    XLSX.writeFile(workbook, filename);
  };

  if (loading && trainingSessions.length === 0) {
    return (
      <div className="admin-dashboard">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  if (trainingSessions.length === 0) {
    return (
      <div className="admin-dashboard">
        <div className="empty-state">
          <h2>No Training Sessions Found</h2>
          <p>Create a training session to start collecting evaluations.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <button className="btn-back-home" onClick={() => navigate('/')}>
          ← Back to Home
        </button>
        <div className="header-content-center">
          <h1>Admin Dashboard</h1>
          <p>View and analyze training evaluation responses</p>
        </div>
        {/* <button 
          className="btn-instructor-ratings"
          onClick={() => navigate('/instructor-ratings')}
        >
          📊 Instructor Ratings
        </button> */}
      </div>

      <div className="dashboard-controls">
        <div className="form-group">
          <label htmlFor="batchSearch">Search by Batch</label>
          <input
            type="text"
            id="batchSearch"
            placeholder="Enter batch number..."
            value={batchSearch}
            onChange={(e) => setBatchSearch(e.target.value)}
            className="batch-search-input"
          />
        </div>
        <div className="form-group">
          <label htmlFor="sessionSelect">Select Training Session</label>
          <select
            id="sessionSelect"
            value={selectedSession || ''}
            onChange={(e) => setSelectedSession(e.target.value)}
            className="session-select"
          >
            {trainingSessions
              .filter(session => 
                batchSearch === '' || 
                session.batch_id.toString().toLowerCase().includes(batchSearch.toLowerCase())
              )
              .map(session => (
                <option key={session.id} value={session.id}>
                  {session.training_name} - Batch {session.batch_id}
                </option>
              ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading evaluations...</div>
      ) : evaluations.length === 0 ? (
        <div className="empty-state">
          <h3>No evaluations yet</h3>
          <p>No responses have been submitted for this training session.</p>
        </div>
      ) : (
        <>
          <div className="analytics-section">
            <div className="stats-grid">
              <div className="stat-card">
                <h3>Total Responses</h3>
                <div className="stat-value">{analytics.totalResponses}</div>
              </div>

              <div className="stat-card">
                <h3>Rating Distribution</h3>
                <div className="rating-distribution">
                  {Object.entries(analytics.ratingCounts).map(([rating, count]) => (
                    <div key={rating} className="rating-item">
                      <span className="rating-name">{getRatingLabel(rating)}</span>
                      <span className="rating-count">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="analytics-card">
              <h3>Question Averages by Category</h3>
              {analytics.questionAverages.reduce((groups, item) => {
                const group = item.group;
                if (!groups[group]) groups[group] = [];
                groups[group].push(item);
                return groups;
              }, Object.create(null)) &&
                Object.entries(
                  analytics.questionAverages.reduce((groups, item) => {
                    const group = item.group;
                    if (!groups[group]) groups[group] = [];
                    groups[group].push(item);
                    return groups;
                  }, {})
                ).map(([group, questions]) => (
                  <div key={group} className="question-group">
                    <h4>{group}</h4>
                    {questions.map((q, idx) => (
                      <div key={idx} className="question-average">
                        <span className="question-text">{q.question}</span>
                        <div className="average-bar-container">
                          <div
                            className="average-bar"
                            style={{ width: `${(q.average / 4) * 100}%` }}
                          ></div>
                          <span className="average-value">{q.average}/4.00</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ))
              }
            </div>

            {Object.keys(analytics.overallEvaluationCounts).length > 0 && (
              <div className="analytics-card">
                <h3>Overall Training Evaluation</h3>
                <div className="sources-list">
                  {Object.entries(analytics.overallEvaluationCounts)
                    .sort((a, b) => {
                      const order = ['Excellent', 'Very Good', 'Good', 'Fair', 'Poor'];
                      return order.indexOf(a[0]) - order.indexOf(b[0]);
                    })
                    .map(([rating, count]) => (
                      <div key={rating} className="source-item">
                        <span className="source-name">{rating}</span>
                        <span className="source-count">{count} responses</span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {Object.keys(analytics.sourceCounts).length > 0 && (
              <div className="analytics-card">
                <h3>Information Sources</h3>
                <div className="sources-list">
                  {Object.entries(analytics.sourceCounts)
                    .sort((a, b) => b[1] - a[1])
                    .map(([source, count]) => (
                      <div key={source} className="source-item">
                        <span className="source-name">{getSourceLabel(source)}</span>
                        <span className="source-count">{count} responses</span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {analytics.allSuggestions && analytics.allSuggestions.length > 0 && (
              <div className="analytics-card suggestions-card">
                <div className="card-header-with-action">
                  <div>
                    <h3>Training Recommendations ({analytics.allSuggestions.length})</h3>
                    <p className="card-description">
                      Individuals recommended by participants who would benefit from this training
                    </p>
                  </div>
                  <button 
                    className="btn-export-excel"
                    onClick={exportRecommendationsToExcel}
                  >
                    <span className="export-icon">📊</span>
                    Export to Excel
                  </button>
                </div>
                <div className="suggestions-grid">
                  {analytics.allSuggestions.map((suggestion, index) => (
                    <div key={index} className="suggestion-card">
                      <div className="suggestion-number">#{index + 1}</div>
                      <div className="suggestion-details">
                        {suggestion.name && (
                          <div className="suggestion-field">
                            <span className="field-label">Name:</span>
                            <span className="field-value">{suggestion.name}</span>
                          </div>
                        )}
                        {suggestion.phone && (
                          <div className="suggestion-field">
                            <span className="field-label">Phone:</span>
                            <span className="field-value">{suggestion.phone}</span>
                          </div>
                        )}
                        {suggestion.email && (
                          <div className="suggestion-field">
                            <span className="field-label">Email:</span>
                            <span className="field-value">{suggestion.email}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="responses-section">
  <h2>Individual Responses</h2>
  <div className="response-card-container">
    {evaluations.map((evaluation, index) => (
      <div key={evaluation.id} className="response-card">
        <div className="response-header">
          <h3>Response #{index + 1}</h3>
          <span className="response-date">
            {new Date(evaluation.submitted_at).toLocaleDateString()} at{' '}
            {new Date(evaluation.submitted_at).toLocaleTimeString()}
          </span>
        </div>

        {/* Instructor and Course Info */}
        <div className="instructor-info">
          {evaluation.instructor_name && (
            <p><strong>Instructor Name:</strong> {evaluation.instructor_name}</p>
          )}
          {evaluation.course && (
            <p><strong>Course:</strong> {evaluation.course}</p>
          )}
          {evaluation.course_date && (
            <p><strong>Date:</strong> {new Date(evaluation.course_date).toLocaleDateString()}</p>
          )}
        </div>

        {/* Participant Info */}
        {(evaluation.participant_name || evaluation.participant_email) && (
          <div className="participant-info">
            {evaluation.participant_name && <p><strong>Name:</strong> {evaluation.participant_name}</p>}
            {evaluation.participant_email && <p><strong>Email:</strong> {evaluation.participant_email}</p>}
          </div>
        )}

        {/* Ratings Section */}
        <div className="response-section">
          <h4>Ratings</h4>
          {evaluation.ratings.map((rating, idx) => (
            <div key={idx} className="rating-response">
              <p className="response-question">{rating.question}</p>
              <p className="response-answer">{getRatingLabel(rating.rating)}</p>
            </div>
          ))}
        </div>

        {/* Open-Ended Responses */}
        <div className="response-section">
          <h4>Open-Ended Responses</h4>
          {evaluation.open_ended_responses.map((response, idx) => (
            <div key={idx} className="open-response">
              <p className="response-question">{response.question}</p>
              <p className="response-answer">{response.response || 'No response provided'}</p>
            </div>
          ))}
        </div>

        {/* Additional Comments */}
        {evaluation.additional_comments && (
          <div className="response-section">
            <h4>Additional Comments</h4>
            <p className="response-answer">{evaluation.additional_comments}</p>
          </div>
        )}
      </div>
    ))}
  </div>
</div>
        </>
      )}
    </div>
  );
}
