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

app.get("/", (req, res) => {
  res.send("Attendance backend is running");
});

app.post("/add-student", (req, res) => {
  const { id, name, subject, totalClasses, attendedClasses } = req.body;

  const percentage = calculatePercentage(attendedClasses, totalClasses);
  const riskLevel = getRiskLevel(percentage);

  const student = {
    id: String(id),
    name,
    subject,
    totalClasses,
    attendedClasses,
    percentage,
    riskLevel
  };

  students.push(student);

  res.json({ message: "Student added successfully", student });
});

app.get("/students", (req, res) => {
  res.json(students);
});

app.get("/defaulters", (req, res) => {
  const sortedStudents = [...students].sort((a, b) => a.percentage - b.percentage);
  res.json(sortedStudents.slice(0, 5));
});

app.get("/alerts", (req, res) => {
  const alerts = students.filter(student => student.percentage < 65);
  res.json(alerts);
});

app.delete("/delete-student/:id", (req, res) => {
  const id = String(req.params.id);

  students = students.filter(student => String(student.id) !== id);

  res.json({ message: "Student deleted successfully", deletedId: id });
});

app.listen(8080, () => {
  console.log("Node backend running at http://localhost:8080");
});