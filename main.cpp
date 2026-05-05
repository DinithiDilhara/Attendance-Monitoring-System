#include <iostream>
#include <string>
using namespace std;

struct Student {
    int id;
    string name;
    string subject;
    int totalClasses;
    int attendedClasses;
    float percentage;
    string riskLevel;
};

float calculatePercentage(int attended, int total) {
    if (total <= 0) return 0;
    return (attended * 100.0) / total;
}

string getRiskLevel(float percentage) {
    if (percentage >= 80) return "Safe";
    if (percentage >= 65) return "Warning";
    return "High Risk";
}

void displayStudent(Student s) {
    cout << "\nStudent ID: " << s.id;
    cout << "\nName: " << s.name;
    cout << "\nSubject: " << s.subject;
    cout << "\nTotal Classes: " << s.totalClasses;
    cout << "\nAttended Classes: " << s.attendedClasses;
    cout << "\nAttendance Percentage: " << s.percentage << "%";
    cout << "\nRisk Level: " << s.riskLevel;

    if (s.percentage < 65) {
        cout << "\nAlert: Student is not eligible for exams.";
    }

    cout << "\n";
}

void displayDefaulterList(Student students[], int count) {
    if (count == 0) {
        cout << "No student records found.\n";
        return;
    }

    Student tempStudents[100];

    for (int i = 0; i < count; i++) {
        tempStudents[i] = students[i];
    }

    for (int i = 0; i < count - 1; i++) {
        for (int j = 0; j < count - i - 1; j++) {
            if (tempStudents[j].percentage > tempStudents[j + 1].percentage) {
                Student temp = tempStudents[j];
                tempStudents[j] = tempStudents[j + 1];
                tempStudents[j + 1] = temp;
            }
        }
    }

    cout << "\n===== Defaulter List - Lowest Attendance First =====\n";

    int limit = count > 5 ? 5 : count;

    for (int i = 0; i < limit; i++) {
        cout << i + 1 << ". ";
        cout << tempStudents[i].id << " - ";
        cout << tempStudents[i].name << " - ";
        cout << tempStudents[i].percentage << "% - ";
        cout << tempStudents[i].riskLevel << "\n";
    }
}

int main() {
    Student students[100];
    int count = 0;
    int choice;

    do {
        cout << "\n===== Attendance Monitoring System =====\n";
        cout << "1. Add Student\n";
        cout << "2. Display All Students\n";
        cout << "3. Search Student by ID\n";
        cout << "4. Display Defaulter List\n";
        cout << "5. Exit\n";
        cout << "Enter your choice: ";

        if (!(cin >> choice)) {
            cin.clear();
            cin.ignore(1000, '\n');
            cout << "Invalid input. Please enter a number.\n";
            continue;
        }

        if (choice == 1) {
            if (count >= 100) {
                cout << "Student limit reached.\n";
                continue;
            }

            cout << "Enter Student ID: ";
            cin >> students[count].id;

            cout << "Enter Name: ";
            cin >> students[count].name;

            cout << "Enter Subject: ";
            cin >> students[count].subject;

            cout << "Enter Total Classes: ";
            cin >> students[count].totalClasses;

            cout << "Enter Attended Classes: ";
            cin >> students[count].attendedClasses;

            students[count].percentage = calculatePercentage(
                students[count].attendedClasses,
                students[count].totalClasses
            );

            students[count].riskLevel = getRiskLevel(students[count].percentage);

            count++;
            cout << "Student added successfully.\n";
        }
        else if (choice == 2) {
            if (count == 0) {
                cout << "No student records found.\n";
            } else {
                for (int i = 0; i < count; i++) {
                    displayStudent(students[i]);
                }
            }
        }
        else if (choice == 3) {
            int searchId;
            bool found = false;

            cout << "Enter Student ID to search: ";
            cin >> searchId;

            for (int i = 0; i < count; i++) {
                if (students[i].id == searchId) {
                    displayStudent(students[i]);
                    found = true;
                    break;
                }
            }

            if (!found) {
                cout << "Student not found.\n";
            }
        }
        else if (choice == 4) {
            displayDefaulterList(students, count);
        }
        else if (choice == 5) {
            cout << "Exiting system.\n";
        }
        else {
            cout << "Invalid choice.\n";
        }

    } while (choice != 5);

    return 0;
}