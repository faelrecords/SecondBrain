import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BookOpen, Flame, GraduationCap, LayoutDashboard, Lightbulb, LogOut, Palette, Play, Plus, Save, Sparkles, Star, Trash2, Users, Waves } from 'lucide-react';
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

function Shell({ children, tab, setTab, user, tone, setTone }) {
  const nav = user?.is_admin
    ? [['learn', BookOpen, 'Aulas'], ['admin', LayoutDashboard, 'Cursos'], ['users', Users, 'Usuários'], ['suggestions', Lightbulb, 'Sugestões']]
    : [['learn', BookOpen, 'Aulas']];
  return <div className="app">
    <aside>
      <div className="brand"><GraduationCap /><span>SecondBrain</span></div>
      <nav>{nav.map(([id, Icon, label]) =>
        <button key={id} className={tab === id ? 'active' : ''} onClick={() => setTab(id)}><Icon size={18} />{label}</button>
      )}</nav>
      <div className="side-bottom">
        <button className="tone-toggle" onClick={() => setTone(tone === 'aqua' ? 'red' : 'aqua')}>
          {tone === 'aqua' ? <Waves size={18} /> : <Flame size={18} />}
          {tone === 'aqua' ? 'Cyano' : 'Vermelho'}
        </button>
        <button className="logout" onClick={logout}><LogOut size={18} />Sair</button>
      </div>
    </aside>
    <section className="main">{children}</section>
  </div>;
}

function Stars({ value, onChange }) {
  return <div className="stars">{[1, 2, 3, 4, 5].map(n =>
    <button key={n} className={n <= value ? 'on' : ''} onClick={() => onChange(n)}><Star size={18} fill="currentColor" /></button>
  )}</div>;
}

function Learn({ courses, reload }) {
  const [courseId, setCourseId] = useState(courses[0]?.id);
  const course = courses.find(c => c.id === courseId) || courses[0];
  const lessons = course?.modules.flatMap(m => m.lessons.map(l => ({ ...l, module_title: m.title }))) || [];
  const [lessonId, setLessonId] = useState(lessons[0]?.id);
  const lesson = lessons.find(l => l.id === lessonId) || lessons[0];
  const [suggest, setSuggest] = useState('');
  useEffect(() => { if (!lessonId && lessons[0]) setLessonId(lessons[0].id); }, [courseId, courses]);
  async function rate(n) { await api.post('/ratings', { lesson_id: lesson.id, rating: n }); reload(); }
  async function sendSuggestion() {
    await api.post('/suggestions', { lesson_id: lesson?.id, title: 'Sugestão de aula', message: suggest });
    setSuggest('');
  }
  if (!course) return <Empty title="Nenhum curso" text="Admin precisa criar cursos." />;
  return <div className="learn-page">
    <section className="mentor-hero">
      <div className="hero-grid-bg" />
      <div className="hero-copy">
        <div className="hero-pill"><Sparkles size={14} /> MentoriaWeb</div>
        <h1>Aprenda processos internos com aulas diretas e organizadas</h1>
        <p>Escolha um curso, avance por módulos, assista pela plataforma, avalie aulas e peça novas adições.</p>
      </div>
      <div className="hero-orbit">
        <div className="orbit-ring" />
        <div className="orbit-card main-orbit"><GraduationCap size={34} /><span>Mentoria</span></div>
        <div className="orbit-card mini one"><BookOpen size={20} /></div>
        <div className="orbit-card mini two"><Star size={20} /></div>
        <div className="orbit-card mini three"><Lightbulb size={20} /></div>
      </div>
    </section>
    <header className="section-head">
      <div><h2>Cursos disponíveis</h2><p>Tela inicial de mentoria.</p></div>
    </header>
    <div className="learn-grid">
      <div className="course-list">
        {courses.map(c => <button key={c.id} className={c.id === course.id ? 'course active' : 'course'} onClick={() => { setCourseId(c.id); setLessonId(null); }}>
          <img src={c.cover_url || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80'} />
          <span>{c.title}</span><small>{c.modules.reduce((n, m) => n + m.lessons.length, 0)} aulas</small>
        </button>)}
      </div>
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
            <Stars value={lesson.my_rating || 0} onChange={rate} />
          </div>
          <div className="suggest-box">
            <textarea placeholder="Sugerir nova aula, ajuste ou material..." value={suggest} onChange={e => setSuggest(e.target.value)} />
            <button disabled={!suggest.trim()} onClick={sendSuggestion}><Lightbulb size={16} />Enviar sugestão</button>
          </div>
        </> : <Empty title="Curso vazio" text="Sem aulas cadastradas." />}
      </div>
      <div className="lesson-list">
        {course.modules.map(m => <div key={m.id} className="module">
          <h3>{m.title}</h3>
          {m.lessons.map(l => <button key={l.id} className={lesson?.id === l.id ? 'lesson active' : 'lesson'} onClick={() => setLessonId(l.id)}>
            <Play size={15} /><span>{l.title}</span><small>{l.duration}</small>
          </button>)}
        </div>)}
      </div>
    </div>
  </div>;
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
      {type === 'course' && <Field label="Capa URL" value={form.cover_url} onChange={v => setForm({ ...form, cover_url: v })} />}
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
      <label className="check"><input type="checkbox" checked={form.is_admin} onChange={e => setForm({ ...form, is_admin: e.target.checked })} /> Administrador</label>
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

function Field({ label, value, onChange, type = 'text' }) {
  return <><label>{label}</label><input type={type} value={value || ''} onChange={e => onChange(e.target.value)} /></>;
}
function Area({ label, value, onChange }) {
  return <><label>{label}</label><textarea value={value || ''} onChange={e => onChange(e.target.value)} /></>;
}
function Select({ label, value, onChange, options }) {
  return <><label>{label}</label><select value={value || ''} onChange={e => onChange(e.target.value)}><option value="">Selecione</option>{options.map(([v, t]) => <option key={v} value={v}>{t}</option>)}</select></>;
}
function Modal({ title, children, onClose, onSave }) {
  return <div className="modal-bg"><div className="modal"><h2>{title}</h2>{children}<div className="modal-actions"><button onClick={onClose}>Cancelar</button><button className="primary" onClick={onSave}><Save size={16} />Salvar</button></div></div></div>;
}

function App() {
  const [user, setUser] = useState(profile());
  const [tab, setTab] = useState('learn');
  const [tone, setTone] = useState(localStorage.getItem('tone') || 'aqua');
  const [courses, setCourses] = useState([]);
  async function load() { if (token()) setCourses(await api.get('/courses')); }
  useEffect(() => { load().catch(logout); }, [user]);
  useEffect(() => { localStorage.setItem('tone', tone); }, [tone]);
  if (!user) return <Login onLogin={() => setUser(profile())} />;
  return <div className={tone === 'red' ? 'tone-red' : ''}><Shell tab={tab} setTab={setTab} user={user} tone={tone} setTone={setTone}>
    {tab === 'learn' && <Learn courses={courses} reload={load} />}
    {tab === 'admin' && <AdminCourses courses={courses} reload={load} />}
    {tab === 'users' && <UsersAdmin />}
    {tab === 'suggestions' && <SuggestionsAdmin />}
  </Shell></div>;
}

createRoot(document.getElementById('root')).render(<App />);
