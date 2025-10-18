/* Client-only auth + registration (localStorage). Connects login -> dashboards.
   Save this file and reload login.html / register.html. */
(() => {
  const DB_KEY = 'bsta_db';
  const USER_SESSION = 'bsta_user';

  function initDB() {
    if (localStorage.getItem(DB_KEY)) return;
    const db = {
      users: [
        // sample professor (use to test login)
        {
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
        }
      ],
      classes: [],
      assessments: []
    };
    localStorage.setItem(DB_KEY, JSON.stringify(db));
  }

  function loadDB() {
    return JSON.parse(localStorage.getItem(DB_KEY) || '{ "users": [], "classes": [], "assessments": [] }');
  }
  function saveDB(db) {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
  }

  function nextStudentNumber(db) {
    const prefix = 'UA2025';
    const nums = db.users
      .filter(u => u.studentNumber && u.studentNumber.startsWith(prefix))
      .map(u => parseInt(u.studentNumber.slice(prefix.length), 10) || 0);
    const next = nums.length ? Math.max(...nums) + 1 : 1;
    return prefix + String(next).padStart(5, '0');
  }

  function $(id) { return document.getElementById(id); }

  document.addEventListener('DOMContentLoaded', () => {
    initDB();

    // REGISTER handler
    const regForm = $('registerForm');
    if (regForm) {
      regForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const db = loadDB();

        const role = $('roleSelect')?.value || 'student';
        const username = ($('usernameR')?.value || '').trim();
        if (!username) { alert('Enter username'); return; }
        if (db.users.some(u => u.username === username)) { alert('Username already exists'); return; }

        const user = {
          id: (role === 'student' ? 'stud-' : 'prof-') + Date.now(),
          role,
          username,
          password: $('passwordR')?.value || '',
          surname: ($('surname')?.value || '').trim(),
          givenName: ($('givenName')?.value || '').trim(),
          middleInitial: ($('middleInitial')?.value || '').trim(),
          email: ($('email')?.value || '').trim(),
          contact: ($('contact')?.value || '').trim(),
          profilePic: ''
        };

        if (role === 'student') {
          user.studentNumber = nextStudentNumber(db);
        }

        db.users.push(user);
        saveDB(db);

        if (role === 'student') {
          alert(`Account created. Your Student Number: ${user.studentNumber}`);
        } else {
          alert('Professor account created.');
        }
        location.href = 'login.html';
      });
    }

    // LOGIN handler
    const loginForm = $('loginForm');
    if (loginForm) {
      loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const role = $('role')?.value || 'student';
        const username = ($('username')?.value || '').trim();
        const password = $('password')?.value || '';
        if (!username || !password) { alert('Enter username and password'); return; }

        const db = loadDB();
        const user = db.users.find(u => u.username === username && u.password === password && u.role === role);
        if (!user) { alert('Invalid credentials or role'); return; }

        // Save lightweight session object (avoid storing all DB references)
        const sessionUser = {
          id: user.id,
          role: user.role,
          username: user.username,
          surname: user.surname,
          givenName: user.givenName,
          middleInitial: user.middleInitial,
          studentNumber: user.studentNumber,
          email: user.email,
          contact: user.contact,
          profilePic: user.profilePic
        };
        sessionStorage.setItem(USER_SESSION, JSON.stringify(sessionUser));

        if (user.role === 'professor') {
          location.href = 'professor-dashboard.html';
        } else {
          location.href = 'student-dashboard.html';
        }
      });
    }

    // If pages include quick role switch UI or other JS, this file only handles register/login.
  });
})();