const express = require("express");
const Database = require("better-sqlite3");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../frontend")));

const db = new Database(path.join(__dirname, "attendance.db"));

db.exec(`
  CREATE TABLE IF NOT EXISTS modules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE
  );

  CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS attendance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id TEXT NOT NULL,
    module_code TEXT NOT NULL,
    total_classes INTEGER NOT NULL DEFAULT 0,
    attended_classes INTEGER NOT NULL DEFAULT 0,
    UNIQUE(student_id, module_code)
  );
`);

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
  const students = db.prepare("SELECT * FROM students").all();
  const attendanceRows = db.prepare("SELECT * FROM attendance").all();

  const ll = new LinkedList();
  const bst = new BST();
  const attendanceMap = {};

  for (const row of attendanceRows) {
    if (!attendanceMap[row.student_id]) attendanceMap[row.student_id] = [];

    const pct =
      row.total_classes > 0
        ? Math.round((row.attended_classes / row.total_classes) * 100)
        : 0;

    attendanceMap[row.student_id].push({
      module_code: row.module_code,
      total_classes: row.total_classes,
      attended_classes: row.attended_classes,
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
  const modules = db.prepare("SELECT * FROM modules ORDER BY name").all();
  res.json(modules);
});

app.post("/api/modules", (req, res) => {
  const { name, code } = req.body;

  if (!name || !code) {
    return res.status(400).json({ error: "Name and code required" });
  }

  try {
    const stmt = db.prepare("INSERT INTO modules (name, code) VALUES (?, ?)");
    const result = stmt.run(name.trim(), code.trim().toUpperCase());

    res.json({
      id: result.lastInsertRowid,
      name: name.trim(),
      code: code.trim().toUpperCase(),
    });
  } catch (e) {
    res.status(409).json({ error: "Module code already exists" });
  }
});

app.delete("/api/modules/:code", (req, res) => {
  db.prepare("DELETE FROM attendance WHERE module_code = ?").run(req.params.code);
  db.prepare("DELETE FROM modules WHERE code = ?").run(req.params.code);
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

  try {
    const stmt = db.prepare("INSERT INTO students (student_id, name) VALUES (?, ?)");
    const result = stmt.run(student_id.trim().toUpperCase(), name.trim());

    res.json({
      id: result.lastInsertRowid,
      student_id: student_id.trim().toUpperCase(),
      name: name.trim(),
    });
  } catch (e) {
    res.status(409).json({ error: "Student ID already exists" });
  }
});

app.delete("/api/students/:student_id", (req, res) => {
  db.prepare("DELETE FROM attendance WHERE student_id = ?").run(req.params.student_id);
  db.prepare("DELETE FROM students WHERE student_id = ?").run(req.params.student_id);
  res.json({ success: true });
});

app.post("/api/attendance", (req, res) => {
  const { student_id, module_code, total_classes, attended_classes } = req.body;

  if (!student_id || !module_code || total_classes == null || attended_classes == null) {
    return res.status(400).json({ error: "All fields required" });
  }

  if (attended_classes > total_classes) {
    return res.status(400).json({ error: "Attended cannot exceed total classes" });
  }

  const stmt = db.prepare(`
    INSERT INTO attendance (student_id, module_code, total_classes, attended_classes)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(student_id, module_code) DO UPDATE SET
      total_classes = excluded.total_classes,
      attended_classes = excluded.attended_classes
  `);

  stmt.run(
    student_id.toUpperCase(),
    module_code.toUpperCase(),
    total_classes,
    attended_classes
  );

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
        total_classes: a.total_classes,
        attended_classes: a.attended_classes,
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
  console.log(`📦 Database: attendance.db`);
  console.log(`📡 API base: http://192.168.23.172:${PORT}/api\n`);
});