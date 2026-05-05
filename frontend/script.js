const API_URL = "http://localhost:8080";

async function addStudent() {
  const student = {
    id: document.getElementById("id").value,
    name: document.getElementById("name").value,
    subject: document.getElementById("subject").value,
    totalClasses: Number(document.getElementById("total").value),
    attendedClasses: Number(document.getElementById("attended").value)
  };
  await fetch(`${API_URL}/add-student`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(student)
  });
  clearInputs();
  loadStudents();
}

async function loadStudents() {
  const response = await fetch(`${API_URL}/students`);
  const students = await response.json();
  const table = document.getElementById("studentTable");
  table.innerHTML = "";
  students.forEach(student => {
    table.innerHTML += `
      <tr>
        <td>${student.id}</td>
        <td>${student.name}</td>
        <td>${student.subject}</td>
        <td>${student.percentage.toFixed(2)}%</td>
        <td>${student.riskLevel}</td>
        <td><button onclick="deleteStudent('${student.id}')">Delete</button></td>
      </tr>
    `;
  });
}

async function deleteStudent(id) {
  await fetch(`${API_URL}/delete-student/${id}`, { method: "DELETE" });
  loadStudents();
}

async function showDefaulters() {
  const response = await fetch(`${API_URL}/defaulters`);
  const students = await response.json();
  let output = "<b>Defaulter List - Lowest Attendance First</b><br><br>";
  students.forEach((student, index) => {
    output += `${index + 1}. ${student.id} - ${student.name} - ${student.percentage.toFixed(2)}% - ${student.riskLevel}<br>`;
  });
  document.getElementById("output").innerHTML = output;
}

async function processAlerts() {
  const response = await fetch(`${API_URL}/alerts`);
  const alerts = await response.json();
  let output = "<b>High Risk Student Alert Queue</b><br><br>";
  if (alerts.length === 0) {
    output += "No high-risk student alerts found.";
  } else {
    alerts.forEach(student => {
      output += `Alert for ${student.name}: Student is not eligible for exams.<br>`;
    });
  }
  document.getElementById("output").innerHTML = output;
}

function clearInputs() {
  document.getElementById("id").value = "";
  document.getElementById("name").value = "";
  document.getElementById("subject").value = "";
  document.getElementById("total").value = "";
  document.getElementById("attended").value = "";
}

loadStudents();