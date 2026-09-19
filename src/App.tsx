import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { BrowserRouter, Link, Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import toast, { Toaster } from 'react-hot-toast'
import './App.css'
import img from "./assets/logo.png"
import fallbackUniversities from './data/universities-fallback.json'
import professorsData from './data/professors.json'
type University = {
  name: string
  country: string
  alpha_two_code: string
  state_province: string | null
  domains: string[]
  web_pages: string[]
  code?: string
  city?: string
  region?: string
  international_fee_band?: string
  tuition_free?: boolean
  semester_contribution?: number | string
  is_tu9?: boolean
  english_programs?: boolean
  world_ranking?: number | string
}

type UniversitySearchMode = 'vector' | 'regex'

const UNIVERSITY_SEARCH_FIELDS: Array<{ key: keyof University; weight: number }> = [
  { key: 'name', weight: 4 },
  { key: 'country', weight: 2 },
  { key: 'city', weight: 2 },
  { key: 'region', weight: 1.5 },
  { key: 'code', weight: 1.5 },
  { key: 'international_fee_band', weight: 1 },
  { key: 'world_ranking', weight: 1 },
]

function universitySearchText(university: University) {
  return [
    university.name,
    university.country,
    university.city ?? '',
    university.region ?? '',
    university.code ?? '',
    university.international_fee_band ?? '',
    university.world_ranking ?? '',
    university.state_province ?? '',
    ...university.domains,
  ].join(' ')
}

function tokenizeSearchText(value: string) {
  return value.toLowerCase().match(/[a-z0-9]+/g) ?? []
}

function vectorSimilarity(query: string, university: University) {
  const queryTokens = new Set(tokenizeSearchText(query))
  if (queryTokens.size === 0) return 1

  const documentTokens = new Map<string, number>()
  UNIVERSITY_SEARCH_FIELDS.forEach(({ key, weight }) => {
    const value = university[key]
    if (typeof value === 'string' || typeof value === 'number') {
      tokenizeSearchText(String(value)).forEach((token) => {
        documentTokens.set(token, (documentTokens.get(token) ?? 0) + weight)
      })
    }
  })
  const queryMagnitude = Math.sqrt(queryTokens.size)
  const documentMagnitude = Math.sqrt([...documentTokens.values()].reduce((sum, value) => sum + value ** 2, 0))
  if (!documentMagnitude) return 0
  const dotProduct = [...queryTokens].reduce((sum, token) => sum + (documentTokens.get(token) ?? 0), 0)
  return dotProduct / (queryMagnitude * documentMagnitude)
}

type Scholarship = {
  name: string
  country: string
  funding: string
  match: number
  deadline: string
  benefits: string[]
  level: string
  eligibility: string
  provider: string
  url: string
}

type Professor = {
  name: string
  university: string
  country: string
  research: string[]
  student: string[]
  link: string
}

type Application = {
  name: string
  program: string
  status: string
  progress: number
  deadline: string
}

const _scholarships: Scholarship[] = [
  {
    name: 'DAAD Scholarship',
    country: 'Germany',
    funding: 'Fully Funded',
    match: 91,
    deadline: '15 Oct',
    benefits: ['Tuition support', 'Monthly stipend', 'Travel allowance'],
    level: 'Master’s / PhD',
    eligibility: 'Bangladeshi graduates applying to eligible German programmes',
    provider: 'DAAD',
    url: 'https://www.daad.de/en/',
  },
  {
    name: 'Ontario Graduate Scholarship',
    country: 'Canada',
    funding: 'Partial Funding',
    match: 84,
    deadline: '01 Nov',
    benefits: ['Tuition waiver', 'Research support', 'Living grant'],
    level: 'Master’s',
    eligibility: 'International students with strong academic and research records',
    provider: 'Ontario universities',
    url: 'https://grad.uwo.ca/admissions/financing/ogs.html',
  },
  {
    name: 'Fulbright Foreign Student Program',
    country: 'USA',
    funding: 'Fully Funded',
    match: 77,
    deadline: '18 Sep',
    benefits: ['Tuition', 'Health insurance', 'Monthly stipend'],
    level: 'Master’s / PhD',
    eligibility: 'Bangladeshi citizens pursuing graduate study in the United States',
    provider: 'U.S. Department of State',
    url: 'https://foreign.fulbrightonline.org/',
  },
]

const BANGLADESHI_SCHOLARSHIPS: Scholarship[] = [
  ..._scholarships,
  { name: 'Chevening Scholarships', country: 'United Kingdom', funding: 'Fully Funded', match: 95, deadline: '5 Nov', benefits: ['Full tuition', 'Monthly stipend', 'Travel costs'], level: 'Master’s', eligibility: 'Bangladeshi citizens with leadership and work experience', provider: 'UK Foreign, Commonwealth & Development Office', url: 'https://www.chevening.org/scholarships/' },
  { name: 'Commonwealth Master’s Scholarships', country: 'United Kingdom', funding: 'Fully Funded', match: 92, deadline: 'Varies by nomination', benefits: ['Tuition fees', 'Living allowance', 'Airfare'], level: 'Master’s', eligibility: 'Citizens of eligible Commonwealth countries including Bangladesh', provider: 'Commonwealth Scholarship Commission', url: 'https://cscuk.fcdo.gov.uk/scholarships/commonwealth-masters-scholarships/' },
  { name: 'Erasmus Mundus Joint Masters', country: 'Europe', funding: 'Fully Funded', match: 94, deadline: 'Oct–Jan', benefits: ['Participation costs', 'Monthly scholarship', 'Travel allowance'], level: 'Master’s', eligibility: 'Students worldwide applying to participating joint programmes', provider: 'European Commission', url: 'https://erasmus-plus.ec.europa.eu/scholarships' },
  { name: 'Australia Awards Scholarships', country: 'Australia', funding: 'Fully Funded', match: 90, deadline: '30 Apr', benefits: ['Full tuition', 'Living expenses', 'Health cover'], level: 'Master’s', eligibility: 'Bangladeshi professionals meeting country and programme criteria', provider: 'Australian Government', url: 'https://www.australiaawards.gov.au/' },
  { name: 'Canada Vanier Graduate Scholarships', country: 'Canada', funding: 'Fully Funded', match: 88, deadline: 'Institution-specific', benefits: ['CAD 50,000 per year', 'Three years of support'], level: 'PhD', eligibility: 'International doctoral candidates nominated by a Canadian institution', provider: 'Government of Canada', url: 'https://vanier.gc.ca/en/home-accueil.html' },
  { name: 'McCall MacBain Scholarships', country: 'Canada', funding: 'Fully Funded', match: 86, deadline: 'Aug–Sep', benefits: ['Tuition and fees', 'Monthly stipend', 'Mentorship'], level: 'Master’s', eligibility: 'Future graduate leaders applying to eligible McGill programmes', provider: 'McGill University', url: 'https://mccallmacbainscholars.org/' },
  { name: 'Gates Cambridge Scholarship', country: 'United Kingdom', funding: 'Fully Funded', match: 89, deadline: 'Oct–Dec', benefits: ['University composition fee', 'Maintenance allowance', 'Additional funding'], level: 'Postgraduate', eligibility: 'Outstanding applicants to eligible University of Cambridge courses', provider: 'Gates Cambridge Trust', url: 'https://www.gatescambridge.org/' },
  { name: 'University of Oxford Clarendon Fund', country: 'United Kingdom', funding: 'Fully Funded', match: 87, deadline: 'Course-specific', benefits: ['Full tuition', 'Annual living grant'], level: 'Graduate', eligibility: 'Applicants to eligible Oxford graduate programmes', provider: 'University of Oxford', url: 'https://www.ox.ac.uk/clarendon' },
  { name: 'MEXT Scholarship', country: 'Japan', funding: 'Fully Funded', match: 85, deadline: 'Embassy-specific', benefits: ['Tuition waiver', 'Monthly allowance', 'Airfare'], level: 'Bachelor’s / Master’s / PhD', eligibility: 'Bangladeshi applicants applying through embassy or university routes', provider: 'Japanese Government', url: 'https://www.studyinjapan.go.jp/en/planning/scholarships/mext-scholarships/' },
  { name: 'Türkiye Scholarships', country: 'Türkiye', funding: 'Fully Funded', match: 84, deadline: '10 Jan–20 Feb', benefits: ['Tuition', 'Accommodation', 'Monthly stipend'], level: 'Bachelor’s / Master’s / PhD', eligibility: 'International students meeting academic and age requirements', provider: 'Government of Türkiye', url: 'https://www.turkiyeburslari.gov.tr/' },
  { name: 'Stipendium Hungaricum', country: 'Hungary', funding: 'Fully Funded', match: 82, deadline: '15 Jan', benefits: ['Tuition-free education', 'Monthly stipend', 'Accommodation contribution'], level: 'Bachelor’s / Master’s / PhD', eligibility: 'Students nominated by their sending partner country', provider: 'Hungarian Government', url: 'https://stipendiumhungaricum.hu/' },
  { name: 'Swiss Government Excellence Scholarships', country: 'Switzerland', funding: 'Fully Funded', match: 80, deadline: 'Varies by country', benefits: ['Monthly stipend', 'Tuition support', 'Health insurance'], level: 'Research / PhD', eligibility: 'Highly qualified postgraduate researchers and artists', provider: 'Swiss Confederation', url: 'https://www.sbfi.admin.ch/sbfi/en/home/education/scholarships-and-grants/swiss-government-excellence-scholarships.html' },
]

const _professors: Professor[] = [
  { name: 'Peng Gao', university: 'Virginia Tech', country: 'USA', research: ['Systems Security', 'Network Security', '(Agentic) AI for Security', 'AI and Agent Security and Safety'], student: ['postdocs', 'Ph.D. students', 'MS students', 'interns'], link: 'https://people.cs.vt.edu/penggao/' },
  { name: 'Nitesh Saxena', university: 'Texas A&M University', country: 'USA', research: ['Cybersecurity', 'Authentication', 'Privacy'], student: ['post-doc'], link: 'https://nsaxena.engr.tamu.edu/' },
  { name: 'Ram Krishnan', university: 'University of Texas at San Antonio', country: 'USA', research: ['Computer Security'], student: ['PhD degree'], link: 'https://ceid.utsa.edu/rkrishnan/prospective-students/' },
  { name: 'Jun Dai', university: 'Worcester Polytechnic Institute', country: 'USA', research: ['LLM Security', 'AI', 'Networked and Distributed Systems'], student: ['Undergraduates', "Master's", 'PhD'], link: 'https://www.wpi.edu/people/faculty/jdai' },
  { name: 'Hasan Shahriar', university: 'University of Arkansas', country: 'USA', research: ['Secure Software', 'AI', 'Cybersecurity'], student: [], link: '' },
  { name: 'Hemanta K. Maji', university: 'Purdue University', country: 'USA', research: ['Cryptography'], student: [], link: 'https://www.cs.purdue.edu/homes/hmaji/' },
  { name: 'Pedro Fonseca', university: 'Purdue University', country: 'USA', research: ['Information Security and Assurance', 'Networking and Operating Systems', 'Distributed Systems'], student: ['PhD students'], link: 'https://www.cs.purdue.edu/homes/pfonseca/' },
  { name: 'Hanshen Xiao', university: 'Purdue University', country: 'USA', research: ['AI', 'ML', 'NLP'], student: ['PhD Students'], link: 'https://hanshen-xiao.github.io/' },
  { name: 'Z. Berkay Celik', university: 'Purdue University', country: 'USA', research: ['AI', 'ML', 'NLP'], student: ['PhD students', 'research interns'], link: 'https://beerkay.github.io/' },
  { name: 'Adam Bates', university: 'University of Illinois Urbana–Champaign', country: 'USA', research: ['Digital Security & Privacy', 'Systems', 'Networks', 'Measurement', 'Human Factors'], student: ['PhD', "Master's"], link: 'https://adambates.org/about/' },
  { name: 'Kazem Taram', university: 'Purdue University', country: 'USA', research: ['Computer Architecture', 'Computer Security'], student: ['Graduate students'], link: 'https://mktrm.github.io/' },
  { name: 'Antonio Bianchi', university: 'Purdue University', country: 'USA', research: ['Software and Systems Security'], student: ['Interns', 'PhD students', 'Postdocs'], link: 'https://antoniobianchi.me/' },
  { name: 'Wenke Lee', university: 'Georgia Institute of Technology', country: 'USA', research: ['Systems', 'Network Security'], student: [], link: '' },
  { name: 'Dawn Song', university: 'University of California, Berkeley', country: 'USA', research: ['AI Security', 'Privacy', 'Blockchain'], student: [], link: '' },
  { name: 'Engin Kirda', university: 'Northeastern University', country: 'USA', research: ['Systems', 'Software and Network Security'], student: ['PhD'], link: 'https://www.khoury.northeastern.edu/home/ek/' },
  { name: 'Trent Jaeger', university: 'Pennsylvania State University', country: 'USA', research: ['Operating Systems Security'], student: [], link: '' },
  { name: 'Somesh Jha', university: 'University of Wisconsin–Madison', country: 'USA', research: ['AI Security', 'Malware Detection'], student: [], link: '' },
  { name: 'Patrick McDaniel', university: 'Pennsylvania State University', country: 'USA', research: ['Mobile Security', 'Network Security'], student: [], link: '' },
  { name: 'XiaoFeng Wang', university: 'Indiana University Bloomington', country: 'USA', research: ['Privacy', 'Applied Cryptography'], student: [], link: '' },
  { name: 'Shiqing Ma', university: 'Rutgers University', country: 'USA', research: ['AI Security', 'Software Security'], student: [], link: '' },
  { name: 'Nalin Asanka Gamagedara Arachchilage', university: 'RMIT University', country: 'Australia', research: ['Human-Centred Cybersecurity'], student: ["Master's Research", 'PhD student'], link: 'https://www.rmit.edu.au/profiles/g/nalin-arachchilage' },
  { name: 'Siamak Layeghy', university: 'University of Queensland', country: 'Australia', research: ['AI', 'Machine Learning', 'Cybersecurity'], student: [], link: 'https://about.uq.edu.au/experts/24474' },
  { name: 'Dan Kim', university: 'University of Queensland', country: 'Australia', research: ['Cybersecurity', 'AI'], student: [], link: 'https://about.uq.edu.au/experts/23703' },
  { name: 'Dr Jonathan Davies', university: 'University of Queensland', country: 'Australia', research: ['ML'], student: [], link: 'https://about.uq.edu.au/experts/45717' },
  { name: 'Chris Roelfsema', university: 'University of Queensland', country: 'Australia', research: ['ML'], student: [], link: 'https://about.uq.edu.au/experts/765' },
  { name: 'Ron Steinfeld', university: 'Monash University', country: 'Australia', research: ['Cryptography', 'Cybersecurity'], student: [], link: '' },
  { name: 'Mahmoud Elkhodr', university: 'CQUniversity', country: 'Australia', research: ['IoT Security', 'AI', 'Blockchain'], student: [], link: '' },
  { name: 'Mark Sanderson', university: 'RMIT University', country: 'Australia', research: ['AI', 'Information Retrieval', 'NLP'], student: [], link: '' },
  { name: 'Toby Murray', university: 'University of Melbourne', country: 'Australia', research: ['Software Security', 'Formal Methods'], student: [], link: '' },
  { name: 'Hoa Khanh Dam', university: 'University of Wollongong', country: 'Australia', research: ['AI', 'Software Engineering'], student: [], link: '' },
  { name: 'Miao Xu', university: 'University of Queensland', country: 'Australia', research: ['Machine Learning', 'Data Mining'], student: [], link: '' },
  { name: 'Suranga Seneviratne', university: 'University of Sydney', country: 'Australia', research: ['Mobile Security', 'Privacy', 'AI'], student: [], link: '' },
]

const _applications: Application[] = [
  {
    name: 'Technical University of Munich',
    program: 'MSc Computer Science',
    status: 'In progress',
    progress: 75,
    deadline: '15 Oct',
  },
  {
    name: 'University of Toronto',
    program: 'MSc Applied Computing',
    status: 'Profile ready',
    progress: 52,
    deadline: '01 Nov',
  },
  {
    name: 'University of Michigan',
    program: 'MS Data Science',
    status: 'Document review',
    progress: 63,
    deadline: '20 Nov',
  },
]

const _checklist = [
  'Academic transcript',
  'Passport',
  'CV',
  'Statement of purpose',
  'Recommendation letters',
  'IELTS certificate',
  'Research proposal',
  'Financial documents',
]

const _adminData = [
  { label: 'Universities', value: 42 },
  { label: 'Programs', value: 78 },
  { label: 'Scholarships', value: 31 },
  { label: 'Professors', value: 64 },
]

const destinations = [
  { country: 'Australia', flag: 'AU', image: '/australia.jpg', note: 'Uncover a world of opportunities with world-class education and an outstanding quality of life.', tone: 'destination-australia' },
  { country: 'Canada', flag: 'CA', image: '/canada.jpg', note: 'Study in a welcoming, safe and multicultural society known for innovation.', tone: 'destination-canada' },
  { country: 'Ireland', flag: 'IE', image: '/ireland.jpg', note: 'Join a friendly, English-speaking country with respected institutions and a rich culture.', tone: 'destination-ireland' },
  { country: 'New Zealand', flag: 'NZ', image: '/new-zealand.jpg', note: 'Enjoy a supportive learning environment, beautiful landscapes and a balanced lifestyle.', tone: 'destination-new-zealand' },
  { country: 'United Kingdom', flag: 'UK', image: '/uk.jpg', note: 'Choose globally respected universities and vibrant student cities.', tone: 'destination-uk' },
  { country: 'United States', flag: 'US', image: '/usa.jpg', note: 'Explore leading research, flexible programs and ambitious career pathways.', tone: 'destination-usa' },
  { country: 'Germany', flag: 'DE', image: '/germany.jpg', note: 'Access strong public universities, practical research and a thriving technology sector.', tone: 'destination-germany' },
]

const WORQNOW_UNIVERSITY_ENDPOINTS = [
  { country: 'United Kingdom', code: 'GB', url: 'https://api.worqnow.ai/education/uk/universities' },
  { country: 'United States', code: 'US', url: 'https://api.worqnow.ai/education/usa/universities' },
  { country: 'Canada', code: 'CA', url: 'https://api.worqnow.ai/education/ca/universities' },
  { country: 'Germany', code: 'DE', url: 'https://api.worqnow.ai/education/de/universities' },
  { country: 'Ireland', code: 'IE', url: 'https://api.worqnow.ai/education/ie/universities' },
  { country: 'Australia', code: 'AU', url: 'https://api.worqnow.ai/education/au/universities' },
] as const

type WorqnowUniversity = {
  code?: unknown
  name?: unknown
  city?: unknown
  region?: unknown
  website?: unknown
  international_fee_band?: unknown
  tuition_free?: unknown
  semester_contribution?: unknown
  is_tu9?: unknown
  english_programs?: unknown
  world_ranking?: unknown
}

type WorqnowResponse = {
  data?: unknown
}

function normalizeUniversity(item: WorqnowUniversity, endpoint: (typeof WORQNOW_UNIVERSITY_ENDPOINTS)[number]): University | null {
  if (typeof item.name !== 'string' || !item.name.trim()) return null
  const website = typeof item.website === 'string' ? item.website : ''
  const domain = website ? website.replace(/^https?:\/\//, '').split('/')[0] : ''
  return {
    name: item.name,
    country: endpoint.country,
    alpha_two_code: endpoint.code,
    state_province: typeof item.region === 'string' ? item.region : null,
    domains: domain ? [domain] : [],
    web_pages: website ? [website] : [],
    code: typeof item.code === 'string' ? item.code : undefined,
    city: typeof item.city === 'string' ? item.city : undefined,
    region: typeof item.region === 'string' ? item.region : undefined,
    international_fee_band: typeof item.international_fee_band === 'string' ? item.international_fee_band : undefined,
    tuition_free: typeof item.tuition_free === 'boolean' ? item.tuition_free : undefined,
    semester_contribution: typeof item.semester_contribution === 'number' || typeof item.semester_contribution === 'string' ? item.semester_contribution : undefined,
    is_tu9: typeof item.is_tu9 === 'boolean' ? item.is_tu9 : undefined,
    english_programs: typeof item.english_programs === 'boolean' ? item.english_programs : undefined,
    world_ranking: typeof item.world_ranking === 'number' || typeof item.world_ranking === 'string' ? item.world_ranking : undefined,
  }
}

const _conversation = [
  { sender: 'You', text: 'What documents do I need for a Germany master\'s application?' },
  { sender: 'AI', text: 'Based on your saved program, prepare transcript, CV, SOP, IELTS, recommendation letters, and proof of funds. Verify all details on the official university website.' },
]

void _scholarships
void _professors
void _applications
void _checklist
void _adminData
void _conversation

type Theme = 'dark' | 'light'

type ThemeContextValue = {
  theme: Theme
  toggleTheme: () => void
}

type User = {
  id: string
  name: string
  email: string
  bio: string
  target_degree: string
  target_countries: string[]
  interests: string[]
}

type AuthContextValue = {
  user: User | null
  authReady: boolean
  refreshUser: () => Promise<void>
  logout: () => Promise<void>
}

const ThemeContext = createContext<ThemeContextValue | null>(null)
const AuthContext = createContext<AuthContextValue | null>(null)

function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used inside ThemeContext.Provider')
  }
  return context
}

function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthContext.Provider')
  return context
}

function AppTopbar() {
  const { theme, toggleTheme } = useTheme()
  const { user, logout } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="topbar">
      <Link className="brand-wrap no-underline" to="/">
        <img src={img} alt="CUET logo" className="h-[45px] w-[35px]" />
        <div>
          <p className="eyebrow">CUET</p>
          <h2>Study Abroad Helper</h2>
        </div>
      </Link>
      <nav className="nav" aria-label="Primary navigation">
        <Link to="/universities">Explore universities</Link>
        <Link to="/scholarships#scholarships">Scholarships</Link>
        <Link to="/professors#professors">Find professors</Link>
        <Link to="/ai">AI tools</Link>
        {user && <Link to="/dashboard">Dashboard</Link>}
        {user && <Link to="/profile">Profile</Link>}
      </nav>
      <div className="topbar-actions">
        <button type="button" className="theme-toggle" onClick={toggleTheme}>
          {theme === 'dark' ? '☀ Light' : '☾ Dark'}
        </button>
        {user ? (
          <button type="button" className="secondary-btn small" onClick={async () => {
            try {
              await logout()
              toast.success('You have been logged out.')
            } catch {
              toast.error('Unable to log out. Please try again.')
            }
          }}>Log out</button>
        ) : (
          <Link className="primary-btn nav-cta" to="/login">Get started</Link>
        )}
        <button
          type="button"
          className="menu-toggle"
          onClick={() => setMobileMenuOpen((open) => !open)}
          aria-expanded={mobileMenuOpen}
          aria-controls="mobile-navigation"
          aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
        >
          <span /><span /><span />
        </button>
      </div>
      <nav id="mobile-navigation" className={`mobile-nav ${mobileMenuOpen ? 'mobile-nav-open' : ''}`} aria-label="Mobile navigation">
        <Link onClick={() => setMobileMenuOpen(false)} to="/universities">Explore universities</Link>
        <Link onClick={() => setMobileMenuOpen(false)} to="/scholarships#scholarships">Scholarships</Link>
        <Link onClick={() => setMobileMenuOpen(false)} to="/professors#professors">Find professors</Link>
        <Link onClick={() => setMobileMenuOpen(false)} to="/ai">AI tools</Link>
        {user && <Link onClick={() => setMobileMenuOpen(false)} to="/dashboard">Dashboard</Link>}
        {user && <Link onClick={() => setMobileMenuOpen(false)} to="/profile">Profile</Link>}
        {user ? (
          <button className="secondary-btn" onClick={async () => {
            setMobileMenuOpen(false)
            try {
              await logout()
              toast.success('You have been logged out.')
            } catch {
              toast.error('Unable to log out. Please try again.')
            }
          }}>Log out</button>
        ) : (
          <Link className="primary-btn" onClick={() => setMobileMenuOpen(false)} to="/login">Get started</Link>
        )}
      </nav>
    </header>
  )
}

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, authReady } = useAuth()
  if (!authReady) return <div className="account-loading">Loading your account...</div>
  return user ? <>{children}</> : <Navigate to="/login" replace />
}

const apiBaseUrl = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')

async function authRequest(path: string, options?: RequestInit) {
  const response = await fetch(`${apiBaseUrl}/api${path}`, { ...options, credentials: 'include', headers: { 'Content-Type': 'application/json', ...options?.headers } })
  const rawPayload = response.status === 204 ? '' : await response.text()
  let payload: { message?: string; user?: User } | null = null
  if (rawPayload) {
    try { payload = JSON.parse(rawPayload) as { message?: string; user?: User } } catch { throw new Error(`API returned an invalid response (${response.status})`) }
  }
  if (!response.ok) throw new Error(payload?.message ?? 'Request failed')
  return payload
}

async function aiRequest<T>(path: string, body: unknown) {
  const response = await fetch(`${apiBaseUrl}/api/ai${path}`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  const rawPayload = await response.text()
  let payload: (T & { message?: string }) | null = null
  try { payload = JSON.parse(rawPayload) as T & { message?: string } } catch { throw new Error(`API returned an invalid response (${response.status})`) }
  if (!response.ok) throw new Error(payload.message ?? 'AI request failed')
  return payload
}

function AuthLayout({ children, title, subtitle }: { children: ReactNode; title: string; subtitle: string }) {
  const { theme, toggleTheme } = useTheme()

  return (
    <div className="auth-page">
      <header className="auth-header">
        <Link className="auth-brand" to="/">
          <img src={img} alt="CUET logo" />
          <span>Study Abroad Helper</span>
        </Link>
        <button type="button" className="theme-toggle" onClick={toggleTheme}>
          {theme === 'dark' ? '☀ Light' : '☾ Dark'}
        </button>
      </header>
      <main className="auth-main">
        <section className="auth-card">
          <div className="auth-heading">
            <p className="eyebrow">CUET Study Abroad Helper</p>
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </div>
          {children}
        </section>
      </main>
    </div>
  )
}

function LoginPage() {
  const { refreshUser } = useAuth()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const googleError = new URLSearchParams(window.location.search).get('error')
  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to continue planning your study abroad journey.">
      <form className="auth-form" onSubmit={async (event) => {
        event.preventDefault()
        setLoading(true); setError('')
        try {
          const form = new FormData(event.currentTarget)
          await authRequest('/auth/login', { method: 'POST', body: JSON.stringify({ email: form.get('email'), password: form.get('password') }) })
          await refreshUser()
          toast.success('Welcome back!')
          navigate('/')
        } catch (requestError) {
          const message = requestError instanceof Error ? requestError.message : 'Unable to log in'
          setError(message)
          toast.error(message)
        } finally { setLoading(false) }
      }}>
        <label htmlFor="login-email">Email address</label>
        <input id="login-email" name="email" type="email" placeholder="you@example.com" required />
        <label htmlFor="login-password">Password</label>
        <input id="login-password" name="password" type="password" placeholder="Enter your password" required />
        <div className="auth-form-row">
          <label className="auth-checkbox"><input type="checkbox" name="remember" /> Remember me</label>
          <a href="#forgot-password">Forgot password?</a>
        </div>
        {error && <p className="auth-error">{error}</p>}
        <button type="submit" className="auth-submit" disabled={loading}>{loading ? 'Signing in...' : 'Log in'}</button>
        <div className="auth-divider"><span>or</span></div>
        <a className="google-submit" href={`${apiBaseUrl}/api/auth/google`}>Continue with Google</a>
        {googleError && <p className="auth-error">Google sign-in could not be completed. Please try again.</p>}
      </form>
      <p className="auth-switch">Don’t have an account? <Link to="/register">Create one</Link></p>
    </AuthLayout>
  )
}

function RegisterPage() {
  const { refreshUser } = useAuth()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const navigate = useNavigate()
  return (
    <AuthLayout title="Create your account" subtitle="Start discovering universities, scholarships, and opportunities made for you.">
      <form className="auth-form" onSubmit={async (event) => {
        event.preventDefault()
        setLoading(true); setError('')
        try {
          const form = new FormData(event.currentTarget)
          const password = String(form.get('password') ?? '')
          const confirmPassword = String(form.get('confirmPassword') ?? '')
          if (password !== confirmPassword) {
            setError('Passwords do not match.')
            toast.error('Passwords do not match.')
            return
          }
          await authRequest('/auth/register', { method: 'POST', body: JSON.stringify({ name: form.get('name'), email: form.get('email'), password }) })
          await refreshUser()
          toast.success('Your account has been created.')
          navigate('/')
        } catch (requestError) {
          const message = requestError instanceof Error ? requestError.message : 'Unable to create account'
          setError(message)
          toast.error(message)
        } finally { setLoading(false) }
      }}>
        <label htmlFor="register-name">Full name</label>
        <input id="register-name" name="name" type="text" placeholder="Your full name" required />
        <label htmlFor="register-email">Email address</label>
        <input id="register-email" name="email" type="email" placeholder="you@example.com" required />
        <label htmlFor="register-password">Password</label>
        <div className="password-field">
          <input id="register-password" name="password" type={showPassword ? 'text' : 'password'} placeholder="Create a password" minLength={8} required />
          <button type="button" className="password-toggle" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? 'Hide' : 'Show'}</button>
        </div>
        <label htmlFor="register-confirm-password">Confirm password</label>
        <div className="password-field">
          <input id="register-confirm-password" name="confirmPassword" type={showConfirmPassword ? 'text' : 'password'} placeholder="Re-enter your password" minLength={8} required />
          <button type="button" className="password-toggle" onClick={() => setShowConfirmPassword((visible) => !visible)} aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}>{showConfirmPassword ? 'Hide' : 'Show'}</button>
        </div>
        <label className="auth-checkbox"><input type="checkbox" name="terms" required /> I agree to the terms and privacy policy</label>
        {error && <p className="auth-error">{error}</p>}
        <button type="submit" className="auth-submit" disabled={loading}>{loading ? 'Creating account...' : 'Create account'}</button>
      </form>
      <p className="auth-switch">Already have an account? <Link to="/login">Log in</Link></p>
    </AuthLayout>
  )
}

function ScholarshipsPage() {
  const { theme } = useTheme()
  const [query, setQuery] = useState('')
  const [country, setCountry] = useState('All')
  const [level, setLevel] = useState('All')
  const countries = useMemo(() => ['All', ...new Set(BANGLADESHI_SCHOLARSHIPS.map((item) => item.country).sort())], [])
  const levels = useMemo(() => ['All', ...new Set(BANGLADESHI_SCHOLARSHIPS.flatMap((item) => item.level.split(' / ')).sort())], [])
  const scholarships = useMemo(() => {
    const term = query.trim().toLowerCase()
    return BANGLADESHI_SCHOLARSHIPS.filter((item) => {
      const searchable = [item.name, item.country, item.funding, item.level, item.provider, item.eligibility, ...item.benefits].join(' ').toLowerCase()
      return searchable.includes(term)
        && (country === 'All' || item.country === country)
        && (level === 'All' || item.level.includes(level))
    })
  }, [country, level, query])

  return (
    <div className={`app-shell ${theme}-theme`}>
      <AppTopbar />

      <main className="scholarship-page">
        <section className="scholarship-hero">
          <div>
            <p className="eyebrow">Funding directory for Bangladesh</p>
            <h1>Find scholarships for your study abroad journey</h1>
            <p>Explore major funding opportunities open to Bangladeshi students. Always verify current deadlines and eligibility on the official provider website.</p>
          </div>
          <div className="university-hero-stat"><strong>{BANGLADESHI_SCHOLARSHIPS.length}</strong><span>featured opportunities</span></div>
        </section>
        <section id="scholarships" className="university-content">
          <div className="university-toolbar scholarship-toolbar">
            <label className="university-search"><span>Search scholarships</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Try “fully funded” or “Germany”" type="search" /></label>
            <label className="university-filter"><span>Destination</span><select value={country} onChange={(event) => setCountry(event.target.value)}>{countries.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label className="university-filter"><span>Study level</span><select value={level} onChange={(event) => setLevel(event.target.value)}>{levels.map((item) => <option key={item}>{item}</option>)}</select></label>
          </div>
          <div className="university-results-heading"><div><p className="eyebrow">Your funding shortlist</p><h2>{scholarships.length} opportunities found</h2></div><span>For Bangladeshi applicants · verify details before applying</span></div>
          {scholarships.length > 0 ? (
            <div className="scholarship-results-grid">
              {scholarships.map((scholarship) => (
                <article className="scholarship-card" key={scholarship.name}>
                  <div className="university-card-top"><span className="country-tag">{scholarship.country}</span><span className="match-badge">{scholarship.match}% match</span></div>
                  <h2>{scholarship.name}</h2>
                  <p className="scholarship-provider">{scholarship.provider}</p>
                  <div className="scholarship-details"><span><strong>{scholarship.funding}</strong> funding</span><span><strong>{scholarship.level}</strong></span><span><strong>{scholarship.deadline}</strong> deadline</span></div>
                  <p className="scholarship-eligibility">{scholarship.eligibility}</p>
                  <div className="scholarship-benefits">{scholarship.benefits.map((benefit) => <span key={benefit}>{benefit}</span>)}</div>
                  <div className="university-card-actions"><a className="primary-btn small" href={scholarship.url} target="_blank" rel="noreferrer">View official details</a><button type="button" className="secondary-btn small">Save scholarship</button></div>
                </article>
              ))}
            </div>
          ) : <div className="university-empty"><h2>No scholarships found</h2><p>Try a different keyword, destination, or study level.</p></div>}
          <p className="scholarship-disclaimer">This directory highlights well-known opportunities and is not an exhaustive guarantee of every scholarship available. Awards, deadlines, nationality rules, and eligible programmes change regularly. Confirm all information with the official provider.</p>
        </section>
      </main>
    </div>
  )
}

function ProfessorsPage() {
  const { theme } = useTheme()
  const [query, setQuery] = useState('')
  const [country, setCountry] = useState('All')
  const countries = useMemo(() => ['All', ...new Set(professorsData.map((professor) => professor.country).sort())], [])
  const professors = useMemo(() => {
    const term = query.trim().toLowerCase()
    return professorsData.filter((professor) => {
      const searchable = [professor.name, professor.university, professor.country, ...professor.research, ...professor.student].join(' ').toLowerCase()
      return searchable.includes(term) && (country === 'All' || professor.country === country)
    })
  }, [country, query])

  return (
    <div className={`app-shell ${theme}-theme`}>
      <AppTopbar />

      <main className="professor-page">
        <section className="professor-hero">
          <div>
            <p className="eyebrow">Supervisor directory</p>
            <h1>Find research supervisors for your next degree</h1>
            <p>Explore supervisors from the provided research list by university, country, research area, and student type.</p>
          </div>
          <div className="university-hero-stat"><strong>{professorsData.length}</strong><span>supervisors listed</span></div>
        </section>
        <section id="professors" className="university-content">
          <div className="university-toolbar professor-toolbar">
            <label className="university-search"><span>Search supervisors, universities, or research</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Try “AI security” or “Purdue”" type="search" /></label>
            <label className="university-filter"><span>Country</span><select value={country} onChange={(event) => setCountry(event.target.value)}>{countries.map((item) => <option key={item}>{item}</option>)}</select></label>
          </div>
          <div className="university-results-heading"><div><p className="eyebrow">Research connections</p><h2>{professors.length} matching supervisors</h2></div><span>Source: supervisor_list - Sheet1.pdf</span></div>
          {professors.length > 0 ? (
            <div className="professor-results-grid">
              {professors.map((professor) => (
                <article className="professor-card" key={`${professor.name}-${professor.university}`}>
                  <div className="university-card-top"><span className="country-tag">{professor.country}</span><span className="match-badge">{professor.research.length} areas</span></div>
                  <h2>{professor.name}</h2>
                  <p className="professor-university">{professor.university}</p>
                  <div className="professor-section"><span>Research areas</span><div className="professor-tags">{professor.research.map((area) => <span key={area}>{area}</span>)}</div></div>
                  {professor.student.length > 0 && <div className="professor-section"><span>May supervise</span><p>{professor.student.join(' · ')}</p></div>}
                  <div className="university-card-actions">
                    {professor.link ? <a className="primary-btn small" href={professor.link} target="_blank" rel="noreferrer">View profile</a> : <span className="secondary-btn small professor-unavailable">Profile unavailable</span>}
                    <button type="button" className="secondary-btn small">Save supervisor</button>
                  </div>
                </article>
              ))}
            </div>
          ) : <div className="university-empty"><h2>No supervisors found</h2><p>Try another research area, university, or country.</p></div>}
        </section>
      </main>
    </div>
  )
}

function UniversitiesPage() {
  const { theme } = useTheme()
  const [universities, setUniversities] = useState<University[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [usingFallback, setUsingFallback] = useState(false)
  const [failedEndpointCount, setFailedEndpointCount] = useState(0)
  const [query, setQuery] = useState('')
  const [country, setCountry] = useState('All')
  const [searchMode, setSearchMode] = useState<UniversitySearchMode>('vector')
  const [currentPage, setCurrentPage] = useState(1)
  const universitiesPerPage = 20
  
  useEffect(() => {
    const loadUniversities = async () => {
      setLoading(true)
      setError('')
      setUsingFallback(false)
      const results = await Promise.allSettled(WORQNOW_UNIVERSITY_ENDPOINTS.map(async (endpoint) => {
        const controller = new AbortController()
        const timeout = window.setTimeout(() => controller.abort(), 10000)
        try {
          const response = await fetch(endpoint.url, { signal: controller.signal })
          if (!response.ok) throw new Error(`${endpoint.country} API returned ${response.status}`)
          const payload: unknown = await response.json()
          if (!payload || typeof payload !== 'object') throw new Error(`${endpoint.country} API returned an invalid response`)
          const records = (payload as WorqnowResponse).data
          if (!Array.isArray(records)) throw new Error(`${endpoint.country} API returned no university data`)
          return records
            .filter((item): item is WorqnowUniversity => Boolean(item && typeof item === 'object'))
            .map((item) => normalizeUniversity(item, endpoint))
            .filter((university): university is University => university !== null)
        } finally {
          window.clearTimeout(timeout)
        }
      }))
      const successfulRecords = results
        .filter((result): result is PromiseFulfilledResult<University[]> => result.status === 'fulfilled')
        .flatMap((result) => result.value)
      const failedCount = results.filter((result) => result.status === 'rejected').length
      const uniqueUniversities = Array.from(
        new Map(successfulRecords.map((university) => [`${university.alpha_two_code}-${university.name}`, university])).values(),
      )
      setFailedEndpointCount(failedCount)
      if (uniqueUniversities.length > 0) {
        setUniversities(uniqueUniversities)
        if (failedCount > 0) setError(`${failedCount} country endpoint${failedCount === 1 ? '' : 's'} could not be reached.`)
      } else {
        setUniversities(fallbackUniversities)
        setUsingFallback(true)
        setError('The live university services could not be reached.')
      }
      setLoading(false)
    }
    void loadUniversities()
  }, [])

  const countries = useMemo(() => ['All', ...new Set(universities.map((university) => university.country).sort())], [universities])
  const filteredUniversities = useMemo(() => {
    const normalizedQuery = query.trim()
    let regex: RegExp | null = null
    if (searchMode === 'regex' && normalizedQuery) {
      try {
        regex = new RegExp(normalizedQuery, 'i')
      } catch {
        return []
      }
    }
    return universities
      .map((university) => {
        const searchText = universitySearchText(university)
        const score = searchMode === 'regex'
          ? (!normalizedQuery || regex?.test(searchText) ? 1 : 0)
          : vectorSimilarity(normalizedQuery, university)
        return { university, score }
      })
      .filter(({ university, score }) => {
        const matchesSearch = !normalizedQuery || (searchMode === 'regex' ? score > 0 : score > 0)
        return matchesSearch && (country === 'All' || university.country === country)
      })
      .sort((left, right) => right.score - left.score)
      .map(({ university }) => university)
  }, [country, query, searchMode, universities])
  const totalPages = Math.max(1, Math.ceil(filteredUniversities.length / universitiesPerPage))
  const displayedPage = Math.min(currentPage, totalPages)
  const paginatedUniversities = filteredUniversities.slice(
    (displayedPage - 1) * universitiesPerPage,
    displayedPage * universitiesPerPage,
  )

  return (
    <div className={`app-shell ${theme}-theme`}>
      <AppTopbar />

      <main className="university-page">
        <section className="university-hero">
          <div>
            <p className="eyebrow">University directory</p>
            <h1>Find the right university for your next chapter</h1>
            <p>Explore curated programs and compare destinations, costs, deadlines, and areas of focus in one place.</p>
          </div>
          <div className="university-hero-stat">
            <strong>{universities.length}</strong>
            <span>universities available</span>
          </div>
        </section>

        <section id="opportunities" className="university-content">
          <div className="university-toolbar">
            <label className="university-search">
              <span>{searchMode === 'vector' ? 'AI vector search' : 'Regex search'}</span>
              <input
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value)
                  setCurrentPage(1)
                }}
                placeholder="Try “data science” or “Canada”"
                type="search"
              />
            </label>
            <label className="university-filter">
              <span>Search mode</span>
              <select
                value={searchMode}
                onChange={(event) => {
                  setSearchMode(event.target.value as UniversitySearchMode)
                  setCurrentPage(1)
                }}
              >
                <option value="vector">AI vector relevance</option>
                <option value="regex">Regular expression</option>
              </select>
            </label>
            <label className="university-filter">
              <span>Country</span>
              <select
                value={country}
                onChange={(event) => {
                  setCountry(event.target.value)
                  setCurrentPage(1)
                }}
              >
                {countries.map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>
          </div>

          <div className="university-results-heading">
            <div>
              <p className="eyebrow">Your shortlist</p>
              <h2>{filteredUniversities.length} matching opportunities</h2>
            </div>
            <span>{query && searchMode === 'regex'
              ? 'Regex matches university metadata'
              : query
                ? 'Results ranked by local vector similarity'
                : usingFallback
                  ? 'Showing cached data while live services are unavailable'
                  : failedEndpointCount > 0
                    ? `Live Worqnow data with ${failedEndpointCount} unavailable endpoint${failedEndpointCount === 1 ? '' : 's'}`
                    : 'Live data from Worqnow Education API'}</span>
          </div>

          {loading ? (
            <div className="university-empty"><h2>Loading universities...</h2><p>Fetching the latest institutions from Worqnow.</p></div>
          ) : filteredUniversities.length > 0 ? (
            <>
            <div className="university-results-grid">
              {paginatedUniversities.map((university) => (
                <article className="university-result-card" key={`${university.name}-${university.country}-${university.alpha_two_code}`}>
                  <div className="university-card-top">
                    <span className="country-tag">{university.country}</span>
                    <span className="match-badge">{university.alpha_two_code}</span>
                  </div>
                  <h2>{university.name}</h2>
                  <p className="university-program">{[university.city, university.region].filter(Boolean).join(', ') || university.state_province || 'International institution'}</p>
                  <div className="university-meta">
                    <div><span>Fees</span><strong>{university.tuition_free ? 'Tuition free' : university.international_fee_band ? `${university.international_fee_band} band` : university.semester_contribution ? `Semester: ${university.semester_contribution}` : 'Check institution'}</strong></div>
                    <div><span>Highlights</span><strong>{university.world_ranking ? `World ranking: ${university.world_ranking}` : university.english_programs ? 'English programmes' : university.is_tu9 ? 'TU9 member' : university.domains[0] || 'Not listed'}</strong></div>
                  </div>
                  <div className="university-card-actions">
                    {university.web_pages[0] && <a className="secondary-btn small" href={university.web_pages[0]} target="_blank" rel="noreferrer">Official website</a>}
                    <button type="button" className="primary-btn small">Save university</button>
                  </div>
                </article>
              ))}
            </div>
            {totalPages > 1 && (
              <nav className="university-pagination" aria-label="University pages">
                <button
                  type="button"
                  className="secondary-btn small"
                  onClick={() => setCurrentPage((page) => Math.max(1, Math.min(page, totalPages) - 1))}
                  disabled={displayedPage === 1}
                >
                  Previous
                </button>
                <span>Page {displayedPage} of {totalPages}</span>
                <button
                  type="button"
                  className="secondary-btn small"
                  onClick={() => setCurrentPage((page) => Math.min(totalPages, Math.min(page, totalPages) + 1))}
                  disabled={displayedPage === totalPages}
                >
                  Next
                </button>
              </nav>
            )}
            </>
          ) : error && universities.length === 0 ? (
            <div className="university-empty"><h2>Could not load universities</h2><p>{error}. Please refresh and try again.</p></div>
          ) : (
            <div className="university-empty">
              <h2>No universities found</h2>
              <p>Try a different search term or choose another country.</p>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

function DashboardPage() {
  const { theme } = useTheme()
  const { user } = useAuth()
  const firstName = user?.name.split(' ')[0] ?? 'there'
  const countries = user?.target_countries ?? []
  const interests = user?.interests ?? []

  return (
    <div className={`app-shell ${theme}-theme`}>
      <AppTopbar />
      <main className="account-page">
        <section className="account-hero">
          <div>
            <p className="eyebrow">Personal dashboard</p>
            <h1>Welcome back, {firstName}</h1>
            <p>{user?.target_degree ? `Your ${user.target_degree} journey, organised in one place.` : 'Set your study goals to get a more personalised planning space.'}</p>
          </div>
          <Link className="primary-btn" to="/profile">Complete your profile</Link>
        </section>

        <section className="account-grid" aria-label="Account overview">
          <article className="account-card account-card-accent">
            <span className="account-card-label">Planning focus</span>
            <strong>{user?.target_degree || 'Not set yet'}</strong>
            <p>Your target degree</p>
          </article>
          <article className="account-card">
            <span className="account-card-label">Destinations</span>
            <strong>{countries.length}</strong>
            <p>{countries.length === 1 ? 'country saved' : 'countries saved'}</p>
          </article>
          <article className="account-card">
            <span className="account-card-label">Research interests</span>
            <strong>{interests.length}</strong>
            <p>{interests.length === 1 ? 'interest added' : 'interests added'}</p>
          </article>
        </section>

        <section className="account-panels">
          <article className="account-panel">
            <div className="section-head">
              <div><p className="eyebrow">Your study plan</p><h2>Make your next move</h2></div>
            </div>
            <div className="dashboard-actions">
              <Link to="/universities" className="dashboard-action"><span>01</span><div><strong>Explore universities</strong><p>Compare institutions across your saved destinations.</p></div><b>→</b></Link>
              <Link to="/scholarships#scholarships" className="dashboard-action"><span>02</span><div><strong>Find scholarships</strong><p>Browse funding opportunities for Bangladeshi students.</p></div><b>→</b></Link>
              <Link to="/professors#professors" className="dashboard-action"><span>03</span><div><strong>Find supervisors</strong><p>Discover professors aligned with your research goals.</p></div><b>→</b></Link>
            </div>
          </article>
          <article className="account-panel profile-summary">
            <div className="profile-avatar">{firstName.charAt(0).toUpperCase()}</div>
            <p className="eyebrow">Profile snapshot</p>
            <h2>{user?.name}</h2>
            <p className="profile-email">{user?.email}</p>
            <p>{user?.bio || 'Add a short bio so your study plan reflects who you are.'}</p>
            <div className="tag-list">{countries.map((country) => <span key={country}>{country}</span>)}{interests.slice(0, 3).map((interest) => <span key={interest}>{interest}</span>)}</div>
            <Link className="secondary-btn small" to="/profile">Edit profile</Link>
          </article>
        </section>
      </main>
    </div>
  )
}

function ProfilePage() {
  const { theme } = useTheme()
  const { user, refreshUser } = useAuth()
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  if (!user) return null

  return (
    <div className={`app-shell ${theme}-theme`}>
      <AppTopbar />
      <main className="account-page">
        <section className="account-hero profile-hero">
          <div>
            <p className="eyebrow">Your profile</p>
            <h1>Shape your study plan</h1>
            <p>Keep your goals and interests up to date so your dashboard stays personal to you.</p>
          </div>
          <div className="profile-avatar profile-avatar-large">{user.name.charAt(0).toUpperCase()}</div>
        </section>
        <form className="profile-form account-panel" onSubmit={async (event) => {
          event.preventDefault()
          setSaving(true); setError('')
          const form = new FormData(event.currentTarget)
          try {
            await authRequest('/profile', {
              method: 'PATCH',
              body: JSON.stringify({
                name: form.get('name'),
                bio: form.get('bio'),
                targetDegree: form.get('targetDegree'),
                targetCountries: String(form.get('targetCountries') ?? '').split(',').map((value) => value.trim()).filter(Boolean),
                interests: String(form.get('interests') ?? '').split(',').map((value) => value.trim()).filter(Boolean),
              }),
            })
            await refreshUser()
            toast.success('Profile saved successfully.')
          } catch (requestError) {
            const message = requestError instanceof Error ? requestError.message : 'Unable to save profile'
            setError(message)
            toast.error(message)
          } finally {
            setSaving(false)
          }
        }}>
          <div className="profile-form-heading"><div><p className="eyebrow">Personal details</p><h2>About you</h2></div><span className="profile-form-email">{user.email}</span></div>
          <div className="profile-form-grid">
            <label><span>Full name</span><input name="name" defaultValue={user.name} required /></label>
            <label><span>Target degree</span><input name="targetDegree" defaultValue={user.target_degree} placeholder="e.g. Master's in Computer Science" /></label>
            <label className="profile-form-full"><span>Short bio</span><textarea name="bio" defaultValue={user.bio} rows={4} placeholder="Tell us what you want to study and why." /></label>
            <label><span>Target countries</span><input name="targetCountries" defaultValue={user.target_countries.join(', ')} placeholder="Canada, Germany, Australia" /></label>
            <label><span>Research interests</span><input name="interests" defaultValue={user.interests.join(', ')} placeholder="AI, cybersecurity, data science" /></label>
          </div>
          {error && <p className="auth-error">{error}</p>}
          <div className="profile-form-actions"><Link className="secondary-btn" to="/dashboard">Cancel</Link><button className="primary-btn" type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save profile'}</button></div>
        </form>
      </main>
    </div>
  )
}

const AI_DESTINATION_PROFILES = [
  { country: 'Canada', degree: 'Master’s', budget: 'medium', research: 'research', summary: 'A welcoming, research-focused destination with strong post-study pathways.', monthly: 1650 },
  { country: 'Germany', degree: 'Master’s', budget: 'low', research: 'research', summary: 'Excellent value for money, especially for technical and research-led degrees.', monthly: 1050 },
  { country: 'United Kingdom', degree: 'Master’s', budget: 'high', research: 'career', summary: 'A fast, globally recognised route with a wide range of specialist programmes.', monthly: 2100 },
  { country: 'Australia', degree: 'Bachelor’s', budget: 'high', research: 'career', summary: 'A strong choice for career-focused study, lifestyle, and international communities.', monthly: 1900 },
  { country: 'Ireland', degree: 'PhD', budget: 'medium', research: 'research', summary: 'A growing technology and research hub with an English-speaking academic environment.', monthly: 1750 },
  { country: 'United States', degree: 'PhD', budget: 'high', research: 'research', summary: 'Outstanding research depth and a broad range of specialised doctoral programmes.', monthly: 2300 },
]
type AIRecommendation = { country: string; summary: string; why: string }

function AIToolsPage() {
  const { theme } = useTheme()
  const { user } = useAuth()
  const [degree, setDegree] = useState(user?.target_degree || 'Master’s')
  const [budget, setBudget] = useState('medium')
  const [goal, setGoal] = useState('research')
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([])
  const [country, setCountry] = useState('Germany')
  const [accommodation, setAccommodation] = useState('shared')
  const [monthlyBudget, setMonthlyBudget] = useState(0)
  const [calculatorReady, setCalculatorReady] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [budgetDetails, setBudgetDetails] = useState<{ currency: string; monthlyEstimate: number; breakdown: Record<string, number>; notes: string } | null>(null)
  const [chatInput, setChatInput] = useState('')
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'model'; text: string }>>([])

  const calculateRecommendations = () => {
    setAiLoading(true)
    void aiRequest<{ recommendations: Array<{ country: string; summary: string; why: string }> }>('/recommendations', { degree, budget, goal, targetCountries: user?.target_countries })
      .then((result) => setRecommendations(result.recommendations))
      .catch((error: unknown) => toast.error(error instanceof Error ? error.message : 'Unable to generate recommendations'))
      .finally(() => setAiLoading(false))
  }

  const calculateCost = () => {
    setAiLoading(true)
    void aiRequest<{ currency: string; monthlyEstimate: number; breakdown: Record<string, number>; notes: string }>('/budget', { country, accommodation })
      .then((result) => { setBudgetDetails(result); setMonthlyBudget(result.monthlyEstimate); setCalculatorReady(true) })
      .catch((error: unknown) => toast.error(error instanceof Error ? error.message : 'Unable to calculate budget'))
      .finally(() => setAiLoading(false))
  }

  const sendChatMessage = () => {
    const text = chatInput.trim()
    if (!text || aiLoading) return
    const nextMessages = [...chatMessages, { role: 'user' as const, text }]
    setChatMessages(nextMessages)
    setChatInput('')
    setAiLoading(true)
    void aiRequest<{ message: string }>('/chat', { messages: nextMessages.map(({ role, text: message }) => ({ role, parts: [{ text: message }] })) })
      .then((result) => setChatMessages((current) => [...current, { role: 'model', text: result.message }]))
      .catch((error: unknown) => toast.error(error instanceof Error ? error.message : 'Unable to reach the AI assistant'))
      .finally(() => setAiLoading(false))
  }

  return (
    <div className={`app-shell ${theme}-theme`}>
      <AppTopbar />
      <main className="ai-tools-page" id="ai">
        <section className="ai-tools-hero">
          <div>
            <p className="eyebrow">AI study tools</p>
            <h1>Make your next study decision with confidence</h1>
            <p>Use your goals, budget, and interests to explore destinations and plan a realistic monthly living budget.</p>
          </div>
          <span className="ai-tools-badge">Personalised guidance</span>
        </section>

        <section className="ai-tool-panels">
          <article className="ai-tool-panel">
            <div className="ai-tool-panel-heading"><span className="study-tool-icon">🎓</span><div><p className="eyebrow">Destination guide</p><h2>Can’t decide where to study?</h2></div></div>
            <p>Tell us what matters most and get a short list of destinations to research next.</p>
            <div className="ai-form-grid">
              <label><span>Study level</span><select value={degree} onChange={(event) => setDegree(event.target.value)}><option>Bachelor’s</option><option>Master’s</option><option>PhD</option></select></label>
              <label><span>Budget comfort</span><select value={budget} onChange={(event) => setBudget(event.target.value)}><option value="low">Value focused</option><option value="medium">Balanced</option><option value="high">Flexible</option></select></label>
              <label className="ai-form-full"><span>Main goal</span><select value={goal} onChange={(event) => setGoal(event.target.value)}><option value="research">Research and academic depth</option><option value="career">Career and industry opportunities</option></select></label>
            </div>
            <button type="button" className="primary-btn ai-tool-submit" onClick={calculateRecommendations} disabled={aiLoading}>{aiLoading ? 'Asking Gemini...' : 'Generate recommendations'}</button>
            {recommendations.length > 0 && <div className="ai-recommendations"><h3>Your recommended destinations</h3>{recommendations.map((recommendation) => <div className="ai-recommendation" key={recommendation.country}><div><strong>{recommendation.country}</strong><p>{recommendation.summary}</p><small>{recommendation.why}</small></div><span>Explore →</span></div>)}</div>}
          </article>

          <article className="ai-tool-panel">
            <div className="ai-tool-panel-heading"><span className="study-tool-icon">▣</span><div><p className="eyebrow">Budget planner</p><h2>Cost of living calculator</h2></div></div>
            <p>Estimate a monthly student budget before you shortlist universities and cities.</p>
            <div className="ai-form-grid">
              <label><span>Destination</span><select value={country} onChange={(event) => { setCountry(event.target.value); setCalculatorReady(false) }}>{AI_DESTINATION_PROFILES.map((profile) => <option key={profile.country}>{profile.country}</option>)}</select></label>
              <label><span>Accommodation</span><select value={accommodation} onChange={(event) => { setAccommodation(event.target.value); setCalculatorReady(false) }}><option value="shared">Shared housing</option><option value="campus">University housing</option><option value="private">Private studio</option></select></label>
            </div>
            <button type="button" className="primary-btn ai-tool-submit" onClick={calculateCost} disabled={aiLoading}>{aiLoading ? 'Calculating with Gemini...' : 'Calculate monthly budget'}</button>
            {calculatorReady && budgetDetails && <div className="ai-cost-result"><span>Estimated monthly budget</span><strong>{budgetDetails.currency} {monthlyBudget.toLocaleString()}</strong><p>{budgetDetails.notes}</p><div className="ai-budget-breakdown">{Object.entries(budgetDetails.breakdown).map(([item, value]) => <span key={item}>{item}: {budgetDetails.currency} {value.toLocaleString()}</span>)}</div></div>}
          </article>
        </section>
        <section className="ai-chat-panel">
          <div className="ai-tool-panel-heading"><span className="study-tool-icon">✦</span><div><p className="eyebrow">Study assistant</p><h2>Ask the AI advisor</h2></div></div>
          <div className="ai-chat-messages">{chatMessages.length === 0 ? <p className="ai-chat-empty">Ask about applications, scholarships, supervisors, visas, or studying abroad.</p> : chatMessages.map((message, index) => <div className={`ai-chat-message ${message.role}`} key={`${message.role}-${index}`}><span>{message.role === 'user' ? 'You' : 'Gemini'}</span><p>{message.text}</p></div>)}</div>
          <div className="ai-chat-input"><input value={chatInput} onChange={(event) => setChatInput(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') sendChatMessage() }} placeholder="Ask a study-abroad question..." /><button type="button" className="primary-btn" onClick={sendChatMessage} disabled={!chatInput.trim() || aiLoading}>Send</button></div>
        </section>
      </main>
    </div>
  )
}

function Dashboard() {
  const { theme, toggleTheme } = useTheme()
  const { user, logout } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className={`app-shell ${theme}-theme`}>
      <AppTopbar />
      <header className="topbar legacy-dashboard-header">
        <div className="brand-wrap">
          <img src={img} alt="CUET logo" className='w-[35px] h-[45px]' />
          <div>
            <p className="eyebrow">CUET</p>
            <h2>Study Abroad Helper</h2>
          </div>
        </div>

        <nav className="nav" aria-label="Primary navigation">
          <Link to="/universities">Explore universities</Link>
          <Link to="/scholarships#scholarships">Scholarships</Link>
          <Link to="/professors#professors">Find professors</Link>
          {user && <Link to="/dashboard">Dashboard</Link>}
          {user && <Link to="/profile">Profile</Link>}
          <Link to="/login">AI tools</Link>
        </nav>

        <div className="topbar-actions">
          <button
            type="button"
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
          >
            {theme === 'dark' ? '☀ Light' : '☾ Dark'}
          </button>
          {user ? <button type="button" className="secondary-btn small" onClick={() => void logout()}>Log out</button> : <Link className="primary-btn nav-cta" to="/login">LOGIN / REGISTER</Link>}
          <button
            type="button"
            className="menu-toggle"
            onClick={() => setMobileMenuOpen((open) => !open)}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-navigation"
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          >
            <span />
            <span />
            <span />
          </button>
        </div>

        <nav
          id="mobile-navigation"
          className={`mobile-nav ${mobileMenuOpen ? 'mobile-nav-open' : ''}`}
          aria-label="Mobile navigation"
        >
          <Link onClick={() => setMobileMenuOpen(false)} to="/universities#opportunities">Explore universities</Link>
          <Link onClick={() => setMobileMenuOpen(false)} to="/scholarships#scholarships">Scholarships</Link>
          <Link onClick={() => setMobileMenuOpen(false)} to="/professors#professors">Find professors</Link>
          {user && <Link onClick={() => setMobileMenuOpen(false)} to="/dashboard">Dashboard</Link>}
          {user && <Link onClick={() => setMobileMenuOpen(false)} to="/profile">Profile</Link>}
          <Link onClick={() => setMobileMenuOpen(false)} to="/ai#ai">AI tools</Link>
          <Link className="primary-btn" onClick={() => setMobileMenuOpen(false)} to="/login">LOGIN / REGISTER</Link>
        </nav>
      </header>

      <main>
        <section className="hero-section">
          <div className="hero-copy">
            <nav className="hero-breadcrumb" aria-label="Breadcrumb">
              <Link to="/">CUET Study Abroad Helper</Link>
              <span>/</span>
              <span>Study abroad</span>
            </nav>
            <h1>{user ? `Welcome back, ${user.name.split(' ')[0]}` : 'Study abroad destinations'}</h1>
            <p>
              {user?.target_degree ? `Your ${user.target_degree} journey starts here. Explore destinations and opportunities matched to your goals.` : 'Learn more about exciting places where you can study and find the destination that fits your ambitions.'}
            </p>

            <div className="cta-row">
              <button type="button" className="primary-btn large">
                Explore destinations
              </button>
            </div>
          </div>
        </section>

        <section className="destination-section">
          <div className="section-head">
            <div>
              <p className="eyebrow">Study destinations</p>
              <h3>Explore where you could go next</h3>
            </div>
          </div>
          <div className="destination-grid">
            {destinations.map((destination) => (
              <a
                key={destination.country}
                href="#opportunities"
                className={`destination-card ${destination.tone}`}
                style={{
                  backgroundImage: `linear-gradient(180deg, rgba(15, 23, 42, 0.05) 20%, rgba(2, 8, 23, 0.92) 100%), url(${destination.image})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
                aria-label={`Study in ${destination.country}`}
              >
                <div className="destination-overlay">
                  <span className="destination-flag">{destination.flag}</span>
                  <h4>{destination.country}</h4>
                  <div className="destination-details">
                    <p>{destination.note}</p>
                    <span className="destination-link">Discover →</span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </section>

        <section className="study-tools-section" aria-label="Study planning tools">
          <div className="study-tool-card">
            <span className="study-tool-icon" aria-hidden="true">🎓</span>
            <h3>Can’t decide where to study?</h3>
            <p>Ask AI to get personalised content and course recommendations</p>
            <a className="study-tool-button" href="#ai">Let our system guide you</a>
          </div>
          <div className="study-tool-card">
            <span className="study-tool-icon" aria-hidden="true">▣</span>
            <h3>Cost of living calculator</h3>
            <p>
              Estimate how much you will need to cover your expenses including
              cost of living comparison for various country and accommodation
              options with AI assistance
            </p>
            <a className="study-tool-button" href="#ai">Calculate now</a>
          </div>
        </section>
        </main>

      <footer className="site-footer">
        <div className="footer-top">
          <Link className="footer-brand" to="/">
            <img src={img} alt="CUET Study Abroad Helper logo" />
            <span>
              <strong>CUET</strong>
              <small>Study Abroad Helper</small>
            </span>
          </Link>
          <a className="footer-office-link" href="#opportunities">
            <span aria-hidden="true">⌖</span>
            Find your study advisor
          </a>
        </div>

        <div className="footer-links">
          <div>
            <h4>About us</h4>
            <a href="#opportunities">Why choose CUET Helper</a>
            <a href="#professors">Find a professor</a>
            <a href="#tracker">Application support</a>
            <a href="#ai">AI study tools</a>
            <a href="#opportunities">Study destinations</a>
          </div>
          <div>
            <h4>Useful links</h4>
            <a href="#opportunities">Explore universities</a>
            <a href="#scholarships">Scholarships</a>
            <a href="#tracker">Application checklist</a>
            <a href="#professors">Research opportunities</a>
            <a href="#ai">SOP guidance</a>
          </div>
          <div>
            <h4>Student resources</h4>
            <a href="#ai">AI assistant</a>
            <a href="#opportunities">Funding options</a>
            <a href="#opportunities">Popular programs</a>
          </div>
          <div>
            <h4>Connect with us</h4>
            <a href="#opportunities">CUET student community</a>
            <a href="#professors">Faculty directory</a>
            <a href="#tracker">Contact support</a>
            <a href="#ai">Share feedback</a>
          </div>
        </div>

        <div className="footer-bottom">
          <div>
            <p>© 2026 CUET Study Abroad Helper</p>
            <p className="footer-note">Built to help CUET students plan their global education journey.</p>
            <div className="footer-legal">
              <a href="#opportunities">Privacy policy</a>
              <span>|</span>
              <a href="#opportunities">Terms of use</a>
              <span>|</span>
              <a href="#opportunities">Disclaimer</a>
            </div>
          </div>
          <div className="footer-socials" aria-label="Social links">
            <a href="#opportunities" aria-label="Facebook">f</a>
            <a href="#opportunities" aria-label="Instagram">◎</a>
            <a href="#opportunities" aria-label="LinkedIn">in</a>
            <a href="#opportunities" aria-label="X">𝕏</a>
            <a href="#opportunities" aria-label="YouTube">▶</a>
          </div>
        </div>
      </footer>
    </div>
  )
}

function App() {
  const [theme, setTheme] = useState<Theme>(() => {
    const savedTheme = localStorage.getItem('cuet-theme')
    return savedTheme === 'dark' ? 'dark' : 'light'
  })

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem('cuet-theme', theme)
  }, [theme])

  const themeValue = {
    theme,
    toggleTheme: () => setTheme((current) => current === 'dark' ? 'light' : 'dark'),
  }
  const [user, setUser] = useState<User | null>(null)
  const [authReady, setAuthReady] = useState(false)
  const refreshUser = async () => {
    try {
      const payload = await authRequest('/auth/me')
      setUser(payload?.user ?? null)
    } catch {
      setUser(null)
    }
  }
  const logout = async () => {
    await authRequest('/auth/logout', { method: 'POST' })
    setUser(null)
  }
  useEffect(() => {
    void refreshUser().finally(() => setAuthReady(true))
  }, [])

  return (
    <ThemeContext.Provider value={themeValue}>
      <AuthContext.Provider value={{ user, authReady, refreshUser, logout }}>
        <BrowserRouter>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                borderRadius: '14px',
                background: theme === 'dark' ? '#0f172a' : '#ffffff',
                color: theme === 'dark' ? '#f8fafc' : '#243047',
                border: `1px solid ${theme === 'dark' ? '#334155' : '#e2e8f0'}`,
                boxShadow: '0 12px 30px rgba(15, 23, 42, 0.14)',
              },
            }}
          />
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
            <Route path="/universities" element={<UniversitiesPage />} />
            <Route path="/scholarships" element={<ScholarshipsPage />} />
            <Route path="/professors" element={<ProfessorsPage />} />
            <Route path="/tracker" element={<Dashboard />} />
            <Route path="/ai" element={<ProtectedRoute><AIToolsPage /></ProtectedRoute>} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="*" element={<Dashboard />} />
          </Routes>
        </BrowserRouter>
      </AuthContext.Provider>
    </ThemeContext.Provider>
  )
}

export default App
