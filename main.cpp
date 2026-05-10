#include <iostream>
#include <string>
#include <queue>
using namespace std;

// ─────────────────────────────────────────────
// STRUCT: matches backend attendance record
// one record = one student + one module
// ─────────────────────────────────────────────
struct AttendanceRecord {
    string studentId;
    string name;
    string moduleCode;
    int totalClasses;
    int attendedClasses;
    float percentage;
    string riskLevel;
    bool eligible;
    AttendanceRecord* next; // for Linked List
};

// ─────────────────────────────────────────────
// STRUCT: BST Node — searches by studentId
// ─────────────────────────────────────────────
struct TreeNode {
    AttendanceRecord* record;
    TreeNode* left;
    TreeNode* right;
};

// ─────────────────────────────────────────────
// HELPER FUNCTIONS
// ─────────────────────────────────────────────
float calculatePercentage(int attended, int total) {
    if (total <= 0) return 0;
    return (attended * 100.0f) / total;
}

string getRiskLevel(float percentage) {
    if (percentage >= 80) return "Safe";
    if (percentage >= 65) return "Warning";
    return "High Risk";
}

bool isEligible(float percentage) {
    return percentage >= 65;
}

void displayRecord(AttendanceRecord* r) {
    cout << "\n------------------------------------------";
    cout << "\nStudent ID : " << r->studentId;
    cout << "\nName       : " << r->name;
    cout << "\nModule     : " << r->moduleCode;
    cout << "\nTotal      : " << r->totalClasses;
    cout << "\nAttended   : " << r->attendedClasses;
    cout << "\nPercentage : " << r->percentage << "%";
    cout << "\nRisk Level : " << r->riskLevel;
    cout << "\nEligible   : " << (r->eligible ? "Yes" : "No");
    if (!r->eligible) {
        cout << "\nAlert      : Student is not eligible for exams.";
    }
    cout << "\n";
}

// ─────────────────────────────────────────────
// DSA 1: LINKED LIST — stores all records
// ─────────────────────────────────────────────
void insertLinkedList(AttendanceRecord*& head, AttendanceRecord* record) {
    record->next = nullptr;
    if (head == nullptr) {
        head = record;
    } else {
        AttendanceRecord* temp = head;
        while (temp->next != nullptr) temp = temp->next;
        temp->next = record;
    }
}

void displayAllRecords(AttendanceRecord* head) {
    if (head == nullptr) {
        cout << "\nNo records found.\n";
        return;
    }
    AttendanceRecord* temp = head;
    while (temp != nullptr) {
        displayRecord(temp);
        temp = temp->next;
    }
}

int countRecords(AttendanceRecord* head) {
    int count = 0;
    AttendanceRecord* temp = head;
    while (temp != nullptr) { count++; temp = temp->next; }
    return count;
}

// ─────────────────────────────────────────────
// DSA 2: BST — search by studentId (string compare)
// ─────────────────────────────────────────────
TreeNode* insertBST(TreeNode* root, AttendanceRecord* record) {
    if (root == nullptr) {
        TreeNode* node = new TreeNode;
        node->record = record;
        node->left   = nullptr;
        node->right  = nullptr;
        return node;
    }
    if (record->studentId < root->record->studentId)
        root->left  = insertBST(root->left,  record);
    else if (record->studentId > root->record->studentId)
        root->right = insertBST(root->right, record);
    return root;
}

AttendanceRecord* searchBST(TreeNode* root, string studentId) {
    if (root == nullptr) return nullptr;
    if (studentId == root->record->studentId) return root->record;
    if (studentId <  root->record->studentId) return searchBST(root->left,  studentId);
    return searchBST(root->right, studentId);
}

// ─────────────────────────────────────────────
// DSA 3: QUEUE — high-risk alert queue (FIFO)
// ─────────────────────────────────────────────
void processAlertQueue(queue<AttendanceRecord*>& alertQueue) {
    if (alertQueue.empty()) {
        cout << "\nNo high-risk alerts.\n";
        return;
    }
    cout << "\n===== High Risk Alert Queue (FIFO) =====\n";
    while (!alertQueue.empty()) {
        AttendanceRecord* r = alertQueue.front();
        cout << "\nStudent ID : " << r->studentId;
        cout << "\nName       : " << r->name;
        cout << "\nModule     : " << r->moduleCode;
        cout << "\nAttendance : " << r->percentage << "%";
        cout << "\nAlert      : Student is not eligible for exams.\n";
        alertQueue.pop();
    }
}

// ─────────────────────────────────────────────
// DSA 4: BUBBLE SORT — sort defaulter list
// ─────────────────────────────────────────────
void displayDefaulterList(AttendanceRecord* head) {
    int count = countRecords(head);
    if (count == 0) {
        cout << "\nNo records found.\n";
        return;
    }

    // Copy pointers into array
    AttendanceRecord* arr[500];
    AttendanceRecord* temp = head;
    int index = 0;
    while (temp != nullptr && index < 500) {
        arr[index++] = temp;
        temp = temp->next;
    }

    // Bubble sort — lowest percentage first
    for (int i = 0; i < index - 1; i++) {
        for (int j = 0; j < index - i - 1; j++) {
            if (arr[j]->percentage > arr[j + 1]->percentage) {
                AttendanceRecord* swap = arr[j];
                arr[j]     = arr[j + 1];
                arr[j + 1] = swap;
            }
        }
    }

    cout << "\n===== Defaulter List - Lowest Attendance First =====\n";
    int limit = index > 5 ? 5 : index;
    for (int i = 0; i < limit; i++) {
        cout << "\n" << (i + 1) << ". "
             << arr[i]->studentId << " | "
             << arr[i]->name      << " | "
             << arr[i]->moduleCode << " | "
             << arr[i]->percentage << "% | "
             << arr[i]->riskLevel;
    }
    cout << "\n";
}

// ─────────────────────────────────────────────
// ADD RECORD — insert into LL, BST, Queue
// ─────────────────────────────────────────────
void addRecord(AttendanceRecord*& head, TreeNode*& root, queue<AttendanceRecord*>& alertQueue) {
    AttendanceRecord* r = new AttendanceRecord;

    cout << "\nEnter Student ID   : ";
    cin >> r->studentId;

    // BST duplicate check (same student+module combo)
    AttendanceRecord* existing = searchBST(root, r->studentId);
    if (existing != nullptr) {
        cout << "Student ID " << r->studentId << " already exists.\n";
        delete r;
        return;
    }

    cout << "Enter Name         : ";
    cin.ignore();
    getline(cin, r->name);

    cout << "Enter Module Code  : ";
    cin >> r->moduleCode;

    cout << "Enter Total Classes: ";
    cin >> r->totalClasses;

    cout << "Enter Attended     : ";
    cin >> r->attendedClasses;

    if (r->attendedClasses > r->totalClasses) {
        cout << "Error: Attended cannot exceed total classes.\n";
        delete r;
        return;
    }

    r->percentage = calculatePercentage(r->attendedClasses, r->totalClasses);
    r->riskLevel  = getRiskLevel(r->percentage);
    r->eligible   = isEligible(r->percentage);
    r->next       = nullptr;

    // DSA 1: Insert into Linked List
    insertLinkedList(head, r);

    // DSA 2: Insert into BST
    root = insertBST(root, r);

    // DSA 3: Enqueue if High Risk
    if (!r->eligible) {
        alertQueue.push(r);
        cout << "Warning: Student is not eligible for exams.\n";
    }

    cout << "Record added successfully. Risk Level: " << r->riskLevel << "\n";
}

// ─────────────────────────────────────────────
// SEARCH by Student ID (BST)
// ─────────────────────────────────────────────
void searchRecord(TreeNode* root) {
    string searchId;
    cout << "\nEnter Student ID to search: ";
    cin >> searchId;

    AttendanceRecord* result = searchBST(root, searchId);
    if (result != nullptr) {
        displayRecord(result);
    } else {
        cout << "Student not found.\n";
    }
}

// ─────────────────────────────────────────────
// STATS — matches dashboard
// ─────────────────────────────────────────────
void displayStats(AttendanceRecord* head) {
    int total = 0, safe = 0, warning = 0, highRisk = 0;
    AttendanceRecord* temp = head;
    while (temp != nullptr) {
        total++;
        if (temp->riskLevel == "Safe")        safe++;
        else if (temp->riskLevel == "Warning") warning++;
        else                                   highRisk++;
        temp = temp->next;
    }
    cout << "\n===== Dashboard Stats =====";
    cout << "\nTotal Students : " << total;
    cout << "\nSafe (>=80%)   : " << safe;
    cout << "\nWarning (65-79%): " << warning;
    cout << "\nHigh Risk (<65%): " << highRisk << "\n";
}

// ─────────────────────────────────────────────
// CLEANUP
// ─────────────────────────────────────────────
void deleteLinkedList(AttendanceRecord*& head) {
    AttendanceRecord* temp;
    while (head != nullptr) {
        temp = head;
        head = head->next;
        delete temp;
    }
}

void deleteBST(TreeNode*& root) {
    if (root == nullptr) return;
    deleteBST(root->left);
    deleteBST(root->right);
    delete root;
    root = nullptr;
}

// ─────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────
int main() {
    AttendanceRecord* head = nullptr;
    TreeNode* root         = nullptr;
    queue<AttendanceRecord*> alertQueue;
    int choice;

    cout << "============================================\n";
    cout << " Intelligent Attendance Monitoring System  \n";
    cout << "============================================\n";

    do {
        cout << "\n===== MENU =====\n";
        cout << "1. Add Student Record\n";
        cout << "2. Display All Records (Linked List)\n";
        cout << "3. Search Student by ID (BST)\n";
        cout << "4. Display Defaulter List (Bubble Sort)\n";
        cout << "5. Process Alert Queue (Queue FIFO)\n";
        cout << "6. Dashboard Stats\n";
        cout << "7. Exit\n";
        cout << "Enter choice: ";

        if (!(cin >> choice)) {
            cin.clear();
            cin.ignore(1000, '\n');
            cout << "Invalid input.\n";
            continue;
        }

        switch (choice) {
            case 1: addRecord(head, root, alertQueue);   break;
            case 2: displayAllRecords(head);             break;
            case 3: searchRecord(root);                  break;
            case 4: displayDefaulterList(head);          break;
            case 5: processAlertQueue(alertQueue);       break;
            case 6: displayStats(head);                  break;
            case 7: cout << "Exiting system.\n";         break;
            default: cout << "Invalid choice.\n";
        }

    } while (choice != 7);

    deleteBST(root);
    deleteLinkedList(head);

    return 0;
}