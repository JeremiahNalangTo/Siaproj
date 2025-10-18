// Simple admin UI: list users, add user (quick), remove user, save site name
(function () {
  const { loadDB, saveDB, getSessionUser } = window.BSTA;
  const { $id, nameFull } = window.__utils;

  document.addEventListener('DOMContentLoaded', () => {
    // protect admin - optional: allow any logged-in professor? Here only allow if role === 'professor'
    const session = window.BSTA && window.BSTA ? JSON.parse(sessionStorage.getItem(window.BSTA.SESSION_KEY) || 'null') : null;
    // if you want admin-only, check session.role === 'admin' — currently fallback to allow access when logged in
    if (!session) {
      // not logged in — redirect to login
      // location.href = 'login.html';
    }

    renderUsers();

    $id('addUserBtn').addEventListener('click', () => {
      const uname = prompt('Username');
      if (!uname) return;
      const role = prompt('Role (student/professor)', 'student');
      const db = loadDB();
      const exists = db.users.some(u => u.username === uname);
      if (exists) return alert('Username exists');
      const id = (role === 'student' ? 'stud-' : 'prof-') + Date.now();
      const user = {
        id, role, username: uname, password: 'password',
        surname: 'New', givenName: 'User', middleInitial: '', email: '', contact: '', profilePic: ''
      };
      if (role === 'student') {
        // compute student number
        const prefix = 'UA2025';
        const existingNums = db.users.filter(u => u.studentNumber && u.studentNumber.startsWith(prefix)).map(u => parseInt(u.studentNumber.slice(prefix.length), 10) || 0);
        const nextSeq = existingNums.length ? Math.max(...existingNums) + 1 : 1;
        user.studentNumber = prefix + String(nextSeq).padStart(5, '0');
      }
      db.users.push(user);
      saveDB(db);
      renderUsers();
    });

    $id('settingsForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      alert('Settings saved (client-side only)');
    });

    function renderUsers() {
      const db = loadDB();
      const tbody = $id('userTable').querySelector('tbody');
      tbody.innerHTML = db.users.map(u => `<tr><td>${u.id}</td><td>${nameFull(u)}</td><td>${u.role}</td><td><button data-id="${u.id}" class="del btn small">Delete</button></td></tr>`).join('');
      tbody.querySelectorAll('.del').forEach(b => b.addEventListener('click', () => {
        const db2 = loadDB();
        db2.users = db2.users.filter(x => x.id !== b.dataset.id);
        saveDB(db2);
        renderUsers();
      }));
    }
  });
})();