import { useEffect, useMemo, useState } from 'react'
import {
  BrowserRouter,
  Link,
  Navigate,
  NavLink,
  Outlet,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useOutletContext,
  useParams,
} from 'react-router-dom'
import {
  Activity,
  ArrowDownRight,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CalendarDays,
  Check,
  ChevronDown,
  CircleHelp,
  Download,
  GraduationCap,
  LayoutDashboard,
  LockKeyhole,
  LogOut,
  Mail,
  Menu,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  UserRound,
  UsersRound,
  X,
} from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatScore, getGrade, getStatistics, getStudentAverage, PASS_MARK } from './utils/calculations'
import {
  authenticateAccount,
  clearSession,
  loadSession,
  loadStudents,
  registerAccount,
  saveSession,
  saveStudents,
} from './utils/storage'
import './App.css'

const navigation = [
  { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
  { label: 'Students', to: '/students', icon: UsersRound },
  { label: 'Add student', to: '/students/new', icon: Plus },
  { label: 'Reports', to: '/reports', icon: Activity },
]

const pageTitles = {
  '/dashboard': 'Dashboard',
  '/students': 'Student directory',
  '/students/new': 'Add a student',
  '/reports': 'Academic reports',
}

function dateLabel(value, options = { month: 'short', day: 'numeric', year: 'numeric' }) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('en', options).format(new Date(value))
}

function createStudentId(students) {
  let id
  do {
    id = `STU-${new Date().getFullYear()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`
  } while (students.some((student) => student.id === id))
  return id
}

function Avatar({ name = 'Student', size = 'regular' }) {
  const initials = name.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase()
  return <span className={`avatar avatar-${size}`} aria-hidden="true">{initials}</span>
}

function Button({ children, variant = 'primary', className = '', ...props }) {
  return <button className={`button button-${variant} ${className}`} {...props}>{children}</button>
}

function EmptyState({ title, description, action }) {
  return (
    <div className="empty-state">
      <span className="empty-icon"><UsersRound size={20} /></span>
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  )
}

function GradeBadge({ score }) {
  const grade = getGrade(score)
  if (!grade) return <span className="badge badge-neutral">Not graded</span>
  const tone = grade === 'F' ? 'danger' : grade === 'D' ? 'warning' : 'success'
  return <span className={`badge badge-${tone}`}>Grade {grade}</span>
}

function StatCard({ label, value, note, icon: Icon, tone, trend }) {
  return (
    <article className={`stat-card stat-${tone}`}>
      <div className="stat-topline">
        <span className="stat-icon"><Icon size={18} strokeWidth={2} /></span>
        <span className="stat-trend">{trend}</span>
      </div>
      <p className="stat-label">{label}</p>
      <div className="stat-value">{value}</div>
      <p className="stat-note">{note}</p>
    </article>
  )
}

function App() {
  const [students, setStudents] = useState(loadStudents)
  const [user, setUser] = useState(loadSession)

  useEffect(() => saveStudents(students), [students])

  function signIn(nextUser) {
    saveSession(nextUser)
    setUser(nextUser)
  }

  function signOut() {
    clearSession()
    setUser(null)
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <AuthPage onAuthenticated={signIn} />} />
        <Route element={<AuthenticatedLayout user={user} onLogout={signOut} students={students} setStudents={setStudents} />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="students" element={<StudentList />} />
          <Route path="students/new" element={<StudentEditor />} />
          <Route path="students/:studentId" element={<StudentDetails />} />
          <Route path="students/:studentId/edit" element={<StudentEditor />} />
          <Route path="reports" element={<Reports />} />
        </Route>
        <Route path="*" element={<Navigate to={user ? '/dashboard' : '/login'} replace />} />
      </Routes>
    </BrowserRouter>
  )
}

function AuthPage({ onAuthenticated }) {
  const [isRegister, setIsRegister] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    const normalizedEmail = email.trim()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setError('Enter a valid email address.')
      return
    }
    if (password.length < 8) {
      setError('Password must contain at least 8 characters.')
      return
    }
    if (isRegister && name.trim().length < 2) {
      setError('Enter your full name to create an account.')
      return
    }

    setIsSubmitting(true)
    try {
      const nextUser = isRegister
        ? await registerAccount({ name, email: normalizedEmail, password })
        : await authenticateAccount(normalizedEmail, password)
      if (!nextUser) {
        setError('That email and password combination was not found. Check your details and try again.')
        return
      }
      onAuthenticated(nextUser)
      navigate('/dashboard', { replace: true })
    } catch (submitError) {
      setError(submitError.message || 'We could not complete that request. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-panel">
        <div className="auth-form-wrap">
          <span className="auth-logo"><GraduationCap size={38} /></span>
          <h1>{isRegister ? 'Create your account' : 'Student Management System'}</h1>
          <p className="auth-description">{isRegister ? 'Set up a local demo account to get started.' : 'Manage students efficiently'}</p>
          <form onSubmit={handleSubmit} className="auth-form">
            {isRegister && (
              <label className="field-label">Full name
                <input autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Maya Johnson" required />
              </label>
            )}
            <label className="field-label">Email address
              <span className="input-with-icon"><Mail size={16} /><input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@intango.edu" required /></span>
            </label>
            <label className="field-label">Password
              <span className="input-with-icon"><LockKeyhole size={16} /><input type="password" autoComplete={isRegister ? 'new-password' : 'current-password'} value={password} onChange={(event) => setPassword(event.target.value)} placeholder={isRegister ? 'At least 8 characters' : 'Enter your password'} required minLength={8} /></span>
            </label>
            {error && <p className="form-error" role="alert">{error}</p>}
            <Button type="submit" disabled={isSubmitting} className="auth-submit">{isSubmitting ? 'Please wait…' : isRegister ? 'Create account' : 'Login'}</Button>
          </form>
          <p className="auth-switch">{isRegister ? 'Already have an account?' : 'New to the workspace?'} <button type="button" onClick={() => { setIsRegister(!isRegister); setError('') }}>{isRegister ? 'Sign in' : 'Create an account'}</button></p>
        </div>
      </section>
    </main>
  )
}

function AuthenticatedLayout({ user, onLogout, students, setStudents }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const title = pageTitles[location.pathname] || (location.pathname.endsWith('/edit') ? 'Edit student' : location.pathname.startsWith('/students/') ? 'Student details' : 'Academic reports')

  if (!user) return <Navigate to="/login" replace />

  function handleLogout() {
    onLogout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="app-shell">
      <aside className={`sidebar ${menuOpen ? 'sidebar-open' : ''}`}>
        <Link className="sidebar-brand" to="/dashboard">
          <span className="brand-mark"><GraduationCap size={22} /></span>
          <span><strong>intango</strong><small>STUDENT PORTAL</small></span>
        </Link>
        <div className="nav-caption">WORKSPACE</div>
        <nav className="primary-nav" aria-label="Main navigation">
          {navigation.map(({ label, to, icon: Icon }) => (
            <NavLink key={to} to={to} end={to === '/students'} className={({ isActive }) => {
              const isStudentPage = label === 'Students'
                && location.pathname.startsWith('/students/')
                && !location.pathname.startsWith('/students/new')
              return `nav-link ${isActive || isStudentPage ? 'nav-active' : ''}`
            }} onClick={() => setMenuOpen(false)}>
              <Icon size={18} strokeWidth={1.8} /><span>{label}</span>{label === 'Add student' && <span className="nav-add"><Plus size={14} /></span>}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-spacer" />
        <div className="sidebar-help"><CircleHelp size={17} /><span><strong>Need a hand?</strong><small>Ask your school admin</small></span></div>
        <button className="logout-button" type="button" onClick={handleLogout}><LogOut size={17} /><span>Sign out</span></button>
        <div className="sidebar-version">INTANGO TSS <span>•</span> 1.0.0</div>
      </aside>
      <div className="main-column">
        <header className="topbar">
          <button type="button" className="mobile-menu" aria-label="Toggle navigation" onClick={() => setMenuOpen(!menuOpen)}><Menu size={20} /></button>
          <div className="breadcrumb"><span>Workspace</span><span className="crumb-slash">/</span><strong>{title}</strong></div>
          <div className="topbar-right"><span className="today-label"><CalendarDays size={15} /> {dateLabel(new Date(), { weekday: 'short', month: 'short', day: 'numeric' })}</span><span className="topbar-divider" /><button className="user-menu" type="button" onClick={handleLogout} title="Sign out"><Avatar name={user.name} /><span><strong>{user.name}</strong><small>Administrator</small></span><ChevronDown size={15} /></button></div>
        </header>
        <main className="page-content"><Outlet context={{ students, setStudents, user }} /></main>
      </div>
    </div>
  )
}

function Dashboard() {
  const { students, user } = useOutletContext()
  const stats = useMemo(() => getStatistics(students), [students])
  const recent = [...students].sort((a, b) => new Date(b.registeredAt) - new Date(a.registeredAt)).slice(0, 5)
  const chartData = stats.distribution.filter((item) => item.value > 0)

  return (
    <div className="page-stack">
      <div className="welcome-row"><div><p className="eyebrow">{dateLabel(new Date(), { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).toUpperCase()} <span className="eyebrow-dot" /></p><h1>Good morning, {user.name.split(' ')[0]} <span className="wave">✳</span></h1><p className="page-subtitle">Here’s what’s happening across your student community.</p></div><Link className="button button-primary" to="/students/new"><Plus size={17} /> Add student</Link></div>
      <section className="stats-grid" aria-label="Student statistics">
        <StatCard label="Total students" value={stats.total} note="Registered in your school" icon={UsersRound} tone="blue" trend={<UsersRound size={15} />} />
        <StatCard label="Passed students" value={stats.passed} note={`${stats.scored ? Math.round((stats.passed / stats.scored) * 100) : 0}% of graded students`} icon={Check} tone="green" trend={<Check size={15} />} />
        <StatCard label="Failed students" value={stats.failed} note={`Below the ${PASS_MARK}% pass mark`} icon={ArrowDownRight} tone="yellow" trend={<CircleHelp size={15} />} />
        <StatCard label="Average score" value={stats.average === null ? '—' : `${stats.average.toFixed(1)}%`} note="Across graded students" icon={Activity} tone="purple" trend={<Activity size={15} />} />
      </section>
      <section className="dashboard-grid">
        <article className="panel distribution-panel">
          <div className="panel-heading"><div><h2>Grade distribution</h2><p>Student performance at a glance</p></div><Link to="/reports" className="text-link">View reports <ArrowRight size={14} /></Link></div>
          {chartData.length ? <div className="distribution-body"><div className="chart-wrap"><ResponsiveContainer width="100%" height="100%"><BarChart data={chartData} margin={{ top: 10, right: 4, left: -22, bottom: 0 }}><CartesianGrid vertical={false} stroke="#edf0f4" /><XAxis dataKey="grade" axisLine={false} tickLine={false} tick={{ fill: '#858e9d', fontSize: 12 }} tickFormatter={(value) => `Grade ${value}`} /><YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: '#858e9d', fontSize: 11 }} /><Tooltip cursor={{ fill: '#f5f7fa' }} contentStyle={{ border: '1px solid #e8ebf0', borderRadius: 8, fontSize: 12 }} formatter={(value) => [`${value} students`, 'Count']} /><Bar dataKey="value" radius={[5, 5, 0, 0]} barSize={34}>{chartData.map((item) => <Cell key={item.grade} fill={item.color} />)}</Bar></BarChart></ResponsiveContainer></div><div className="distribution-legend">{stats.distribution.map((item) => <div key={item.grade} className="legend-row"><span className="legend-dot" style={{ background: item.color }} /><span>{item.name}</span><strong>{item.value}</strong></div>)}</div></div> : <EmptyState title="No grades yet" description="Add marks to student profiles to see grade distribution." action={<Link className="text-link" to="/students">Browse students <ArrowRight size={14} /></Link>} />}
        </article>
        <article className="panel recent-panel">
          <div className="panel-heading"><div><h2>Recently registered</h2><p>Your latest student records</p></div><Link to="/students" className="icon-link" aria-label="See all students"><ArrowRight size={17} /></Link></div>
          {recent.length ? <div className="recent-list">{recent.map((student) => <Link to={`/students/${student.id}`} className="recent-row" key={student.id}><Avatar name={student.name} /><span className="recent-person"><strong>{student.name}</strong><small>{student.grade} · {dateLabel(student.registeredAt, { month: 'short', day: 'numeric' })}</small></span><span className="recent-score">{formatScore(getStudentAverage(student))}</span></Link>)}</div> : <EmptyState title="No students yet" description="Your new registrations will appear here." action={<Link className="text-link" to="/students/new">Add the first student <ArrowRight size={14} /></Link>} />}
          <Link className="recent-footer" to="/students">View all students <ArrowRight size={14} /></Link>
        </article>
      </section>
      <div className="dashboard-footnote"><ShieldCheck size={14} /> Figures update from current student records. Students without valid marks are excluded from score calculations.</div>
    </div>
  )
}

function StudentList() {
  const { students, setStudents } = useOutletContext()
  const [query, setQuery] = useState('')
  const [gradeFilter, setGradeFilter] = useState('All classes')
  const [pendingDelete, setPendingDelete] = useState(null)
  const [notice, setNotice] = useState(useLocation().state?.notice || '')
  const classes = [...new Set(students.map((student) => student.grade).filter(Boolean))].sort()
  const filtered = students.filter((student) => {
    const searchMatch = `${student.name} ${student.email}`.toLowerCase().includes(query.trim().toLowerCase())
    return searchMatch && (gradeFilter === 'All classes' || student.grade === gradeFilter)
  })

  function deleteStudent() {
    setStudents(students.filter((student) => student.id !== pendingDelete.id))
    setNotice(`${pendingDelete.name} was removed from the student directory.`)
    setPendingDelete(null)
  }

  return (
    <div className="page-stack">
      <div className="page-heading-row"><div><p className="eyebrow">STUDENT RECORDS</p><h1>Student directory</h1><p className="page-subtitle">Find and manage your school’s student information.</p></div><Link className="button button-primary" to="/students/new"><Plus size={17} /> Add student</Link></div>
      {notice && <div className="notice notice-success" role="status"><Check size={16} />{notice}<button type="button" aria-label="Dismiss message" onClick={() => setNotice('')}><X size={15} /></button></div>}
      <section className="panel directory-panel">
        <div className="directory-toolbar"><div className="directory-count"><strong>{filtered.length}</strong><span>students found</span></div><div className="directory-tools"><label className="search-box"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name or email" aria-label="Search students" /></label><label className="select-wrap"><SlidersHorizontal size={15} /><select value={gradeFilter} onChange={(event) => setGradeFilter(event.target.value)} aria-label="Filter by class"><option>All classes</option>{classes.map((grade) => <option key={grade}>{grade}</option>)}</select><ChevronDown size={14} /></label></div></div>
        {filtered.length ? <div className="table-scroll"><table className="student-table"><thead><tr><th>STUDENT</th><th>STUDENT ID</th><th>EMAIL ADDRESS</th><th>PHONE</th><th>CLASS</th><th>AVERAGE</th><th aria-label="Actions" /></tr></thead><tbody>{filtered.map((student) => <tr key={student.id}><td><Link className="table-person" to={`/students/${student.id}`}><Avatar name={student.name} size="small" /><span><strong>{student.name}</strong><small>Joined {dateLabel(student.registeredAt, { month: 'short', day: 'numeric', year: 'numeric' })}</small></span></Link></td><td className="muted-cell">{student.id}</td><td className="email-cell">{student.email}</td><td className="muted-cell">{student.phone || '—'}</td><td><span className="class-pill">{student.grade || 'Unassigned'}</span></td><td><GradeBadge score={getStudentAverage(student)} /></td><td><div className="table-actions"><Link className="action-button" to={`/students/${student.id}`} title="View details" aria-label={`View ${student.name}`}><ArrowRight size={15} /></Link><Link className="action-button" to={`/students/${student.id}/edit`} title="Edit student" aria-label={`Edit ${student.name}`}><Pencil size={14} /></Link><button className="action-button action-danger" type="button" title="Delete student" aria-label={`Delete ${student.name}`} onClick={() => setPendingDelete(student)}><Trash2 size={14} /></button></div></td></tr>)}</tbody></table></div> : <EmptyState title={query || gradeFilter !== 'All classes' ? 'No matching students' : 'Your directory is empty'} description={query || gradeFilter !== 'All classes' ? 'Try another name, email, or class filter.' : 'Add a student to start building your school directory.'} action={!students.length && <Link className="button button-primary" to="/students/new"><Plus size={16} /> Add student</Link>} />}
        <div className="table-footer"><span>Showing {filtered.length} of {students.length} students</span><span>Updated just now</span></div>
      </section>
      {pendingDelete && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setPendingDelete(null)}><section className="confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="delete-title"><span className="confirm-icon"><Trash2 size={20} /></span><h2 id="delete-title">Delete student record?</h2><p>This will permanently remove <strong>{pendingDelete.name}</strong> and their marks from this browser.</p><div className="dialog-actions"><Button variant="secondary" onClick={() => setPendingDelete(null)}>Keep record</Button><Button variant="danger" onClick={deleteStudent}><Trash2 size={15} /> Delete student</Button></div></section></div>}
    </div>
  )
}

function StudentEditor() {
  const { students, setStudents } = useOutletContext()
  const { studentId } = useParams()
  const student = studentId ? students.find((item) => item.id === studentId) : null
  const navigate = useNavigate()

  if (studentId && !student) return <MissingStudent />

  function saveStudent(values) {
    if (student) {
      setStudents(students.map((item) => item.id === student.id ? { ...item, ...values } : item))
      navigate(`/students/${student.id}`, { state: { notice: 'Student details were updated.' } })
      return
    }
    const id = createStudentId(students)
    setStudents([{ ...values, id, registeredAt: new Date().toISOString() }, ...students])
    navigate('/students', { state: { notice: `${values.name} was added to the student directory.` } })
  }

  return <StudentForm initial={student} students={students} onSave={saveStudent} onCancel={() => navigate(student ? `/students/${student.id}` : '/students')} />
}

function StudentForm({ initial, students, onSave, onCancel }) {
  const [name, setName] = useState(initial?.name || '')
  const [email, setEmail] = useState(initial?.email || '')
  const [phone, setPhone] = useState(initial?.phone || '')
  const [grade, setGrade] = useState(initial?.grade || '')
  const [subjects, setSubjects] = useState(initial?.subjects?.length ? initial.subjects.map((subject) => ({ ...subject })) : [{ name: '', mark: '' }])
  const [error, setError] = useState('')

  function updateSubject(index, key, value) {
    setSubjects(subjects.map((subject, subjectIndex) => subjectIndex === index ? { ...subject, [key]: value } : subject))
  }

  function handleSubmit(event) {
    event.preventDefault()
    setError('')
    if (name.trim().length < 2 || !grade.trim()) {
      setError('Full name and class are required.')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Enter a valid email address.')
      return
    }
    if (!phone.trim()) {
      setError('Phone number is required.')
      return
    }
    const duplicate = students.some((item) => item.email.toLowerCase() === email.trim().toLowerCase() && item.id !== initial?.id)
    if (duplicate) {
      setError('A student with this email address already exists.')
      return
    }

    const validSubjects = []
    for (const subject of subjects) {
      const subjectName = subject.name.trim()
      const hasMark = String(subject.mark).trim() !== ''
      if (!subjectName && !hasMark) continue
      if (!subjectName) {
        setError('Each subject needs a name and a mark from 0 to 100.')
        return
      }
      if (!hasMark) {
        validSubjects.push({ name: subjectName, mark: '' })
        continue
      }
      const mark = Number(subject.mark)
      if (!Number.isFinite(mark) || mark < 0 || mark > 100) {
        setError('Each subject needs a name and a mark from 0 to 100.')
        return
      }
      validSubjects.push({ name: subjectName, mark })
    }

    onSave({ name: name.trim(), email: email.trim().toLowerCase(), phone: phone.trim(), grade: grade.trim(), subjects: validSubjects })
  }

  return (
    <div className="page-stack form-page">
      <div className="page-heading-row"><div><p className="eyebrow">STUDENT RECORDS</p><h1>{initial ? 'Edit student' : 'Add a student'}</h1><p className="page-subtitle">{initial ? 'Update contact information and academic marks.' : 'Create a student profile and add their current marks.'}</p></div><button className="button button-secondary back-button" type="button" onClick={onCancel}><ArrowLeft size={16} /> Back</button></div>
      <form className="student-form" onSubmit={handleSubmit} noValidate>
        <section className="panel form-section"><div className="form-section-title"><span className="section-number">01</span><div><h2>Student information</h2><p>Basic details for the student record.</p></div></div><div className="form-fields"><label className="field-label">Full name <span className="required-mark">*</span><input value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Jordan Lee" autoComplete="name" /></label><label className="field-label">Email address <span className="required-mark">*</span><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="student@school.edu" autoComplete="email" /></label><label className="field-label">Phone number <span className="required-mark">*</span><input type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+1 (555) 000-0000" autoComplete="tel" /></label><label className="field-label">Grade / class <span className="required-mark">*</span><select value={grade} onChange={(event) => setGrade(event.target.value)}><option value="">Select a class</option>{Array.from({ length: 12 }, (_, index) => `Grade ${index + 1}`).map((className) => <option key={className}>{className}</option>)}<option>Other</option></select></label></div></section>
        <section className="panel form-section"><div className="form-section-title"><span className="section-number">02</span><div><h2>Subjects &amp; marks</h2><p>Enter marks from 0–100. Leave blank if not yet assessed.</p></div><span className="optional-label">OPTIONAL</span></div><div className="subject-head"><span>SUBJECT</span><span>MARK / 100</span><span /></div><div className="subject-rows">{subjects.map((subject, index) => <div className="subject-row" key={index}><input value={subject.name} onChange={(event) => updateSubject(index, 'name', event.target.value)} placeholder="e.g. Mathematics" aria-label={`Subject ${index + 1} name`} /><div className="mark-input"><input type="number" min="0" max="100" value={subject.mark} onChange={(event) => updateSubject(index, 'mark', event.target.value)} placeholder="—" aria-label={`Subject ${index + 1} mark`} /><span>/ 100</span></div><button type="button" className="icon-button remove-subject" aria-label={`Remove subject ${index + 1}`} onClick={() => setSubjects(subjects.filter((_, subjectIndex) => subjectIndex !== index))} disabled={subjects.length === 1}><X size={16} /></button></div>)}</div><button type="button" className="add-subject" onClick={() => setSubjects([...subjects, { name: '', mark: '' }])}><Plus size={15} /> Add another subject</button>{subjects.some((subject) => String(subject.mark).trim() !== '') && <div className="average-preview"><Activity size={15} /> Current average <strong>{formatScore(getStudentAverage({ subjects }))}</strong></div>}</section>
        {error && <div className="notice notice-error" role="alert"><CircleHelp size={16} />{error}</div>}
        <div className="form-actions"><p><span className="required-mark">*</span> Required fields</p><div><Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button><Button type="submit"><Check size={16} /> {initial ? 'Save changes' : 'Save student'}</Button></div></div>
      </form>
    </div>
  )
}

function StudentDetails() {
  const { students } = useOutletContext()
  const { studentId } = useParams()
  const location = useLocation()
  const [notice, setNotice] = useState(location.state?.notice || '')
  const student = students.find((item) => item.id === studentId)
  if (!student) return <MissingStudent />
  const average = getStudentAverage(student)
  const grade = getGrade(average)

  return (
    <div className="page-stack">
      <div className="page-heading-row"><div><p className="eyebrow">STUDENT PROFILE <span className="eyebrow-dot" /> {student.id}</p><h1>Student details</h1><p className="page-subtitle">Review personal information and academic progress.</p></div><div className="heading-actions"><Link className="button button-secondary" to="/students"><ArrowLeft size={16} /> Student list</Link><Link className="button button-primary" to={`/students/${student.id}/edit`}><Pencil size={15} /> Edit student</Link></div></div>
      {notice && <div className="notice notice-success" role="status"><Check size={16} />{notice}<button type="button" aria-label="Dismiss message" onClick={() => setNotice('')}><X size={15} /></button></div>}
      <section className="profile-banner panel"><div className="profile-main"><Avatar name={student.name} size="large" /><div><div className="profile-title-row"><h2>{student.name}</h2><GradeBadge score={average} /></div><p className="profile-id">{student.id} <span>·</span> {student.grade}</p><div className="profile-contact"><span><Mail size={14} /> {student.email}</span><span><UserRound size={14} /> {student.phone || 'No phone number'}</span></div></div></div><div className="profile-summary"><span>OVERALL AVERAGE</span><strong>{formatScore(average)}</strong><small>{grade ? grade === 'F' ? 'Needs academic support' : 'Passing performance' : 'No valid marks yet'}</small></div></section>
      <section className="detail-grid">
        <article className="panel detail-panel">
          <div className="panel-heading"><div><h2>Academic record</h2><p>Subject scores and performance</p></div><BookOpen size={19} className="panel-heading-icon" /></div>
          {student.subjects?.length ? (
            <div className="marks-table">
              <div className="marks-header"><span>SUBJECT</span><span>MARK</span><span>GRADE</span></div>
              {student.subjects.map((subject, index) => {
                const rawMark = String(subject.mark ?? '').trim()
                const mark = rawMark ? Number(rawMark) : null
                const validMark = mark !== null && Number.isFinite(mark) && mark >= 0 && mark <= 100 ? mark : null
                return (
                  <div className="marks-row" key={`${subject.name}-${index}`}>
                    <strong>{subject.name || 'Unnamed subject'}</strong>
                    <span className="mark-value">{validMark === null ? 'Not graded' : `${validMark}%`}</span>
                    <GradeBadge score={validMark} />
                  </div>
                )
              })}
              <div className="marks-average"><span>Overall average</span><strong>{formatScore(average)}</strong></div>
            </div>
          ) : <EmptyState title="No subjects recorded" description="Add subject marks to see this student's performance." action={<Link className="text-link" to={`/students/${student.id}/edit`}>Add marks <ArrowRight size={14} /></Link>} />}
        </article>
        <article className="panel detail-panel">
          <div className="panel-heading"><div><h2>Student information</h2><p>Registration and contact details</p></div><UserRound size={19} className="panel-heading-icon" /></div>
          <dl className="information-list"><div><dt>Full name</dt><dd>{student.name}</dd></div><div><dt>Student ID</dt><dd>{student.id}</dd></div><div><dt>Email address</dt><dd><a href={`mailto:${student.email}`}>{student.email}</a></dd></div><div><dt>Phone number</dt><dd>{student.phone || '—'}</dd></div><div><dt>Grade / class</dt><dd>{student.grade || 'Unassigned'}</dd></div><div><dt>Registration date</dt><dd>{dateLabel(student.registeredAt)}</dd></div><div><dt>Performance status</dt><dd><span className={`status-text ${average === null ? 'status-muted' : average >= PASS_MARK ? 'status-pass' : 'status-fail'}`}>{average === null ? 'Not graded' : average >= PASS_MARK ? 'Passing' : 'Needs support'}</span></dd></div></dl>
        </article>
      </section>
    </div>
  )
}

function MissingStudent() {
  return <div className="panel missing-panel"><span className="empty-icon"><CircleHelp size={20} /></span><h2>Student record not found</h2><p>This student may have been removed or the link may be incorrect.</p><Link className="button button-primary" to="/students"><ArrowLeft size={16} /> Back to students</Link></div>
}

function Reports() {
  const { students } = useOutletContext()
  const [gradeFilter, setGradeFilter] = useState('All classes')
  const classes = [...new Set(students.map((student) => student.grade).filter(Boolean))].sort()
  const filtered = gradeFilter === 'All classes' ? students : students.filter((student) => student.grade === gradeFilter)
  const stats = getStatistics(filtered)
  const chartData = stats.distribution.filter((item) => item.value > 0)
  const passRate = stats.scored ? Math.round((stats.passed / stats.scored) * 100) : 0

  function downloadReport() {
    const rows = [['Student ID', 'Full name', 'Email', 'Class', 'Average', 'Grade', 'Status']]
    filtered.forEach((student) => {
      const average = getStudentAverage(student)
      rows.push([student.id, student.name, student.email, student.grade, average === null ? '' : average.toFixed(1), getGrade(average) || '', average === null ? 'Not graded' : average >= PASS_MARK ? 'Passing' : 'Needs support'])
    })
    const csv = rows.map((row) => row.map((field) => `"${String(field).replaceAll('"', '""')}"`).join(',')).join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url
    link.download = `intango-student-report-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  return (
    <div className="page-stack">
      <div className="page-heading-row"><div><p className="eyebrow">ACADEMIC INSIGHTS</p><h1>Reports</h1><p className="page-subtitle">A clear picture of achievement across your classes.</p></div><Button variant="secondary" onClick={downloadReport}><Download size={16} /> Export CSV</Button></div>
      <div className="report-filter panel"><div><span className="filter-icon"><SlidersHorizontal size={17} /></span><span><strong>Report scope</strong><small>Filter every figure and chart by class.</small></span></div><label className="select-wrap"><select value={gradeFilter} onChange={(event) => setGradeFilter(event.target.value)} aria-label="Filter report by class"><option>All classes</option>{classes.map((className) => <option key={className}>{className}</option>)}</select><ChevronDown size={14} /></label></div>
      <section className="stats-grid report-stats"><StatCard label="Registered students" value={stats.total} note={gradeFilter} icon={UsersRound} tone="blue" trend={<UsersRound size={15} />} /><StatCard label="Passing students" value={stats.passed} note={`${passRate}% pass rate`} icon={Check} tone="green" trend={<Check size={15} />} /><StatCard label="Failed students" value={stats.failed} note={`Below ${PASS_MARK}% average`} icon={ArrowDownRight} tone="yellow" trend={<CircleHelp size={15} />} /><StatCard label="Average score" value={stats.average === null ? '—' : `${stats.average.toFixed(1)}%`} note={`${stats.scored} students with marks`} icon={Activity} tone="purple" trend={<Activity size={15} />} /></section>
      <section className="reports-grid"><article className="panel report-chart-panel"><div className="panel-heading"><div><h2>Grade distribution</h2><p>Based on each student's average</p></div><span className="chart-filter-label">{gradeFilter}</span></div>{chartData.length ? <div className="report-chart-body"><div className="pie-chart"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={chartData} dataKey="value" nameKey="name" innerRadius="58%" outerRadius="84%" paddingAngle={3} stroke="none">{chartData.map((item) => <Cell key={item.grade} fill={item.color} />)}</Pie><Tooltip formatter={(value, name) => [`${value} students`, name]} contentStyle={{ border: '1px solid #e8ebf0', borderRadius: 8, fontSize: 12 }} /></PieChart></ResponsiveContainer><div className="pie-center"><strong>{stats.scored}</strong><span>graded</span></div></div><div className="report-legend">{stats.distribution.map((item) => <div className="report-legend-row" key={item.grade}><span className="legend-dot" style={{ background: item.color }} /><span>{item.name}</span><strong>{item.value}</strong></div>)}</div></div> : <EmptyState title="Nothing to chart yet" description="This class has no students with valid subject marks." />}</article><article className="panel performance-panel"><div className="panel-heading"><div><h2>Performance summary</h2><p>Pass and support indicators</p></div><Sparkles size={18} className="panel-heading-icon" /></div>{stats.scored ? <><div className="pass-summary"><div className="pass-rate-number">{passRate}<span>%</span></div><div><strong>Pass rate</strong><small>{stats.passed} of {stats.scored} graded students are passing</small></div></div><div className="pass-meter"><span style={{ width: `${passRate}%` }} /></div><div className="performance-breakdown"><div><span className="legend-dot" style={{ background: '#32C875' }} /><span>Passing</span><strong>{stats.passed}</strong></div><div><span className="legend-dot" style={{ background: '#F04444' }} /><span>Needs support</span><strong>{stats.failed}</strong></div><div><span className="legend-dot" style={{ background: '#9aa3b0' }} /><span>Not yet graded</span><strong>{stats.total - stats.scored}</strong></div></div></> : <EmptyState title="No scores to summarize" description="Add marks to student records to calculate pass rates." />}</article></section>
      <div className="dashboard-footnote"><ShieldCheck size={14} /> Scores use the average of each student’s valid marks. Students with no valid marks are excluded from grade and pass calculations.</div>
    </div>
  )
}

export default App