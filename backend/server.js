const express = require("express");
const cors = require("cors");
const app = express();
app.use(cors());
app.use(express.json());

let students = [];

function calculatePercentage(attended, total) {
  if (total <= 0) return 0;
  return (attended / total) * 100;
}

function getRiskLevel(percentage) {
  if (percentage >= 80) return "Safe";
  if (percentage >= 65) return "Warning";
  return "High Risk";
}

app.post("/add-student", (req, res) => {
  const { id, name, subject, totalClasses, attendedClasses } = req.body;
  const percentage = calculatePercentage(attendedClasses, totalClasses);
  const riskLevel = getRiskLevel(percentage);
  const student = { id, name, subject, totalClasses, attendedClasses, percentage, riskLevel };
  students.push(student);
  res.json({ message: "Student added successfully", student });
});

app.get("/students", (req, res) => {
  res.json(students);
});

app.get("/search/:id", (req, res) => {
  const student = students.find(s => String(s.id) === String(req.params.id));
  if (!student) return res.status(404).json({ message: "Student not found" });
  res.json(student);
});

app.get("/defaulters", (req, res) => {
  const sorted = [...students].sort((a, b) => a.percentage - b.percentage);
  res.json(sorted.slice(0, 5));
});

app.get("/alerts", (req, res) => {
  res.json(students.filter(s => s.riskLevel === "High Risk"));
});

app.delete("/delete-student/:id", (req, res) => {
  const index = students.findIndex(s => String(s.id) === String(req.params.id));
  if (index === -1) return res.status(404).json({ message: "Student not found" });
  students.splice(index, 1);
  res.json({ message: "Student deleted successfully" });
});

app.listen(8080, () => {
  console.log("Server running at http://localhost:8080");
});