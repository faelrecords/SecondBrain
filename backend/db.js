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
  settings: {
    slides: []
  },
  _seq: { users: 0, courses: 0, modules: 0, lessons: 0, ratings: 0, suggestions: 0 }
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

  rateLesson: ({ lesson_id, user_id, rating }) => {
    let row = data.ratings.find(r => r.lesson_id === Number(lesson_id) && r.user_id === Number(user_id));
    if (row) Object.assign(row, { rating: Number(rating), created_at: new Date().toISOString() });
    else {
      row = { id: nextId('ratings'), lesson_id: Number(lesson_id), user_id: Number(user_id), rating: Number(rating), created_at: new Date().toISOString() };
      data.ratings.push(row);
    }
    persist();
    return row;
  },
  lessonRating: (lessonId, userId) => data.ratings.find(r => r.lesson_id === Number(lessonId) && r.user_id === Number(userId)) || null,
  ratingStats: lessonId => {
    const list = data.ratings.filter(r => r.lesson_id === Number(lessonId));
    return { count: list.length, avg: list.length ? list.reduce((sum, r) => sum + r.rating, 0) / list.length : null };
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
  updateSuggestion: (id, patch) => {
    const row = data.suggestions.find(s => s.id === Number(id));
    if (row) { Object.assign(row, patch); persist(); }
    return row;
  },
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
  const mod = db.createModule({ course_id: course.id, title: 'Primeiros passos', description: 'Base operacional.' });
  db.createLesson({
    module_id: mod.id,
    title: 'Como usar plataforma',
    duration: '08 min',
    summary: 'Visão geral da rotina, ordem das aulas, avaliação e envio de sugestões.',
    video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
  });
}

export default db;
