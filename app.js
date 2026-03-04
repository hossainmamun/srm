(function () {
  "use strict";

  // Grade to point mapping for SRM University. Includes common aliases such as S
  // for outstanding, P for pass and Ab/I/W for absent/incomplete/withdrawal.
  const srmCalcGradeMap = {
    O: 10,
    S: 10,
    "A+": 9,
    A: 8,
    "B+": 7,
    B: 6,
    C: 5,
    P: 4,
    D: 6,
    E: 5,
    F: 0,
    Ab: 0,
    I: 0,
    W: 0,
  };

  // Predefined credit options for the credit select dropdown.
  const srmCalcCreditOptions = [1, 2, 3, 4, 5];

  // Application state
  let srmCalcState = {
    semesters: [],
  };

  function srmCalcInit() {
    // Restore persisted state
    const stored = sessionStorage.getItem("srmCalcState");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed && Array.isArray(parsed.semesters)) {
          srmCalcState.semesters = parsed.semesters;
        }
      } catch (err) {
        console.error("Failed to parse stored state", err);
      }
    }
    // If no semesters loaded, initialise with one semester and TWO courses
    if (!srmCalcState.semesters.length) {
      srmCalcState.semesters.push({
        courses: [srmCalcCreateEmptyCourse(), srmCalcCreateEmptyCourse()],
      });
    }
    srmCalcRenderApp();
    // If persisted results exist, render them
    srmCalcRenderStoredResults();
  }

  /**
   * Create an empty course object.
   * @returns {{name: string, credits: string, grade: string}}
   */
  function srmCalcCreateEmptyCourse() {
    return { name: "", credits: "", grade: "" };
  }

  /**
   * Persist the current state to sessionStorage.
   */
  function srmCalcPersistState() {
    try {
      sessionStorage.setItem("srmCalcState", JSON.stringify(srmCalcState));
    } catch (err) {
      console.error("Failed to persist state", err);
    }
  }

  /**
   * Add a new semester to the state and re-render.
   */
  function srmCalcAddSemester() {
    srmCalcState.semesters.push({
      courses: [srmCalcCreateEmptyCourse(), srmCalcCreateEmptyCourse()],
    });
    srmCalcPersistState();
    srmCalcRenderApp();
  }

  /**
   * Remove a semester at the given index. Ensures at least one semester exists.
   * @param {number} index
   */
  function srmCalcRemoveSemester(index) {
    if (srmCalcState.semesters.length > 1) {
      srmCalcState.semesters.splice(index, 1);
      srmCalcPersistState();
      srmCalcRenderApp();
    }
  }

  /**
   * Add a new course row to a specific semester.
   * @param {number} semesterIndex
   */
  function srmCalcAddCourse(semesterIndex) {
    const semester = srmCalcState.semesters[semesterIndex];
    semester.courses.push(srmCalcCreateEmptyCourse());
    srmCalcPersistState();
    srmCalcRenderApp();
  }

  /**
   * Remove a course row from a specific semester. Ensures at least one course
   * remains in the semester.
   * @param {number} semesterIndex
   * @param {number} courseIndex
   */
  function srmCalcRemoveCourse(semesterIndex, courseIndex) {
    const semester = srmCalcState.semesters[semesterIndex];
    if (semester.courses.length > 1) {
      semester.courses.splice(courseIndex, 1);
      srmCalcPersistState();
      srmCalcRenderApp();
    }
  }

  /**
   * Render the entire application into the DOM based on the current state.
   * This function clears and rebuilds the UI on every call.
   */
  function srmCalcRenderApp() {
    const app = document.getElementById("srm-calc-app");
    if (!app) return;
    // Clear existing contents
    app.innerHTML = "";

    // For each semester, build a section
    srmCalcState.semesters.forEach((semester, semIndex) => {
      const semEl = document.createElement("section");
      semEl.className = "srm-calc-semester";

      // Header with semester title and remove button
      const header = document.createElement("div");
      header.className = "srm-calc-semester-header";

      const title = document.createElement("h2");
      title.className = "srm-calc-semester-title";
      title.textContent = `Semester ${semIndex + 1}`;
      header.appendChild(title);

      if (srmCalcState.semesters.length > 1) {
        const removeBtn = document.createElement("button");
        removeBtn.className =
          "st-general-btn srm-calc-remove-semester";
        removeBtn.innerHTML = `<i class="fa-solid fa-xmark"></i>`;
        removeBtn.addEventListener("click", () => {
          srmCalcRemoveSemester(semIndex);
        });
        header.appendChild(removeBtn);
      }
      semEl.appendChild(header);

      // Course rows
      semester.courses.forEach((course, courseIndex) => {
        const row = document.createElement("div");
        row.className = "srm-calc-course-row";

        // Course name input
        const nameInput = document.createElement("input");
        nameInput.type = "text";
        nameInput.className = "st-general-input";
        nameInput.placeholder = "Course name (optional)";
        nameInput.value = course.name;
        nameInput.addEventListener("input", (e) => {
          course.name = e.target.value;
          srmCalcPersistState();
        });
        row.appendChild(nameInput);

        // Credits select + custom input
        const creditContainer = document.createElement("div");
        creditContainer.className = "srm-calc-credit-container";
        // Select element for predefined credits and a custom option
        const creditSelect = document.createElement("select");
        creditSelect.className = "st-general-select";
        // Build options: placeholder first, then predefined credits, then custom
        const creditOpts = [""].concat(
          srmCalcCreditOptions.map((c) => String(c))
        );
        creditOpts.forEach((val) => {
          const opt = document.createElement("option");
          opt.value = val;
          opt.textContent = val ? val : "Select credits";
          creditSelect.appendChild(opt);
        });
        const customOpt = document.createElement("option");
        customOpt.value = "custom";
        customOpt.textContent = "Custom";
        creditSelect.appendChild(customOpt);
        // Custom credit input
        const customInput = document.createElement("input");
        customInput.type = "number";
        customInput.className = "st-general-input srm-calc-custom-credit";
        customInput.placeholder = "Custom credits";
        // Determine initial state based on stored credit value
        const creditVal = course.credits;
        if (creditVal && creditOpts.includes(String(creditVal))) {
          creditSelect.value = String(creditVal);
          customInput.style.display = "none";
          customInput.value = "";
        } else if (creditVal) {
          creditSelect.value = "custom";
          customInput.style.display = "block";
          customInput.value = creditVal;
        } else {
          creditSelect.value = "";
          customInput.style.display = "none";
          customInput.value = "";
        }
        // When the select changes, update course.credits and toggle custom input
        creditSelect.addEventListener("change", (e) => {
          const selected = e.target.value;
          if (selected === "custom") {
            customInput.style.display = "block";
            if (!customInput.value) {
              course.credits = "";
            } else {
              course.credits = customInput.value;
            }
          } else {
            customInput.style.display = "none";
            if (selected === "") {
              course.credits = "";
            } else {
              course.credits = selected;
            }
          }
          srmCalcPersistState();
        });
        // When the custom credit input changes, update course.credits
        customInput.addEventListener("input", (e) => {
          course.credits = e.target.value;
          srmCalcPersistState();
        });
        // Append select and custom input to the container and then to the row
        creditContainer.appendChild(creditSelect);
        creditContainer.appendChild(customInput);
        row.appendChild(creditContainer);

        // Grade select
        const gradeSelect = document.createElement("select");
        gradeSelect.className = "st-general-select";
        const gradeOptions = [
          "",
          "O",
          "S",
          "A+",
          "A",
          "B+",
          "B",
          "C",
          "P",
          "D",
          "E",
          "F",
          "Ab",
          "I",
          "W",
        ];
        gradeOptions.forEach((opt) => {
          const optionEl = document.createElement("option");
          optionEl.value = opt;
          optionEl.textContent = opt || "Select grade";
          if (opt === course.grade) optionEl.selected = true;
          gradeSelect.appendChild(optionEl);
        });
        gradeSelect.addEventListener("change", (e) => {
          course.grade = e.target.value;
          srmCalcPersistState();
        });
        row.appendChild(gradeSelect);

        // Remove course button
        const removeCourseBtn = document.createElement("button");
        removeCourseBtn.className =
          "srm-calc-remove-course";
        removeCourseBtn.innerHTML = `<i class="fa-solid fa-trash-arrow-up"></i>`;
        removeCourseBtn.addEventListener("click", () => {
          srmCalcRemoveCourse(semIndex, courseIndex);
        });
        row.appendChild(removeCourseBtn);

        semEl.appendChild(row);
      });

      // Add course button
      const addCourseBtn = document.createElement("button");
      addCourseBtn.className = "st-general-btn st-main-calculation-btn";
      addCourseBtn.innerHTML = `<i class="fa-solid fa-plus"></i> Add Course`;
      addCourseBtn.addEventListener("click", () => {
        srmCalcAddCourse(semIndex);
      });
      semEl.appendChild(addCourseBtn);

      app.appendChild(semEl);
    });

    // Add semester button
    const addSemesterBtn = document.createElement("button");
    addSemesterBtn.className = "st-general-btn st-pdf-btn srm-add-semester";
    addSemesterBtn.innerHTML = `<i class="fa-solid fa-plus"></i> Add Semester`;
    addSemesterBtn.addEventListener("click", () => {
      srmCalcAddSemester();
    });
    app.appendChild(addSemesterBtn);

    // Calculate button
    const calculateBtn = document.createElement("button");
    calculateBtn.className =
      "st-general-btn st-main-calculation-btn srm-calc-btn";
    calculateBtn.innerHTML = `<i class="fa-solid fa-calculator"></i> Calculate`;
    calculateBtn.addEventListener("click", () => {
      srmCalcCalculateAndRender();
    });
    app.appendChild(calculateBtn);

    const buttonSpacer = document.createElement("div");
    buttonSpacer.className = "button-spacer";
    app.appendChild(buttonSpacer);
    buttonSpacer.appendChild(addSemesterBtn);
    buttonSpacer.appendChild(calculateBtn);

    // Results container (created if not exists)
    let resultsEl = document.getElementById("srm-calc-results");
    if (!resultsEl) {
      resultsEl = document.createElement("section");
      resultsEl.id = "srm-calc-results";
      resultsEl.className = "srm-calc-results";
      app.appendChild(resultsEl);
    }

    // Actions container
    let actionsEl = document.getElementById("srm-calc-actions");
    if (!actionsEl) {
      actionsEl = document.createElement("div");
      actionsEl.id = "srm-calc-actions";
      actionsEl.className = "srm-calc-actions";
      // PDF button
      const pdfBtn = document.createElement("button");
      pdfBtn.className = "st-general-btn st-pdf-btn srm-pdf-btn";
      pdfBtn.innerHTML = `<i class="fa-regular fa-file-pdf"></i> Download PDF`;
      pdfBtn.addEventListener("click", srmCalcDownloadPdf);
      actionsEl.appendChild(pdfBtn);
      // Copy button
      const copyBtn = document.createElement("button");
      copyBtn.className = "st-general-btn st-copy-btn srm-copy-btn";
      copyBtn.innerHTML = `<i class="fa-regular fa-copy"></i> Copy`;
      copyBtn.addEventListener("click", srmCalcCopyToClipboard);
      actionsEl.appendChild(copyBtn);
      // Reset button
      const resetBtn = document.createElement("button");
      resetBtn.className = "st-general-btn st-main-reset-btn srm-reset-btn";
      resetBtn.innerHTML = `<i class="fa-solid fa-arrows-rotate"></i> Reset`;
      resetBtn.addEventListener("click", srmCalcReset);
      actionsEl.appendChild(resetBtn);
      app.appendChild(actionsEl);
    }

    srmCalcRenderStoredResults();
  }

  /**
   * Validate course entries. Returns an array of error messages. Each course
   * should have a numeric credits value (>0) and a selected grade that maps to a
   * grade point. Invalid entries are reported collectively to the user.
   *
   * @returns {string[]} list of validation errors
   */
  function srmCalcValidate() {
    const errors = [];
    srmCalcState.semesters.forEach((semester, semIndex) => {
      semester.courses.forEach((course, courseIndex) => {
        const credits = parseFloat(course.credits);
        if (isNaN(credits) || credits <= 0) {
          errors.push(
            `Semester ${semIndex + 1}, Course ${
              courseIndex + 1
            }: Invalid credits`
          );
        }
        if (!course.grade || !(course.grade in srmCalcGradeMap)) {
          errors.push(
            `Semester ${semIndex + 1}, Course ${
              courseIndex + 1
            }: Grade not selected or invalid`
          );
        }
      });
    });
    return errors;
  }

  /**
   * Calculate GPAs for each semester and the overall CGPA. Assumes validation
   * has already passed. Returns an object containing per-semester results and
   * total CGPA plus summary text.
   *
   * @returns {{semesterResults: {credits: number, gpa: number}[], cgpa: number, summary: string}}
   */
  function srmCalcCalculate() {
    const semesterResults = [];
    let totalWeightedPoints = 0;
    let totalCreditsAll = 0;
    let summaryLines = [];
    srmCalcState.semesters.forEach((semester, semIndex) => {
      let semesterCredits = 0;
      let semesterPoints = 0;
      semester.courses.forEach((course) => {
        const credits = parseFloat(course.credits);
        const gradePoint = srmCalcGradeMap[course.grade] || 0;
        semesterCredits += credits;
        semesterPoints += credits * gradePoint;
      });
      const gpa = semesterCredits > 0 ? semesterPoints / semesterCredits : 0;
      semesterResults.push({ credits: semesterCredits, gpa });
      totalWeightedPoints += semesterPoints;
      totalCreditsAll += semesterCredits;
      summaryLines.push(
        `Semester ${semIndex + 1}: Credits ${semesterCredits.toFixed(
          2
        )}, GPA ${gpa.toFixed(2)}`
      );
    });
    const cgpa =
      totalCreditsAll > 0 ? totalWeightedPoints / totalCreditsAll : 0;
    summaryLines.push(`\nOverall CGPA: ${cgpa.toFixed(2)}`);
    const summary = summaryLines.join("\n");
    return { semesterResults, cgpa, summary };
  }

  /**
   * Perform validation, calculate results and render them in the results
   * container. If validation fails, show errors to the user.
   */
  function srmCalcCalculateAndRender() {
    const resultsEl = document.getElementById("srm-calc-results");
    const actionsEl = document.getElementById("srm-calc-actions");
    if (!resultsEl) return;
    // Clear previous results
    resultsEl.innerHTML = "";
    // Validate
    const errors = srmCalcValidate();
    if (errors.length) {
      const errorList = document.createElement("ul");
      errorList.className = "srm-calc-error";
      errors.forEach((msg) => {
        const li = document.createElement("li");
        li.textContent = msg;
        errorList.appendChild(li);
      });
      resultsEl.appendChild(errorList);
      resultsEl.style.display = "block";
      if (actionsEl) actionsEl.style.display = "none";
      return;
    }
    // Perform calculation
    const { semesterResults, cgpa, summary } = srmCalcCalculate();
    // Render results and persist them
    srmCalcShowResults({ semesterResults, cgpa, summary });
    srmCalcPersistResults({ semesterResults, cgpa, summary });
  }

  /**
   * Generate a PDF document containing the calculation summary and download it.
   */
  function srmCalcDownloadPdf() {
    const resultsEl = document.getElementById("srm-calc-results");
    if (!resultsEl) return;
    const summary = resultsEl.dataset.summary || "";
    // Check if jsPDF is loaded
    if (typeof window.jspdf === "undefined") {
      alert(
        "PDF library failed to load. Please check your internet connection."
      );
      return;
    }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    // Title
    doc.setFontSize(16);
    doc.text("SRM CGPA Calculator Results", 10, 20);
    doc.setFontSize(12);
    const lines = summary.split("\n");
    let y = 30;
    lines.forEach((line) => {
      doc.text(line, 10, y);
      y += 8;
    });
    doc.save("srm-cgpa-results.pdf");
  }

  /**
   * Copy the summary text to the clipboard. Provides feedback via alert.
   */
  async function srmCalcCopyToClipboard() {
    const resultsEl = document.getElementById("srm-calc-results");
    if (!resultsEl) return;
    const summary = resultsEl.dataset.summary || "";
    try {
      await navigator.clipboard.writeText(summary);
      alert("Result summary copied to clipboard!");
    } catch (err) {
      console.error("Copy failed", err);
      alert("Failed to copy result summary.");
    }
  }

  /**
   * Persist the latest calculation results (semester results, CGPA and summary)
   * to sessionStorage so they can be restored on page reload. The results
   * parameter should match the format returned by srmCalcCalculate().
   * @param {{semesterResults: {credits: number, gpa: number}[], cgpa: number, summary: string}} results
   */
  function srmCalcPersistResults(results) {
    try {
      sessionStorage.setItem("srmCalcResults", JSON.stringify(results));
    } catch (err) {
      console.error("Failed to persist results", err);
    }
  }

  /**
   * Remove persisted results from sessionStorage. Called during reset.
   */
  function srmCalcClearResults() {
    sessionStorage.removeItem("srmCalcResults");
  }

  /**
   * Render results into the DOM based on a precomputed results object.
   * This is used both after calculation and when restoring from storage.
   * @param {{semesterResults: {credits: number, gpa: number}[], cgpa: number, summary: string}} data
   */
  function srmCalcShowResults(data) {
    const resultsEl = document.getElementById("srm-calc-results");
    const actionsEl = document.getElementById("srm-calc-actions");
    if (!resultsEl) return;
    const { semesterResults, cgpa, summary } = data;
    // Clear previous contents
    resultsEl.innerHTML = "";
    // Build results table
    const heading = document.createElement("h2");
    heading.textContent = "Results";
    resultsEl.appendChild(heading);
    const table = document.createElement("table");
    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");
    ["Semester", "Total Credits", "GPA"].forEach((text) => {
      const th = document.createElement("th");
      th.textContent = text;
      headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);
    const tbody = document.createElement("tbody");
    semesterResults.forEach((res, index) => {
      const row = document.createElement("tr");
      const semCell = document.createElement("td");
      semCell.textContent = `Semester ${index + 1}`;
      const creditCell = document.createElement("td");
      creditCell.textContent = res.credits.toFixed(2);
      const gpaCell = document.createElement("td");
      gpaCell.textContent = res.gpa.toFixed(2);
      row.appendChild(semCell);
      row.appendChild(creditCell);
      row.appendChild(gpaCell);
      tbody.appendChild(row);
    });
    table.appendChild(tbody);
    resultsEl.appendChild(table);
    // Overall CGPA paragraph
    const overall = document.createElement("p");
    overall.className = "srm-calc-results-summary";
    overall.textContent = `Overall CGPA: ${cgpa.toFixed(2)}`;
    resultsEl.appendChild(overall);
    // Save summary text for copy/pdf functions
    resultsEl.dataset.summary = summary;
    // Show results and actions
    resultsEl.style.display = "block";
    if (actionsEl)
      (actionsEl.style.display = "flex"), (actionsEl.style.flexWrap = "wrap");
  }

  /**
   * If persisted results exist in sessionStorage, render them to the page.
   */
  function srmCalcRenderStoredResults() {
    const stored = sessionStorage.getItem("srmCalcResults");
    if (!stored) return;
    try {
      const data = JSON.parse(stored);
      if (data && data.semesterResults && typeof data.cgpa !== "undefined") {
        srmCalcShowResults(data);
      }
    } catch (err) {
      console.error("Failed to parse stored results", err);
    }
  }

  /**
   * Reset the application to its initial state. Clears sessionStorage and
   * re-renders the UI. Also hides the results and actions sections.
   */
  function srmCalcReset() {
    // Clear persisted state and results
    sessionStorage.removeItem("srmCalcState");
    srmCalcClearResults();
    // Reset semesters to one semester with TWO empty courses
    srmCalcState.semesters = [
      {
        courses: [srmCalcCreateEmptyCourse(), srmCalcCreateEmptyCourse()],
      },
    ];
    const resultsEl = document.getElementById("srm-calc-results");
    const actionsEl = document.getElementById("srm-calc-actions");
    if (resultsEl) {
      resultsEl.style.display = "none";
    }
    if (actionsEl) {
      actionsEl.style.display = "none";
    }
    srmCalcRenderApp();
  }

  // Attach the init function to the DOMContentLoaded event
  document.addEventListener("DOMContentLoaded", srmCalcInit);
})();
