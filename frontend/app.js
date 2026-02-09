const API_BASE_URL = "http://localhost:8080";

const selectors = {
  apiStatus: document.getElementById("apiStatus"),
  // Add form
  addForm: document.getElementById("addStudentForm"),
  addName: document.getElementById("addName"),
  addAge: document.getElementById("addAge"),
  addEmail: document.getElementById("addEmail"),
  addSubmitBtn: document.getElementById("addSubmitBtn"),
  // Update form
  updateForm: document.getElementById("updateStudentForm"),
  updateStudentId: document.getElementById("updateStudentId"),
  updateName: document.getElementById("updateName"),
  updateAge: document.getElementById("updateAge"),
  updateEmail: document.getElementById("updateEmail"),
  updateSubmitBtn: document.getElementById("updateSubmitBtn"),
  resetUpdateFormBtn: document.getElementById("resetUpdateFormBtn"),
  // Shared
  messageBar: document.getElementById("messageBar"),
  tableBody: document.getElementById("studentsTableBody"),
  refreshBtn: document.getElementById("refreshBtn"),
  searchInput: document.getElementById("searchInput"),
  updateSearchInput: document.getElementById("updateSearchInput"),
  celebrationLayer: document.getElementById("celebrationLayer"),
};

let currentUpdateId = null;
let studentsCache = [];

function setApiStatus(status, text) {
  if (!selectors.apiStatus) return;
  selectors.apiStatus.textContent = text;
  selectors.apiStatus.classList.remove("ok", "error");
  if (status === "ok") {
    selectors.apiStatus.classList.add("ok");
  } else if (status === "error") {
    selectors.apiStatus.classList.add("error");
  }
}

function showMessage(type, text) {
  const bar = selectors.messageBar;
  if (!bar) return;
  bar.textContent = text;
  bar.classList.remove("hidden", "info", "error");
  bar.classList.add(type === "error" ? "error" : "info");
  setTimeout(() => {
    bar.classList.add("hidden");
  }, 4000);
}

async function apiRequest(path, options = {}) {
  const url = `${API_BASE_URL}${path}`;
  try {
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
      },
      ...options,
    });

    const text = await response.text();
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = text;
    }

    if (!response.ok) {
      const message =
        (data && data.message) ||
        (typeof data === "string" ? data : "Unexpected error from server");
      throw new Error(message);
    }

    return data;
  } catch (err) {
    throw err instanceof Error ? err : new Error("Network error");
  }
}

async function checkApiHealth() {
  try {
    await apiRequest("/test", { method: "GET" });
    setApiStatus("ok", "API Online");
  } catch (err) {
    setApiStatus("error", "API Offline");
  }
}

function renderEmptyRow() {
  selectors.tableBody.innerHTML =
    '<tr><td colspan="4" class="empty-state">No students yet. Add your first student above.</td></tr>';
}

function renderStudents(students) {
  if (!students || students.length === 0) {
    renderEmptyRow();
    return;
  }

  const rows = students
    .map(
      (s) => `
      <tr data-id="${s.id}">
        <td>${s.name ?? ""}</td>
        <td>${s.age ?? ""}</td>
        <td>${s.email ?? ""}</td>
        <td>
          <div class="actions">
            <button class="btn-chip edit" data-action="edit" data-id="${s.id}">Edit</button>
            <button class="btn-chip delete" data-action="delete" data-id="${s.id}">Delete</button>
          </div>
        </td>
      </tr>
    `
    )
    .join("");

  selectors.tableBody.innerHTML = rows;
}

async function loadStudents() {
  try {
    const students = await apiRequest("/students", { method: "GET" });
    studentsCache = students || [];
    applySearchFilter();
  } catch (err) {
    renderEmptyRow();
    showMessage("error", err.message || "Failed to fetch students");
  }
}

function resetUpdateForm() {
  selectors.updateForm.reset();
  selectors.updateStudentId.value = "";
  currentUpdateId = null;
}

async function handleAddFormSubmit(event) {
  event.preventDefault();

  const name = selectors.addName.value.trim();
  const age = Number(selectors.addAge.value);
  const email = selectors.addEmail.value.trim();

  if (!name || !age || !email) {
    showMessage("error", "Please fill in all fields.");
    return;
  }

  const payload = { name, age, email };
  selectors.addSubmitBtn.disabled = true;

  try {
    const created = await apiRequest("/add-student", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    showMessage("info", "Student created successfully.");
    triggerCelebration(name || "New Student");

    await loadStudents();
    selectors.addForm.reset();
  } catch (err) {
    showMessage("error", err.message || "Failed to save student.");
  } finally {
    selectors.addSubmitBtn.disabled = false;
  }
}

async function handleUpdateFormSubmit(event) {
  event.preventDefault();

  if (!currentUpdateId) {
    showMessage("error", "Please select a student to update from the list below.");
    return;
  }

  const name = selectors.updateName.value.trim();
  const age = Number(selectors.updateAge.value);
  const email = selectors.updateEmail.value.trim();

  if (!name || !age || !email) {
    showMessage("error", "Please fill in all fields.");
    return;
  }

  const payload = { name, age, email };
  selectors.updateSubmitBtn.disabled = true;

  try {
    await apiRequest(`/update/${currentUpdateId}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    showMessage("info", "Student updated successfully.");

    await loadStudents();
    resetUpdateForm();
  } catch (err) {
    showMessage("error", err.message || "Failed to update student.");
  } finally {
    selectors.updateSubmitBtn.disabled = false;
  }
}

function handleTableClick(event) {
  const action = event.target.dataset.action;
  const id = event.target.dataset.id;
  if (!action || !id) return;

  if (action === "edit") {
    startEditStudent(id);
  } else if (action === "delete") {
    deleteStudent(id);
  }
}

async function startEditStudent(id) {
  const row = selectors.tableBody.querySelector(`tr[data-id="${id}"]`);
  if (!row) return;

  const [nameCell, ageCell, emailCell] = row.children;
  selectors.updateStudentId.value = id;
  selectors.updateName.value = nameCell.textContent.trim();
  selectors.updateAge.value = ageCell.textContent.trim();
  selectors.updateEmail.value = emailCell.textContent.trim();

  currentUpdateId = id;
}

async function deleteStudent(id) {
  const confirmed = window.confirm(
    "Are you sure you want to delete this student?"
  );
  if (!confirmed) return;

  try {
    await apiRequest(`/students/${id}`, { method: "DELETE" });
    showMessage("info", "Student deleted successfully.");
    await loadStudents();
    if (currentUpdateId === id) {
      resetUpdateForm();
    }
  } catch (err) {
    showMessage("error", err.message || "Failed to delete student.");
  }
}

function applySearchFilter() {
  const termMain = (selectors.searchInput?.value || "").trim().toLowerCase();
  const termUpdate = (selectors.updateSearchInput?.value || "")
    .trim()
    .toLowerCase();

  const term = (termMain + " " + termUpdate).trim();

  if (!term) {
    renderStudents(studentsCache);
    return;
  }

  const filtered = studentsCache.filter((s) => {
    const name = (s.name || "").toLowerCase();
    const email = (s.email || "").toLowerCase();
    return name.includes(term) || email.includes(term);
  });

  renderStudents(filtered);
}

function initEventListeners() {
  selectors.addForm.addEventListener("submit", handleAddFormSubmit);
  selectors.updateForm.addEventListener("submit", handleUpdateFormSubmit);
  selectors.resetUpdateFormBtn.addEventListener("click", resetUpdateForm);
  selectors.refreshBtn.addEventListener("click", loadStudents);
  selectors.tableBody.addEventListener("click", handleTableClick);
  if (selectors.searchInput) {
    selectors.searchInput.addEventListener("input", applySearchFilter);
  }
  if (selectors.updateSearchInput) {
    selectors.updateSearchInput.addEventListener("input", applySearchFilter);
  }
}

function triggerCelebration(name) {
  const layer = selectors.celebrationLayer;
  if (!layer) return;

  layer.innerHTML = "";
  layer.classList.remove("hidden");

  const message = document.createElement("div");
  message.className = "celebration-message";
  message.textContent = `Welcome, ${name}! 🎉`;
  layer.appendChild(message);

  const colors = ["#f97316", "#22c55e", "#38bdf8", "#a855f7", "#e11d48"];

  const pieces = 80;
  for (let i = 0; i < pieces; i++) {
    const piece = document.createElement("div");
    piece.className = "confetti-piece";
    const left = Math.random() * 100;
    const delay = Math.random() * 0.4;
    const duration = 1.8 + Math.random() * 0.8;
    piece.style.left = `${left}%`;
    piece.style.backgroundColor =
      colors[Math.floor(Math.random() * colors.length)];
    piece.style.animationDuration = `${duration}s`;
    piece.style.animationDelay = `${delay}s`;
    layer.appendChild(piece);
  }

  setTimeout(() => {
    layer.classList.add("hidden");
    layer.innerHTML = "";
  }, 2600);
}

document.addEventListener("DOMContentLoaded", async () => {
  initEventListeners();
  await Promise.all([checkApiHealth(), loadStudents()]);
});

