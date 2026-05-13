const API = `http://${window.location.hostname}:3000/api`;

// ─────────────────────────────────────────────
// TOAST
// ─────────────────────────────────────────────
function toast(msg, type = "success") {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.className = `show ${type}`;
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.className = "", 3000);
}

// ─────────────────────────────────────────────
// TABS
// ─────────────────────────────────────────────
document.querySelectorAll(".nav-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById("tab-" + btn.dataset.tab).classList.add("active");
    if (btn.dataset.tab === "dashboard") loadDashboard();
    if (btn.dataset.tab === "modules")   loadModules();
    if (btn.dataset.tab === "students")  loadStudents();
    if (btn.dataset.tab === "attendance") { loadAttendanceSelects(); loadAttendanceTable(); }
    if (btn.dataset.tab === "risk")      loadRisk();
  });
});

// ─────────────────────────────────────────────
// RISK HELPERS
// ─────────────────────────────────────────────
function badgeHTML(risk) {
  const cls = risk === "Safe" ? "safe" : risk === "Warning" ? "warning" : "risk";
  return `<span class="badge ${cls}">${risk}</span>`;
}

function pctBarHTML(pct) {
  const cls = pct >= 80 ? "safe" : pct >= 65 ? "warning" : "risk";
  return `
    <div class="pct-wrap">
      <div class="pct-bar"><div class="pct-fill ${cls}" style="width:${pct}%"></div></div>
      <span class="pct-num">${pct}%</span>
    </div>`;
}

// ─────────────────────────────────────────────
// DASHBOARD
// ─────────────────────────────────────────────
async function loadDashboard() {
  const res  = await fetch(`${API}/risk`);
  const data = await res.json();

  // stats
  document.getElementById("stat-total").textContent = data.stats.total;
  document.getElementById("stat-safe").textContent  = data.stats.safe;
  document.getElementById("stat-warn").textContent  = data.stats.warning;
  document.getElementById("stat-risk").textContent  = data.stats.highRisk;

  // top 5 defaulters
  const top5 = data.defaulters.slice(0, 5);
  const dtb  = document.getElementById("defaulter-table");
  if (!top5.length) {
    dtb.innerHTML = `<tr><td colspan="7" class="empty">No attendance data yet.</td></tr>`;
  } else {
    dtb.innerHTML = top5.map((s, i) => `
      <tr>
        <td><span class="rank ${i === 0 ? "rank-1" : ""}">#${i + 1}</span></td>
        <td><span class="id-tag">${s.student_id}</span></td>
        <td>${s.name}</td>
        <td><span class="id-tag">${s.module_code || "—"}</span></td>
        <td>${pctBarHTML(s.percentage)}</td>
        <td>${badgeHTML(s.risk)}</td>
        <td style="color:${s.eligible ? "var(--safe)" : "var(--risk)"}; font-size:12px;">
          ${s.eligible ? "✓ Eligible" : "✗ Not Eligible"}
        </td>
      </tr>`).join("");
  }

  // alert queue
  const aq = document.getElementById("alert-queue");
  if (!data.alerts.length) {
    aq.innerHTML = `<div class="empty">No high-risk alerts. All students above 65%.</div>`;
  } else {
    aq.innerHTML = data.alerts.map(s => `
      <div class="alert-item">
        <div>
          <div class="alert-name">${s.name} <span class="id-tag">${s.student_id}</span> <span class="id-tag">${s.module_code}</span></div>
          <div class="alert-msg">⚠ Student is not eligible for exams.</div>
        </div>
        <div class="alert-pct">${s.percentage}%</div>
      </div>`).join("");
  }
}

// ─────────────────────────────────────────────
// MODULES
// ─────────────────────────────────────────────
async function loadModules() {
  const res     = await fetch(`${API}/modules`);
  const modules = await res.json();
  const tb      = document.getElementById("module-table");
  if (!modules.length) {
    tb.innerHTML = `<tr><td colspan="4" class="empty">No modules yet. Add one above.</td></tr>`;
    return;
  }
  tb.innerHTML = modules.map(m => `
    <tr>
      <td><span class="id-tag">${m.code}</span></td>
      <td>${m.name}</td>
      <td>${m.total_lecture_hours}</td>
      <td><button class="btn btn-danger" onclick="deleteModule('${m.code}')">Delete</button></td>
    </tr>`).join("");
}

async function addModule() {
  const name = document.getElementById("mod-name").value.trim();
  const code = document.getElementById("mod-code").value.trim();
  const total_lecture_hours = parseInt(document.getElementById("mod-hours").value);
  if (!name || !code || isNaN(total_lecture_hours)) return toast("Fill in all module fields", "error");
  const res  = await fetch(`${API}/modules`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, code, total_lecture_hours })
  });
  const data = await res.json();
  if (!res.ok) return toast(data.error, "error");
  document.getElementById("mod-name").value = "";
  document.getElementById("mod-code").value = "";
  document.getElementById("mod-hours").value = "";
  toast(`Module ${data.code} added`);
  loadModules();
}

async function deleteModule(code) {
  if (!confirm(`Delete module ${code}? This removes all related attendance records.`)) return;
  await fetch(`${API}/modules/${code}`, { method: "DELETE" });
  toast(`Module ${code} deleted`);
  loadModules();
}

// ─────────────────────────────────────────────
// STUDENTS
// ─────────────────────────────────────────────
async function loadStudents() {
  const res      = await fetch(`${API}/students`);
  const students = await res.json();
  const tb       = document.getElementById("student-table");
  document.getElementById("student-count").textContent = `${students.length} nodes`;

  if (!students.length) {
    tb.innerHTML = `<tr><td colspan="4" class="empty">No students yet.</td></tr>`;
    return;
  }
  tb.innerHTML = students.map(s => {
    const mods = s.attendance.length
      ? s.attendance.map(a => `<span class="id-tag">${a.module_code}</span>`).join(" ")
      : `<span style="color:var(--muted);font-size:12px">None</span>`;
    return `
      <tr>
        <td><span class="id-tag">${s.student_id}</span></td>
        <td>${s.name}</td>
        <td>${mods}</td>
        <td><button class="btn btn-danger" onclick="deleteStudent('${s.student_id}')">Delete</button></td>
      </tr>`;
  }).join("");
}

async function addStudent() {
  const student_id = document.getElementById("stu-id").value.trim();
  const name       = document.getElementById("stu-name").value.trim();
  if (!student_id || !name) return toast("Fill in student ID and name", "error");
  const res  = await fetch(`${API}/students`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ student_id, name })
  });
  const data = await res.json();
  if (!res.ok) return toast(data.error, "error");
  document.getElementById("stu-id").value   = "";
  document.getElementById("stu-name").value = "";
  toast(`Student ${data.student_id} added`);
  loadStudents();
}

async function deleteStudent(student_id) {
  if (!confirm(`Delete student ${student_id}?`)) return;
  await fetch(`${API}/students/${student_id}`, { method: "DELETE" });
  toast(`Student ${student_id} deleted`);
  loadStudents();
}

// ─────────────────────────────────────────────
// ATTENDANCE
// ─────────────────────────────────────────────
async function loadAttendanceSelects() {
  const [sRes, mRes] = await Promise.all([fetch(`${API}/students`), fetch(`${API}/modules`)]);
  const students = await sRes.json();
  const modules  = await mRes.json();

  const ss = document.getElementById("att-student");
  const sm = document.getElementById("att-module");
  ss.innerHTML = `<option value="">Select student…</option>` +
    students.map(s => `<option value="${s.student_id}">${s.name} (${s.student_id})</option>`).join("");
  sm.innerHTML = `<option value="">Select module…</option>` +
    modules.map(m => `<option value="${m.code}" data-hours="${m.total_lecture_hours}">${m.name} (${m.code}) - ${m.total_lecture_hours}h</option>`).join("");
  
  // Add event listener to populate total hours when module is selected
  sm.addEventListener("change", () => {
    const selected = sm.options[sm.selectedIndex];
    const hours = selected.getAttribute("data-hours");
    document.getElementById("att-total").value = hours || "";
    updatePreview();
  });
}

async function loadAttendanceTable() {
  const res  = await fetch(`${API}/students`);
  const stus = await res.json();
  const tb   = document.getElementById("att-table");
  const rows = [];
  stus.forEach(s => s.attendance.forEach(a => rows.push({ ...a, student_id: s.student_id, name: s.name })));
  if (!rows.length) {
    tb.innerHTML = `<tr><td colspan="6" class="empty">No attendance recorded yet.</td></tr>`;
    return;
  }
  tb.innerHTML = rows.map(r => `
    <tr>
      <td><span class="id-tag">${r.student_id}</span></td>
      <td><span class="id-tag">${r.module_code}</span></td>
      <td>${r.total_lecture_hours}</td>
      <td>${r.attended_lecture_hours}</td>
      <td>${pctBarHTML(r.percentage)}</td>
      <td>${badgeHTML(r.risk)}</td>
    </tr>`).join("");
}

// Live preview
["att-total", "att-attended"].forEach(id => {
  document.getElementById(id).addEventListener("input", updatePreview);
});

function updatePreview() {
  const total    = parseInt(document.getElementById("att-total").value);
  const attended = parseInt(document.getElementById("att-attended").value);
  const prev     = document.getElementById("att-preview");
  if (!total || isNaN(attended)) { prev.style.display = "none"; return; }
  const pct   = Math.round((attended / total) * 100);
  const risk  = pct >= 80 ? "Safe" : pct >= 65 ? "Warning" : "High Risk";
  prev.style.display = "block";
  document.getElementById("att-pct-num").textContent = pct + "%";
  document.getElementById("att-badge").innerHTML = badgeHTML(risk);
  const alert = document.getElementById("att-alert");
  alert.style.display = pct < 65 ? "block" : "none";
}

async function recordAttendance() {
  const student_id      = document.getElementById("att-student").value;
  const module_code     = document.getElementById("att-module").value;
  const attended_lecture_hours = parseInt(document.getElementById("att-attended").value);
  if (!student_id || !module_code || isNaN(attended_lecture_hours))
    return toast("Fill in all fields", "error");

  const res  = await fetch(`${API}/attendance`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ student_id, module_code, attended_lecture_hours })
  });
  const data = await res.json();
  if (!res.ok) return toast(data.error, "error");
  toast("Attendance saved");
  document.getElementById("att-attended").value = "";
  document.getElementById("att-total").value = "";
  document.getElementById("att-module").value = "";
  document.getElementById("att-student").value = "";
  loadAttendanceTable();
}

// ─────────────────────────────────────────────
// RISK REPORT
// ─────────────────────────────────────────────
async function loadRisk() {
  const res  = await fetch(`${API}/risk`);
  const data = await res.json();
  const tb   = document.getElementById("risk-table");
  if (!data.defaulters.length) {
    tb.innerHTML = `<tr><td colspan="7" class="empty">No data yet.</td></tr>`;
    return;
  }
  tb.innerHTML = data.defaulters.map((s, i) => `
      <tr>
        <td><span class="rank ${i === 0 ? "rank-1" : ""}">#${i + 1}</span></td>
        <td><span class="id-tag">${s.student_id}</span></td>
        <td>${s.name}</td>
        <td><span class="id-tag">${s.module_code || "—"}</span></td>
        <td>${pctBarHTML(s.percentage)}</td>
        <td>${badgeHTML(s.risk)}</td>
        <td style="color:${s.eligible ? "var(--safe)" : "var(--risk)"}; font-size:12px;">
          ${s.eligible ? "✓ Eligible" : "✗ Not Eligible"}
        </td>
      </tr>`).join("");
}

// ─────────────────────────────────────────────
// SEARCH (BST)
// ─────────────────────────────────────────────
async function searchStudent() {
  const id  = document.getElementById("search-id").value.trim();
  if (!id) return toast("Enter a student ID", "error");
  const res = await fetch(`${API}/search/${id}`);
  const el  = document.getElementById("search-result");
  if (!res.ok) {
    el.classList.remove("visible");
    return toast("Student not found", "error");
  }
  const s = await res.json();
  document.getElementById("sr-name").textContent = s.name;
  document.getElementById("sr-id").textContent   = s.student_id;
  const chips = s.attendance.length
    ? s.attendance.map(a => {
        const cls = a.percentage >= 80 ? "safe" : a.percentage >= 65 ? "warning" : "risk";
        return `
          <div class="module-chip">
            <div class="mc-code">${a.module_code}</div>
            <div class="mc-pct" style="color:var(--${cls === 'safe' ? 'safe' : cls === 'warning' ? 'warn' : 'risk'})">${a.percentage}%</div>
            <div style="margin-top:4px">${badgeHTML(a.risk)}</div>
            ${!a.eligible ? `<div style="font-size:11px;color:var(--risk);margin-top:4px;">⚠ Not eligible</div>` : ""}
          </div>`;
      }).join("")
    : `<div style="color:var(--muted);font-size:13px">No attendance recorded for this student.</div>`;
  document.getElementById("sr-modules").innerHTML = chips;
  el.classList.add("visible");
}

// ─────────────────────────────────────────────
// INIT
// ─────────────────────────────────────────────
loadDashboard();