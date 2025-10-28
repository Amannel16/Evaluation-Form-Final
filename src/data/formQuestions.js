export const ratingQuestions = [
  {
    id: 1,
    group: 'Content Quality',
    questions: [
      'Objective of the training ',
      'Practice to my needs and interest',
      'Well organized',
      'Useful Visual aids and handouts'
    ]
  },
  {
    id: 2,
    group: 'Presentation',
    questions: [
      'Instructors Knowledge',
      'Instructors presentation style',
      'Instructor covered the matarial clearly',
      'Instructor responded well to questions',
      'Instructors ability to relate theory to practice'
    ]
  },
  {
    id: 3,
    group: 'Training Facilities',
    questions: [
      'Training room preparation',
      'Location of the Training',
      'Duration of the Training'
      
    ]
  }
];

export const ratingOptions = [
  { label: 'Questions', isHeader: true },  // No radio button
  { value: 'excellent', label: 'Excellent' },
  { value: 'very_good', label: 'Very Good' },
  { value: 'good', label: 'Good' },
  { value: 'needs_improvement', label: 'Needs Improvement' }
];

export const openEndedQuestions = [
  {
    id: 1,
    question: 'What do you perceive to be the factor that would make training such as this more participatory ?'
  },
  {
    id: 2,
    question: 'Comments/suggestions to improve this training'
  },
  {
    id: 3,
    question: 'Please suggest other follow-up training sessions which could help you day-to-day activity.'
  }
];

export const sourceOptions = [
  { value: 'facebook', label: 'Facebook' },
  { value: 'twitter', label: 'Twitter' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'Tiktok', label: 'Tiktok' },
  { value: 'colleague', label: 'Colleague/Friend Referral' },
  { value: 'website', label: 'Company Website' },
  { value: 'other', label: 'Other' }
];

export const additionalSourceOptions = [
  { value: 'Excellent', label: 'Excellent' },
  { value: 'Very Good', label: 'Very Good' },
  { value: 'Good', label: 'Good' },
  { value: 'Fair', label: 'Fair' },
  { value: 'Poor', label: 'Poor' }
  // { value: 'youtube', label: 'YouTube' },
  // { value: 'podcast', label: 'Podcast' },
  // { value: 'newsletter', label: 'Newsletter' }
];
