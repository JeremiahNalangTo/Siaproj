// Attach this file to professor-dashboard.html and student-dashboard.html (already present)
(function () {
  const { loadDB, saveDB, getSessionUser, setSessionUser } = window.BSTA;
  const { $id, nameFull } = window.__utils;

  document.addEventListener('DOMContentLoaded', () => {
    const user = getSessionUser();
    if (!user) { location.href = 'login.html'; return; }

    // common elements present in both dashboards
    const logoutBtn = document.getElementById('logoutBtn');
    const panel = document.getElementById('panel');

    if (logoutBtn) logoutBtn.addEventListener('click', () => { setSessionUser(null); location.href = 'login.html'; });

    // sidebar links
    document.querySelectorAll('.sidebar a').forEach(a => {
      a.addEventListener('click', (e) => {
        e.preventDefault();
        const view = a.dataset.view;
        renderView(view);
      });
    });

    // initial view
    renderView('profile');

    function renderView(view) {
      const db = loadDB();
      if (user.role === 'professor') renderProfessor(view, db);
      else renderStudent(view, db);
    }

    /* ---------- Professor ---------- */
    function renderProfessor(view, db) {
      if (view === 'profile') {
        panel.innerHTML = `
          <h3>Profile</h3>
          <div class="card">
            <div style="display:flex;gap:12px;align-items:center">
              <img id="pfpic" src="${user.profilePic || 'assets/images/logo.png'}" style="height:88px;width:88px;border-radius:8px;object-fit:cover">
              <div>
                <div><strong>${nameFull(user)}</strong></div>
                <div class="small">${user.email || ''} • ${user.contact || ''}</div>
                <div style="margin-top:8px"><button id="editProfile" class="btn secondary">Edit profile</button></div>
              </div>
            </div>
          </div>`;
        $id('editProfile').addEventListener('click', () => showProfileEditor(db));
      }

      if (view === 'classes') {
        const my = db.classes.filter(c => c.professorId === user.id);
        panel.innerHTML = `
          <h3>My Classes</h3>
          <div class="card"><button id="createClass" class="btn">Create class</button></div>
          <div class="card"><table class="table"><thead><tr><th>Code</th><th>Title</th><th>Students</th><th>Actions</th></tr></thead>
            <tbody>${my.map(c => `<tr><td>${c.code}</td><td>${c.title}</td><td>${(c.students||[]).length}</td>
              <td><button data-id="${c.id}" class="btn small viewClass">View</button></td></tr>`).join('') || '<tr><td colspan="4">No classes</td></tr>'}
            </tbody></table></div>`;
        $id('createClass').addEventListener('click', () => {
          const code = prompt('Class code (e.g. IT101)');
          if (!code) return;
          const title = prompt('Class title');
          if (!title) return;
          const id = 'class-' + Date.now();
          db.classes.push({ id, code, title, professorId: user.id, students: [], requests: [] });
          saveDB(db);
          renderView('classes');
        });
        document.querySelectorAll('.viewClass').forEach(b => b.addEventListener('click', () => {
          const cls = db.classes.find(x => x.id === b.dataset.id);
          showClassDetails(cls, db);
        }));
      }

      if (view === 'requests') {
        // collect requests across professor classes
        const my = db.classes.filter(c => c.professorId === user.id);
        let rows = '';
        my.forEach(c => {
          (c.requests || []).forEach(uid => {
            const u = db.users.find(x => x.id === uid);
            if (!u) return;
            rows += `<tr><td>${c.code}</td><td>${c.title}</td><td>${nameFull(u)}</td>
              <td><button data-class="${c.id}" data-user="${u.id}" class="btn small approve">Approve</button>
                  <button data-class="${c.id}" data-user="${u.id}" class="btn small secondary reject">Reject</button></td></tr>`;
          });
        });
        panel.innerHTML = `<h3>Enrollment Requests</h3><div class="card"><table class="table"><thead><tr><th>Class</th><th>Title</th><th>Student</th><th>Action</th></tr></thead><tbody>${rows || '<tr><td colspan="4">No requests</td></tr>'}</tbody></table></div>`;
        document.querySelectorAll('.approve').forEach(b => b.addEventListener('click', () => {
          const cid = b.dataset.class; const uid = b.dataset.user;
          const db2 = loadDB(); const cls = db2.classes.find(x => x.id === cid);
          cls.requests = (cls.requests || []).filter(r => r !== uid);
          cls.students = cls.students || [];
          if (!cls.students.includes(uid)) cls.students.push(uid);
          saveDB(db2); alert('Approved'); renderView('requests');
        }));
        document.querySelectorAll('.reject').forEach(b => b.addEventListener('click', () => {
          const cid = b.dataset.class; const uid = b.dataset.user;
          const db2 = loadDB(); const cls = db2.classes.find(x => x.id === cid);
          cls.requests = (cls.requests || []).filter(r => r !== uid);
          saveDB(db2); alert('Rejected'); renderView('requests');
        }));
      }

      if (view === 'assessments') {
        const my = db.classes.filter(c => c.professorId === user.id);
        panel.innerHTML = `<h3>Assessments</h3>
          <div class="card">
            <label>Class</label>
            <select id="assClass">${my.map(c => `<option value="${c.id}">${c.code} — ${c.title}</option>`).join('')}</select>
            <label>Title</label><input id="assTitle">
            <label>Type</label>
            <select id="assType"><option value="quiz">Quiz</option><option value="activity">Activity</option></select>
            <div style="margin-top:8px"><button id="createAssess" class="btn">Create</button></div>
          </div>
          <div id="assList" class="card"></div>`;
        $id('createAssess').addEventListener('click', () => {
          const classId = $id('assClass').value;
          const title = $id('assTitle').value.trim();
          const type = $id('assType').value;
          if (!title) return alert('Provide title');
          const db2 = loadDB();
          const id = 'as-' + Date.now();
          const a = { id, classId, title, type, quizQuestions: [], submissions: [] };
          if (type === 'quiz') {
            const qcount = parseInt(prompt('How many questions?') || '0', 10);
            for (let i = 0; i < qcount; i++) {
              const q = prompt(`Question ${i + 1} text`);
              const ans = prompt('Correct answer (text, exact)');
              if (q) a.quizQuestions.push({ q, answer: ans || '' });
            }
          }
          db2.assessments.push(a);
          saveDB(db2);
          alert('Assessment created');
          renderView('assessments');
        });
        renderAssessList();
        function renderAssessList() {
          const db3 = loadDB();
          const items = (db3.assessments || []).filter(a => my.some(c => c.id === a.classId));
          $id('assList').innerHTML = `<h4>Your assessments</h4>${items.map(a => `<div style="padding:8px;border:1px solid #eef2f6;border-radius:6px;margin-bottom:8px"><strong>${a.title}</strong> (${a.type}) - ${db3.classes.find(cc => cc.id === a.classId)?.code || ''} <div style="margin-top:6px"><button data-id="${a.id}" class="btn small viewSub">View submissions</button></div></div>`).join('') || '<p class="small">No assessments</p>'}`;
          document.querySelectorAll('.viewSub').forEach(b => b.addEventListener('click', () => {
            const db4 = loadDB();
            const a = db4.assessments.find(x => x.id === b.dataset.id);
            panel.innerHTML = `<h3>Submissions: ${a.title}</h3><div class="card"><table class="table"><thead><tr><th>Student</th><th>Submission</th><th>Score</th><th>Action</th></tr></thead><tbody>${
              (a.submissions || []).map(s => {
                const stu = db4.users.find(u => u.id === s.userId);
                return `<tr><td>${nameFull(stu)}</td><td>${s.type === 'quiz' ? (s.answers || []).join(' | ') : s.filename || 'file'}</td><td>${s.score ?? '-'}</td><td><button data-ass="${a.id}" data-user="${s.userId}" class="btn small gradeBtn">Grade</button></td></tr>`;
              }).join('') || '<tr><td colspan="4">No submissions</td></tr>'
            }</tbody></table></div><div style="margin-top:8px"><button id="back" class="btn secondary">Back</button></div>`;
            $id('back').addEventListener('click', () => renderView('assessments'));
            document.querySelectorAll('.gradeBtn').forEach(g => g.addEventListener('click', () => {
              const asId = g.dataset.ass; const uid = g.dataset.user;
              const db5 = loadDB(); const aa = db5.assessments.find(x => x.id === asId); const sub = aa.submissions.find(s => s.userId === uid);
              const score = parseFloat(prompt('Enter numeric score (0-100)') || '0');
              sub.score = Math.max(0, Math.min(100, score));
              saveDB(db5);
              alert('Saved');
              renderView('assessments');
            })));
          }));
        }
      }
    }

    /* ---------- Student ---------- */
    function renderStudent(view, db) {
      if (view === 'profile') {
        panel.innerHTML = `
          <h3>Profile</h3>
          <div class="card">
            <div style="display:flex;gap:12px;align-items:center">
              <img id="pfpic" src="${user.profilePic || 'assets/images/logo.png'}" style="height:88px;width:88px;border-radius:8px;object-fit:cover">
              <div>
                <div><strong>${nameFull(user)}</strong></div>
                <div class="small">Student #: ${user.studentNumber || '-'}</div>
                <div class="small">${user.email || ''} • ${user.contact || ''}</div>
                <div style="margin-top:8px"><button id="editProfile" class="btn secondary">Edit profile</button></div>
              </div>
            </div>
          </div>`;
        $id('editProfile').addEventListener('click', () => showProfileEditor(db));
      }

      if (view === 'available') {
        const available = db.classes.filter(c => !(c.students || []).includes(user.id) && !((c.requests||[]).includes(user.id)));
        panel.innerHTML = `<h3>Available Classes</h3><div class="card">${available.map(c => `<div style="padding:8px;border-bottom:1px solid #eef2f6"><strong>${c.code}</strong> — ${c.title}<div style="margin-top:8px"><button data-id="${c.id}" class="btn small reqBtn">Request to join</button></div></div>`).join('') || '<p class="small">No classes</p>'}</div>`;
        document.querySelectorAll('.reqBtn').forEach(b => b.addEventListener('click', () => {
          const db2 = loadDB(); const cls = db2.classes.find(x => x.id === b.dataset.id);
          cls.requests = cls.requests || []; if (!cls.requests.includes(user.id)) cls.requests.push(user.id);
          saveDB(db2); alert('Requested. Wait for approval'); renderView('available');
        }));
      }

      if (view === 'enrolled') {
        const my = db.classes.filter(c => (c.students || []).includes(user.id));
        panel.innerHTML = `<h3>My Classes</h3><div class="card">${my.map(c => `<div style="padding:8px;border-bottom:1px solid #eef2f6"><strong>${c.code}</strong> — ${c.title} <div style="margin-top:8px"><button data-id="${c.id}" class="btn small viewClass">Open</button></div></div>`).join('') || '<p class="small">No enrolled classes</p>'}</div>`;
        document.querySelectorAll('.viewClass').forEach(b => b.addEventListener('click', () => {
          const cls = db.classes.find(x => x.id === b.dataset.id);
          showStudentClass(cls, db);
        }));
      }

      if (view === 'grades') {
        const enrolled = db.classes.filter(c => (c.students || []).includes(user.id));
        let html = '<h3>Grades</h3>';
        enrolled.forEach(c => {
          const asses = (db.assessments || []).filter(a => a.classId === c.id);
          const quizAs = asses.filter(a => a.type === 'quiz');
          const actAs = asses.filter(a => a.type === 'activity');

          const quizScores = quizAs.map(a => (a.submissions || []).find(s => s.userId === user.id)?.score ?? 0);
          const actScores = actAs.map(a => (a.submissions || []).find(s => s.userId === user.id)?.score ?? 0);

          const quizAvg = quizScores.length ? (quizScores.reduce((a,b)=>a+b,0)/quizScores.length) : 0;
          const actAvg = actScores.length ? (actScores.reduce((a,b)=>a+b,0)/actScores.length) : 0;
          const weighted = (quizAvg * 0.4) + (actAvg * 0.6);
          const grade = percentToGrade(weighted);
          html += `<div class="card"><strong>${c.code} — ${c.title}</strong><p class="small">Quiz avg: ${round(quizAvg)} | Activity avg: ${round(actAvg)} | Combined: ${round(weighted)}%</p><p><strong>Final Grade: ${grade}</strong></p></div>`;
        });
        panel.innerHTML = html || '<p class="small">No grades</p>';
      }
    }

    /* ---------- Shared helpers ---------- */
    function showProfileEditor(db) {
      panel.innerHTML = `<h3>Edit profile</h3>
        <div class="card">
          <label>Upload profile picture</label><input id="pfile" type="file" accept="image/*">
          <label>Surname</label><input id="psurname" value="${user.surname || ''}">
          <label>Given name</label><input id="pgiven" value="${user.givenName || ''}">
          <label>Middle initial</label><input id="pmid" value="${user.middleInitial || ''}">
          <label>Email</label><input id="pemail" value="${user.email || ''}">
          <label>Contact</label><input id="pcontact" value="${user.contact || ''}">
          <label>Username</label><input id="pusername" value="${user.username || ''}">
          <label>New password (leave blank to keep)</label><input id="ppassword" type="password">
          <div style="margin-top:8px"><button id="saveProfile" class="btn">Save</button> <button id="cancelEdit" class="btn secondary">Cancel</button></div>
        </div>`;
      $id('cancelEdit').addEventListener('click', () => renderView('profile'));
      $id('saveProfile').addEventListener('click', () => {
        const db2 = loadDB();
        const u = db2.users.find(x => x.id === user.id);
        u.surname = $id('psurname').value.trim();
        u.givenName = $id('pgiven').value.trim();
        u.middleInitial = $id('pmid').value.trim();
        u.email = $id('pemail').value.trim();
        u.contact = $id('pcontact').value.trim();
        u.username = $id('pusername').value.trim();
        const np = $id('ppassword').value;
        if (np) u.password = np;
        const file = $id('pfile').files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = function (ev) {
            u.profilePic = ev.target.result;
            saveDB(db2);
            setSessionUser(u);
            alert('Saved');
            renderView('profile');
          };
          reader.readAsDataURL(file);
          return;
        }
        saveDB(db2);
        setSessionUser(u);
        alert('Saved');
        renderView('profile');
      });
    }

    function showClassDetails(cls, db) {
      const students = (cls.students || []).map(id => db.users.find(u => u.id === id));
      panel.innerHTML = `<h3>${cls.code} — ${cls.title}</h3><div class="card"><h4>Students</h4>${students.map(s => `<div>${nameFull(s)}</div>`).join('') || '<p class="small">None</p>'}</div><div style="margin-top:8px"><button id="back" class="btn secondary">Back</button></div>`;
      $id('back').addEventListener('click', () => renderView('classes'));
    }

    function showStudentClass(cls, db) {
      const asses = (db.assessments || []).filter(a => a.classId === cls.id);
      panel.innerHTML = `<h3>${cls.code} — ${cls.title}</h3>
        <div class="card"><h4>Assessments</h4>${asses.map(a => `<div style="padding:6px;border-bottom:1px solid #eef2f6"><strong>${a.title}</strong> (${a.type}) <div style="margin-top:8px">${a.type === 'quiz' ? `<button data-id="${a.id}" class="btn small takeQuiz">Take quiz</button>` : `<input type="file" id="file-${a.id}"> <button data-id="${a.id}" class="btn small submitAct">Submit</button>`}</div></div>`).join('') || '<p class="small">No assessments</p>'}</div><div style="margin-top:8px"><button id="back" class="btn secondary">Back</button></div>`;
      $id('back').addEventListener('click', () => renderView('enrolled'));
      document.querySelectorAll('.takeQuiz').forEach(b => b.addEventListener('click', () => {
        const a = loadDB().assessments.find(x => x.id === b.dataset.id);
        takeQuiz(a);
      }));
      document.querySelectorAll('.submitAct').forEach(b => b.addEventListener('click', () => {
        const id = b.dataset.id; const input = document.getElementById('file-' + id);
        if (!input.files.length) return alert('Choose a file');
        const file = input.files[0];
        const reader = new FileReader();
        reader.onload = function (ev) {
          const db3 = loadDB();
          const a = db3.assessments.find(x => x.id === id);
          a.submissions = a.submissions || [];
          a.submissions.push({ userId: user.id, filename: file.name, data: ev.target.result, score: null, type: 'activity' });
          saveDB(db3);
          alert('Submitted');
          renderView('enrolled');
        };
        reader.readAsDataURL(file);
      }));
    }

    function takeQuiz(a) {
      const answers = []; let correct = 0;
      for (let i = 0; i < (a.quizQuestions || []).length; i++) {
        const q = a.quizQuestions[i];
        const ans = prompt(q.q);
        answers.push(ans || '');
        if ((q.answer || '').trim().toLowerCase() === (ans || '').trim().toLowerCase()) correct++;
      }
      const score = (a.quizQuestions.length ? (correct / a.quizQuestions.length) * 100 : 0);
      const db2 = loadDB(); const as = db2.assessments.find(x => x.id === a.id);
      as.submissions = as.submissions || [];
      as.submissions.push({ userId: user.id, answers, score, type: 'quiz' });
      saveDB(db2);
      alert(`Quiz submitted. Score: ${round(score)}%`);
      renderView('enrolled');
    }

    function percentToGrade(p) {
      if (p < 75) return '5.00 (Failed)';
      if (p >= 96) return '1.00';
      if (p >= 92) return '1.25';
      if (p >= 88) return '1.50';
      if (p >= 84) return '1.75';
      if (p >= 80) return '2.00';
      if (p >= 76) return '2.25';
      if (p >= 73) return '2.50';
      if (p >= 70) return '2.75';
      return '3.00';
    }
    function round(n) { return Math.round(n * 100) / 100; }
  });
})();