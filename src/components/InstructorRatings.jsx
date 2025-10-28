import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { evaluationService, trainingSessionService } from '../services/evaluationService';
import './InstructorRatings.css';

export default function InstructorRatings() {
  const navigate = useNavigate();
  const [instructorData, setInstructorData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('rating'); // rating, name, sessions
  const [filterRating, setFilterRating] = useState('all'); // all, 5, 4, 3, 2, 1
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInstructor, setSelectedInstructor] = useState(null);
  const [timeRange, setTimeRange] = useState('all'); // all, month, quarter, year

  useEffect(() => {
    loadInstructorRatings();
  }, []);

  const loadInstructorRatings = async () => {
    setLoading(true);
    try {
      // Get all training sessions
      const sessions = await trainingSessionService.getAllTrainingSessions();
      
      // Get all evaluations
      const allEvaluations = [];
      for (const session of sessions) {
        const evaluations = await evaluationService.getEvaluationsByTrainingSession(session.id);
        allEvaluations.push(...evaluations.map(e => ({ ...e, session })));
      }

      // Group by instructor
      const instructorMap = {};
      
      sessions.forEach(session => {
        if (!session.instructor_name) return;
        
        if (!instructorMap[session.instructor_name]) {
          instructorMap[session.instructor_name] = {
            name: session.instructor_name,
            sessions: [],
            evaluations: [],
            totalRatings: 0,
            ratingSum: 0,
            feedbackCount: 0,
            trends: []
          };
        }
        
        instructorMap[session.instructor_name].sessions.push(session);
      });

      // Add evaluations to instructors
      allEvaluations.forEach(evaluation => {
        const instructorName = evaluation.session.instructor_name;
        if (!instructorName || !instructorMap[instructorName]) return;
        
        instructorMap[instructorName].evaluations.push(evaluation);
        
        // Calculate ratings
        evaluation.ratings.forEach(rating => {
          const ratingValue = getRatingValue(rating.rating);
          instructorMap[instructorName].totalRatings++;
          instructorMap[instructorName].ratingSum += ratingValue;
        });
        
        // Count feedback
        if (evaluation.additional_comments) {
          instructorMap[instructorName].feedbackCount++;
        }
      });

      // Calculate averages and trends
      const instructors = Object.values(instructorMap).map(instructor => {
        const avgRating = instructor.totalRatings > 0 
          ? (instructor.ratingSum / instructor.totalRatings).toFixed(2)
          : 0;
        
        // Calculate trends (group by month)
        const trends = calculateTrends(instructor.evaluations);
        
        return {
          ...instructor,
          avgRating: parseFloat(avgRating),
          totalSessions: instructor.sessions.length,
          totalEvaluations: instructor.evaluations.length,
          trends
        };
      });

      setInstructorData(instructors);
    } catch (error) {
      console.error('Error loading instructor ratings:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRatingValue = (rating) => {
    const values = { excellent: 5, very_good: 4, good: 3, needs_improvement: 2 };
    return values[rating] || 0;
  };

  const calculateTrends = (evaluations) => {
    const monthlyData = {};
    
    evaluations.forEach(evaluation => {
      const date = new Date(evaluation.submitted_at);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { count: 0, sum: 0 };
      }
      
      evaluation.ratings.forEach(rating => {
        const value = getRatingValue(rating.rating);
        monthlyData[monthKey].sum += value;
        monthlyData[monthKey].count++;
      });
    });

    return Object.entries(monthlyData)
      .map(([month, data]) => ({
        month,
        avgRating: (data.sum / data.count).toFixed(2),
        count: data.count
      }))
      .sort((a, b) => a.month.localeCompare(b.month));
  };

  const getFilteredAndSortedInstructors = () => {
    let filtered = [...instructorData];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(instructor =>
        instructor.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply rating filter
    if (filterRating !== 'all') {
      const minRating = parseInt(filterRating);
      const maxRating = minRating + 0.99;
      filtered = filtered.filter(instructor =>
        instructor.avgRating >= minRating && instructor.avgRating <= maxRating
      );
    }

    // Apply time range filter
    if (timeRange !== 'all') {
      const now = new Date();
      let cutoffDate;
      
      if (timeRange === 'month') {
        cutoffDate = new Date(now.setMonth(now.getMonth() - 1));
      } else if (timeRange === 'quarter') {
        cutoffDate = new Date(now.setMonth(now.getMonth() - 3));
      } else if (timeRange === 'year') {
        cutoffDate = new Date(now.setFullYear(now.getFullYear() - 1));
      }

      filtered = filtered.map(instructor => {
        const recentEvaluations = instructor.evaluations.filter(
          e => new Date(e.submitted_at) >= cutoffDate
        );
        
        if (recentEvaluations.length === 0) return null;
        
        // Recalculate ratings for time range
        let sum = 0, count = 0;
        recentEvaluations.forEach(e => {
          e.ratings.forEach(r => {
            sum += getRatingValue(r.rating);
            count++;
          });
        });
        
        return {
          ...instructor,
          avgRating: count > 0 ? parseFloat((sum / count).toFixed(2)) : 0,
          totalEvaluations: recentEvaluations.length
        };
      }).filter(Boolean);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      if (sortBy === 'rating') {
        return b.avgRating - a.avgRating;
      } else if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      } else if (sortBy === 'sessions') {
        return b.totalSessions - a.totalSessions;
      }
      return 0;
    });

    return filtered;
  };

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<span key={i} className="star filled">★</span>);
      } else if (i === fullStars && hasHalfStar) {
        stars.push(<span key={i} className="star half">★</span>);
      } else {
        stars.push(<span key={i} className="star empty">☆</span>);
      }
    }
    return stars;
  };

  const filteredInstructors = getFilteredAndSortedInstructors();

  if (loading) {
    return (
      <div className="instructor-ratings-container">
        <div className="loading">Loading instructor ratings...</div>
      </div>
    );
  }

  return (
    <div className="instructor-ratings-container">
      <div className="ratings-header">
        <div>
          <h1>Instructor Performance Analytics</h1>
          <p>Comprehensive ratings and feedback analysis</p>
        </div>
        <button className="btn-back" onClick={() => navigate('/admin')}>
          ← Back to Dashboard
        </button>
      </div>

      {/* Filters and Controls */}
      <div className="controls-section">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search instructors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <label>Sort By:</label>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="rating">Highest Rating</option>
            <option value="name">Name (A-Z)</option>
            <option value="sessions">Most Sessions</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Filter Rating:</label>
          <select value={filterRating} onChange={(e) => setFilterRating(e.target.value)}>
            <option value="all">All Ratings</option>
            <option value="5">5 Stars</option>
            <option value="4">4 Stars</option>
            <option value="3">3 Stars</option>
            <option value="2">2 Stars</option>
            <option value="1">1 Star</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Time Range:</label>
          <select value={timeRange} onChange={(e) => setTimeRange(e.target.value)}>
            <option value="all">All Time</option>
            <option value="month">Last Month</option>
            <option value="quarter">Last 3 Months</option>
            <option value="year">Last Year</option>
          </select>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="summary-stats">
        <div className="stat-card">
          <h3>Total Instructors</h3>
          <div className="stat-value">{filteredInstructors.length}</div>
        </div>
        <div className="stat-card">
          <h3>Average Rating</h3>
          <div className="stat-value">
            {filteredInstructors.length > 0
              ? (filteredInstructors.reduce((sum, i) => sum + i.avgRating, 0) / filteredInstructors.length).toFixed(2)
              : '0.00'}
          </div>
        </div>
        <div className="stat-card">
          <h3>Total Evaluations</h3>
          <div className="stat-value">
            {filteredInstructors.reduce((sum, i) => sum + i.totalEvaluations, 0)}
          </div>
        </div>
      </div>

      {/* Instructor Cards */}
      <div className="instructors-grid">
        {filteredInstructors.length === 0 ? (
          <div className="empty-state">
            <p>No instructors found matching your criteria.</p>
          </div>
        ) : (
          filteredInstructors.map((instructor) => (
            <div key={instructor.name} className="instructor-card">
              <div className="instructor-header">
                <div className="instructor-info">
                  <h3>{instructor.name}</h3>
                  <div className="rating-display">
                    <div className="stars">{renderStars(instructor.avgRating)}</div>
                    <span className="rating-value">{instructor.avgRating} / 5.0</span>
                  </div>
                </div>
              </div>

              <div className="instructor-stats">
                <div className="stat-item">
                  <span className="stat-label">Sessions</span>
                  <span className="stat-number">{instructor.totalSessions}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Evaluations</span>
                  <span className="stat-number">{instructor.totalEvaluations}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Feedback</span>
                  <span className="stat-number">{instructor.feedbackCount}</span>
                </div>
              </div>

              {/* Trends Chart */}
              {instructor.trends.length > 0 && (
                <div className="trends-section">
                  <h4>Performance Trend</h4>
                  <div className="trend-chart">
                    {instructor.trends.slice(-6).map((trend, idx) => (
                      <div key={idx} className="trend-bar">
                        <div
                          className="bar"
                          style={{ height: `${(trend.avgRating / 5) * 100}%` }}
                          title={`${trend.month}: ${trend.avgRating}`}
                        ></div>
                        <span className="month-label">{trend.month.split('-')[1]}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button
                className="btn-details"
                onClick={() => setSelectedInstructor(instructor)}
              >
                View Details
              </button>
            </div>
          ))
        )}
      </div>

      {/* Detailed Modal */}
      {selectedInstructor && (
        <div className="modal-overlay" onClick={() => setSelectedInstructor(null)}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedInstructor.name} - Detailed Analytics</h2>
              <button className="close-button" onClick={() => setSelectedInstructor(null)}>
                &times;
              </button>
            </div>

            <div className="modal-body">
              <div className="detail-section">
                <h3>Overall Performance</h3>
                <div className="performance-summary">
                  <div className="rating-display large">
                    <div className="stars">{renderStars(selectedInstructor.avgRating)}</div>
                    <span className="rating-value">{selectedInstructor.avgRating} / 5.0</span>
                  </div>
                  <div className="metrics">
                    <p><strong>Total Sessions:</strong> {selectedInstructor.totalSessions}</p>
                    <p><strong>Total Evaluations:</strong> {selectedInstructor.totalEvaluations}</p>
                    <p><strong>Feedback Received:</strong> {selectedInstructor.feedbackCount}</p>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <h3>Training Sessions</h3>
                <div className="sessions-list">
                  {selectedInstructor.sessions.map((session) => (
                    <div key={session.id} className="session-item">
                      <strong>{session.training_name}</strong>
                      <span className="session-meta">
                        {session.training_id} - Batch {session.batch_id}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="detail-section">
                <h3>Participant Feedback</h3>
                <div className="feedback-list">
                  {selectedInstructor.evaluations
                    .filter(e => e.additional_comments)
                    .map((evaluation, idx) => (
                      <div key={idx} className="feedback-item">
                        <p className="feedback-text">"{evaluation.additional_comments}"</p>
                        <span className="feedback-date">
                          {new Date(evaluation.submitted_at).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  {selectedInstructor.evaluations.filter(e => e.additional_comments).length === 0 && (
                    <p className="no-feedback">No written feedback available.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}