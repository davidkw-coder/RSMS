const STUDENTS_KEY = 'rsms_students_v1'
const SESSION_KEY = 'rsms_session_v1'
const ACCOUNTS_KEY = 'rsms_accounts_v1'

export const SAMPLE_STUDENTS = [
  {
    id: 'STU-2026-001',
    name: 'Amelia Williams',
    email: 'amelia.williams@school.edu',
    phone: '+1 (555) 014-2201',
    grade: 'Grade 10',
    registeredAt: '2026-10-24T09:30:00.000Z',
    subjects: [{ name: 'Mathematics', mark: 88 }, { name: 'English', mark: 82 }, { name: 'Science', mark: 91 }],
  },
  {
    id: 'STU-2026-002',
    name: 'Noah Thompson',
    email: 'noah.thompson@school.edu',
    phone: '+1 (555) 014-2202',
    grade: 'Grade 9',
    registeredAt: '2026-10-23T12:15:00.000Z',
    subjects: [{ name: 'Mathematics', mark: 74 }, { name: 'English', mark: 68 }, { name: 'Science', mark: 79 }],
  },
  {
    id: 'STU-2026-003',
    name: 'Olivia Chen',
    email: 'olivia.chen@school.edu',
    phone: '+1 (555) 014-2203',
    grade: 'Grade 10',
    registeredAt: '2026-10-22T08:45:00.000Z',
    subjects: [{ name: 'Mathematics', mark: 58 }, { name: 'English', mark: 66 }, { name: 'Science', mark: 61 }],
  },
  {
    id: 'STU-2026-004',
    name: 'Ethan Williams',
    email: 'ethan.williams@school.edu',
    phone: '+1 (555) 014-2204',
    grade: 'Grade 8',
    registeredAt: '2026-10-20T14:10:00.000Z',
    subjects: [{ name: 'Mathematics', mark: 42 }, { name: 'English', mark: 48 }, { name: 'Science', mark: 45 }],
  },
  {
    id: 'STU-2026-005',
    name: 'Sofia Martinez',
    email: 'sofia.martinez@school.edu',
    phone: '+1 (555) 014-2205',
    grade: 'Grade 9',
    registeredAt: '2026-10-18T10:00:00.000Z',
    subjects: [{ name: 'Mathematics', mark: 95 }, { name: 'English', mark: 89 }, { name: 'Science', mark: 93 }],
  },
]

export function loadStudents() {
  try {
    const stored = localStorage.getItem(STUDENTS_KEY)
    if (stored === null) return SAMPLE_STUDENTS
    const parsed = JSON.parse(stored)
    return Array.isArray(parsed) ? parsed : SAMPLE_STUDENTS
  } catch {
    return SAMPLE_STUDENTS
  }
}

export function saveStudents(students) {
  localStorage.setItem(STUDENTS_KEY, JSON.stringify(students))
}

export function loadSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY))
  } catch {
    return null
  }
}

export function saveSession(user) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user))
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY)
}

function readAccounts() {
  try {
    const accounts = JSON.parse(localStorage.getItem(ACCOUNTS_KEY))
    return Array.isArray(accounts) ? accounts : []
  } catch {
    return []
  }
}

async function derivePasswordHash(password, salt) {
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: encoder.encode(salt), iterations: 120000, hash: 'SHA-256' },
    key,
    256,
  )
  return Array.from(new Uint8Array(bits), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

export async function registerAccount({ name, email, password }) {
  const accounts = readAccounts()
  const normalizedEmail = email.trim().toLowerCase()
  if (accounts.some((account) => account.email === normalizedEmail)) {
    throw new Error('An account with this email already exists.')
  }

  const salt = crypto.randomUUID()
  const passwordHash = await derivePasswordHash(password, salt)
  accounts.push({ name: name.trim(), email: normalizedEmail, salt, passwordHash })
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts))
  return { name: name.trim(), email: normalizedEmail }
}

export async function authenticateAccount(email, password) {
  const normalizedEmail = email.trim().toLowerCase()
  if (normalizedEmail === 'admin@intango.edu' && password === 'Student123!') {
    return { name: 'Admin User', email: normalizedEmail }
  }

  const account = readAccounts().find((item) => item.email === normalizedEmail)
  if (!account) return null
  const passwordHash = await derivePasswordHash(password, account.salt)
  return passwordHash === account.passwordHash
    ? { name: account.name, email: account.email }
    : null
}