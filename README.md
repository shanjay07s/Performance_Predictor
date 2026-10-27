# Student Performance Predictor

> **B.Tech Artificial Intelligence & Data Science — Mini Project**  
> A lightweight, modern, and responsive client-side web application that estimates student examination performance using continuous academic indicators and a normalized rule-based linear model.

---

## 1. Project Overview

**Student Performance Predictor** is a frontend-only decision support tool designed for students, educators, and academic advisors. By analyzing four key continuous assessment factors—previous exam scores, daily study hours, lecture attendance, and assignment completion—the system computes an estimated final examination score (0–100), maps it to a qualitative performance category, delivers personalized study recommendations, and visualizes comparative performance via **Chart.js**.

---

## 2. Key Features

- **Responsive Student Input Form:**
  - Student Name (optional, personalized reports).
  - Previous Examination Marks (0–100).
  - Average Daily Study Hours (0–16 hrs/day).
  - Classroom Attendance Percentage (0–100%).
  - Assignment Completion Percentage (0–100%).
  - Real-time client-side validation with inline error highlights.
  - "Sample Data" quick-fill button for fast viva and classroom demonstrations.

- **Rule-Based Estimation Engine:**
  - Multi-factor linear weighted model (Sum of weights = 1.0 / 100%).
  - Normalization of study hours using an 8-hour/day benchmark.
  - Clamping to enforce valid range $[0.0, 100.0]$.
  - Formatted to 1 decimal place with a brief calculation animation.
  - Explicitly labeled as a rule-based estimate (transparent heuristics, not an unverified black-box ML model).

- **Categorization & Tailored Recommendations:**
  - **85.0 – 100.0:** Excellent (Green Badge)
  - **70.0 – 84.9:** Very Good (Blue Badge)
  - **50.0 – 69.9:** Good (Amber Badge)
  - **35.0 – 49.9:** Needs Improvement (Orange Badge)
  - **Below 35.0:** At Risk (Red Badge)
  - Tailored action items highlighting specific weaknesses (e.g., low attendance warnings, revision routines).

- **Dynamic Visual Analytics (Chart.js):**
  - **Bar Chart:** Direct side-by-side comparison of Previous Marks vs. Predicted Marks.
  - **Doughnut Chart:** Marks achieved vs. remaining potential to reach 100%.
  - Clean canvas destruction and lifecycle management to prevent memory leaks or tooltip ghosting.

- **Prediction History (Local Storage):**
  - Retains up to 15 recent predictions in the browser's `localStorage`.
  - Displays timestamp, student name, input metrics, predicted marks, and category.
  - Supports individual item deletion and one-click history clearing.

- **UI/UX Design:**
  - Modern academic dashboard palette: Royal Blue (`#2563eb`), Violet/Purple (`#7c3aed`), and Clean Slate.
  - Fully responsive on mobile, tablet, and desktop viewports.

---

## 3. Mathematical Formula & Methodology

### Indicator Weights
| Academic Metric | Weight ($w_i$) | Rationale |
| :--- | :---: | :--- |
| **Previous Exam Marks** | **50% (0.50)** | Strongest historical indicator of academic baseline and subject grasp. |
| **Daily Study Hours** | **20% (0.20)** | Measures self-study consistency and dedicated revision time. |
| **Classroom Attendance** | **15% (0.15)** | Measures lecture attendance, instructor interaction, and class engagement. |
| **Assignment Completion** | **15% (0.15)** | Reflects continuous coursework adherence and practical homework practice. |

### Normalization Logic
Study hours are expressed in hours per day (0–16), whereas all other inputs are on a 0–100 scale. To ensure equal mathematical scaling, study hours are normalized using an **8.0 hours/day** benchmark:

$$\text{NormalizedStudyHours} = \min\left(\frac{\text{StudyHours}}{8.0} \times 100, \, 100\right)$$

*Example:* A student studying 4.0 hours daily achieves $\frac{4.0}{8.0} \times 100 = 50\%$.

### Final Prediction Equation

$$\text{Predicted Marks} = (0.50 \times \text{PreviousMarks}) + (0.20 \times \text{NormalizedStudyHours}) + (0.15 \times \text{Attendance}) + (0.15 \times \text{Assignments})$$

The final score is bounded strictly to the interval $[0, 100]$:

$$\text{Final Score} = \max\left(0, \min(100, \text{Predicted Marks})\right)$$

---

## 4. File Structure

```
performance_tracker/
│
├── index.html     # Semantic HTML5 structure and accessible form controls
├── style.css      # Custom styling, CSS variables, cards, and responsive media queries
├── script.js      # Core logic, validation, formula calculation, Chart.js lifecycle, localStorage
└── README.md      # Comprehensive project documentation & viva guide
```

---

## 5. How to Run Locally

Because this project is built using pure **HTML5, CSS3, and Vanilla JavaScript**, it requires **no backend server, no npm installations, and no database setup**.

### Option A: Direct Browser Launch (Simplest)
1. Double-click `index.html` or right-click `index.html` and choose **Open With > Google Chrome / Microsoft Edge / Mozilla Firefox**.
2. The application will immediately open and run locally.

### Option B: Local HTTP Server (Recommended for Developers)
Using a lightweight local server ensures clean CDN caching and seamless asset loading:

- **Using Python 3:**
  ```bash
  python -m http.server 3000
  ```
  Open `http://localhost:3000` in your web browser.

- **Using Node.js (`npx`):**
  ```bash
  npx serve .
  ```

- **Using VS Code Live Server:**
  Right-click `index.html` inside VS Code and click **"Open with Live Server"**.

---

## 6. Mini-Project Report Synopsis (For College Documentation)

### Abstract
Student academic performance is influenced by multiple continuous behavioral and historical parameters. In early semesters or prior to final semester examinations, students often lack an accessible, transparent tool to gauge where their current academic engagement will lead. This mini-project presents **Student Performance Predictor**, a client-side web application developed with HTML5, CSS3, and JavaScript. Utilizing a multi-factor normalized linear weighted algorithm, the system evaluates previous test scores, study dedication, attendance, and coursework completion to predict final examination marks. Interactive visual analytics developed with Chart.js offer instant comparative insights and motivational guidance without requiring server dependencies or data transmission over external networks.

### System Architecture
1. **Presentation Layer (`index.html` + `style.css`):** Accessible form layout, responsive two-column grid, high-contrast category badges, and dynamic Chart.js canvas elements.
2. **Controller & Business Logic (`script.js`):**
   - **Input Sanitization & Validation:** Range and numeric boundary checking.
   - **Transformation Engine:** Feature scaling (normalizing study hours) and weighted linear combination.
   - **Analytics & Visualization:** Dynamic Chart.js instantiation and destruction.
3. **Persistence Layer (`localStorage`):** Non-sensitive client-side persistence of historical test scenarios for comparative review.

