const apiBaseUrl = 'https://api.example.com'; // Replace with your actual API base URL

async function fetchStudents() {
    try {
        const response = await fetch(`${apiBaseUrl}/students`);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const students = await response.json();
        return students;
    } catch (error) {
        console.error('Error fetching students:', error);
        throw error;
    }
}

async function fetchTeachers() {
    try {
        const response = await fetch(`${apiBaseUrl}/teachers`);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const teachers = await response.json();
        return teachers;
    } catch (error) {
        console.error('Error fetching teachers:', error);
        throw error;
    }
}

async function addStudent(studentData) {
    try {
        const response = await fetch(`${apiBaseUrl}/students`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(studentData),
        });
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const newStudent = await response.json();
        return newStudent;
    } catch (error) {
        console.error('Error adding student:', error);
        throw error;
    }
}

async function updateStudent(studentId, studentData) {
    try {
        const response = await fetch(`${apiBaseUrl}/students/${studentId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(studentData),
        });
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const updatedStudent = await response.json();
        return updatedStudent;
    } catch (error) {
        console.error('Error updating student:', error);
        throw error;
    }
}

async function deleteStudent(studentId) {
    try {
        const response = await fetch(`${apiBaseUrl}/students/${studentId}`, {
            method: 'DELETE',
        });
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return true;
    } catch (error) {
        console.error('Error deleting student:', error);
        throw error;
    }
}

// Simple DB helpers attached to window for other scripts to use.
(function () {
  const DB_KEY = 'bsta_db';
  const SESSION_KEY = 'bsta_user';

  function init() {
    if (localStorage.getItem(DB_KEY)) return;
    const db = { users: [], classes: [], assessments: [] };
    // sample professor for testing
    db.users.push({
      id: 'prof-1',
      role: 'professor',
      username: 'profjohn',
      password: 'password',
      surname: 'Doe',
      givenName: 'John',
      middleInitial: 'A',
      email: 'john.doe@bsta.edu',
      contact: '09171234567',
      profilePic: ''
    });
    localStorage.setItem(DB_KEY, JSON.stringify(db));
  }

  function loadDB() {
    return JSON.parse(localStorage.getItem(DB_KEY) || '{ "users": [], "classes": [], "assessments": [] }');
  }

  function saveDB(db) {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
  }

  function getSessionUser() {
    try { return JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null'); } catch { return null; }
  }

  function setSessionUser(user) {
    if (!user) sessionStorage.removeItem(SESSION_KEY);
    else sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
  }

  window.BSTA = {
    init,
    loadDB,
    saveDB,
    getSessionUser,
    setSessionUser,
    DB_KEY,
    SESSION_KEY
  };

  init();
})();