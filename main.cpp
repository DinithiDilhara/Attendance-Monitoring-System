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
    Student* next;
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

void displayStudent(Student* s) {
    cout << "\nStudent ID: " << s->id;
    cout << "\nName: " << s->name;
    cout << "\nSubject: " << s->subject;
    cout << "\nTotal Classes: " << s->totalClasses;
    cout << "\nAttended Classes: " << s->attendedClasses;
    cout << "\nAttendance Percentage: " << s->percentage << "%";
    cout << "\nRisk Level: " << s->riskLevel;

    if (s->percentage < 65) {
        cout << "\nAlert: Student is not eligible for exams.";
    }

    cout << "\n";
}

void addStudent(Student*& head) {
    Student* newStudent = new Student;

    cout << "Enter Student ID: ";
    cin >> newStudent->id;

    cout << "Enter Name: ";
    cin >> newStudent->name;

    cout << "Enter Subject: ";
    cin >> newStudent->subject;

    cout << "Enter Total Classes: ";
    cin >> newStudent->totalClasses;

    cout << "Enter Attended Classes: ";
    cin >> newStudent->attendedClasses;

    newStudent->percentage = calculatePercentage(
        newStudent->attendedClasses,
        newStudent->totalClasses
    );

    newStudent->riskLevel = getRiskLevel(newStudent->percentage);
    newStudent->next = nullptr;

    if (head == nullptr) {
        head = newStudent;
    } else {
        Student* temp = head;
        while (temp->next != nullptr) {
            temp = temp->next;
        }
        temp->next = newStudent;
    }

    cout << "Student added successfully.\n";
}

void displayAllStudents(Student* head) {
    if (head == nullptr) {
        cout << "No student records found.\n";
        return;
    }

    Student* temp = head;
    while (temp != nullptr) {
        displayStudent(temp);
        temp = temp->next;
    }
}

void searchStudent(Student* head) {
    int searchId;
    bool found = false;

    cout << "Enter Student ID to search: ";
    cin >> searchId;

    Student* temp = head;
    while (temp != nullptr) {
        if (temp->id == searchId) {
            displayStudent(temp);
            found = true;
            break;
        }
        temp = temp->next;
    }

    if (!found) {
        cout << "Student not found.\n";
    }
}

int countStudents(Student* head) {
    int count = 0;
    Student* temp = head;

    while (temp != nullptr) {
        count++;
        temp = temp->next;
    }

    return count;
}

void displayDefaulterList(Student* head) {
    int count = countStudents(head);

    if (count == 0) {
        cout << "No student records found.\n";
        return;
    }

    Student* tempStudents[100];
    Student* temp = head;
    int index = 0;

    while (temp != nullptr && index < 100) {
        tempStudents[index] = temp;
        index++;
        temp = temp->next;
    }

    for (int i = 0; i < count - 1; i++) {
        for (int j = 0; j < count - i - 1; j++) {
            if (tempStudents[j]->percentage > tempStudents[j + 1]->percentage) {
                Student* swapTemp = tempStudents[j];
                tempStudents[j] = tempStudents[j + 1];
                tempStudents[j + 1] = swapTemp;
            }
        }
    }

    cout << "\n===== Defaulter List - Lowest Attendance First =====\n\n";

    int limit = count > 5 ? 5 : count;

    for (int i = 0; i < limit; i++) {
        cout << i + 1 << ". ";
        cout << tempStudents[i]->id << " - ";
        cout << tempStudents[i]->name << " - ";
        cout << tempStudents[i]->percentage << "% - ";
        cout << tempStudents[i]->riskLevel << "\n";
    }
}

void deleteMemory(Student*& head) {
    Student* temp;

    while (head != nullptr) {
        temp = head;
        head = head->next;
        delete temp;
    }
}

int main() {
    Student* head = nullptr;
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
            addStudent(head);
        }
        else if (choice == 2) {
            displayAllStudents(head);
        }
        else if (choice == 3) {
            searchStudent(head);
        }
        else if (choice == 4) {
            displayDefaulterList(head);
        }
        else if (choice == 5) {
            cout << "Exiting system.\n";
        }
        else {
            cout << "Invalid choice.\n";
        }

    } while (choice != 5);

    deleteMemory(head);

    return 0;
}