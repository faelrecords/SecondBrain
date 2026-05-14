import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import db, { publicUser, seed } from './db.js';

const app = express();
const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

seed();
app.use(cors());
app.use(express.json({ limit: '2mb' }));

function sign(user) {
  return jwt.sign({
    id: user.id,
    name: user.name,
    is_admin: !!user.is_admin,
    is_super: !!user.is_super
  }, JWT_SECRET, { expiresIn: '30d' });
}

function auth(req, res, next) {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'sem token' });
  try {
    req.auth = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'token inválido' });
  }
}

function admin(req, res, next) {
  auth(req, res, () => {
    if (!req.auth.is_admin) return res.status(403).json({ error: 'sem permissão' });
    next();
  });
}

function withStats(lesson, userId) {
  const stats = db.ratingStats(lesson.id);
  return { ...lesson, rating_avg: stats.avg, rating_count: stats.count, my_rating: db.lessonRating(lesson.id, userId)?.rating || 0 };
}

function courseTree(course, userId, adminView = false) {
  return {
    ...course,
    modules: db.listModules(course.id).map(module => ({
      ...module,
      lessons: db.listLessons(module.id).map(lesson => adminView ? lesson : withStats(lesson, userId))
    }))
  };
}

app.post('/api/auth/login', (req, res) => {
  const user = db.findUserByIdentifier(req.body.identifier);
  if (!user || !bcrypt.compareSync(req.body.password || '', user.password_hash || '')) {
    return res.status(401).json({ error: 'credenciais inválidas' });
  }
  res.json({ token: sign(user), user: publicUser(user) });
});

app.get('/api/me', auth, (req, res) => res.json(publicUser(db.findUser(req.auth.id))));

app.get('/api/courses', auth, (req, res) => {
  const list = db.listCourses()
    .filter(c => req.auth.is_admin || c.published)
    .map(c => courseTree(c, req.auth.id, req.auth.is_admin));
  res.json(list);
});

app.get('/api/courses/:id', auth, (req, res) => {
  const course = db.findCourse(req.params.id);
  if (!course) return res.status(404).json({ error: 'curso não existe' });
  res.json(courseTree(course, req.auth.id, req.auth.is_admin));
});

app.post('/api/ratings', auth, (req, res) => {
  const rating = Number(req.body.rating);
  if (rating < 1 || rating > 5) return res.status(400).json({ error: 'nota inválida' });
  res.json(db.rateLesson({ lesson_id: req.body.lesson_id, user_id: req.auth.id, rating }));
});

app.post('/api/suggestions', auth, (req, res) => {
  if (!String(req.body.message || '').trim()) return res.status(400).json({ error: 'sugestão obrigatória' });
  res.json(db.createSuggestion({
    user_id: req.auth.id,
    lesson_id: req.body.lesson_id,
    title: req.body.title,
    message: String(req.body.message).trim()
  }));
});

app.get('/api/users', admin, (req, res) => res.json(db.listUsers()));
app.post('/api/users', admin, (req, res) => {
  const { name, email, password, is_admin } = req.body;
  if (!name || !password || password.length < 4) return res.status(400).json({ error: 'nome e senha obrigatórios' });
  res.json(publicUser(db.createUser({ name, email, is_admin, password_hash: bcrypt.hashSync(password, 10) })));
});
app.put('/api/users/:id', admin, (req, res) => {
  const target = db.findUser(req.params.id);
  if (!target) return res.status(404).json({ error: 'usuário não existe' });
  if (target.is_super && target.id !== req.auth.id) return res.status(403).json({ error: 'usuário protegido' });
  const patch = { name: req.body.name, email: req.body.email, is_admin: !!req.body.is_admin };
  if (req.body.password) patch.password_hash = bcrypt.hashSync(req.body.password, 10);
  res.json(publicUser(db.updateUser(req.params.id, patch)));
});
app.delete('/api/users/:id', admin, (req, res) => res.json({ ok: db.deleteUser(req.params.id) }));

app.post('/api/courses', admin, (req, res) => res.json(db.createCourse(req.body)));
app.put('/api/courses/:id', admin, (req, res) => res.json(db.updateCourse(req.params.id, req.body)));
app.delete('/api/courses/:id', admin, (req, res) => { db.deleteCourse(req.params.id); res.json({ ok: true }); });
app.post('/api/modules', admin, (req, res) => res.json(db.createModule(req.body)));
app.put('/api/modules/:id', admin, (req, res) => res.json(db.updateModule(req.params.id, req.body)));
app.delete('/api/modules/:id', admin, (req, res) => { db.deleteModule(req.params.id); res.json({ ok: true }); });
app.post('/api/lessons', admin, (req, res) => res.json(db.createLesson(req.body)));
app.put('/api/lessons/:id', admin, (req, res) => res.json(db.updateLesson(req.params.id, req.body)));
app.delete('/api/lessons/:id', admin, (req, res) => { db.deleteLesson(req.params.id); res.json({ ok: true }); });
app.get('/api/suggestions', admin, (req, res) => res.json(db.listSuggestions()));
app.put('/api/suggestions/:id', admin, (req, res) => res.json(db.updateSuggestion(req.params.id, req.body)));
app.get('/api/settings', auth, (req, res) => res.json(db.getSettings()));
app.put('/api/settings', admin, (req, res) => res.json(db.updateSettings(req.body)));

const dist = path.resolve('../frontend/dist');
if (fs.existsSync(dist)) {
  app.use(express.static(dist));
  app.get(/^(?!\/api).*/, (_, res) => res.sendFile(path.join(dist, 'index.html')));
}

app.listen(PORT, () => console.log(`API http://localhost:${PORT}`));
