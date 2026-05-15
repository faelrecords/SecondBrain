import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Award, BarChart3, Bell, BookOpen, CheckCircle, ChevronLeft, ChevronRight, Download, GraduationCap, HelpCircle, Image, LayoutDashboard, Lightbulb, Lock, LogOut, Menu, MessageCircle, Play, Plus, Save, Search, Star, Trash2, User, Users } from 'lucide-react';
import './styles.css';

const API = import.meta.env.VITE_API_URL || (
  window.location.hostname.endsWith('github.io')
    ? 'https://euxcyhewlpehhgybymnv.supabase.co/functions/v1/api'
    : '/api'
);

function token() { return localStorage.getItem('token'); }
function profile() { try { return JSON.parse(localStorage.getItem('profile') || 'null'); } catch { return null; } }
function setSession(data) { localStorage.setItem('token', data.token); localStorage.setItem('profile', JSON.stringify(data.user)); }
function logout() { localStorage.clear(); location.reload(); }
function saveProfile(user) { localStorage.setItem('profile', JSON.stringify(user)); }

async function request(path, opts = {}) {
  const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) };
  if (token()) headers.Authorization = `Bearer ${token()}`;
  const res = await fetch(API + path, { ...opts, headers });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'erro');
  return res.json();
}
const api = {
  get: p => request(p),
  post: (p, b) => request(p, { method: 'POST', body: JSON.stringify(b) }),
  put: (p, b) => request(p, { method: 'PUT', body: JSON.stringify(b) }),
  del: p => request(p, { method: 'DELETE' })
};

function embedUrl(url) {
  if (!url) return '';
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?/]+)/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  const drive = url.match(/drive\.google\.com\/file\/d\/([^/]+)/);
  if (drive) return `https://drive.google.com/file/d/${drive[1]}/preview`;
  return url;
}

function Login({ onLogin }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ identifier: '', name: '', email: '', password: '' });
  const [err, setErr] = useState('');
  const [ok, setOk] = useState('');
  async function submit(e) {
    e.preventDefault(); setErr(''); setOk('');
    try {
      if (mode === 'login') {
        const data = await api.post('/auth/login', form);
        setSession(data); onLogin();
      } else if (mode === 'register') {
        const data = await api.post('/auth/register', form);
        setSession(data); onLogin();
      } else {
        await api.post('/auth/recover', form);
        setOk('Senha atualizada.');
        setMode('login');
      }
    } catch (e) { setErr(e.message); }
  }
  return <main className="auth-page">
    <form className="auth-card" onSubmit={submit}>
      <div className="brand-lock"><GraduationCap size={30} /><span>SecondBrain</span></div>
      <h1>{mode === 'login' ? 'Acesso interno' : mode === 'register' ? 'Criar conta' : 'Recuperar senha'}</h1>
      <p>Plataforma de cursos da empresa.</p>
      <div className="auth-tabs">
        <button type="button" className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')}>Login</button>
        <button type="button" className={mode === 'register' ? 'active' : ''} onClick={() => setMode('register')}>Cadastro</button>
        <button type="button" className={mode === 'recover' ? 'active' : ''} onClick={() => setMode('recover')}>Senha</button>
      </div>
      {err && <div className="error">{err}</div>}
      {ok && <div className="success">{ok}</div>}
      {mode === 'register' && <>
        <label>Nome</label>
        <input autoFocus value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
        <label>Email</label>
        <input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
      </>}
      {mode !== 'register' && <>
        <label>Usuário ou email</label>
        <input autoFocus value={form.identifier} onChange={e => setForm({ ...form, identifier: e.target.value })} />
      </>}
      <label>Senha</label>
      <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
      <button className="primary">{mode === 'login' ? 'Entrar' : mode === 'register' ? 'Cadastrar' : 'Atualizar senha'}</button>
    </form>
  </main>;
}

function Shell({ children, tab, setTab, user }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const nav = user?.is_admin
    ? [['dashboard', BarChart3, 'Dashboard'], ['learn', BookOpen, 'Catálogo'], ['admin', LayoutDashboard, 'Cursos'], ['users', Users, 'Usuários'], ['admin-progress', Award, 'Progresso'], ['admin-questions', HelpCircle, 'Perguntas'], ['feedback', Star, 'Avaliações'], ['suggestions', Lightbulb, 'Sugestões'], ['notifications', Bell, 'Notificações'], ['settings', Image, 'Configurações'], ['profile', User, 'Perfil']]
    : [['dashboard', BarChart3, 'Dashboard'], ['learn', BookOpen, 'Catálogo'], ['community', MessageCircle, 'Comunidade'], ['notifications', Bell, 'Notificações'], ['profile', User, 'Perfil'], ['my-suggestions', Lightbulb, 'Sugestões']];
  return <div className="app">
    <aside>
      <div className="mobile-head">
        <div className="brand"><GraduationCap /><span>SecondBrain</span></div>
        <button className="mobile-menu-btn" onClick={() => setMenuOpen(v => !v)}><Menu size={20} /></button>
      </div>
      <nav className={menuOpen ? 'open' : ''}>{nav.map(([id, Icon, label]) =>
        <button key={id} className={tab === id ? 'active' : ''} onClick={() => { setTab(id); setMenuOpen(false); }}><Icon size={18} />{label}</button>
      )}<button className="logout nav-logout" onClick={logout}><LogOut size={18} />Sair</button></nav>
      <div className="side-bottom">
        <button className="logout" onClick={logout}><LogOut size={18} />Sair</button>
      </div>
    </aside>
    <section className="main">{children}</section>
  </div>;
}

function Stars({ value, onChange }) {
  return <div className="stars">{[1, 2, 3, 4, 5].map(n =>
    <button type="button" key={n} className={n <= value ? 'on' : ''} onClick={() => onChange(n)}><Star size={18} fill="currentColor" /></button>
  )}</div>;
}

function ProgressBar({ value }) {
  return <div className="progress-track"><span style={{ width: `${Math.min(100, Math.max(0, value || 0))}%` }} /></div>;
}

function Dashboard({ courses, user }) {
  const [data, setData] = useState(null);
  useEffect(() => { api.get('/dashboard').then(setData).catch(() => {}); }, []);
  const total = courses.reduce((sum, c) => sum + (c.total_lessons || 0), 0);
  const watched = courses.reduce((sum, c) => sum + (c.watched_lessons || 0), 0);
  const progress = data?.progress_percent ?? (total ? Math.round((watched / total) * 100) : 0);
  const active = data?.in_progress || courses.filter(c => c.watched_lessons > 0 && c.watched_lessons < c.total_lessons);
  const certificates = data?.certificates || [];
  return <div>
    <header className="topbar"><div><h1>Dashboard</h1></div></header>
    <div className="stats-grid">
      <div className="stat-card"><small>Progresso geral</small><strong>{progress}%</strong><ProgressBar value={progress} /></div>
      <div className="stat-card"><small>Aulas concluídas</small><strong>{data?.watched_lessons ?? watched}/{data?.total_lessons ?? total}</strong></div>
      <div className="stat-card"><small>Certificados</small><strong>{certificates.length}</strong></div>
    </div>
    <section className="panel-section">
      <h2>Cursos em andamento</h2>
      <div className="mini-list">{active.map(c => <div className="mini-row" key={c.id}><span>{c.title}</span><b>{c.progress_percent || 0}%</b><ProgressBar value={c.progress_percent || 0} /></div>)}
        {!active.length && <Empty title="Sem cursos em andamento" text="Comece um curso pelo catálogo." />}</div>
    </section>
    <section className="panel-section">
      <h2>Conquistas</h2>
      <div className="achievement-grid">
        {(data?.achievements || []).map(a => <span key={a} className="achievement"><Award size={18} />{a}</span>)}
        {certificates.map(c => <span key={c.code} className="achievement"><CheckCircle size={18} />{c.course_title || c.code}</span>)}
        {!certificates.length && !(data?.achievements || []).length && <span className="achievement muted"><Award size={18} />Nenhuma conquista ainda</span>}
      </div>
    </section>
  </div>;
}

function Learn({ courses, reload }) {
  const [settings, setSettings] = useState({ slides: [] });
  const [slide, setSlide] = useState(0);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [level, setLevel] = useState('');
  const [courseId, setCourseId] = useState(null);
  const course = courses.find(c => c.id === courseId);
  const lessons = course?.modules.flatMap(m => m.lessons.map(l => ({ ...l, module_title: m.title }))) || [];
  const [moduleId, setModuleId] = useState(null);
  const module = course?.modules.find(m => m.id === moduleId);
  const moduleLessons = module?.lessons || [];
  const [lessonId, setLessonId] = useState(null);
  const lesson = lessons.find(l => l.id === lessonId) || lessons[0];
  const [ratingDraft, setRatingDraft] = useState(0);
  const [reviewText, setReviewText] = useState('');
  useEffect(() => { api.get('/settings').then(setSettings).catch(() => {}); }, []);
  useEffect(() => {
    if (!settings.slides?.length) return;
    const timer = setInterval(() => setSlide(v => (v + 1) % settings.slides.length), 5500);
    return () => clearInterval(timer);
  }, [settings.slides?.length]);
  useEffect(() => {
    if (moduleLessons[0]) setLessonId(moduleLessons[0].id);
  }, [moduleId]);
  useEffect(() => {
    setRatingDraft(lesson?.my_rating || 0);
    setReviewText(lesson?.my_comment || '');
  }, [lesson?.id]);
  const categories = [...new Set(courses.map(c => c.category || 'Geral'))];
  const levels = [...new Set(courses.map(c => c.level || 'iniciante'))];
  const filteredCourses = courses.filter(c =>
    (!search || `${c.title} ${c.description}`.toLowerCase().includes(search.toLowerCase())) &&
    (!category || (c.category || 'Geral') === category) &&
    (!level || (c.level || 'iniciante') === level)
  );
  const moduleIndex = course?.modules.findIndex(m => m.id === moduleId) ?? -1;
  const moduleComplete = m => (m?.lessons || []).length && m.lessons.every(l => l.watched);
  const modulePassed = m => !m?.quiz_count || m.my_quiz_best?.passed;
  const isModuleLocked = index => course?.access_mode !== 'free' && index > 0 && !course.modules.slice(0, index).every(m => moduleComplete(m) && modulePassed(m));
  const lessonIndex = moduleLessons.findIndex(l => l.id === lesson?.id);
  const isLessonLocked = index => course?.access_mode !== 'free' && index > 0 && !moduleLessons[index - 1]?.watched;
  function continueWhereStopped(targetCourse = courses[0]) {
    const flat = targetCourse?.modules.flatMap(m => m.lessons.map(l => ({ ...l, module_id: m.id }))) || [];
    const target = flat.find(l => !l.watched) || flat.at(-1);
    if (!target) return;
    setCourseId(targetCourse.id);
    setModuleId(target.module_id);
    setLessonId(target.id);
  }
  async function markWatched() {
    await api.post('/progress/watch', { lesson_id: lesson.id, rating: ratingDraft, comment: reviewText });
    await reload();
    const idx = moduleLessons.findIndex(l => l.id === lesson.id);
    const next = moduleLessons[idx + 1];
    if (next) setLessonId(next.id);
  }
  if (!courses.length) return <Empty title="Nenhum curso" text="Admin precisa criar cursos." />;
  if (!course) return <div className="learn-page">
    <HeroSlider slides={settings.slides || []} slide={slide} setSlide={setSlide} />
    <div className="continue-row">
      <button className="primary continue-btn" onClick={() => continueWhereStopped(courses[0])}><Play size={17} />Continuar de onde parou</button>
    </div>
    <header className="section-head"><div><h2>Cursos disponíveis</h2></div></header>
    <div className="catalog-filters">
      <div className="search-box"><Search size={18} /><input placeholder="Buscar curso" value={search} onChange={e => setSearch(e.target.value)} /></div>
      <select value={category} onChange={e => setCategory(e.target.value)}><option value="">Todas categorias</option>{categories.map(c => <option key={c} value={c}>{c}</option>)}</select>
      <select value={level} onChange={e => setLevel(e.target.value)}><option value="">Todos níveis</option>{levels.map(l => <option key={l} value={l}>{l}</option>)}</select>
    </div>
    <div className="poster-grid">
      {filteredCourses.map(c => <button key={c.id} className="poster-card" onClick={() => setCourseId(c.id)}>
        <img src={c.cover_url || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80'} />
        <div><span className="card-meta">{c.category || 'Geral'} · {c.level || 'iniciante'} · {c.workload || 'sem carga'}</span><h3>{c.title}</h3><p>{c.description}</p><ProgressBar value={c.progress_percent || 0} /><small>{c.modules.length} módulos</small></div>
      </button>)}
    </div>
  </div>;
  if (!module) return <div className="learn-page">
    <button className="back-btn" onClick={() => setCourseId(null)}>Voltar</button>
    <header className="section-head"><div><h2>{course.title}</h2></div><button className="primary slim" onClick={() => continueWhereStopped(course)}><Play size={16} />Continuar de onde parou</button></header>
    {course.progress_percent === 100 && <CertificatePanel course={course} />}
    <div className="poster-grid">
      {course.modules.map((m, i) => <button key={m.id} disabled={isModuleLocked(i)} className={isModuleLocked(i) ? 'poster-card locked' : 'poster-card'} onClick={() => !isModuleLocked(i) && setModuleId(m.id)}>
        <img src={m.cover_url || course.cover_url || 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=900&q=80'} />
        <div>{isModuleLocked(i) && <span className="lock-pill"><Lock size={14} />Travado</span>}<h3>{m.title}</h3><p>{m.description}</p><ProgressBar value={m.lessons.length ? Math.round((m.lessons.filter(l => l.watched).length / m.lessons.length) * 100) : 0} /><small>{m.lessons.length} aulas · quiz {m.quiz_count ? `${m.min_score}%` : 'livre'}</small></div>
      </button>)}
    </div>
  </div>;
  return <div className="learn-page">
    <button className="back-btn" onClick={() => setModuleId(null)}>Voltar</button>
    <header className="section-head"><div><h2>{module.title}</h2><p>{course.title}</p></div></header>
    <div className="learn-grid">
      <div className="player-panel">
        {lesson ? <>
          <iframe src={embedUrl(lesson.video_url)} allow="autoplay; fullscreen; picture-in-picture" allowFullScreen />
          <div className="lesson-head">
            <div><small>{lesson.module_title}</small><h2>{lesson.title}</h2></div>
            <span>{lesson.duration}</span>
          </div>
          <p className="summary">{lesson.summary || 'Sem resumo.'}</p>
          {(lesson.material_url || lesson.material_links) && <div className="material-box">
            {lesson.material_url && <a href={lesson.material_url} target="_blank" rel="noreferrer">Material complementar</a>}
            {String(lesson.material_links || '').split('\n').filter(Boolean).map((l, i) => <a key={i} href={l} target="_blank" rel="noreferrer">Link {i + 1}</a>)}
          </div>}
          {lesson.transcript && <details className="transcript-box"><summary>Transcrição / legenda</summary><p>{lesson.transcript}</p></details>}
          <div className="rating-box">
            <div><b>Avaliar aula</b><small>{lesson.rating_count ? `${lesson.rating_avg.toFixed(1)} média / ${lesson.rating_count} votos` : 'sem avaliações'}</small></div>
            <Stars value={ratingDraft} onChange={setRatingDraft} />
          </div>
          <div className="suggest-box">
            <textarea placeholder="Avaliação em texto opcional..." value={reviewText} onChange={e => setReviewText(e.target.value)} />
            <button className="primary" disabled={!ratingDraft || lesson.watched} onClick={markWatched}>
              {lesson.watched ? 'Aula assistida' : 'Marcar como assistido'}
            </button>
          </div>
          <div className="lesson-nav">
            <button disabled={lessonIndex <= 0} onClick={() => setLessonId(moduleLessons[lessonIndex - 1]?.id)}><ChevronLeft size={17} />Anterior</button>
            <button disabled={!moduleLessons[lessonIndex + 1] || isLessonLocked(lessonIndex + 1)} onClick={() => setLessonId(moduleLessons[lessonIndex + 1]?.id)}>Próxima<ChevronRight size={17} /></button>
          </div>
          <LessonInteraction lesson={lesson} />
          <ModuleQuiz module={module} reload={reload} />
        </> : <Empty title="Curso vazio" text="Sem aulas cadastradas." />}
      </div>
      <div className="lesson-list">
        <div className="module">
          <h3>Aulas</h3>
          {moduleLessons.map((l, i) => <button key={l.id} disabled={isLessonLocked(i)} className={`${lesson?.id === l.id ? 'lesson active' : 'lesson'} ${isLessonLocked(i) ? 'locked' : ''}`} onClick={() => !isLessonLocked(i) && setLessonId(l.id)}>
            {isLessonLocked(i) ? <Lock size={15} /> : <Play size={15} />}<span>{l.title}</span><small>{l.watched ? 'feito' : l.duration}</small>
          </button>)}
        </div>
      </div>
    </div>
  </div>;
}

function HeroSlider({ slides, slide, setSlide }) {
  const active = slides[slide];
  if (!active) return <section className="mentor-hero empty-hero"><div><div className="hero-pill">SecondBrain</div><h1>Cursos internos</h1></div></section>;
  return <section className="hero-slider">
    <img src={active.image_url} />
    <div className="slide-dots">{slides.map((_, i) => <button key={i} className={i === slide ? 'active' : ''} onClick={() => setSlide(i)} />)}</div>
  </section>;
}

function LessonInteraction({ lesson }) {
  const [comments, setComments] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [comment, setComment] = useState('');
  const [question, setQuestion] = useState({ title: '', message: '' });
  async function load() {
    if (!lesson?.id) return;
    const [c, q] = await Promise.all([
      api.get(`/lessons/${lesson.id}/comments`),
      api.get('/questions')
    ]);
    setComments(c);
    setQuestions(q.filter(x => x.lesson_id === lesson.id));
  }
  useEffect(() => { load().catch(() => {}); }, [lesson?.id]);
  async function sendComment() {
    await api.post(`/lessons/${lesson.id}/comments`, { message: comment });
    setComment('');
    load();
  }
  async function sendQuestion() {
    await api.post('/questions', { lesson_id: lesson.id, ...question });
    setQuestion({ title: '', message: '' });
    load();
  }
  return <div className="interaction-grid">
    <section className="interaction-card">
      <h3><MessageCircle size={17} />Comentários</h3>
      <div className="thread-list">{comments.map(c => <div key={c.id} className="thread-item"><b>{c.user_name}</b><p>{c.message}</p></div>)}</div>
      <textarea placeholder="Comentar aula..." value={comment} onChange={e => setComment(e.target.value)} />
      <button className="primary" disabled={!comment.trim()} onClick={sendComment}>Enviar comentário</button>
    </section>
    <section className="interaction-card">
      <h3><HelpCircle size={17} />Perguntas ao mentor</h3>
      <div className="thread-list">{questions.map(q => <div key={q.id} className="thread-item"><b>{q.title}</b><p>{q.message}</p>{q.answer && <small>Resposta: {q.answer}</small>}</div>)}</div>
      <input placeholder="Título" value={question.title} onChange={e => setQuestion({ ...question, title: e.target.value })} />
      <textarea placeholder="Pergunta..." value={question.message} onChange={e => setQuestion({ ...question, message: e.target.value })} />
      <button className="primary" disabled={!question.message.trim()} onClick={sendQuestion}>Enviar pergunta</button>
    </section>
  </div>;
}

function ModuleQuiz({ module, reload }) {
  const questions = (() => { try { const q = JSON.parse(module.quiz_json || '[]'); return Array.isArray(q) ? q : []; } catch { return []; } })();
  const [answers, setAnswers] = useState([]);
  const [result, setResult] = useState(null);
  if (!questions.length) return null;
  const ready = (module.lessons || []).every(l => l.watched);
  async function submit() {
    const row = await api.post('/quiz/attempts', { module_id: module.id, answers });
    setResult(row);
    reload();
  }
  return <section className="quiz-box">
    <div className="section-head compact"><div><h2>Quiz do módulo</h2><p>Nota mínima {module.min_score || 70}%</p></div>{module.my_quiz_best && <span className="status-pill">{module.my_quiz_best.percent}%</span>}</div>
    {!ready && <div className="error">Conclua todas aulas do módulo para liberar quiz.</div>}
    {questions.map((q, i) => <div className="quiz-question" key={i}>
      <b>{i + 1}. {q.question}</b>
      <div className="quiz-options">{(q.options || []).map((op, idx) => <button key={idx} className={answers[i] === idx ? 'active' : ''} onClick={() => setAnswers(a => { const next = [...a]; next[i] = idx; return next; })}>{op}</button>)}</div>
    </div>)}
    {result && <div className={result.passed ? 'success' : 'error'}>{result.percent}% · {result.passed ? 'aprovado' : 'reprovado'}</div>}
    <button className="primary" disabled={!ready || questions.some((_, i) => answers[i] === undefined)} onClick={submit}>Enviar quiz</button>
  </section>;
}

function escapePdf(text) {
  return String(text || '').replace(/[\\()]/g, '\\$&').replace(/[^\x20-\x7E]/g, '');
}

function downloadPdf(lines, filename) {
  const body = lines.map((line, i) => `BT /F1 ${i ? 16 : 30} Tf 72 ${730 - i * 34} Td (${escapePdf(line)}) Tj ET`).join('\n');
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 842 595] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>',
    `<< /Length ${body.length} >>\nstream\n${body}\nendstream`
  ];
  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach((obj, i) => { offsets.push(pdf.length); pdf += `${i + 1} 0 obj\n${obj}\nendobj\n`; });
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.slice(1).map(o => `${String(o).padStart(10, '0')} 00000 n `).join('\n')}\ntrailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([pdf], { type: 'application/pdf' }));
  a.download = filename;
  a.click();
}

function CertificatePanel({ course }) {
  const [cert, setCert] = useState(null);
  const user = profile();
  async function issue() {
    const row = await api.post('/certificates', { course_id: course.id });
    setCert(row);
  }
  const link = cert ? `${location.origin}${location.pathname}?cert=${cert.code}` : '';
  return <section className="certificate-box">
    <div><h2>Certificado disponível</h2>{cert && <p>Link verificável: {link}</p>}</div>
    <button className="primary" onClick={issue}><Award size={16} />Gerar certificado</button>
    {cert && <button onClick={() => downloadPdf(['Certificado SecondBrain', user?.name || 'Aluno', course.title, `Código: ${cert.code}`, link], `certificado-${cert.code}.pdf`)}><Download size={16} />Download PDF</button>}
  </section>;
}

function ProfilePage({ onUpdate }) {
  const [form, setForm] = useState(profile() || {});
  async function save() {
    const user = await api.put('/me', form);
    saveProfile(user);
    onUpdate(user);
  }
  return <div>
    <header className="topbar"><div><h1>Perfil</h1></div><button className="primary slim" onClick={save}><Save size={16} />Salvar</button></header>
    <div className="admin-card profile-card">
      <ImageField label="Foto do aluno" value={form.avatar_url} onChange={v => setForm({ ...form, avatar_url: v })} />
      <Field label="Nome" value={form.name} onChange={v => setForm({ ...form, name: v })} />
      <Field label="Email" value={form.email} onChange={v => setForm({ ...form, email: v })} />
      <Area label="Bio" value={form.bio} onChange={v => setForm({ ...form, bio: v })} />
      <Field label="Nova senha" type="password" value={form.password || ''} onChange={v => setForm({ ...form, password: v })} />
    </div>
  </div>;
}

function NotificationsPage() {
  const [items, setItems] = useState([]);
  async function load() { setItems(await api.get('/notifications')); }
  useEffect(() => { load(); }, []);
  async function mark(n) {
    if (Number.isFinite(Number(n.id))) await api.put(`/notifications/${n.id}/read`, {});
    load();
  }
  return <div>
    <header className="topbar"><div><h1>Notificações</h1></div></header>
    <div className="admin-stack">{items.map(n => <div className={`admin-card notification ${n.read ? 'read' : ''}`} key={n.id}>
      <div><small>{n.type}</small><h2>{n.title}</h2><p>{n.message}</p></div>
      {!n.read && <button onClick={() => mark(n)}>Marcar lida</button>}
    </div>)}</div>
  </div>;
}

function CommunityPage() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ title: '', message: '' });
  async function load() { setItems(await api.get('/forum')); }
  useEffect(() => { load(); }, []);
  async function send() {
    await api.post('/forum', form);
    setForm({ title: '', message: '' });
    load();
  }
  return <div>
    <header className="topbar"><div><h1>Comunidade</h1></div></header>
    <div className="admin-card">
      <Field label="Título" value={form.title} onChange={v => setForm({ ...form, title: v })} />
      <Area label="Publicação" value={form.message} onChange={v => setForm({ ...form, message: v })} />
      <button className="primary" disabled={!form.message.trim()} onClick={send}>Publicar</button>
    </div>
    <div className="admin-stack mt">{items.map(p => <div className="admin-card" key={p.id}><small>{p.user_name}</small><h2>{p.title}</h2><p>{p.message}</p></div>)}</div>
  </div>;
}

function AdminProgress() {
  const [rows, setRows] = useState([]);
  useEffect(() => { api.get('/admin/progress').then(setRows); }, []);
  return <div>
    <header className="topbar"><div><h1>Progresso dos alunos</h1></div></header>
    <div className="admin-stack">{rows.map(r => <div className="admin-card" key={r.user.id}>
      <h2>{r.user.name}</h2><p>{r.user.email}</p>
      <div className="mini-list">{r.courses.map(c => <div className="mini-row" key={c.id}><span>{c.title}</span><b>{c.progress_percent}%</b><ProgressBar value={c.progress_percent} /></div>)}</div>
      <span className="status-pill">{r.certificates} certificados</span>
    </div>)}</div>
  </div>;
}

function AdminQuestions() {
  const [items, setItems] = useState([]);
  const [answers, setAnswers] = useState({});
  async function load() { setItems(await api.get('/questions')); }
  useEffect(() => { load(); }, []);
  async function answer(q) {
    await api.put(`/questions/${q.id}`, { answer: answers[q.id] || q.answer, status: 'answered' });
    setAnswers({});
    load();
  }
  return <div>
    <header className="topbar"><div><h1>Perguntas</h1></div></header>
    <div className="admin-stack">{items.map(q => <div className="admin-card" key={q.id}>
      <small>{q.user_name} · {q.lesson_title || 'geral'} · {q.status}</small>
      <h2>{q.title}</h2><p>{q.message}</p>
      {q.answer && <div className="answer-box">Resposta atual: {q.answer}</div>}
      <textarea placeholder="Responder mentor..." value={answers[q.id] || ''} onChange={e => setAnswers({ ...answers, [q.id]: e.target.value })} />
      <button className="primary" disabled={!answers[q.id]?.trim()} onClick={() => answer(q)}>Responder</button>
    </div>)}</div>
  </div>;
}

function VerifyCertificate() {
  const code = new URLSearchParams(location.search).get('cert');
  const [cert, setCert] = useState(null);
  const [err, setErr] = useState('');
  useEffect(() => { api.get(`/certificates/verify/${code}`).then(setCert).catch(e => setErr(e.message)); }, [code]);
  return <main className="auth-page"><section className="auth-card">
    <div className="brand-lock"><GraduationCap size={30} /><span>SecondBrain</span></div>
    <h1>Certificado</h1>
    {err && <div className="error">{err}</div>}
    {cert && <><p>Certificado válido.</p><h2>{cert.user_name}</h2><p>{cert.course_title}</p><span className="status-pill">{cert.code}</span></>}
  </section></main>;
}

function Empty({ title, text }) {
  return <div className="empty"><h2>{title}</h2><p>{text}</p></div>;
}

function AdminCourses({ courses, reload }) {
  const [editing, setEditing] = useState(null);
  const [type, setType] = useState('course');
  const empty = { title: '', description: '', cover_url: '', published: true, category: 'Geral', level: 'iniciante', workload: '', access_mode: 'sequential', course_id: '', module_id: '', summary: '', video_url: '', material_url: '', material_links: '', transcript: '', duration: '', quiz_json: '', min_score: 70, order: 1 };
  const [form, setForm] = useState(empty);
  function open(kind, data = {}) { setType(kind); setEditing(data.id || 'new'); setForm({ ...empty, ...data }); }
  async function save() {
    const paths = { course: '/courses', module: '/modules', lesson: '/lessons' };
    if (editing === 'new') await api.post(paths[type], form);
    else await api.put(`${paths[type]}/${editing}`, form);
    setEditing(null); reload();
  }
  async function remove(kind, id) {
    const paths = { course: '/courses', module: '/modules', lesson: '/lessons' };
    if (confirm('Excluir?')) { await api.del(`${paths[kind]}/${id}`); reload(); }
  }
  return <div>
    <header className="topbar"><div><h1>Configurar cursos</h1><p>Cursos, módulos, aulas e links Google Drive/Youtube.</p></div><button className="primary slim" onClick={() => open('course')}><Plus size={16} />Curso</button></header>
    <div className="admin-stack">{courses.map(c => <div className="admin-card" key={c.id}>
      <div className="admin-row">
        <div><h2>{c.title}</h2><p>{c.description}</p></div>
        <div className="actions"><button onClick={() => open('module', { course_id: c.id })}>Módulo</button><button onClick={() => open('course', c)}>Editar</button><button className="danger" onClick={() => remove('course', c.id)}><Trash2 size={15} /></button></div>
      </div>
      {c.modules.map(m => <div className="module-admin" key={m.id}>
        <div className="admin-row compact"><b>{m.title}</b><div className="actions"><button onClick={() => open('lesson', { module_id: m.id })}>Aula</button><button onClick={() => open('module', m)}>Editar</button><button className="danger" onClick={() => remove('module', m.id)}><Trash2 size={15} /></button></div></div>
        {m.lessons.map(l => <div className="lesson-admin" key={l.id}><span>{l.title}</span><small>{l.video_url}</small><div className="actions"><button onClick={() => open('lesson', l)}>Editar</button><button className="danger" onClick={() => remove('lesson', l.id)}><Trash2 size={15} /></button></div></div>)}
      </div>)}
    </div>)}</div>
    {editing && <Modal title={editing === 'new' ? `Novo ${type}` : `Editar ${type}`} onClose={() => setEditing(null)} onSave={save}>
      {type === 'module' && <Select label="Curso" value={form.course_id} onChange={v => setForm({ ...form, course_id: v })} options={courses.map(c => [c.id, c.title])} />}
      {type === 'lesson' && <Select label="Módulo" value={form.module_id} onChange={v => setForm({ ...form, module_id: v })} options={courses.flatMap(c => c.modules.map(m => [m.id, `${c.title} / ${m.title}`]))} />}
      <Field label="Título" value={form.title} onChange={v => setForm({ ...form, title: v })} />
      {(type === 'course' || type === 'module') && <ImageField label="Capa vertical 1080x1920" value={form.cover_url} onChange={v => setForm({ ...form, cover_url: v })} />}
      {type === 'course' && <>
        <Field label="Categoria" value={form.category} onChange={v => setForm({ ...form, category: v })} />
        <Select label="Nível" value={form.level} onChange={v => setForm({ ...form, level: v })} options={[['iniciante', 'iniciante'], ['intermediário', 'intermediário'], ['avançado', 'avançado']]} />
        <Field label="Carga horária" value={form.workload} onChange={v => setForm({ ...form, workload: v })} />
        <Select label="Liberação das aulas" value={form.access_mode} onChange={v => setForm({ ...form, access_mode: v })} options={[['sequential', 'sequencial'], ['free', 'livre']]} />
      </>}
      {type !== 'lesson' && <Area label="Descrição" value={form.description} onChange={v => setForm({ ...form, description: v })} />}
      {type === 'module' && <>
        <Field label="Nota mínima do quiz (%)" type="number" value={form.min_score} onChange={v => setForm({ ...form, min_score: Number(v) })} />
        <Area label="Quiz JSON" value={form.quiz_json} onChange={v => setForm({ ...form, quiz_json: v })} />
      </>}
      {type === 'lesson' && <>
        <Field label="Duração" value={form.duration} onChange={v => setForm({ ...form, duration: v })} />
        <Field label="Youtube ou Google Drive" value={form.video_url} onChange={v => setForm({ ...form, video_url: v })} />
        <ImageField label="Material complementar (PDF/imagem/link)" value={form.material_url} onChange={v => setForm({ ...form, material_url: v })} accept="image/*,.pdf" />
        <Area label="Links de apoio (um por linha)" value={form.material_links} onChange={v => setForm({ ...form, material_links: v })} />
        <Area label="Transcrição / legenda" value={form.transcript} onChange={v => setForm({ ...form, transcript: v })} />
        <Area label="Resumo" value={form.summary} onChange={v => setForm({ ...form, summary: v })} />
      </>}
      <Field label="Ordem" type="number" value={form.order} onChange={v => setForm({ ...form, order: Number(v) })} />
    </Modal>}
  </div>;
}

function UsersAdmin() {
  const [users, setUsers] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', password: '', is_admin: false });
  async function load() { setUsers(await api.get('/users')); }
  useEffect(() => { load(); }, []);
  function open(u) { setEditing(u?.id || 'new'); setForm({ name: u?.name || '', email: u?.email || '', password: '', is_admin: !!u?.is_admin }); }
  async function save() {
    if (editing === 'new') await api.post('/users', form);
    else await api.put(`/users/${editing}`, form);
    setEditing(null); load();
  }
  return <div><header className="topbar"><div><h1>Usuários</h1></div><button className="primary slim" onClick={() => open()}><Plus size={16} />Usuário</button></header>
    <div className="table">{users.map(u => <div className="table-row" key={u.id}><div className="avatar">{u.name[0]}</div><div><b>{u.name}</b><small>{u.email || 'sem email'} · {u.is_admin ? 'admin' : 'aluno'}</small></div><button onClick={() => open(u)}>Editar</button>{!u.is_super && <button className="danger" onClick={async () => { await api.del(`/users/${u.id}`); load(); }}>Excluir</button>}</div>)}</div>
    {editing && <Modal title={editing === 'new' ? 'Novo usuário' : 'Editar usuário'} onClose={() => setEditing(null)} onSave={save}>
      <Field label="Nome" value={form.name} onChange={v => setForm({ ...form, name: v })} />
      <Field label="Email" value={form.email} onChange={v => setForm({ ...form, email: v })} />
      <Field label="Senha" type="password" value={form.password} onChange={v => setForm({ ...form, password: v })} />
      <div className="role-switch">
        <button type="button" className={!form.is_admin ? 'active' : ''} onClick={() => setForm({ ...form, is_admin: false })}>User</button>
        <button type="button" className={form.is_admin ? 'active' : ''} onClick={() => setForm({ ...form, is_admin: true })}>Admin</button>
      </div>
    </Modal>}
  </div>;
}

function SuggestionsAdmin() {
  const [items, setItems] = useState([]);
  async function load() { setItems(await api.get('/suggestions')); }
  useEffect(() => { load(); }, []);
  async function remove(id) {
    if (!confirm('Excluir sugestão?')) return;
    await api.del(`/suggestions/${id}`);
    load();
  }
  return <div><header className="topbar"><div><h1>Sugestões</h1></div></header>
    <div className="admin-stack">{items.map(s => <div className="admin-card suggestion" key={s.id}>
      <div><small>{s.user_name} · {s.lesson_title || 'geral'}</small><h2>{s.title}</h2><p>{s.message}</p></div>
      <div className="suggestion-controls">
        <select className="status-select" value={s.status} onChange={async e => { await api.put(`/suggestions/${s.id}`, { status: e.target.value }); load(); }}>
          <option value="open">em análise</option>
          <option value="planned">implementando</option>
          <option value="done">implementada</option>
          <option value="rejected">rejeitada</option>
        </select>
        <button className="danger" onClick={() => remove(s.id)}><Trash2 size={15} />Excluir</button>
      </div>
    </div>)}</div>
  </div>;
}

function UserSuggestions() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ title: '', message: '' });
  async function load() { setItems(await api.get('/me/suggestions')); }
  useEffect(() => { load(); }, []);
  async function send() {
    await api.post('/suggestions', { title: form.title || 'Sugestão', message: form.message });
    setForm({ title: '', message: '' });
    load();
  }
  const label = { open: 'em análise', planned: 'implementando', done: 'implementada', rejected: 'rejeitada' };
  return <div>
    <header className="topbar"><div><h1>Sugestões</h1></div></header>
    <div className="admin-card suggestion-form">
      <Field label="Título" value={form.title} onChange={v => setForm({ ...form, title: v })} />
      <Area label="Sugestão" value={form.message} onChange={v => setForm({ ...form, message: v })} />
      <button className="primary" disabled={!form.message.trim()} onClick={send}><Lightbulb size={16} />Enviar sugestão</button>
    </div>
    <div className="admin-stack" style={{ marginTop: 16 }}>
      {items.map(s => <div className="admin-card suggestion" key={s.id}><div><small>{s.lesson_title || 'geral'}</small><h2>{s.title}</h2><p>{s.message}</p></div><span className="status-pill">{label[s.status] || s.status}</span></div>)}
    </div>
  </div>;
}

function FeedbackAdmin() {
  const [data, setData] = useState({ suggestions: [], ratings: [] });
  useEffect(() => { api.get('/feedback').then(setData); }, []);
  return <div>
    <header className="topbar"><div><h1>Avaliações</h1><p>Avaliações, textos e sugestões em um lugar.</p></div></header>
    <div className="admin-stack">
      {data.ratings.map(r => <div className="admin-card suggestion" key={`r-${r.id}`}>
        <div><small>{r.user_name} · {r.lesson_title}</small><h2>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</h2><p>{r.comment || 'Sem texto.'}</p></div>
      </div>)}
      {data.suggestions.map(s => <div className="admin-card suggestion" key={`s-${s.id}`}>
        <div><small>{s.user_name} · {s.lesson_title || 'geral'}</small><h2>{s.title}</h2><p>{s.message}</p></div><span className="status-pill">{s.status}</span>
      </div>)}
    </div>
  </div>;
}

function SettingsAdmin() {
  const [settings, setSettings] = useState({ slides: [] });
  const [pendingSlide, setPendingSlide] = useState('');
  useEffect(() => { api.get('/settings').then(setSettings); }, []);
  function addSlide(url) {
    setSettings({ ...settings, slides: [...(settings.slides || []), { image_url: url }] });
    setPendingSlide('');
  }
  async function save() {
    await api.put('/settings', settings);
  }
  return <div>
    <header className="topbar"><div><h1>Configurações</h1></div><button className="primary slim" onClick={save}><Save size={16} />Salvar</button></header>
    <div className="admin-card">
      <ImageField label="Novo slide 1920x1080" value={pendingSlide} onChange={setPendingSlide} />
      <button className="primary add-slide-btn" disabled={!pendingSlide} onClick={() => addSlide(pendingSlide)}><Plus size={16} />Adicionar slide</button>
      <div className="slides-admin">
        {(settings.slides || []).map((s, i) => <div key={i} className="slide-admin-item">
          <img src={s.image_url} />
          <button className="danger" onClick={() => setSettings({ ...settings, slides: settings.slides.filter((_, idx) => idx !== i) })}><Trash2 size={15} /></button>
        </div>)}
      </div>
    </div>
  </div>;
}

function Field({ label, value, onChange, type = 'text' }) {
  return <><label>{label}</label><input type={type} value={value || ''} onChange={e => onChange(e.target.value)} /></>;
}
function Area({ label, value, onChange }) {
  return <><label>{label}</label><textarea value={value || ''} onChange={e => onChange(e.target.value)} /></>;
}
function Select({ label, value, onChange, options }) {
  return <><label>{label}</label><select value={value || ''} onChange={e => onChange(e.target.value)}><option value="">Selecione</option>{options.map(([v, t]) => <option key={v} value={v}>{t}</option>)}</select></>;
}
function fileToDataUrl(file, cb) {
  if (file.type === 'application/pdf') {
    const reader = new FileReader();
    reader.onload = () => cb(reader.result);
    reader.readAsDataURL(file);
    return;
  }
  if (!file.type.startsWith('image/')) return;
  const img = document.createElement('img');
  const reader = new FileReader();
  reader.onload = () => {
    img.onload = () => {
      const max = 1600;
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      cb(canvas.toDataURL('image/jpeg', 0.82));
    };
    img.src = reader.result;
  };
  reader.readAsDataURL(file);
}
function ImageField({ label, value, onChange, accept = 'image/*' }) {
  const [loading, setLoading] = useState(false);
  function handleFile(file) {
    if (!file) return;
    setLoading(true);
    fileToDataUrl(file, url => {
      onChange(url);
      setLoading(false);
    });
  }
  return <div className="image-field">
    <label>{label}</label>
    <label className="file-picker">
      <Image size={17} />
      <span>{loading ? 'Processando...' : 'Selecionar imagem'}</span>
      <input type="file" accept={accept} onChange={e => handleFile(e.target.files?.[0])} />
    </label>
    {loading && <div className="upload-progress"><span /></div>}
    <input placeholder="ou cole URL da imagem" value={value || ''} onChange={e => onChange(e.target.value)} />
    {value && (String(value).startsWith('data:application/pdf') || String(value).toLowerCase().endsWith('.pdf')
      ? <a className="material-link" href={value} target="_blank" rel="noreferrer">Abrir material</a>
      : <img src={value} />)}
  </div>;
}
function Modal({ title, children, onClose, onSave }) {
  return <div className="modal-bg"><div className="modal"><h2>{title}</h2>{children}<div className="modal-actions"><button onClick={onClose}>Cancelar</button><button className="primary" onClick={onSave}><Save size={16} />Salvar</button></div></div></div>;
}

function App() {
  const [user, setUser] = useState(profile());
  const [tab, setTab] = useState('dashboard');
  const [courses, setCourses] = useState([]);
  async function load() { if (token()) setCourses(await api.get('/courses')); }
  useEffect(() => { load().catch(logout); }, [user]);
  if (new URLSearchParams(location.search).get('cert')) return <VerifyCertificate />;
  if (!user) return <Login onLogin={() => setUser(profile())} />;
  return <Shell tab={tab} setTab={setTab} user={user}>
    {tab === 'dashboard' && <Dashboard courses={courses} user={user} />}
    {tab === 'learn' && <Learn courses={courses} reload={load} />}
    {tab === 'community' && <CommunityPage />}
    {tab === 'notifications' && <NotificationsPage />}
    {tab === 'profile' && <ProfilePage onUpdate={setUser} />}
    {tab === 'my-suggestions' && <UserSuggestions />}
    {tab === 'admin' && <AdminCourses courses={courses} reload={load} />}
    {tab === 'users' && <UsersAdmin />}
    {tab === 'admin-progress' && <AdminProgress />}
    {tab === 'admin-questions' && <AdminQuestions />}
    {tab === 'feedback' && <FeedbackAdmin />}
    {tab === 'suggestions' && <SuggestionsAdmin />}
    {tab === 'settings' && <SettingsAdmin />}
  </Shell>;
}

createRoot(document.getElementById('root')).render(<App />);
