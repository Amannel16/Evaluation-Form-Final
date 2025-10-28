import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { evaluationService, trainingSessionService } from '../services/evaluationService';
import { ratingQuestions, ratingOptions, openEndedQuestions, sourceOptions, additionalSourceOptions } from '../data/formQuestions';
import logo from '../assets/logo.png';
import './EvaluationForm.css';

export default function EvaluationForm() {
  const { trainingSessionId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [formData, setFormData] = useState({
    participantName: '',
    participantEmail: '',
     instructorName: '',
    ratings: {},
    openEndedResponses: {},
    sources: [],
    overallEvaluation: '',
    additionalComments: '',
    suggestions: [{ name: '', phone: '', email: '' }]
  });

  const handleRatingChange = (groupIndex, questionIndex, value) => {
    const key = `${groupIndex}-${questionIndex}`;
    setFormData(prev => ({
      ...prev,
      ratings: {
        ...prev.ratings,
        [key]: value
      }
    }));
  };

  const handleOpenEndedChange = (questionId, value) => {
    setFormData(prev => ({
      ...prev,
      openEndedResponses: {
        ...prev.openEndedResponses,
        [questionId]: value
      }
    }));
  };

  const handleSourceChange = (value) => {
    setFormData(prev => ({
      ...prev,
      sources: prev.sources.includes(value)
        ? prev.sources.filter(s => s !== value)
        : [...prev.sources, value]
    }));
  };

  const handleOverallEvaluationChange = (value) => {
    setFormData(prev => ({
      ...prev,
      overallEvaluation: value
    }));
  };

  const handleSuggestionChange = (index, field, value) => {
    setFormData(prev => {
      const newSuggestions = [...prev.suggestions];
      newSuggestions[index][field] = value;
      return { ...prev, suggestions: newSuggestions };
    });
  };

  const addSuggestion = () => {
    setFormData(prev => ({
      ...prev,
      suggestions: [...prev.suggestions, { name: '', phone: '', email: '' }]
    }));
  };

  const removeSuggestion = (index) => {
    setFormData(prev => ({
      ...prev,
      suggestions: prev.suggestions.filter((_, i) => i !== index)
    }));
  };

 const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);

  try {
    const ratingsArray = [];
    ratingQuestions.forEach((group, groupIndex) => {
      group.questions.forEach((question, questionIndex) => {
        const key = `${groupIndex}-${questionIndex}`;
        ratingsArray.push({
          group: group.group,
          question: question,
          rating: formData.ratings[key] || ''
        });
      });
    });

    const openEndedArray = openEndedQuestions.map((q) => ({
      question: q.question,
      response: formData.openEndedResponses[q.id] || ''
    }));

    const evaluationData = {
      training_session_id: trainingSessionId,
      instructor_name: formData.instructorName, // Changed to instructor name
      course: formData.course, // Changed to course
      course_date: formData.courseDate, // Added course date
      ratings: ratingsArray,
      open_ended_responses: openEndedArray,
      sources: formData.overallEvaluation ? [...formData.sources, formData.overallEvaluation] : formData.sources,
      additional_comments: formData.additionalComments,
      suggestions: formData.suggestions.filter(s => s.name || s.phone || s.email)
    };

    await evaluationService.submitEvaluation(evaluationData);
    setSubmitted(true);
  } catch (error) {
    console.error('Error submitting evaluation:', error);
    alert('Failed to submit evaluation. Please try again.');
  } finally {
    setLoading(false);
  }
};

  if (submitted) {
    return (
      <div className="success-message">
        <div className="success-card">
          <h2>Thank You!</h2>
          <p>Your evaluation has been submitted successfully.</p>
          <p>We appreciate your feedback!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="evaluation-form-container">
      <div className="company-branding-eval">
        <div className="company-logo-eval">
          <img src={logo} alt="TradeEthiopia Group Logo" />
        </div>
        <div className="company-info-eval">
          <h2 className="company-name-eval">TradeEthiopia Group</h2>
          <p className="company-tagline-eval">Connecting Markets Empowering Business</p>
        </div>
      </div>

      <div className="form-header">
        <h1>Training Evaluation Form</h1>
        <p>Please take a few moments to provide your feedback on the training session.</p>
      </div>

      <form onSubmit={handleSubmit} className="evaluation-form">
        <section className="form-section">
  <h2>Participant Information (Optional)</h2>
  
  <div className="form-group">
    <label htmlFor="instructorName">Instructor Name</label>
    <select
      id="instructorName"
      value={formData.instructorName}
      onChange={(e) => setFormData(prev => ({ ...prev, instructorName: e.target.value }))}
    >
      <option value="">Select Instructor</option>
      <option value="Tilaye Alemayehu">Tilaye Alemayehu</option>
      <option value="Abel Derege">Abel Derege</option>
      <option value="Kirubel Fikre">Kirubel Fikre</option>
      <option value="Mesfin Legesse">Mesfin Legesse</option>
      <option value="Kaleb">Kaleb</option>
      <option value="Ayana">Ayana</option>
      <option value="Mesfin Legesse">Mesfin Legesse</option>
      <option value="Selam Gemechu">Selam Gemechu</option>
      <option value="Meron Demsse">Meron Demsse</option>
      <option value="Tadesse Hayilu">Tadesse Hayilu</option>
      {/* Add more instructors as needed */}
    </select>
  </div>
  
  <div className="form-group">
    <label htmlFor="course">Course</label>
    <select
      id="course"
      value={formData.course}
      onChange={(e) => setFormData(prev => ({ ...prev, course: e.target.value }))}
    >
      <option value="">Select Course</option>
      <option value="International Trade Import Export">International Trade Import Export</option>
      <option value="Coffee Cupping">Coffee Cupping</option>
      <option value="Digital Markating">Digital Markating</option>
      <option value="STOCK MARKET FOR BEGINNERS">STOCK MARKET FOR BEGINNERS</option>
      <option value="LOGISTICS AND TRANSPORT MANAGEMENT TRAINING">LOGISTICS AND TRANSPORT MANAGEMENT TRAINING</option>
      <option value="COFFEE BUSINESS SUSTAINABILITY TRAINING FOR BEGINNERS">COFFEE BUSINESS SUSTAINABILITY TRAINING FOR BEGINNERS</option>
      <option value="SALES AND MARKETING TRAINING">SALES AND MARKETING TRAINING</option>
      {/* Add more courses as needed */}
    </select>
  </div>

  <div className="form-group">
  <label htmlFor="courseDate">Course Date</label>
  <input
    type="date"
    id="courseDate"
    value={formData.courseDate}
    onChange={(e) => setFormData(prev => ({ ...prev, courseDate: e.target.value }))}
    placeholder="Select course date"
  />
</div>
</section>

        {ratingQuestions.map((group, groupIndex) => (
          <section key={group.id} className="form-section">
            <h2>{group.group}</h2>
            <div className="rating-labels">
              {ratingOptions.map((option, index) => (
                <span key={option.value || `header-${index}`} className="rating-label">{option.label}</span>
              ))}
            </div>
            {group.questions.map((question, questionIndex) => (
              <div key={questionIndex} className="rating-question">
                <label className="question-text">{question}</label>
                <div className="rating-options">
                  {ratingOptions.map((option, index) => (
                    option.isHeader ? (
                      <span key={`header-${index}`} className="rating-header-spacer"></span>
                    ) : (
                      <label key={option.value} className="radio-option" data-label={option.label}>
                        <span className="mobile-label">{option.label}</span>
                        <input
                          type="radio"
                          name={`rating-${groupIndex}-${questionIndex}`}
                          value={option.value}
                          checked={formData.ratings[`${groupIndex}-${questionIndex}`] === option.value}
                          onChange={(e) => handleRatingChange(groupIndex, questionIndex, e.target.value)}
                          required
                        />
                        <span className="radio-custom"></span>
                      </label>
                    )
                  ))}
                </div>
              </div>
            ))}
          </section>
        ))}

        <section className="form-section">
          <h2>Open-Ended Feedback</h2>
          {openEndedQuestions.map((q) => (
            <div key={q.id} className="form-group">
              <label htmlFor={`open-${q.id}`}>{q.question}</label>
              <textarea
                id={`open-${q.id}`}
                value={formData.openEndedResponses[q.id] || ''}
                onChange={(e) => handleOpenEndedChange(q.id, e.target.value)}
                rows="4"
                placeholder="Please share your thoughts..."
              />
            </div>
          ))}
        </section>

        <section className="form-section">
          <h2>How did you hear about this training?</h2>
          <div className="checkbox-grid">
            {sourceOptions.map(option => (
              <label key={option.value} className="checkbox-option">
                <input
                  type="checkbox"
                  checked={formData.sources.includes(option.value)}
                  onChange={() => handleSourceChange(option.value)}
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
        </section>

        <section className="form-section">
          <h2>Overall, how would you evaluate this training session?</h2>
          <div className="radio-grid">
            {additionalSourceOptions.map(option => (
              <label key={option.value} className="radio-option-large">
                <input
                  type="radio"
                  name="overallEvaluation"
                  value={option.value}
                  checked={formData.overallEvaluation === option.value}
                  onChange={() => handleOverallEvaluationChange(option.value)}
                  required
                />
                <span className="radio-custom-large"></span>
                <span className="radio-label-text">{option.label}</span>
              </label>
            ))}
          </div>
        </section>

        <section className="form-section">
          <h2>Training Recommendations</h2>
          <p className="section-description">
            Please provide the names of individuals who you think would benefit from the training. 
            For each person, include the following details: Name, Phone Number, and Email Address. 
            You may suggest multiple individuals if necessary. Please remember that this information 
            is not used for instructor rating purposes.
          </p>
          
          {formData.suggestions.map((suggestion, index) => (
            <div key={index} className="suggestion-item">
              <div className="suggestion-header">
                <h3>Recommendation {index + 1}</h3>
                {formData.suggestions.length > 1 && (
                  <button
                    type="button"
                    className="btn-remove-suggestion"
                    onClick={() => removeSuggestion(index)}
                  >
                    Remove
                  </button>
                )}
              </div>
              
              <div className="suggestion-fields">
                <div className="form-group">
                  <label htmlFor={`suggestion-name-${index}`}>Name</label>
                  <input
                    type="text"
                    id={`suggestion-name-${index}`}
                    value={suggestion.name}
                    onChange={(e) => handleSuggestionChange(index, 'name', e.target.value)}
                    placeholder="Full name"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor={`suggestion-phone-${index}`}>Phone Number</label>
                  <input
                    type="tel"
                    id={`suggestion-phone-${index}`}
                    value={suggestion.phone}
                    onChange={(e) => handleSuggestionChange(index, 'phone', e.target.value)}
                    placeholder="e.g., +251 912 345 678"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor={`suggestion-email-${index}`}>Email Address</label>
                  <input
                    type="email"
                    id={`suggestion-email-${index}`}
                    value={suggestion.email}
                    onChange={(e) => handleSuggestionChange(index, 'email', e.target.value)}
                    placeholder="email@example.com"
                  />
                </div>
              </div>
            </div>
          ))}
          
          <button
            type="button"
            className="btn-add-suggestion"
            onClick={addSuggestion}
          >
            + Add Another Recommendation
          </button>
        </section>

        <section className="form-section">
          <h2>Additional Comments</h2>
          <div className="form-group">
            <textarea
              value={formData.additionalComments}
              onChange={(e) => setFormData(prev => ({ ...prev, additionalComments: e.target.value }))}
              rows="4"
              placeholder="Any other comments or suggestions?"
            />
          </div>
        </section>

        <div className="form-actions">
          <button type="submit" className="submit-button" disabled={loading}>
            {loading ? 'Submitting...' : 'Submit Evaluation'}
          </button>
        </div>
      </form>
    </div>
  );
}
