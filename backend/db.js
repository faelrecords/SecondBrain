import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

const DB_PATH = path.resolve('secondbrain.json');

const seedData = {
  users: [],
  courses: [],
  modules: [],
  lessons: [],
  ratings: [],
  suggestions: [],
  progress: [],
  comments: [],
  questions: [],
  forum_posts: [],
  quiz_attempts: [],
  certificates: [],
  notifications: [],
  settings: {
    slides: []
  },
  _seq: { users: 0, courses: 0, modules: 0, lessons: 0, ratings: 0, suggestions: 0, progress: 0, comments: 0, questions: 0, forum_posts: 0, quiz_attempts: 0, certificates: 0, notifications: 0 }
};

function clone(v) {
  return JSON.parse(JSON.stringify(v));
}

function load() {
  if (!fs.existsSync(DB_PATH)) return clone(seedData);
  try {
    const data = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
    for (const key of Object.keys(seedData)) if (!(key in data)) data[key] = clone(seedData[key]);
    for (const key of Object.keys(seedData._seq)) if (typeof data._seq[key] !== 'number') data._seq[key] = 0;
    for (const c of data.courses) {
      c.category ||= 'Geral';
      c.level ||= 'iniciante';
      c.workload ||= c.duration || '';
      c.access_mode ||= 'sequential';
    }
    for (const m of data.modules) {
      m.min_score = Number(m.min_score || 70);
      m.quiz_json ||= '';
    }
    for (const l of data.lessons) {
      l.material_url ||= '';
      l.material_links ||= '';
      l.transcript ||= '';
    }
    return data;
  } catch {
    return clone(seedData);
  }
}

let data = load();
let writeTimer = null;

function persist() {
  clearTimeout(writeTimer);
  writeTimer = setTimeout(() => fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2)), 50);
}

function nextId(table) {
  data._seq[table] = (data._seq[table] || 0) + 1;
  return data._seq[table];
}

export function publicUser(user) {
  if (!user) return null;
  const { password_hash, ...rest } = user;
  return rest;
}

export const db = {
  listUsers: () => data.users.map(publicUser).sort((a, b) => a.name.localeCompare(b.name)),
  findUser: id => data.users.find(u => u.id === Number(id)),
  findUserByIdentifier: identifier => {
    const clean = String(identifier || '').trim().toLowerCase();
    if (!clean) return null;
    return data.users.find(u => u.name.toLowerCase() === clean || String(u.email || '').toLowerCase() === clean);
  },
  createUser: input => {
    const user = {
      id: nextId('users'),
      name: input.name,
      email: input.email || '',
      role: input.role || 'student',
      is_admin: !!input.is_admin,
      is_super: !!input.is_super,
      password_hash: input.password_hash,
      created_at: new Date().toISOString()
    };
    data.users.push(user); persist(); return user;
  },
  updateUser: (id, patch) => {
    const user = db.findUser(id);
    if (user) { Object.assign(user, patch); persist(); }
    return user;
  },
  deleteUser: id => {
    const user = db.findUser(id);
    if (!user || user.is_super) return false;
    data.users = data.users.filter(u => u.id !== Number(id));
    data.ratings = data.ratings.filter(r => r.user_id !== Number(id));
    data.suggestions = data.suggestions.filter(s => s.user_id !== Number(id));
    persist();
    return true;
  },

  listCourses: () => data.courses
    .sort((a, b) => (a.order || 0) - (b.order || 0) || a.title.localeCompare(b.title)),
  findCourse: id => data.courses.find(c => c.id === Number(id)),
  createCourse: input => {
    const course = {
      id: nextId('courses'),
      title: input.title,
      description: input.description || '',
      cover_url: input.cover_url || '',
      category: input.category || 'Geral',
      level: input.level || 'iniciante',
      workload: input.workload || '',
      access_mode: input.access_mode || 'sequential',
      published: input.published !== false,
      order: Number(input.order || data.courses.length + 1),
      created_at: new Date().toISOString()
    };
    data.courses.push(course); persist(); return course;
  },
  updateCourse: (id, patch) => {
    const course = db.findCourse(id);
    if (course) { Object.assign(course, patch); persist(); }
    return course;
  },
  deleteCourse: id => {
    const moduleIds = data.modules.filter(m => m.course_id === Number(id)).map(m => m.id);
    const lessonIds = data.lessons.filter(l => moduleIds.includes(l.module_id)).map(l => l.id);
    data.courses = data.courses.filter(c => c.id !== Number(id));
    data.modules = data.modules.filter(m => m.course_id !== Number(id));
    data.lessons = data.lessons.filter(l => !moduleIds.includes(l.module_id));
    data.ratings = data.ratings.filter(r => !lessonIds.includes(r.lesson_id));
    persist();
  },

  listModules: courseId => data.modules
    .filter(m => !courseId || m.course_id === Number(courseId))
    .sort((a, b) => (a.order || 0) - (b.order || 0)),
  findModule: id => data.modules.find(m => m.id === Number(id)),
  createModule: input => {
    const module = {
      id: nextId('modules'),
      course_id: Number(input.course_id),
      title: input.title,
      description: input.description || '',
      cover_url: input.cover_url || '',
      quiz_json: input.quiz_json || '',
      min_score: Number(input.min_score || 70),
      order: Number(input.order || data.modules.length + 1),
      created_at: new Date().toISOString()
    };
    data.modules.push(module); persist(); return module;
  },
  updateModule: (id, patch) => {
    const module = db.findModule(id);
    if (module) { Object.assign(module, patch); persist(); }
    return module;
  },
  deleteModule: id => {
    const lessonIds = data.lessons.filter(l => l.module_id === Number(id)).map(l => l.id);
    data.modules = data.modules.filter(m => m.id !== Number(id));
    data.lessons = data.lessons.filter(l => l.module_id !== Number(id));
    data.ratings = data.ratings.filter(r => !lessonIds.includes(r.lesson_id));
    persist();
  },

  listLessons: moduleId => data.lessons
    .filter(l => !moduleId || l.module_id === Number(moduleId))
    .sort((a, b) => (a.order || 0) - (b.order || 0)),
  findLesson: id => data.lessons.find(l => l.id === Number(id)),
  createLesson: input => {
    const lesson = {
      id: nextId('lessons'),
      module_id: Number(input.module_id),
      title: input.title,
      summary: input.summary || '',
      video_url: input.video_url || '',
      material_url: input.material_url || '',
      material_links: input.material_links || '',
      transcript: input.transcript || '',
      duration: input.duration || '',
      order: Number(input.order || data.lessons.length + 1),
      created_at: new Date().toISOString()
    };
    data.lessons.push(lesson); persist(); return lesson;
  },
  updateLesson: (id, patch) => {
    const lesson = db.findLesson(id);
    if (lesson) { Object.assign(lesson, patch); persist(); }
    return lesson;
  },
  deleteLesson: id => {
    data.lessons = data.lessons.filter(l => l.id !== Number(id));
    data.ratings = data.ratings.filter(r => r.lesson_id !== Number(id));
    persist();
  },

  rateLesson: ({ lesson_id, user_id, rating, comment = '' }) => {
    let row = data.ratings.find(r => r.lesson_id === Number(lesson_id) && r.user_id === Number(user_id));
    if (row) Object.assign(row, { rating: Number(rating), comment, created_at: new Date().toISOString() });
    else {
      row = { id: nextId('ratings'), lesson_id: Number(lesson_id), user_id: Number(user_id), rating: Number(rating), comment, created_at: new Date().toISOString() };
      data.ratings.push(row);
    }
    persist();
    return row;
  },
  lessonRating: (lessonId, userId) => data.ratings.find(r => r.lesson_id === Number(lessonId) && r.user_id === Number(userId)) || null,
  lessonProgress: (lessonId, userId) => data.progress.find(p => p.lesson_id === Number(lessonId) && p.user_id === Number(userId)) || null,
  ratingStats: lessonId => {
    const list = data.ratings.filter(r => r.lesson_id === Number(lessonId));
    return { count: list.length, avg: list.length ? list.reduce((sum, r) => sum + r.rating, 0) / list.length : null };
  },
  markWatched: ({ lesson_id, user_id, rating, comment }) => {
    const ratingNumber = Number(rating);
    if (ratingNumber < 1 || ratingNumber > 5) throw new Error('nota inválida');
    db.rateLesson({ lesson_id, user_id, rating: ratingNumber, comment: comment || '' });
    let row = data.progress.find(p => p.lesson_id === Number(lesson_id) && p.user_id === Number(user_id));
    if (row) Object.assign(row, { watched: true, updated_at: new Date().toISOString() });
    else {
      row = { id: nextId('progress'), lesson_id: Number(lesson_id), user_id: Number(user_id), watched: true, updated_at: new Date().toISOString() };
      data.progress.push(row);
    }
    persist();
    return row;
  },
  createSuggestion: input => {
    const row = {
      id: nextId('suggestions'),
      user_id: Number(input.user_id),
      lesson_id: input.lesson_id ? Number(input.lesson_id) : null,
      title: input.title || 'Sugestão',
      message: input.message,
      status: 'open',
      created_at: new Date().toISOString()
    };
    data.suggestions.push(row); persist(); return row;
  },
  listSuggestions: () => data.suggestions
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .map(s => ({
      ...s,
      user_name: db.findUser(s.user_id)?.name || '?',
      lesson_title: db.findLesson(s.lesson_id)?.title || ''
    })),
  listUserSuggestions: userId => data.suggestions
    .filter(s => s.user_id === Number(userId))
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .map(s => ({
      ...s,
      lesson_title: db.findLesson(s.lesson_id)?.title || ''
    })),
  updateSuggestion: (id, patch) => {
    const row = data.suggestions.find(s => s.id === Number(id));
    if (row) { Object.assign(row, patch); persist(); }
    return row;
  },
  deleteSuggestion: id => {
    data.suggestions = data.suggestions.filter(s => s.id !== Number(id));
    persist();
  },
  listComments: lessonId => data.comments
    .filter(c => c.lesson_id === Number(lessonId))
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
    .map(c => ({ ...c, user_name: db.findUser(c.user_id)?.name || '?' })),
  createComment: input => {
    const row = { id: nextId('comments'), lesson_id: Number(input.lesson_id), user_id: Number(input.user_id), message: input.message, created_at: new Date().toISOString() };
    data.comments.push(row); persist(); return row;
  },
  listQuestions: user => data.questions
    .filter(q => user.is_admin || q.user_id === Number(user.id))
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .map(q => ({ ...q, user_name: db.findUser(q.user_id)?.name || '?', lesson_title: db.findLesson(q.lesson_id)?.title || '' })),
  createQuestion: input => {
    const row = { id: nextId('questions'), lesson_id: input.lesson_id ? Number(input.lesson_id) : null, user_id: Number(input.user_id), title: input.title || 'Pergunta', message: input.message, answer: '', status: 'open', created_at: new Date().toISOString() };
    data.questions.push(row); persist(); return row;
  },
  answerQuestion: (id, patch, adminId) => {
    const row = data.questions.find(q => q.id === Number(id));
    if (!row) return null;
    row.answer = patch.answer || row.answer || '';
    row.status = patch.status || (row.answer ? 'answered' : row.status);
    row.answered_by = Number(adminId);
    row.answered_at = new Date().toISOString();
    db.notify({ user_id: row.user_id, type: 'mentor', title: 'Resposta do mentor', message: row.title || row.message });
    persist();
    return row;
  },
  listForum: () => data.forum_posts
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .map(p => ({ ...p, user_name: db.findUser(p.user_id)?.name || '?' })),
  createForum: input => {
    const row = { id: nextId('forum_posts'), user_id: Number(input.user_id), title: input.title || 'Post', message: input.message, created_at: new Date().toISOString() };
    data.forum_posts.push(row); persist(); return row;
  },
  notify: input => {
    const targets = input.user_id ? [Number(input.user_id)] : data.users.filter(u => !u.is_admin).map(u => u.id);
    for (const userId of targets) data.notifications.push({ id: nextId('notifications'), user_id: userId, type: input.type || 'info', title: input.title, message: input.message || '', link: input.link || '', read: false, created_at: new Date().toISOString() });
    persist();
  },
  listNotifications: userId => data.notifications
    .filter(n => n.user_id === Number(userId))
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at)),
  readNotification: (id, userId) => {
    const row = data.notifications.find(n => n.id === Number(id) && n.user_id === Number(userId));
    if (row) { row.read = true; persist(); }
    return row;
  },
  parseQuiz: module => {
    try { const q = JSON.parse(module.quiz_json || '[]'); return Array.isArray(q) ? q : []; } catch { return []; }
  },
  bestQuiz: (moduleId, userId) => data.quiz_attempts
    .filter(a => a.module_id === Number(moduleId) && a.user_id === Number(userId))
    .sort((a, b) => (b.percent || 0) - (a.percent || 0))[0] || null,
  submitQuiz: ({ module_id, user_id, answers }) => {
    const module = db.findModule(module_id);
    const quiz = db.parseQuiz(module || {});
    const score = quiz.reduce((sum, q, i) => sum + (Number(answers?.[i]) === Number(q.answer) ? 1 : 0), 0);
    const percent = quiz.length ? Math.round((score / quiz.length) * 100) : 0;
    const row = { id: nextId('quiz_attempts'), module_id: Number(module_id), user_id: Number(user_id), score, total: quiz.length, percent, passed: percent >= Number(module?.min_score || 70), answers: answers || [], created_at: new Date().toISOString() };
    data.quiz_attempts.push(row); persist(); return row;
  },
  progressForCourse: (course, userId) => {
    const moduleIds = data.modules.filter(m => m.course_id === course.id).map(m => m.id);
    const lessons = data.lessons.filter(l => moduleIds.includes(l.module_id));
    const watched = lessons.filter(l => db.lessonProgress(l.id, userId)?.watched).length;
    return { total_lessons: lessons.length, watched_lessons: watched, progress_percent: lessons.length ? Math.round((watched / lessons.length) * 100) : 0 };
  },
  listCertificates: userId => data.certificates.filter(c => c.user_id === Number(userId)).map(c => ({ ...c, course_title: db.findCourse(c.course_id)?.title || '' })),
  issueCertificate: (courseId, userId) => {
    let row = data.certificates.find(c => c.course_id === Number(courseId) && c.user_id === Number(userId));
    if (!row) {
      row = { id: nextId('certificates'), course_id: Number(courseId), user_id: Number(userId), code: '', created_at: new Date().toISOString() };
      row.code = `SB-${row.user_id}-${row.course_id}-${row.id}`;
      data.certificates.push(row);
      persist();
    }
    return { ...row, course_title: db.findCourse(courseId)?.title || '' };
  },
  verifyCertificate: code => {
    const row = data.certificates.find(c => c.code === code);
    return row && { ...row, user_name: db.findUser(row.user_id)?.name || '', course_title: db.findCourse(row.course_id)?.title || '' };
  },
  progressReport: () => data.users.filter(u => !u.is_admin).map(u => ({
    user: publicUser(u),
    courses: db.listCourses().map(c => ({ id: c.id, title: c.title, ...db.progressForCourse(c, u.id) })),
    certificates: data.certificates.filter(c => c.user_id === u.id).length
  })),
  listFeedback: () => ({
    suggestions: db.listSuggestions(),
    ratings: [...data.ratings]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .map(r => ({
        ...r,
        user_name: db.findUser(r.user_id)?.name || '?',
        lesson_title: db.findLesson(r.lesson_id)?.title || ''
      }))
  }),
  getSettings: () => data.settings || { slides: [] },
  updateSettings: patch => {
    data.settings = { ...(data.settings || {}), ...patch };
    persist();
    return data.settings;
  }
};

export function seed() {
  if (!data.users.some(u => u.is_super)) {
    db.createUser({
      name: 'Rafael',
      email: 'admin@empresa.local',
      is_admin: true,
      is_super: true,
      password_hash: bcrypt.hashSync('99637716', 10)
    });
  }
  if (data.courses.length) return;
  const course = db.createCourse({
    title: 'Onboarding Comercial',
    description: 'Processos internos, rotina e qualidade de atendimento.',
    cover_url: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&q=80'
  });
  const mod = db.createModule({ course_id: course.id, title: 'Primeiros passos', description: 'Base operacional.', min_score: 70 });
  db.createLesson({
    module_id: mod.id,
    title: 'Como usar plataforma',
    duration: '08 min',
    summary: 'Visão geral da rotina, ordem das aulas, avaliação e envio de sugestões.',
    video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    transcript: 'Use a plataforma para assistir aulas, concluir etapas, responder quizzes e gerar certificados.'
  });
}

export default db;
