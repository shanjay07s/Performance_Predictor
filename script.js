/**
 * ==============================================================================
 * Student Performance Predictor
 * Academic Marks Estimator & Visual Analytics Dashboard
 * 
 * Target Audience: B.Tech Artificial Intelligence & Data Science Mini-Project
 * Description: A frontend-only academic decision-support tool that calculates
 *              an estimated examination score using a normalized, weighted
 *              rule-based linear algorithm.
 * ==============================================================================
 */

// Strict mode for cleaner and safer JavaScript execution
'use strict';

/* ==============================================================================
   1. CONFIGURATION & ADJUSTABLE MODEL WEIGHTS
   These constants define the mathematical rule-based model.
   Students can adjust weights or benchmark hours as needed.
   ============================================================================== */

/**
 * Weights assigned to each academic indicator.
 * The sum of all weights equals 1.0 (100%).
 */
const MODEL_CONFIG = {
  weights: {
    previousMarks: 0.50,         // 50% - Prior academic foundation
    studyHours: 0.20,            // 20% - Daily self-study commitment
    attendance: 0.15,            // 15% - Classroom attendance & lecture engagement
    assignmentCompletion: 0.15   // 15% - Continuous assessment & coursework
  },

  /**
   * Reference study hours considered optimal for 100% normalized study effort.
   * Studying 8 hours/day reaches the 100% normalized benchmark.
   */
  benchmarkStudyHours: 8.0,

  /**
   * Bounds for input validation
   */
  bounds: {
    studyHours: { min: 0, max: 16 },
    attendance: { min: 0, max: 100 },
    previousMarks: { min: 0, max: 100 },
    assignmentCompletion: { min: 0, max: 100 }
  },

  /**
   * Performance Category Thresholds and Metadata
   */
  categories: [
    {
      min: 85.0,
      label: 'Excellent',
      badgeClass: 'badge-excellent',
      icon: '★',
      color: '#10b981',
      summary: 'Outstanding academic command across continuous indicators.'
    },
    {
      min: 70.0,
      label: 'Very Good',
      badgeClass: 'badge-verygood',
      icon: '◆',
      color: '#0284c7',
      summary: 'Strong academic performance with solid foundational consistency.'
    },
    {
      min: 50.0,
      label: 'Good',
      badgeClass: 'badge-good',
      icon: '●',
      color: '#d97706',
      summary: 'Satisfactory standing with notable opportunity for score growth.'
    },
    {
      min: 35.0,
      label: 'Needs Improvement',
      badgeClass: 'badge-improvement',
      icon: '▲',
      color: '#ea580c',
      summary: 'Borderline performance; targeted effort required to ensure safe passing.'
    },
    {
      min: 0.0,
      label: 'At Risk',
      badgeClass: 'badge-atrisk',
      icon: '!',
      color: '#e11d48',
      summary: 'Immediate academic intervention and remediation recommended.'
    }
  ],

  // Storage key for LocalStorage
  storageKey: 'student_performance_prediction_history_v1',
  maxHistoryItems: 15
};

/* ==============================================================================
   2. DOM ELEMENT REFERENCES
   ============================================================================== */
const elements = {
  // Form & Inputs
  form: document.getElementById('predictionForm'),
  inputName: document.getElementById('studentName'),
  inputPrevMarks: document.getElementById('previousMarks'),
  inputStudyHours: document.getElementById('studyHours'),
  inputAttendance: document.getElementById('attendance'),
  inputAssignments: document.getElementById('assignmentCompletion'),

  // Buttons
  btnPredict: document.getElementById('btnPredict'),
  btnReset: document.getElementById('btnReset'),
  btnQuickDemo: document.getElementById('btnQuickDemo'),
  btnClearHistory: document.getElementById('btnClearHistory'),

  // Error Message Containers
  errorPrevMarks: document.getElementById('errorPreviousMarks'),
  errorStudyHours: document.getElementById('errorStudyHours'),
  errorAttendance: document.getElementById('errorAttendance'),
  errorAssignments: document.getElementById('errorAssignmentCompletion'),

  // Results Presentation Elements
  resultsPlaceholder: document.getElementById('resultsPlaceholder'),
  resultsSection: document.getElementById('resultsSection'),
  studentHeading: document.getElementById('resultStudentHeading'),
  predictedScoreValue: document.getElementById('predictedScoreValue'),
  scoreProgressBar: document.getElementById('scoreProgressBar'),
  categoryBadge: document.getElementById('categoryBadge'),
  categoryLabel: document.getElementById('categoryLabel'),
  badgeIcon: document.getElementById('badgeIcon'),

  // Metric Chips
  metricPrevMarks: document.getElementById('metricPrevMarks'),
  metricStudyHours: document.getElementById('metricStudyHours'),
  metricAttendance: document.getElementById('metricAttendance'),
  metricAssignments: document.getElementById('metricAssignments'),

  // Recommendation Elements
  recTitle: document.getElementById('recTitle'),
  recMessage: document.getElementById('recMessage'),

  // Chart Canvases
  canvasBar: document.getElementById('comparisonBarChart'),
  canvasDoughnut: document.getElementById('scoreDoughnutChart'),

  // History Elements
  historyTable: document.getElementById('historyTable'),
  historyTableBody: document.getElementById('historyTableBody'),
  historyEmptyState: document.getElementById('historyEmptyState'),

  // Toast Notification
  toast: document.getElementById('toast')
};

/* ==============================================================================
   3. CHART INSTANCES STATE
   Keep references to Chart.js instances so they can be updated or destroyed
   before recreating them (preventing overlapping canvas artifacts).
   ============================================================================== */
let comparisonChartInstance = null;
let doughnutChartInstance = null;

/* ==============================================================================
   4. CALCULATION & PREDICTION ENGINE
   ============================================================================== */

/**
 * Normalizes daily study hours to a 0-100 scale using the configured benchmark.
 * @param {number} hours - Daily study hours (0 - 16)
 * @returns {number} Normalized score between 0 and 100
 */
function normalizeStudyHours(hours) {
  if (hours <= 0) return 0;
  // Clamped at 100% if study hours meet or exceed the benchmark
  const normalized = (hours / MODEL_CONFIG.benchmarkStudyHours) * 100;
  return Math.min(normalized, 100);
}

/**
 * Calculates the predicted score based on the weighted multi-factor formula.
 * Formula:
 * Predicted = (PrevMarks * 0.50) + (NormStudyHours * 0.20) + (Attendance * 0.15) + (Assignments * 0.15)
 * 
 * @param {Object} data - Cleaned student metrics
 * @returns {number} Predicted score strictly clamped to [0, 100]
 */
function calculatePredictedScore(data) {
  const normStudy = normalizeStudyHours(data.studyHours);

  const weightedPrevious = data.previousMarks * MODEL_CONFIG.weights.previousMarks;
  const weightedStudy = normStudy * MODEL_CONFIG.weights.studyHours;
  const weightedAttendance = data.attendance * MODEL_CONFIG.weights.attendance;
  const weightedAssignments = data.assignmentCompletion * MODEL_CONFIG.weights.assignmentCompletion;

  const rawScore = weightedPrevious + weightedStudy + weightedAttendance + weightedAssignments;

  // Strict boundary clamping between 0 and 100
  const clampedScore = Math.max(0, Math.min(100, rawScore));

  // Return floating point score (rounded to 1 decimal place later in display)
  return Number(clampedScore.toFixed(1));
}

/**
 * Determines the performance category based on the predicted score.
 * @param {number} score - Predicted examination score (0 - 100)
 * @returns {Object} Category definition object
 */
function determineCategory(score) {
  for (const cat of MODEL_CONFIG.categories) {
    if (score >= cat.min) {
      return cat;
    }
  }
  return MODEL_CONFIG.categories[MODEL_CONFIG.categories.length - 1];
}

/**
 * Generates an encouraging, tailored recommendation based on the score
 * and specific input weaknesses (attendance, study hours, assignments).
 * 
 * @param {number} score - Predicted final score
 * @param {Object} data - Student inputs
 * @param {Object} category - Resulting performance category
 * @returns {Object} { title: string, text: string }
 */
function generateRecommendation(score, data, category) {
  const tips = [];

  // Check specific improvement levers
  if (data.attendance < 75) {
    tips.push(`Attendance is currently at ${data.attendance}%. Aim for at least 75–85% to capture critical classroom lectures and internal assessment points.`);
  }

  if (data.studyHours < 3.0) {
    tips.push(`Increasing your daily self-study from ${data.studyHours}h to 3.5–4.5h with spaced repetition will yield noticeable score gains.`);
  }

  if (data.assignmentCompletion < 70) {
    tips.push(`Coursework completion is at ${data.assignmentCompletion}%. Timely submission of weekly assignments reinforces exam problem-solving.`);
  }

  if (data.previousMarks < 50 && (data.studyHours >= 4 || data.attendance >= 80)) {
    tips.push('Your strong daily study routine and attendance will help you rebound significantly from previous lower exam scores.');
  }

  let title = `${category.label} Trajectory`;
  let text = '';

  switch (category.label) {
    case 'Excellent':
      text = `Outstanding performance! Your high engagement across all metrics puts you on track for exceptional mastery. ${tips.join(' ')} Keep up the consistent revision and mentor fellow peers!`;
      break;

    case 'Very Good':
      text = `Commendable standing! You have built a solid foundation. ${tips.length ? tips.join(' ') : 'Refining answers for high-weightage topics will comfortably push you into the Excellent tier.'}`;
      break;

    case 'Good':
      text = `Steady academic progress. You are performing reliably, but there is clear upside potential. ${tips.length ? tips.join(' ') : 'Structuring dedicated weekend revision sessions will elevate your overall grade.'}`;
      break;

    case 'Needs Improvement':
      text = `Passing threshold is within reach, but caution is warranted. ${tips.length ? tips.join(' ') : 'Focus on active problem-solving and closing subject-matter gaps before final exams.'}`;
      break;

    case 'At Risk':
    default:
      text = `Immediate proactive action recommended. ${tips.length ? tips.join(' ') : 'Consult your subject faculty, form a structured study group, and concentrate on high-yield textbook units.'}`;
      break;
  }

  return { title, text };
}

/* ==============================================================================
   5. FORM VALIDATION
   ============================================================================== */

/**
 * Validates a single numeric input against defined boundaries.
 * @param {HTMLInputElement} input - Target input element
 * @param {HTMLElement} errorEl - Error container element
 * @param {number} min - Minimum allowed value
 * @param {number} max - Maximum allowed value
 * @param {string} fieldName - Human-readable label
 * @returns {boolean} True if valid, false otherwise
 */
function validateNumericField(input, errorEl, min, max, fieldName) {
  const val = input.value.trim();

  if (val === '') {
    showFieldError(input, errorEl, `${fieldName} is required.`);
    return false;
  }

  const num = Number(val);

  if (isNaN(num)) {
    showFieldError(input, errorEl, `Please enter a valid numeric value.`);
    return false;
  }

  if (num < min || num > max) {
    showFieldError(input, errorEl, `${fieldName} must be between ${min} and ${max}.`);
    return false;
  }

  clearFieldError(input, errorEl);
  return true;
}

/**
 * Displays an error on an input field.
 */
function showFieldError(input, errorEl, message) {
  input.classList.add('is-invalid');
  errorEl.textContent = message;
  errorEl.classList.add('visible');
}

/**
 * Clears an error from an input field.
 */
function clearFieldError(input, errorEl) {
  input.classList.remove('is-invalid');
  errorEl.textContent = '';
  errorEl.classList.remove('visible');
}

/**
 * Validates all form inputs.
 * @returns {Object|null} Validated data object or null if any validation fails
 */
function validateForm() {
  let isValid = true;

  const isPrevValid = validateNumericField(
    elements.inputPrevMarks,
    elements.errorPrevMarks,
    MODEL_CONFIG.bounds.previousMarks.min,
    MODEL_CONFIG.bounds.previousMarks.max,
    'Previous Examination Marks'
  );

  const isStudyValid = validateNumericField(
    elements.inputStudyHours,
    elements.errorStudyHours,
    MODEL_CONFIG.bounds.studyHours.min,
    MODEL_CONFIG.bounds.studyHours.max,
    'Average Daily Study Hours'
  );

  const isAttendanceValid = validateNumericField(
    elements.inputAttendance,
    elements.errorAttendance,
    MODEL_CONFIG.bounds.attendance.min,
    MODEL_CONFIG.bounds.attendance.max,
    'Classroom Attendance'
  );

  const isAssignmentsValid = validateNumericField(
    elements.inputAssignments,
    elements.errorAssignments,
    MODEL_CONFIG.bounds.assignmentCompletion.min,
    MODEL_CONFIG.bounds.assignmentCompletion.max,
    'Assignment Completion'
  );

  isValid = isPrevValid && isStudyValid && isAttendanceValid && isAssignmentsValid;

  if (!isValid) return null;

  return {
    studentName: elements.inputName.value.trim() || 'Anonymous Student',
    previousMarks: parseFloat(elements.inputPrevMarks.value),
    studyHours: parseFloat(elements.inputStudyHours.value),
    attendance: parseFloat(elements.inputAttendance.value),
    assignmentCompletion: parseFloat(elements.inputAssignments.value)
  };
}

/* ==============================================================================
   6. CHART VISUALIZATIONS (CHART.JS)
   ============================================================================== */

/**
 * Renders or updates the Comparative Bar Chart (Previous vs Predicted).
 * @param {number} previousMarks 
 * @param {number} predictedMarks 
 */
function renderComparisonBarChart(previousMarks, predictedMarks) {
  if (!elements.canvasBar) return;

  const ctx = elements.canvasBar.getContext('2d');

  // Destroy previous instance to avoid canvas reuse errors or tooltips sticking
  if (comparisonChartInstance) {
    comparisonChartInstance.destroy();
  }

  comparisonChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Previous Marks', 'Predicted Marks'],
      datasets: [{
        label: 'Marks / 100',
        data: [previousMarks, predictedMarks],
        backgroundColor: [
          'rgba(124, 58, 237, 0.75)',  // Purple for previous
          'rgba(37, 99, 235, 0.85)'    // Vibrant Blue for predicted
        ],
        borderColor: [
          '#7c3aed',
          '#2563eb'
        ],
        borderWidth: 1.5,
        borderRadius: 8,
        barThickness: 48
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          backgroundColor: '#0f172a',
          titleFont: { family: 'Inter', size: 13, weight: 'bold' },
          bodyFont: { family: 'Inter', size: 12 },
          padding: 10,
          cornerRadius: 6,
          callbacks: {
            label: function(context) {
              return ` ${context.parsed.y.toFixed(1)} / 100`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          ticks: {
            stepSize: 20,
            font: { family: 'Inter', size: 11 },
            color: '#64748b'
          },
          grid: {
            color: '#f1f5f9'
          }
        },
        x: {
          ticks: {
            font: { family: 'Inter', size: 12, weight: '600' },
            color: '#334155'
          },
          grid: {
            display: false
          }
        }
      }
    }
  });
}

/**
 * Renders or updates the Doughnut Chart (Predicted Marks vs Remaining Potential).
 * @param {number} predictedMarks 
 * @param {string} categoryColor 
 */
function renderScoreDoughnutChart(predictedMarks, categoryColor) {
  if (!elements.canvasDoughnut) return;

  const ctx = elements.canvasDoughnut.getContext('2d');
  const remaining = Math.max(0, Number((100 - predictedMarks).toFixed(1)));

  if (doughnutChartInstance) {
    doughnutChartInstance.destroy();
  }

  doughnutChartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Predicted Score', 'Remaining to 100'],
      datasets: [{
        data: [predictedMarks, remaining],
        backgroundColor: [
          categoryColor || '#2563eb',
          '#e2e8f0'
        ],
        borderColor: ['#ffffff', '#ffffff'],
        borderWidth: 2,
        hoverOffset: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '72%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            font: { family: 'Inter', size: 11, weight: '500' },
            color: '#334155',
            usePointStyle: true,
            boxWidth: 8
          }
        },
        tooltip: {
          backgroundColor: '#0f172a',
          titleFont: { family: 'Inter', size: 13, weight: 'bold' },
          bodyFont: { family: 'Inter', size: 12 },
          padding: 10,
          cornerRadius: 6,
          callbacks: {
            label: function(context) {
              return ` ${context.label}: ${context.parsed.toFixed(1)}`;
            }
          }
        }
      }
    }
  });
}

/* ==============================================================================
   7. RESULTS DISPLAY & UI RENDERING
   ============================================================================== */

/**
 * Updates the UI with predicted results, categories, and charts.
 * @param {Object} data - Validated input data
 * @param {number} score - Predicted final marks
 */
function displayResults(data, score) {
  const category = determineCategory(score);
  const recommendation = generateRecommendation(score, data, category);

  // Update Student Name / Heading
  if (data.studentName && data.studentName !== 'Anonymous Student') {
    elements.studentHeading.textContent = `Estimated Result for ${data.studentName}`;
  } else {
    elements.studentHeading.textContent = `Estimated Academic Result`;
  }

  // Update Score and Progress Bar
  elements.predictedScoreValue.textContent = score.toFixed(1);
  elements.scoreProgressBar.style.width = `${score}%`;

  // Update Category Badge
  elements.categoryBadge.className = `category-badge ${category.badgeClass}`;
  elements.categoryLabel.textContent = category.label;
  elements.badgeIcon.textContent = category.icon;

  // Update Metric Quick Chips
  elements.metricPrevMarks.textContent = `${data.previousMarks.toFixed(1)}`;
  elements.metricStudyHours.textContent = `${data.studyHours.toFixed(1)} h`;
  elements.metricAttendance.textContent = `${data.attendance.toFixed(1)}%`;
  elements.metricAssignments.textContent = `${data.assignmentCompletion.toFixed(1)}%`;

  // Update Recommendation Box
  elements.recTitle.textContent = recommendation.title;
  elements.recMessage.textContent = recommendation.text;

  // Hide placeholder and reveal results wrapper
  elements.resultsPlaceholder.classList.add('hidden');
  elements.resultsSection.classList.remove('hidden');

  // Render Charts
  renderComparisonBarChart(data.previousMarks, score);
  renderScoreDoughnutChart(score, category.color);

  // Save to history
  savePredictionToHistory(data, score, category);
}

/* ==============================================================================
   8. PREDICTION HISTORY (BROWSER LOCAL STORAGE)
   ============================================================================== */

/**
 * Loads prediction records from LocalStorage.
 * @returns {Array} Array of prediction history objects
 */
function getStoredHistory() {
  try {
    const raw = localStorage.getItem(MODEL_CONFIG.storageKey);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.warn('LocalStorage unavailable or restricted:', err);
    return [];
  }
}

/**
 * Saves a prediction entry to LocalStorage.
 */
function savePredictionToHistory(data, score, category) {
  try {
    const history = getStoredHistory();
    const entry = {
      id: Date.now().toString(),
      date: new Date().toLocaleString([], {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      studentName: data.studentName,
      previousMarks: data.previousMarks,
      studyHours: data.studyHours,
      attendance: data.attendance,
      assignmentCompletion: data.assignmentCompletion,
      predictedMarks: score,
      category: category.label,
      badgeClass: category.badgeClass
    };

    // Prepend new entry
    history.unshift(entry);

    // Keep only most recent items
    if (history.length > MODEL_CONFIG.maxHistoryItems) {
      history.pop();
    }

    localStorage.setItem(MODEL_CONFIG.storageKey, JSON.stringify(history));
    renderHistoryTable();
  } catch (err) {
    console.warn('Could not persist history to LocalStorage:', err);
  }
}

/**
 * Renders the prediction history table.
 */
function renderHistoryTable() {
  const history = getStoredHistory();
  elements.historyTableBody.innerHTML = '';

  if (history.length === 0) {
    elements.historyTable.style.display = 'none';
    elements.historyEmptyState.style.display = 'block';
    elements.btnClearHistory.style.display = 'none';
    return;
  }

  elements.historyTable.style.display = 'table';
  elements.historyEmptyState.style.display = 'none';
  elements.btnClearHistory.style.display = 'inline-flex';

  history.forEach(item => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${escapeHTML(item.date)}</td>
      <td><strong>${escapeHTML(item.studentName)}</strong></td>
      <td>${item.previousMarks.toFixed(1)}</td>
      <td>${item.studyHours.toFixed(1)} h</td>
      <td>${item.attendance.toFixed(1)}%</td>
      <td>${item.assignmentCompletion.toFixed(1)}%</td>
      <td><strong>${item.predictedMarks.toFixed(1)}</strong></td>
      <td><span class="table-badge ${item.badgeClass}">${escapeHTML(item.category)}</span></td>
      <td>
        <button type="button" class="btn-icon-delete" data-id="${item.id}" title="Delete this entry">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
        </button>
      </td>
    `;
    elements.historyTableBody.appendChild(row);
  });

  // Attach delete handlers to individual delete buttons
  const deleteButtons = elements.historyTableBody.querySelectorAll('.btn-icon-delete');
  deleteButtons.forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      const id = this.getAttribute('data-id');
      deleteHistoryItem(id);
    });
  });
}

/**
 * Deletes a single prediction entry by its ID.
 * @param {string} id 
 */
function deleteHistoryItem(id) {
  try {
    let history = getStoredHistory();
    history = history.filter(item => item.id !== id);
    localStorage.setItem(MODEL_CONFIG.storageKey, JSON.stringify(history));
    renderHistoryTable();
    showToast('Record removed from history.');
  } catch (err) {
    console.error('Failed to delete history record:', err);
  }
}

/**
 * Clears all predictions from LocalStorage.
 */
function clearAllHistory() {
  const history = getStoredHistory();
  if (history.length === 0) return;

  const confirmed = window.confirm('Are you sure you want to clear all prediction history?');
  if (confirmed) {
    try {
      localStorage.removeItem(MODEL_CONFIG.storageKey);
      renderHistoryTable();
      showToast('All prediction records cleared.');
    } catch (err) {
      console.error('Failed to clear history:', err);
    }
  }
}

/* ==============================================================================
   9. UTILITY HELPERS
   ============================================================================== */

/**
 * Escapes HTML characters to prevent XSS.
 * @param {string} str 
 * @returns {string} Sanitized string
 */
function escapeHTML(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Displays a non-intrusive toast alert.
 * @param {string} message 
 */
function showToast(message) {
  if (!elements.toast) return;
  elements.toast.textContent = message;
  elements.toast.classList.add('show');
  setTimeout(() => {
    elements.toast.classList.remove('show');
  }, 2800);
}

/**
 * Resets the application back to its clean initial state.
 */
function resetApplication() {
  // Reset form
  elements.form.reset();

  // Clear validation messages
  clearFieldError(elements.inputPrevMarks, elements.errorPrevMarks);
  clearFieldError(elements.inputStudyHours, elements.errorStudyHours);
  clearFieldError(elements.inputAttendance, elements.errorAttendance);
  clearFieldError(elements.inputAssignments, elements.errorAssignments);

  // Hide results and show placeholder
  elements.resultsSection.classList.add('hidden');
  elements.resultsPlaceholder.classList.remove('hidden');

  // Destroy charts
  if (comparisonChartInstance) {
    comparisonChartInstance.destroy();
    comparisonChartInstance = null;
  }
  if (doughnutChartInstance) {
    doughnutChartInstance.destroy();
    doughnutChartInstance = null;
  }

  showToast('Form and results reset.');
}

/**
 * Pre-populates the input form with typical sample data for fast testing.
 */
function loadSampleData() {
  elements.inputName.value = 'Rohan Verma';
  elements.inputPrevMarks.value = '76.0';
  elements.inputStudyHours.value = '5.0';
  elements.inputAttendance.value = '88.0';
  elements.inputAssignments.value = '90.0';

  // Clear errors if any
  clearFieldError(elements.inputPrevMarks, elements.errorPrevMarks);
  clearFieldError(elements.inputStudyHours, elements.errorStudyHours);
  clearFieldError(elements.inputAttendance, elements.errorAttendance);
  clearFieldError(elements.inputAssignments, elements.errorAssignments);

  showToast('Sample student metrics loaded.');
}

/* ==============================================================================
   10. EVENT LISTENERS & INITIALIZATION
   ============================================================================== */

/**
 * Handles Form Submission
 */
elements.form.addEventListener('submit', function(event) {
  event.preventDefault();

  const validatedData = validateForm();
  if (!validatedData) {
    showToast('Please correct the highlighted input errors.');
    return;
  }

  // Show brief computation indicator (transparent, non-blocking UI feel)
  elements.btnPredict.classList.add('is-loading');
  elements.btnPredict.disabled = true;

  setTimeout(() => {
    elements.btnPredict.classList.remove('is-loading');
    elements.btnPredict.disabled = false;

    // Run prediction
    const predictedMarks = calculatePredictedScore(validatedData);

    // Update UI & Visualizations
    displayResults(validatedData, predictedMarks);

    showToast(`Prediction calculated: ${predictedMarks.toFixed(1)} marks`);

    // Smooth scroll to results on mobile/tablets
    if (window.innerWidth < 840) {
      elements.resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, 350); // 350ms brief calculation animation
});

// Real-time error clearing as user types
elements.inputPrevMarks.addEventListener('input', () => clearFieldError(elements.inputPrevMarks, elements.errorPrevMarks));
elements.inputStudyHours.addEventListener('input', () => clearFieldError(elements.inputStudyHours, elements.errorStudyHours));
elements.inputAttendance.addEventListener('input', () => clearFieldError(elements.inputAttendance, elements.errorAttendance));
elements.inputAssignments.addEventListener('input', () => clearFieldError(elements.inputAssignments, elements.errorAssignments));

// Reset Button
elements.btnReset.addEventListener('click', resetApplication);

// Quick Demo / Sample Data Button
elements.btnQuickDemo.addEventListener('click', loadSampleData);

// Clear History Button
elements.btnClearHistory.addEventListener('click', clearAllHistory);

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  renderHistoryTable();
});

