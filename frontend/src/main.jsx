import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BookOpen, GraduationCap, Image, LayoutDashboard, Lightbulb, LogOut, Play, Plus, Save, Star, Trash2, Users } from 'lucide-react';
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
  const [form, setForm] = useState({ identifier: '', password: '' });
  const [err, setErr] = useState('');
  async function submit(e) {
    e.preventDefault(); setErr('');
    try {
      const data = await api.post('/auth/login', form);
      setSession(data); onLogin();
    } catch (e) { setErr(e.message); }
  }
  return <main className="auth-page">
    <form className="auth-card" onSubmit={submit}>
      <div className="brand-lock"><GraduationCap size={30} /><span>SecondBrain</span></div>
      <h1>Acesso interno</h1>
      <p>Plataforma de cursos da empresa.</p>
      {err && <div className="error">{err}</div>}
      <label>Usuário ou email</label>
      <input autoFocus value={form.identifier} onChange={e => setForm({ ...form, identifier: e.target.value })} />
      <label>Senha</label>
      <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
      <button className="primary">Entrar</button>
    </form>
  </main>;
}

function Shell({ children, tab, setTab, user }) {
  const nav = user?.is_admin
    ? [['learn', BookOpen, 'Aulas'], ['admin', LayoutDashboard, 'Cursos'], ['users', Users, 'Usuários'], ['feedback', Star, 'Avaliações'], ['suggestions', Lightbulb, 'Sugestões'], ['settings', Image, 'Configurações']]
    : [['learn', BookOpen, 'Aulas']];
  return <div className="app">
    <aside>
      <div className="brand"><GraduationCap /><span>SecondBrain</span></div>
      <nav>{nav.map(([id, Icon, label]) =>
        <button key={id} className={tab === id ? 'active' : ''} onClick={() => setTab(id)}><Icon size={18} />{label}</button>
      )}</nav>
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

function Learn({ courses, reload }) {
  const [settings, setSettings] = useState({ slides: [] });
  const [slide, setSlide] = useState(0);
  const [courseId, setCourseId] = useState(null);
  const course = courses.find(c => c.id === courseId);
  const lessons = course?.modules.flatMap(m => m.lessons.map(l => ({ ...l, module_title: m.title }))) || [];
  const [moduleId, setModuleId] = useState(null);
  const module = course?.modules.find(m => m.id === moduleId);
  const moduleLessons = module?.lessons || [];
  const [lessonId, setLessonId] = useState(null);
  const lesson = lessons.find(l => l.id === lessonId) || lessons[0];
  const [suggest, setSuggest] = useState('');
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
  async function sendSuggestion() {
    await api.post('/suggestions', { lesson_id: lesson?.id, title: 'Sugestão de aula', message: suggest });
    setSuggest('');
  }
  if (!courses.length) return <Empty title="Nenhum curso" text="Admin precisa criar cursos." />;
  if (!course) return <div className="learn-page">
    <HeroSlider slides={settings.slides || []} slide={slide} setSlide={setSlide} />
    <div className="continue-row">
      <button className="primary continue-btn" onClick={() => continueWhereStopped(courses[0])}><Play size={17} />Continuar de onde parou</button>
    </div>
    <header className="section-head"><div><h2>Cursos disponíveis</h2><p>Escolha curso para ver módulos.</p></div></header>
    <div className="poster-grid">
      {courses.map(c => <button key={c.id} className="poster-card" onClick={() => setCourseId(c.id)}>
        <img src={c.cover_url || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80'} />
        <div><h3>{c.title}</h3><p>{c.description}</p><small>{c.modules.length} módulos</small></div>
      </button>)}
    </div>
  </div>;
  if (!module) return <div className="learn-page">
    <button className="back-btn" onClick={() => setCourseId(null)}>Voltar</button>
    <header className="section-head"><div><h2>{course.title}</h2><p>Módulos</p></div><button className="primary slim" onClick={() => continueWhereStopped(course)}><Play size={16} />Continuar de onde parou</button></header>
    <div className="poster-grid">
      {course.modules.map(m => <button key={m.id} className="poster-card" onClick={() => setModuleId(m.id)}>
        <img src={m.cover_url || course.cover_url || 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=900&q=80'} />
        <div><h3>{m.title}</h3><p>{m.description}</p><small>{m.lessons.length} aulas</small></div>
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
          <div className="suggest-box">
            <textarea placeholder="Sugerir nova aula, ajuste ou material..." value={suggest} onChange={e => setSuggest(e.target.value)} />
            <button disabled={!suggest.trim()} onClick={sendSuggestion}><Lightbulb size={16} />Enviar sugestão</button>
          </div>
        </> : <Empty title="Curso vazio" text="Sem aulas cadastradas." />}
      </div>
      <div className="lesson-list">
        <div className="module">
          <h3>Aulas</h3>
          {moduleLessons.map(l => <button key={l.id} className={lesson?.id === l.id ? 'lesson active' : 'lesson'} onClick={() => setLessonId(l.id)}>
            <Play size={15} /><span>{l.title}</span><small>{l.watched ? 'feito' : l.duration}</small>
          </button>)}
        </div>
      </div>
    </div>
  </div>;
}

function HeroSlider({ slides, slide, setSlide }) {
  const active = slides[slide];
  if (!active) return <section className="mentor-hero empty-hero"><div><div className="hero-pill">SecondBrain</div><h1>Cursos internos</h1><p>Configure slides em Configurações.</p></div></section>;
  return <section className="hero-slider">
    <img src={active.image_url} />
    <div className="slide-dots">{slides.map((_, i) => <button key={i} className={i === slide ? 'active' : ''} onClick={() => setSlide(i)} />)}</div>
  </section>;
}

function Empty({ title, text }) {
  return <div className="empty"><h2>{title}</h2><p>{text}</p></div>;
}

function AdminCourses({ courses, reload }) {
  const [editing, setEditing] = useState(null);
  const [type, setType] = useState('course');
  const empty = { title: '', description: '', cover_url: '', published: true, course_id: '', module_id: '', summary: '', video_url: '', duration: '', order: 1 };
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
      {type !== 'lesson' && <Area label="Descrição" value={form.description} onChange={v => setForm({ ...form, description: v })} />}
      {type === 'lesson' && <>
        <Field label="Duração" value={form.duration} onChange={v => setForm({ ...form, duration: v })} />
        <Field label="Youtube ou Google Drive" value={form.video_url} onChange={v => setForm({ ...form, video_url: v })} />
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
  return <div><header className="topbar"><div><h1>Usuários</h1><p>Mesmo padrão administrativo do Biblio.</p></div><button className="primary slim" onClick={() => open()}><Plus size={16} />Usuário</button></header>
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
  return <div><header className="topbar"><div><h1>Sugestões</h1><p>Pedidos enviados por usuários.</p></div></header>
    <div className="admin-stack">{items.map(s => <div className="admin-card suggestion" key={s.id}><div><small>{s.user_name} · {s.lesson_title || 'geral'}</small><h2>{s.title}</h2><p>{s.message}</p></div><select value={s.status} onChange={async e => { await api.put(`/suggestions/${s.id}`, { status: e.target.value }); load(); }}><option value="open">aberta</option><option value="planned">planejada</option><option value="done">feita</option><option value="rejected">recusada</option></select></div>)}</div>
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
  useEffect(() => { api.get('/settings').then(setSettings); }, []);
  function addSlide(url) {
    setSettings({ ...settings, slides: [...(settings.slides || []), { image_url: url }] });
  }
  async function save() {
    await api.put('/settings', settings);
  }
  return <div>
    <header className="topbar"><div><h1>Configurações</h1><p>Slides 1920x1080 da tela inicial.</p></div><button className="primary slim" onClick={save}><Save size={16} />Salvar</button></header>
    <div className="admin-card">
      <ImageField label="Novo slide 1920x1080" value="" onChange={addSlide} />
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
  const reader = new FileReader();
  reader.onload = () => cb(reader.result);
  reader.readAsDataURL(file);
}
function ImageField({ label, value, onChange }) {
  return <div className="image-field">
    <label>{label}</label>
    <label className="file-picker">
      <Image size={17} />
      <span>Selecionar imagem</span>
      <input type="file" accept="image/*" onChange={e => e.target.files?.[0] && fileToDataUrl(e.target.files[0], onChange)} />
    </label>
    <input placeholder="ou cole URL da imagem" value={value || ''} onChange={e => onChange(e.target.value)} />
    {value && <img src={value} />}
  </div>;
}
function Modal({ title, children, onClose, onSave }) {
  return <div className="modal-bg"><div className="modal"><h2>{title}</h2>{children}<div className="modal-actions"><button onClick={onClose}>Cancelar</button><button className="primary" onClick={onSave}><Save size={16} />Salvar</button></div></div></div>;
}

function App() {
  const [user, setUser] = useState(profile());
  const [tab, setTab] = useState('learn');
  const [courses, setCourses] = useState([]);
  async function load() { if (token()) setCourses(await api.get('/courses')); }
  useEffect(() => { load().catch(logout); }, [user]);
  if (!user) return <Login onLogin={() => setUser(profile())} />;
  return <Shell tab={tab} setTab={setTab} user={user}>
    {tab === 'learn' && <Learn courses={courses} reload={load} />}
    {tab === 'admin' && <AdminCourses courses={courses} reload={load} />}
    {tab === 'users' && <UsersAdmin />}
    {tab === 'feedback' && <FeedbackAdmin />}
    {tab === 'suggestions' && <SuggestionsAdmin />}
    {tab === 'settings' && <SettingsAdmin />}
  </Shell>;
}

createRoot(document.getElementById('root')).render(<App />);
