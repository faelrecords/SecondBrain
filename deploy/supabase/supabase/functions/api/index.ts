import { createClient } from 'npm:@supabase/supabase-js@2.45.4';
import bcrypt from 'npm:bcryptjs@2.4.3';
import jwt from 'npm:jsonwebtoken@9.0.2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const JWT_SECRET = Deno.env.get('JWT_SECRET') || '';
const STATE_KEY = Deno.env.get('SUPABASE_STATE_KEY') || 'secondbrain';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const defaultData: any = {
  users: [],
  courses: [],
  modules: [],
  lessons: [],
  ratings: [],
  progress: [],
  suggestions: [],
  comments: [],
  questions: [],
  forum_posts: [],
  quiz_attempts: [],
  certificates: [],
  notifications: [],
  settings: { slides: [] },
  _seq: { users: 0, courses: 0, modules: 0, lessons: 0, ratings: 0, progress: 0, suggestions: 0, comments: 0, questions: 0, forum_posts: 0, quiz_attempts: 0, certificates: 0, notifications: 0 }
};

class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function corsHeaders(req: Request) {
  const origin = req.headers.get('origin') || '';
  const allowed = (Deno.env.get('ALLOWED_ORIGINS') || '*').split(',').map(x => x.trim()).filter(Boolean);
  const allowOrigin = allowed.includes('*') || !origin ? '*' : allowed.includes(origin) ? origin : allowed[0] || '*';
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    Vary: 'Origin'
  };
}

function json(req: Request, data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders(req), 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
  });
}

function cloneDefault() {
  return JSON.parse(JSON.stringify(defaultData));
}

function ensureShape(db: any) {
  const base = cloneDefault();
  for (const key of Object.keys(base)) if (db[key] === undefined) db[key] = base[key];
  for (const key of Object.keys(base._seq)) if (typeof db._seq[key] !== 'number') db._seq[key] = 0;
  for (const c of db.courses) {
    c.category ||= 'Geral';
    c.level ||= 'iniciante';
    c.workload ||= c.duration || '';
    c.access_mode ||= 'sequential';
  }
  for (const m of db.modules) {
    m.min_score = Number(m.min_score || 70);
    m.quiz_json ||= '';
  }
  for (const l of db.lessons) {
    l.material_url ||= '';
    l.material_links ||= '';
    l.transcript ||= '';
  }
  return db;
}

function nextId(db: any, table: string) {
  db._seq[table] = (db._seq[table] || 0) + 1;
  return db._seq[table];
}

async function body(req: Request) {
  return await req.json().catch(() => ({}));
}

async function loadDB() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !JWT_SECRET) throw new HttpError(500, 'ambiente incompleto');
  const { data, error } = await supabase.from('app_state').select('data').eq('key', STATE_KEY).maybeSingle();
  if (error) throw new HttpError(500, error.message);
  const db = data?.data ? ensureShape(data.data) : cloneDefault();
  if (!db.users.some((u: any) => u.is_super)) {
    db.users.push({
      id: nextId(db, 'users'),
      name: Deno.env.get('SUPER_ADMIN_NAME') || 'Rafael',
      email: Deno.env.get('SUPER_ADMIN_EMAIL') || 'admin@empresa.local',
      role: 'student',
      is_admin: true,
      is_super: true,
      password_hash: bcrypt.hashSync(Deno.env.get('SUPER_ADMIN_PASS') || crypto.randomUUID(), 10),
      created_at: new Date().toISOString()
    });
    await saveDB(db);
  }
  if (!db.courses.length) {
    const course = {
      id: nextId(db, 'courses'),
      title: 'Onboarding Comercial',
      description: 'Processos internos, rotina e qualidade de atendimento.',
      cover_url: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&q=80',
      category: 'Onboarding',
      level: 'iniciante',
      workload: '08 min',
      access_mode: 'sequential',
      published: true,
      order: 1,
      created_at: new Date().toISOString()
    };
    db.courses.push(course);
    const module = { id: nextId(db, 'modules'), course_id: course.id, title: 'Primeiros passos', description: 'Base operacional.', cover_url: '', min_score: 70, quiz_json: '', order: 1, created_at: new Date().toISOString() };
    db.modules.push(module);
    db.lessons.push({
      id: nextId(db, 'lessons'),
      module_id: module.id,
      title: 'Como usar plataforma',
      summary: 'Visão geral da rotina, ordem das aulas, avaliação e envio de sugestões.',
      video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      material_url: '',
      material_links: '',
      transcript: 'Use a plataforma para assistir aulas, concluir etapas, responder quizzes e gerar certificados.',
      duration: '08 min',
      order: 1,
      created_at: new Date().toISOString()
    });
    await saveDB(db);
  }
  return db;
}

async function saveDB(db: any) {
  const { error } = await supabase.from('app_state').upsert({ key: STATE_KEY, data: db });
  if (error) throw new HttpError(500, error.message);
}

function publicUser(user: any) {
  if (!user) return null;
  const { password_hash, ...rest } = user;
  return rest;
}

function findUserByIdentifier(db: any, identifier: string) {
  const clean = String(identifier || '').trim().toLowerCase();
  if (!clean) return null;
  return db.users.find((u: any) => u.name.toLowerCase() === clean || String(u.email || '').toLowerCase() === clean);
}

function sign(user: any) {
  return jwt.sign({
    id: user.id,
    name: user.name,
    is_admin: !!user.is_admin,
    is_super: !!user.is_super
  }, JWT_SECRET, { expiresIn: '30d' });
}

function auth(req: Request) {
  const h = req.headers.get('authorization') || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : '';
  if (!token) throw new HttpError(401, 'sem token');
  try {
    return jwt.verify(token, JWT_SECRET) as any;
  } catch {
    throw new HttpError(401, 'token inválido');
  }
}

function adminOnly(user: any) {
  if (!user.is_admin) throw new HttpError(403, 'sem permissão');
}

function listCourses(db: any) {
  return [...db.courses].sort((a: any, b: any) => (a.order || 0) - (b.order || 0) || a.title.localeCompare(b.title));
}

function listModules(db: any, courseId?: number) {
  return db.modules.filter((m: any) => !courseId || m.course_id === Number(courseId)).sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
}

function listLessons(db: any, moduleId?: number) {
  return db.lessons.filter((l: any) => !moduleId || l.module_id === Number(moduleId)).sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
}

function ratingStats(db: any, lessonId: number) {
  const rows = db.ratings.filter((r: any) => r.lesson_id === Number(lessonId));
  return { count: rows.length, avg: rows.length ? rows.reduce((sum: number, r: any) => sum + r.rating, 0) / rows.length : null };
}

function lessonRating(db: any, lessonId: number, userId: number) {
  return db.ratings.find((r: any) => r.lesson_id === Number(lessonId) && r.user_id === Number(userId)) || null;
}

function lessonProgress(db: any, lessonId: number, userId: number) {
  return db.progress.find((p: any) => p.lesson_id === Number(lessonId) && p.user_id === Number(userId)) || null;
}

function parseQuiz(module: any) {
  try {
    const parsed = JSON.parse(module.quiz_json || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function bestQuiz(db: any, moduleId: number, userId: number) {
  const attempts = db.quiz_attempts.filter((a: any) => a.module_id === Number(moduleId) && a.user_id === Number(userId));
  return attempts.sort((a: any, b: any) => (b.percent || 0) - (a.percent || 0))[0] || null;
}

function progressForCourse(db: any, course: any, userId: number) {
  const moduleIds = db.modules.filter((m: any) => m.course_id === course.id).map((m: any) => m.id);
  const lessons = db.lessons.filter((l: any) => moduleIds.includes(l.module_id));
  const watched = lessons.filter((l: any) => lessonProgress(db, l.id, userId)?.watched).length;
  return { total_lessons: lessons.length, watched_lessons: watched, progress_percent: lessons.length ? Math.round((watched / lessons.length) * 100) : 0 };
}

function addNotification(db: any, input: any) {
  const targets = input.user_id ? [Number(input.user_id)] : db.users.filter((u: any) => !u.is_admin).map((u: any) => u.id);
  for (const userId of targets) {
    db.notifications.push({
      id: nextId(db, 'notifications'),
      user_id: userId,
      type: input.type || 'info',
      title: input.title,
      message: input.message || '',
      link: input.link || '',
      read: false,
      created_at: new Date().toISOString()
    });
  }
}

function certificateCode(row: any) {
  return `SB-${row.user_id}-${row.course_id}-${row.id}`;
}

function withStats(db: any, lesson: any, userId: number) {
  const stats = ratingStats(db, lesson.id);
  const rating = lessonRating(db, lesson.id, userId);
  const progress = lessonProgress(db, lesson.id, userId);
  return {
    ...lesson,
    rating_avg: stats.avg,
    rating_count: stats.count,
    my_rating: rating?.rating || 0,
    my_comment: rating?.comment || '',
    watched: !!progress?.watched,
    comment_count: db.comments.filter((c: any) => c.lesson_id === lesson.id).length,
    question_count: db.questions.filter((q: any) => q.lesson_id === lesson.id).length
  };
}

function courseTree(db: any, course: any, user: any, adminView = false) {
  const progress = progressForCourse(db, course, user.id);
  return {
    ...course,
    ...progress,
    modules: listModules(db, course.id).map((module: any) => ({
      ...module,
      quiz_count: parseQuiz(module).length,
      my_quiz_best: bestQuiz(db, module.id, user.id),
      lessons: listLessons(db, module.id).map((lesson: any) => adminView ? lesson : withStats(db, lesson, user.id))
    }))
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(req) });
  try {
    const url = new URL(req.url);
    const path = url.pathname.replace(/^\/(?:functions\/v1\/)?api/, '') || '/';
    const method = req.method;
    if (path === '/health') return json(req, { ok: true });

    const db = await loadDB();

    if (method === 'POST' && path === '/auth/login') {
      const b = await body(req);
      const user = findUserByIdentifier(db, b.identifier);
      if (!user || !bcrypt.compareSync(String(b.password || ''), user.password_hash || '')) throw new HttpError(401, 'credenciais inválidas');
      return json(req, { token: sign(user), user: publicUser(user) });
    }

    if (method === 'POST' && path === '/auth/register') {
      const b = await body(req);
      if (!b.name || !b.password || String(b.password).length < 4) throw new HttpError(400, 'nome e senha obrigatórios');
      if (findUserByIdentifier(db, b.name) || (b.email && findUserByIdentifier(db, b.email))) throw new HttpError(400, 'usuário já existe');
      const row = {
        id: nextId(db, 'users'),
        name: b.name,
        email: b.email || '',
        role: 'student',
        bio: b.bio || '',
        avatar_url: b.avatar_url || '',
        is_admin: false,
        is_super: false,
        password_hash: bcrypt.hashSync(b.password, 10),
        created_at: new Date().toISOString()
      };
      db.users.push(row);
      await saveDB(db);
      return json(req, { token: sign(row), user: publicUser(row) });
    }

    if (method === 'POST' && path === '/auth/recover') {
      const b = await body(req);
      const row = findUserByIdentifier(db, b.identifier);
      if (!row) throw new HttpError(404, 'usuário não encontrado');
      if (!b.password || String(b.password).length < 4) throw new HttpError(400, 'senha inválida');
      row.password_hash = bcrypt.hashSync(b.password, 10);
      await saveDB(db);
      return json(req, { ok: true });
    }

    const verifyMatch = path.match(/^\/certificates\/verify\/([^/]+)$/);
    if (method === 'GET' && verifyMatch) {
      const cert = db.certificates.find((c: any) => c.code === verifyMatch[1]);
      if (!cert) throw new HttpError(404, 'certificado não encontrado');
      return json(req, {
        ...cert,
        user_name: db.users.find((u: any) => u.id === cert.user_id)?.name || '',
        course_title: db.courses.find((c: any) => c.id === cert.course_id)?.title || ''
      });
    }

    const user = auth(req);

    if (method === 'GET' && path === '/me') {
      return json(req, publicUser(db.users.find((u: any) => u.id === Number(user.id))));
    }

    if (method === 'PUT' && path === '/me') {
      const row = db.users.find((u: any) => u.id === Number(user.id));
      if (!row) throw new HttpError(404, 'usuário não existe');
      const b = await body(req);
      row.name = b.name || row.name;
      row.email = b.email || '';
      row.bio = b.bio || '';
      row.avatar_url = b.avatar_url || '';
      if (b.password) row.password_hash = bcrypt.hashSync(b.password, 10);
      await saveDB(db);
      return json(req, publicUser(row));
    }

    if (method === 'GET' && path === '/settings') {
      return json(req, db.settings || { slides: [] });
    }

    if (method === 'GET' && path === '/courses') {
      return json(req, listCourses(db).filter((c: any) => user.is_admin || c.published).map((c: any) => courseTree(db, c, user, user.is_admin)));
    }

    if (method === 'GET' && path === '/dashboard') {
      const courses = listCourses(db).filter((c: any) => user.is_admin || c.published).map((c: any) => courseTree(db, c, user, false));
      const total = courses.reduce((sum: number, c: any) => sum + c.total_lessons, 0);
      const watched = courses.reduce((sum: number, c: any) => sum + c.watched_lessons, 0);
      const certificates = db.certificates.filter((c: any) => c.user_id === Number(user.id));
      return json(req, {
        progress_percent: total ? Math.round((watched / total) * 100) : 0,
        watched_lessons: watched,
        total_lessons: total,
        in_progress: courses.filter((c: any) => c.watched_lessons > 0 && c.watched_lessons < c.total_lessons),
        completed: courses.filter((c: any) => c.total_lessons && c.watched_lessons === c.total_lessons),
        certificates,
        achievements: [
          watched > 0 ? 'Primeira aula concluída' : null,
          certificates.length ? 'Certificado emitido' : null,
          watched >= 10 ? '10 aulas concluídas' : null
        ].filter(Boolean)
      });
    }

    const courseIdMatch = path.match(/^\/courses\/(\d+)$/);
    if (method === 'GET' && courseIdMatch) {
      const course = db.courses.find((c: any) => c.id === Number(courseIdMatch[1]));
      if (!course) throw new HttpError(404, 'curso não existe');
      return json(req, courseTree(db, course, user, user.is_admin));
    }

    if (method === 'POST' && path === '/ratings') {
      const b = await body(req);
      const rating = Number(b.rating);
      if (rating < 1 || rating > 5) throw new HttpError(400, 'nota inválida');
      let row = db.ratings.find((r: any) => r.lesson_id === Number(b.lesson_id) && r.user_id === Number(user.id));
      if (row) Object.assign(row, { rating, comment: b.comment || '', created_at: new Date().toISOString() });
      else {
        row = { id: nextId(db, 'ratings'), lesson_id: Number(b.lesson_id), user_id: Number(user.id), rating, comment: b.comment || '', created_at: new Date().toISOString() };
        db.ratings.push(row);
      }
      await saveDB(db);
      return json(req, row);
    }

    if (method === 'POST' && path === '/progress/watch') {
      const b = await body(req);
      const rating = Number(b.rating);
      if (rating < 1 || rating > 5) throw new HttpError(400, 'avalie antes de concluir');
      let rateRow = db.ratings.find((r: any) => r.lesson_id === Number(b.lesson_id) && r.user_id === Number(user.id));
      if (rateRow) Object.assign(rateRow, { rating, comment: b.comment || '', created_at: new Date().toISOString() });
      else {
        rateRow = { id: nextId(db, 'ratings'), lesson_id: Number(b.lesson_id), user_id: Number(user.id), rating, comment: b.comment || '', created_at: new Date().toISOString() };
        db.ratings.push(rateRow);
      }
      let progress = db.progress.find((p: any) => p.lesson_id === Number(b.lesson_id) && p.user_id === Number(user.id));
      if (progress) Object.assign(progress, { watched: true, updated_at: new Date().toISOString() });
      else {
        progress = { id: nextId(db, 'progress'), lesson_id: Number(b.lesson_id), user_id: Number(user.id), watched: true, updated_at: new Date().toISOString() };
        db.progress.push(progress);
      }
      await saveDB(db);
      return json(req, progress);
    }

    let m = path.match(/^\/lessons\/(\d+)\/comments$/);
    if (m && method === 'GET') {
      return json(req, db.comments
        .filter((c: any) => c.lesson_id === Number(m![1]))
        .sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        .map((c: any) => ({ ...c, user_name: db.users.find((u: any) => u.id === c.user_id)?.name || '?' })));
    }
    if (m && method === 'POST') {
      const b = await body(req);
      if (!String(b.message || '').trim()) throw new HttpError(400, 'comentário obrigatório');
      const row = { id: nextId(db, 'comments'), lesson_id: Number(m![1]), user_id: Number(user.id), message: String(b.message).trim(), created_at: new Date().toISOString() };
      db.comments.push(row);
      await saveDB(db);
      return json(req, row);
    }

    if (method === 'GET' && path === '/questions') {
      const rows = db.questions
        .filter((q: any) => user.is_admin || q.user_id === Number(user.id))
        .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .map((q: any) => ({ ...q, user_name: db.users.find((u: any) => u.id === q.user_id)?.name || '?', lesson_title: db.lessons.find((l: any) => l.id === q.lesson_id)?.title || '' }));
      return json(req, rows);
    }
    if (method === 'POST' && path === '/questions') {
      const b = await body(req);
      if (!String(b.message || '').trim()) throw new HttpError(400, 'pergunta obrigatória');
      const row = {
        id: nextId(db, 'questions'),
        lesson_id: b.lesson_id ? Number(b.lesson_id) : null,
        user_id: Number(user.id),
        title: b.title || 'Pergunta',
        message: String(b.message).trim(),
        answer: '',
        status: 'open',
        created_at: new Date().toISOString()
      };
      db.questions.push(row);
      await saveDB(db);
      return json(req, row);
    }

    if (method === 'GET' && path === '/forum') {
      return json(req, db.forum_posts
        .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .map((p: any) => ({ ...p, user_name: db.users.find((u: any) => u.id === p.user_id)?.name || '?' })));
    }
    if (method === 'POST' && path === '/forum') {
      const b = await body(req);
      if (!String(b.message || '').trim()) throw new HttpError(400, 'mensagem obrigatória');
      const row = { id: nextId(db, 'forum_posts'), user_id: Number(user.id), title: b.title || 'Post', message: String(b.message).trim(), created_at: new Date().toISOString() };
      db.forum_posts.push(row);
      await saveDB(db);
      return json(req, row);
    }

    if (method === 'GET' && path === '/notifications') {
      const rows = db.notifications
        .filter((n: any) => n.user_id === Number(user.id))
        .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      const incomplete = listCourses(db).filter((c: any) => user.is_admin || c.published).map((c: any) => progressForCourse(db, c, user.id)).some((p: any) => p.total_lessons && p.progress_percent < 100);
      if (incomplete) rows.unshift({ id: 'reminder', title: 'Continue seu progresso', message: 'Há aulas pendentes esperando conclusão.', type: 'progress', read: false, created_at: new Date().toISOString() });
      return json(req, rows);
    }
    m = path.match(/^\/notifications\/(\d+)\/read$/);
    if (m && method === 'PUT') {
      const row = db.notifications.find((n: any) => n.id === Number(m![1]) && n.user_id === Number(user.id));
      if (row) row.read = true;
      await saveDB(db);
      return json(req, row || { ok: true });
    }

    if (method === 'POST' && path === '/quiz/attempts') {
      const b = await body(req);
      const module = db.modules.find((x: any) => x.id === Number(b.module_id));
      if (!module) throw new HttpError(404, 'módulo não existe');
      const quiz = parseQuiz(module);
      if (!quiz.length) throw new HttpError(400, 'quiz vazio');
      const answers = Array.isArray(b.answers) ? b.answers : [];
      const score = quiz.reduce((sum: number, q: any, i: number) => sum + (Number(answers[i]) === Number(q.answer) ? 1 : 0), 0);
      const percent = Math.round((score / quiz.length) * 100);
      const passed = percent >= Number(module.min_score || 70);
      const row = { id: nextId(db, 'quiz_attempts'), module_id: module.id, user_id: Number(user.id), score, total: quiz.length, percent, passed, answers, created_at: new Date().toISOString() };
      db.quiz_attempts.push(row);
      await saveDB(db);
      return json(req, row);
    }

    if (method === 'GET' && path === '/certificates') {
      return json(req, db.certificates.filter((c: any) => c.user_id === Number(user.id)).map((c: any) => ({ ...c, course_title: db.courses.find((x: any) => x.id === c.course_id)?.title || '' })));
    }
    if (method === 'POST' && path === '/certificates') {
      const b = await body(req);
      const course = db.courses.find((c: any) => c.id === Number(b.course_id));
      if (!course) throw new HttpError(404, 'curso não existe');
      const progress = progressForCourse(db, course, user.id);
      if (!progress.total_lessons || progress.progress_percent < 100) throw new HttpError(400, 'curso incompleto');
      let row = db.certificates.find((c: any) => c.course_id === course.id && c.user_id === Number(user.id));
      if (!row) {
        row = { id: nextId(db, 'certificates'), course_id: course.id, user_id: Number(user.id), code: '', created_at: new Date().toISOString() };
        row.code = certificateCode(row);
        db.certificates.push(row);
        await saveDB(db);
      }
      return json(req, { ...row, course_title: course.title });
    }

    if (method === 'POST' && path === '/suggestions') {
      const b = await body(req);
      if (!String(b.message || '').trim()) throw new HttpError(400, 'sugestão obrigatória');
      const row = {
        id: nextId(db, 'suggestions'),
        user_id: Number(user.id),
        lesson_id: b.lesson_id ? Number(b.lesson_id) : null,
        title: b.title || 'Sugestão',
        message: String(b.message).trim(),
        status: 'open',
        created_at: new Date().toISOString()
      };
      db.suggestions.push(row);
      await saveDB(db);
      return json(req, row);
    }

    if (method === 'GET' && path === '/me/suggestions') {
      const rows = [...db.suggestions]
        .filter((s: any) => s.user_id === Number(user.id))
        .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .map((s: any) => ({ ...s, lesson_title: db.lessons.find((l: any) => l.id === s.lesson_id)?.title || '' }));
      return json(req, rows);
    }

    adminOnly(user);

    if (method === 'PUT' && path === '/settings') {
      db.settings = { ...(db.settings || {}), ...(await body(req)) };
      await saveDB(db);
      return json(req, db.settings);
    }

    if (method === 'GET' && path === '/admin/progress') {
      const rows = db.users.filter((u: any) => !u.is_admin).map((u: any) => ({
        user: publicUser(u),
        courses: listCourses(db).map((c: any) => ({ id: c.id, title: c.title, ...progressForCourse(db, c, u.id) })),
        certificates: db.certificates.filter((c: any) => c.user_id === u.id).length
      }));
      return json(req, rows);
    }

    m = path.match(/^\/questions\/(\d+)$/);
    if (m && method === 'PUT') {
      const row = db.questions.find((q: any) => q.id === Number(m![1]));
      if (!row) throw new HttpError(404, 'pergunta não existe');
      const b = await body(req);
      row.answer = b.answer || row.answer || '';
      row.status = b.status || (row.answer ? 'answered' : row.status);
      row.answered_by = Number(user.id);
      row.answered_at = new Date().toISOString();
      addNotification(db, { user_id: row.user_id, type: 'mentor', title: 'Resposta do mentor', message: row.title || row.message });
      await saveDB(db);
      return json(req, row);
    }

    if (method === 'GET' && path === '/users') {
      return json(req, db.users.map(publicUser).sort((a: any, b: any) => a.name.localeCompare(b.name)));
    }
    if (method === 'POST' && path === '/users') {
      const b = await body(req);
      if (!b.name || !b.password || b.password.length < 4) throw new HttpError(400, 'nome e senha obrigatórios');
      const row = {
        id: nextId(db, 'users'),
        name: b.name,
        email: b.email || '',
        role: 'student',
        is_admin: !!b.is_admin,
        is_super: false,
        password_hash: bcrypt.hashSync(b.password, 10),
        created_at: new Date().toISOString()
      };
      db.users.push(row);
      await saveDB(db);
      return json(req, publicUser(row));
    }

    m = path.match(/^\/users\/(\d+)$/);
    if (m && method === 'PUT') {
      const row = db.users.find((u: any) => u.id === Number(m![1]));
      if (!row) throw new HttpError(404, 'usuário não existe');
      if (row.is_super && row.id !== user.id) throw new HttpError(403, 'usuário protegido');
      const b = await body(req);
      row.name = b.name;
      row.email = b.email || '';
      row.is_admin = !!b.is_admin;
      if (b.password) row.password_hash = bcrypt.hashSync(b.password, 10);
      await saveDB(db);
      return json(req, publicUser(row));
    }
    if (m && method === 'DELETE') {
      const row = db.users.find((u: any) => u.id === Number(m![1]));
      if (!row) throw new HttpError(404, 'usuário não existe');
      if (row.is_super) throw new HttpError(403, 'usuário protegido');
      db.users = db.users.filter((u: any) => u.id !== Number(m![1]));
      db.ratings = db.ratings.filter((r: any) => r.user_id !== Number(m![1]));
      db.suggestions = db.suggestions.filter((s: any) => s.user_id !== Number(m![1]));
      await saveDB(db);
      return json(req, { ok: true });
    }

    if (method === 'POST' && path === '/courses') {
      const b = await body(req);
      const row = { id: nextId(db, 'courses'), title: b.title, description: b.description || '', cover_url: b.cover_url || '', category: b.category || 'Geral', level: b.level || 'iniciante', workload: b.workload || '', access_mode: b.access_mode || 'sequential', published: b.published !== false, order: Number(b.order || db.courses.length + 1), created_at: new Date().toISOString() };
      db.courses.push(row);
      addNotification(db, { type: 'content', title: 'Novo curso', message: row.title });
      await saveDB(db);
      return json(req, row);
    }
    m = path.match(/^\/courses\/(\d+)$/);
    if (m && method === 'PUT') {
      const row = db.courses.find((c: any) => c.id === Number(m![1]));
      if (!row) throw new HttpError(404, 'curso não existe');
      Object.assign(row, await body(req));
      await saveDB(db);
      return json(req, row);
    }
    if (m && method === 'DELETE') {
      const id = Number(m![1]);
      const moduleIds = db.modules.filter((x: any) => x.course_id === id).map((x: any) => x.id);
      const lessonIds = db.lessons.filter((x: any) => moduleIds.includes(x.module_id)).map((x: any) => x.id);
      db.courses = db.courses.filter((x: any) => x.id !== id);
      db.modules = db.modules.filter((x: any) => x.course_id !== id);
      db.lessons = db.lessons.filter((x: any) => !moduleIds.includes(x.module_id));
      db.ratings = db.ratings.filter((x: any) => !lessonIds.includes(x.lesson_id));
      await saveDB(db);
      return json(req, { ok: true });
    }

    if (method === 'POST' && path === '/modules') {
      const b = await body(req);
      const row = { id: nextId(db, 'modules'), course_id: Number(b.course_id), title: b.title, description: b.description || '', cover_url: b.cover_url || '', quiz_json: b.quiz_json || '', min_score: Number(b.min_score || 70), order: Number(b.order || db.modules.length + 1), created_at: new Date().toISOString() };
      db.modules.push(row);
      await saveDB(db);
      return json(req, row);
    }
    m = path.match(/^\/modules\/(\d+)$/);
    if (m && method === 'PUT') {
      const row = db.modules.find((x: any) => x.id === Number(m![1]));
      if (!row) throw new HttpError(404, 'módulo não existe');
      Object.assign(row, await body(req));
      await saveDB(db);
      return json(req, row);
    }
    if (m && method === 'DELETE') {
      const id = Number(m![1]);
      const lessonIds = db.lessons.filter((x: any) => x.module_id === id).map((x: any) => x.id);
      db.modules = db.modules.filter((x: any) => x.id !== id);
      db.lessons = db.lessons.filter((x: any) => x.module_id !== id);
      db.ratings = db.ratings.filter((x: any) => !lessonIds.includes(x.lesson_id));
      await saveDB(db);
      return json(req, { ok: true });
    }

    if (method === 'POST' && path === '/lessons') {
      const b = await body(req);
      const row = { id: nextId(db, 'lessons'), module_id: Number(b.module_id), title: b.title, summary: b.summary || '', video_url: b.video_url || '', material_url: b.material_url || '', material_links: b.material_links || '', transcript: b.transcript || '', duration: b.duration || '', order: Number(b.order || db.lessons.length + 1), created_at: new Date().toISOString() };
      db.lessons.push(row);
      addNotification(db, { type: 'content', title: 'Nova aula', message: row.title });
      await saveDB(db);
      return json(req, row);
    }
    m = path.match(/^\/lessons\/(\d+)$/);
    if (m && method === 'PUT') {
      const row = db.lessons.find((x: any) => x.id === Number(m![1]));
      if (!row) throw new HttpError(404, 'aula não existe');
      Object.assign(row, await body(req));
      await saveDB(db);
      return json(req, row);
    }
    if (m && method === 'DELETE') {
      db.lessons = db.lessons.filter((x: any) => x.id !== Number(m![1]));
      db.ratings = db.ratings.filter((x: any) => x.lesson_id !== Number(m![1]));
      await saveDB(db);
      return json(req, { ok: true });
    }

    if (method === 'GET' && path === '/suggestions') {
      const rows = [...db.suggestions].sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).map((s: any) => ({
        ...s,
        user_name: db.users.find((u: any) => u.id === s.user_id)?.name || '?',
        lesson_title: db.lessons.find((l: any) => l.id === s.lesson_id)?.title || ''
      }));
      return json(req, rows);
    }

    if (method === 'GET' && path === '/feedback') {
      const suggestions = [...db.suggestions].sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).map((s: any) => ({
        ...s,
        user_name: db.users.find((u: any) => u.id === s.user_id)?.name || '?',
        lesson_title: db.lessons.find((l: any) => l.id === s.lesson_id)?.title || ''
      }));
      const ratings = [...db.ratings].sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).map((r: any) => ({
        ...r,
        user_name: db.users.find((u: any) => u.id === r.user_id)?.name || '?',
        lesson_title: db.lessons.find((l: any) => l.id === r.lesson_id)?.title || ''
      }));
      return json(req, { suggestions, ratings });
    }
    m = path.match(/^\/suggestions\/(\d+)$/);
    if (m && method === 'PUT') {
      const row = db.suggestions.find((s: any) => s.id === Number(m![1]));
      if (!row) throw new HttpError(404, 'sugestão não existe');
      Object.assign(row, await body(req));
      await saveDB(db);
      return json(req, row);
    }
    if (m && method === 'DELETE') {
      db.suggestions = db.suggestions.filter((s: any) => s.id !== Number(m![1]));
      await saveDB(db);
      return json(req, { ok: true });
    }

    throw new HttpError(404, 'não encontrado');
  } catch (e) {
    const status = e instanceof HttpError ? e.status : 500;
    return json(req, { error: e instanceof Error ? e.message : 'erro' }, status);
  }
});
