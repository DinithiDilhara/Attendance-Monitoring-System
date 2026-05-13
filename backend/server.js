const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../frontend")));

// In-memory data storage
let moduleIdCounter = 1;
let studentIdCounter = 1;
let attendanceIdCounter = 1;

const modulesStore = [];
const studentsStore = [];
const attendanceStore = [];

class StudentNode {
  constructor(data) {
    this.data = data;
    this.next = null;
  }
}

class LinkedList {
  constructor() {
    this.head = null;
    this.size = 0;
  }

  insert(student) {
    const node = new StudentNode(student);
    if (!this.head) this.head = node;
    else {
      let current = this.head;
      while (current.next) current = current.next;
      current.next = node;
    }
    this.size++;
  }

  toArray() {
    const arr = [];
    let current = this.head;
    while (current) {
      arr.push(current.data);
      current = current.next;
    }
    return arr;
  }
}

class BSTNode {
  constructor(student) {
    this.student = student;
    this.left = null;
    this.right = null;
  }
}

class BST {
  constructor() {
    this.root = null;
  }

  insert(student) {
    const node = new BSTNode(student);
    if (!this.root) {
      this.root = node;
      return;
    }

    let current = this.root;
    while (true) {
      if (student.student_id < current.student.student_id) {
        if (!current.left) {
          current.left = node;
          break;
        }
        current = current.left;
      } else {
        if (!current.right) {
          current.right = node;
          break;
        }
        current = current.right;
      }
    }
  }

  search(studentId) {
    let current = this.root;
    while (current) {
      if (studentId === current.student.student_id) return current.student;
      current = studentId < current.student.student_id ? current.left : current.right;
    }
    return null;
  }
}

class AlertQueue {
  constructor() {
    this.items = [];
  }

  enqueue(student) {
    this.items.push(student);
  }

  dequeue() {
    return this.items.shift();
  }

  isEmpty() {
    return this.items.length === 0;
  }

  processAll() {
    const alerts = [];
    while (!this.isEmpty()) {
      alerts.push(this.dequeue());
    }
    return alerts;
  }
}

function bubbleSort(arr) {
  const sorted = [...arr];

  for (let i = 0; i < sorted.length - 1; i++) {
    for (let j = 0; j < sorted.length - i - 1; j++) {
      if (sorted[j].percentage > sorted[j + 1].percentage) {
        [sorted[j], sorted[j + 1]] = [sorted[j + 1], sorted[j]];
      }
    }
  }

  return sorted;
}

function classifyRisk(percentage) {
  if (percentage >= 80) return "Safe";
  if (percentage >= 65) return "Warning";
  return "High Risk";
}

function buildStructures() {
  const students = studentsStore;
  const attendanceRows = attendanceStore;
  const modules = modulesStore;

  const ll = new LinkedList();
  const bst = new BST();
  const attendanceMap = {};
  const moduleMap = {};

  // Create module map for quick lookup
  for (const module of modules) {
    moduleMap[module.code] = module;
  }

  for (const row of attendanceRows) {
    if (!attendanceMap[row.student_id]) attendanceMap[row.student_id] = [];

    const module = moduleMap[row.module_code];
    const totalHours = module ? module.total_lecture_hours : 0;
    const attendedHours = row.attended_lecture_hours;

    const pct =
      totalHours > 0
        ? Math.round((attendedHours / totalHours) * 100)
        : 0;

    attendanceMap[row.student_id].push({
      module_code: row.module_code,
      total_lecture_hours: totalHours,
      attended_lecture_hours: attendedHours,
      percentage: pct,
      risk: classifyRisk(pct),
      eligible: pct >= 65,
    });
  }

  for (const s of students) {
    const enriched = {
      ...s,
      attendance: attendanceMap[s.student_id] || [],
    };

    ll.insert(enriched);
    bst.insert(enriched);
  }

  return { ll, bst };
}

app.get("/api/modules", (req, res) => {
  const modules = modulesStore.sort((a, b) => a.name.localeCompare(b.name));
  res.json(modules);
});

app.post("/api/modules", (req, res) => {
  const { name, code, total_lecture_hours } = req.body;

  if (!name || !code || total_lecture_hours == null) {
    return res.status(400).json({ error: "Name, code, and total lecture hours required" });
  }

  const codeUpper = code.trim().toUpperCase();
  
  // Check if module code already exists
  if (modulesStore.some(m => m.code === codeUpper)) {
    return res.status(409).json({ error: "Module code already exists" });
  }

  const newModule = {
    id: moduleIdCounter++,
    name: name.trim(),
    code: codeUpper,
    total_lecture_hours: total_lecture_hours,
  };

  modulesStore.push(newModule);

  res.json(newModule);
});

app.delete("/api/modules/:code", (req, res) => {
  const code = req.params.code.toUpperCase();
  
  // Remove module
  const moduleIndex = modulesStore.findIndex(m => m.code === code);
  if (moduleIndex !== -1) {
    modulesStore.splice(moduleIndex, 1);
  }
  
  // Remove related attendance records
  const attendanceIndexes = [];
  for (let i = 0; i < attendanceStore.length; i++) {
    if (attendanceStore[i].module_code === code) {
      attendanceIndexes.push(i);
    }
  }
  for (let i = attendanceIndexes.length - 1; i >= 0; i--) {
    attendanceStore.splice(attendanceIndexes[i], 1);
  }
  
  res.json({ success: true });
});

app.get("/api/students", (req, res) => {
  const { ll } = buildStructures();
  res.json(ll.toArray());
});

app.post("/api/students", (req, res) => {
  const { student_id, name } = req.body;

  if (!student_id || !name) {
    return res.status(400).json({ error: "student_id and name required" });
  }

  const idUpper = student_id.trim().toUpperCase();
  
  // Check if student ID already exists
  if (studentsStore.some(s => s.student_id === idUpper)) {
    return res.status(409).json({ error: "Student ID already exists" });
  }

  const newStudent = {
    id: studentIdCounter++,
    student_id: idUpper,
    name: name.trim(),
  };

  studentsStore.push(newStudent);

  res.json(newStudent);
});

app.delete("/api/students/:student_id", (req, res) => {
  const studentId = req.params.student_id.toUpperCase();
  
  // Remove student
  const studentIndex = studentsStore.findIndex(s => s.student_id === studentId);
  if (studentIndex !== -1) {
    studentsStore.splice(studentIndex, 1);
  }
  
  // Remove related attendance records
  const attendanceIndexes = [];
  for (let i = 0; i < attendanceStore.length; i++) {
    if (attendanceStore[i].student_id === studentId) {
      attendanceIndexes.push(i);
    }
  }
  for (let i = attendanceIndexes.length - 1; i >= 0; i--) {
    attendanceStore.splice(attendanceIndexes[i], 1);
  }
  
  res.json({ success: true });
});

app.post("/api/attendance", (req, res) => {
  const { student_id, module_code, attended_lecture_hours } = req.body;

  if (!student_id || !module_code || attended_lecture_hours == null) {
    return res.status(400).json({ error: "Student ID, module code, and attended hours required" });
  }

  const studentIdUpper = student_id.toUpperCase();
  const moduleCodeUpper = module_code.toUpperCase();

  // Get module to validate attended hours
  const module = modulesStore.find(m => m.code === moduleCodeUpper);
  
  if (!module) {
    return res.status(404).json({ error: "Module not found" });
  }

  if (attended_lecture_hours > module.total_lecture_hours) {
    return res.status(400).json({ error: "Attended hours cannot exceed total lecture hours" });
  }

  // Check if attendance record already exists
  const existingIndex = attendanceStore.findIndex(
    a => a.student_id === studentIdUpper && a.module_code === moduleCodeUpper
  );

  if (existingIndex !== -1) {
    // Update existing record
    attendanceStore[existingIndex].attended_lecture_hours = attended_lecture_hours;
  } else {
    // Create new record
    const newAttendance = {
      id: attendanceIdCounter++,
      student_id: studentIdUpper,
      module_code: moduleCodeUpper,
      attended_lecture_hours: attended_lecture_hours,
    };
    attendanceStore.push(newAttendance);
  }

  res.json({ success: true });
});

app.get("/api/search/:student_id", (req, res) => {
  const { bst } = buildStructures();
  const result = bst.search(req.params.student_id.toUpperCase());

  if (!result) return res.status(404).json({ error: "Student not found" });

  res.json(result);
});

app.get("/api/risk", (req, res) => {
  const { ll } = buildStructures();
  const allStudents = ll.toArray();

  const queue = new AlertQueue();
  const summaries = [];

  for (const student of allStudents) {
    for (const a of student.attendance) {
      const summary = {
        student_id: student.student_id,
        name: student.name,
        module_code: a.module_code,
        percentage: a.percentage,
        risk: a.risk,
        eligible: a.eligible,
        total_lecture_hours: a.total_lecture_hours,
        attended_lecture_hours: a.attended_lecture_hours,
      };

      summaries.push(summary);

      if (a.risk === "High Risk") {
        queue.enqueue(summary);
      }
    }
  }

  const sorted = bubbleSort(summaries);
  const alerts = queue.processAll();

  res.json({
    defaulters: sorted,
    alerts,
    stats: {
      total: summaries.length,
      safe: summaries.filter((s) => s.risk === "Safe").length,
      warning: summaries.filter((s) => s.risk === "Warning").length,
      highRisk: summaries.filter((s) => s.risk === "High Risk").length,
    },
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`\n🎓 Laptop: http://localhost:${PORT}`);
  console.log(`📱 Tablet: http://192.168.23.172:${PORT}`);
  console.log(`� Storage: In-Memory (Temporary)`);
  console.log(`⚠️  Data will be cleared when project closes\n`);
  console.log(`📡 API base: http://192.168.23.172:${PORT}/api\n`);
});