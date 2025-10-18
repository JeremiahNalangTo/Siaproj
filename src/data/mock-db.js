// Small helper to bootstrap localStorage data (run once from auth.js)
(function(){
  if(localStorage.getItem('bsta_db')) return;
  const db = {
    users: [
      // sample professor
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
        profilePic: '',
      },
      // sample student
      {
        id: 'stud-1',
        role: 'student',
        username: 'sally',
        password: 'password',
        surname: 'Reyes',
        givenName: 'Sally',
        middleInitial: 'B',
        studentNumber: '2021-001',
        email: 'sally@bsta.edu',
        contact: '09178889999',
        profilePic: '',
      }
    ],
    classes: [
      // class structure: { id, code, title, professorId, students:[], requests:[] }
    ],
    assessments: [
      // { id, classId, type: 'quiz'|'activity', title, quizQuestions:[{q,options,answer}], submissions: [{userId,answers/filename,score}] }
    ]
  };
  localStorage.setItem('bsta_db', JSON.stringify(db));
})();