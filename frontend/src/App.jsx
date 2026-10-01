import { useEffect, useState } from 'react'
import { Alert, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, MenuItem, Snackbar, TextField, ThemeProvider, Tooltip, createTheme } from '@mui/material'
import { ArrowDownUp, ArrowLeft, ArrowRight, BriefcaseBusiness, ChartNoAxesCombined, ChevronDown, CircleHelp, Globe2, LayoutDashboard, Pencil, Plus, Search, SlidersHorizontal, UsersRound, X } from 'lucide-react'
import './App.css'

const COUNTRIES = ['Australia', 'Canada', 'Germany', 'Singapore', 'United Kingdom', 'United States']
const DEPARTMENTS = ['Design', 'Engineering', 'Finance', 'Legal', 'Operations', 'People', 'Product', 'Sales']
const LEVELS = ['L1', 'L2', 'L3', 'L4', 'L5', 'L6']
const CURRENCIES = ['AUD', 'CAD', 'EUR', 'GBP', 'SGD', 'USD']
const COUNTRY_CURRENCIES = { Australia: 'AUD', Canada: 'CAD', Germany: 'EUR', Singapore: 'SGD', 'United Kingdom': 'GBP', 'United States': 'USD' }
const EMPTY_FORM = { name: '', email: '', country: 'United States', department: 'Engineering', job_title: '', level: 'L1', salary_currency: 'USD', salary: '' }
const muiTheme = createTheme({ typography: { fontFamily: 'DM Sans, Avenir Next, sans-serif' }, palette: { primary: { main: '#236c7a' }, error: { main: '#b74c43' } }, shape: { borderRadius: 5 } })

async function apiRequest(path, options = {}) {
  const response = await fetch(path, { headers: { 'Content-Type': 'application/json', ...options.headers }, ...options })
  const body = await response.json().catch(() => ({}))
  if (!response.ok) {
    const message = body.errors
      ? Object.entries(body.errors).map(([field, messages]) => `${field.replaceAll('_', ' ')} ${messages.join(', ')}`).join('. ')
      : body.error || `Request failed (${response.status})`
    throw new Error(message)
  }
  return body
}

function formatMoney(cents, currency) {
  return new Intl.NumberFormat('en', { style: 'currency', currency, maximumFractionDigits: 0 }).format(cents / 100)
}

function initials(name) {
  return name.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase()
}

function EmployeeForm({ employee, onClose, onSaved, notify }) {
  const [form, setForm] = useState(() => employee ? { ...employee, salary: (employee.salary_cents / 100).toFixed(2) } : { ...EMPTY_FORM })
  const [saving, setSaving] = useState(false)

  function updateField(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value, ...(name === 'country' ? { salary_currency: COUNTRY_CURRENCIES[value] } : {}) }))
  }

  async function submit(event) {
    event.preventDefault()
    setSaving(true)
    try {
      const payload = { ...form, salary_cents: Math.round(Number(form.salary) * 100) }
      delete payload.salary
      await apiRequest(employee ? `/api/employees/${employee.id}` : '/api/employees', {
        method: employee ? 'PATCH' : 'POST',
        body: JSON.stringify({ employee: payload }),
      })
      onSaved()
      notify(employee ? 'Employee details updated' : 'Employee added to the directory', 'success')
      onClose()
    } catch (error) {
      notify(error.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm" aria-labelledby="employee-dialog-title">
      <form onSubmit={submit}>
        <DialogTitle id="employee-dialog-title" className="dialog-title">
          <span>{employee ? 'Update employee' : 'Add employee'}</span>
          <IconButton aria-label="Close" onClick={onClose} size="small"><X size={18} /></IconButton>
        </DialogTitle>
        <DialogContent className="dialog-content">
          <p className="form-intro">Employee profile and current annual base salary.</p>
          <div className="form-grid">
            <TextField required label="Full name" name="name" value={form.name} onChange={updateField} />
            <TextField required type="email" label="Work email" name="email" value={form.email} onChange={updateField} />
            <TextField required select label="Country" name="country" value={form.country} onChange={updateField}>{COUNTRIES.map((country) => <MenuItem key={country} value={country}>{country}</MenuItem>)}</TextField>
            <TextField required select label="Department" name="department" value={form.department} onChange={updateField}>{DEPARTMENTS.map((department) => <MenuItem key={department} value={department}>{department}</MenuItem>)}</TextField>
            <TextField required label="Job title" name="job_title" value={form.job_title} onChange={updateField} />
            <TextField required select label="Level" name="level" value={form.level} onChange={updateField}>{LEVELS.map((level) => <MenuItem key={level} value={level}>{level}</MenuItem>)}</TextField>
            <TextField required select label="Currency" name="salary_currency" value={form.salary_currency} onChange={updateField}>{CURRENCIES.map((currency) => <MenuItem key={currency} value={currency}>{currency}</MenuItem>)}</TextField>
            <TextField required type="number" inputProps={{ min: 0, step: '0.01' }} label="Annual base salary" name="salary" value={form.salary} onChange={updateField} />
          </div>
        </DialogContent>
        <DialogActions className="dialog-actions">
          <Button onClick={onClose} color="inherit">Cancel</Button>
          <Button type="submit" variant="contained" disabled={saving}>{saving ? 'Saving…' : employee ? 'Save changes' : 'Add employee'}</Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}

function EmployeeTable({ employees, loading, onEdit, onSort, sort, compact = false }) {
  const columns = [['name', 'Employee'], ['department', 'Department'], ['country', 'Location'], ['level', 'Level'], ['salary_cents', 'Annual base']]
  return (
    <div className={`table-wrap${compact ? ' compact-table' : ''}`}>
      <table className="employee-table">
        <thead><tr>{columns.map(([field, label]) => <th key={field}><button className={sort.field === field ? 'sort-heading selected' : 'sort-heading'} onClick={() => onSort(field)}>{label}<ArrowDownUp size={13} /></button></th>)}<th><span className="sr-only">Actions</span></th></tr></thead>
        <tbody>
          {loading && !employees.length && <tr><td colSpan="6" className="table-state"><CircularProgress size={22} />Loading employee records…</td></tr>}
          {!loading && !employees.length && <tr><td colSpan="6" className="table-state">No employees match these filters.</td></tr>}
          {employees.map((employee, index) => (
            <tr key={employee.id}>
              <td><div className="employee-cell"><span className={`employee-avatar avatar-${index % 5}`}>{initials(employee.name)}</span><span><strong>{employee.name}</strong><small>{employee.email}</small></span></div></td>
              <td><div className="department-cell"><strong>{employee.department}</strong><small>{employee.job_title}</small></div></td>
              <td><span className="location-cell"><Globe2 size={14} />{employee.country}</span></td>
              <td><span className="level-pill">{employee.level}</span></td>
              <td><strong className="salary-cell">{formatMoney(employee.salary_cents, employee.salary_currency)} <small>{employee.salary_currency}</small></strong></td>
              <td className="action-cell"><Tooltip title="Edit employee"><IconButton aria-label={`Edit ${employee.name}`} size="small" onClick={() => onEdit(employee)}><Pencil size={15} /><span className="sr-only">Edit employee</span></IconButton></Tooltip></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function AppContent() {
  const [view, setView] = useState('overview')
  const [dashboard, setDashboard] = useState(null)
  const [employees, setEmployees] = useState([])
  const [pagination, setPagination] = useState({ current_page: 1, per_page: 20, total_count: 0, total_pages: 0 })
  const [filters, setFilters] = useState({ search: '', country: 'All countries', department: 'All departments', level: 'All levels' })
  const [sort, setSort] = useState({ field: 'name', direction: 'asc' })
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [editingEmployee, setEditingEmployee] = useState(null)
  const [formOpen, setFormOpen] = useState(false)
  const [notice, setNotice] = useState({ open: false, message: '', severity: 'success' })

  useEffect(() => {
    let active = true
    apiRequest('/api/dashboard').then((data) => { if (active) setDashboard(data) }).catch((error) => { if (active) setLoadError(error.message) })
    return () => { active = false }
  }, [])

  useEffect(() => {
    let active = true
    const activeFilters = {
      ...filters,
      country: filters.country === 'All countries' ? '' : filters.country,
      department: filters.department === 'All departments' ? '' : filters.department,
      level: filters.level === 'All levels' ? '' : filters.level,
    }
    const query = new URLSearchParams({ page: String(page), per_page: '20', sort: sort.field, direction: sort.direction, ...Object.fromEntries(Object.entries(activeFilters).filter(([, value]) => value)) })
    const timer = window.setTimeout(() => {
      apiRequest(`/api/employees?${query}`)
        .then((data) => {
          if (active) {
            setEmployees(data.employees)
            setPagination(data.pagination)
            setLoadError('')
          }
        })
        .catch((error) => { if (active) setLoadError(error.message) })
        .finally(() => { if (active) setLoading(false) })
    }, filters.search ? 220 : 0)
    return () => { active = false; window.clearTimeout(timer) }
  }, [filters, page, sort])

  function updateFilter(name, value) {
    setLoading(true)
    setFilters((current) => ({ ...current, [name]: value }))
    setPage(1)
  }

  function toggleSort(field) {
    setLoading(true)
    setSort((current) => ({ field, direction: current.field === field && current.direction === 'asc' ? 'desc' : 'asc' }))
  }

  function notify(message, severity = 'success') {
    setNotice({ open: true, message, severity })
  }

  function reloadData() {
    setLoading(true)
    apiRequest('/api/dashboard').then(setDashboard).catch((error) => setLoadError(error.message))
    setFilters((current) => ({ ...current }))
  }

  function startCreate() {
    setEditingEmployee(null)
    setFormOpen(true)
  }

  function startEdit(employee) {
    setEditingEmployee(employee)
    setFormOpen(true)
  }

  const firstIndex = pagination.total_count ? (page - 1) * pagination.per_page + 1 : 0
  const lastIndex = Math.min(page * pagination.per_page, pagination.total_count)
  const maxDepartmentCount = Math.max(...(dashboard?.departments.map((entry) => entry.employee_count) ?? [1]), 1)

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#overview" onClick={() => setView('overview')}><span className="brand-mark"><UsersRound size={19} strokeWidth={2.2} /></span><span><strong>acme</strong><small>PEOPLE OPERATIONS</small></span></a>
        <div className="workspace-label">WORKSPACE</div>
        <nav className="side-nav" aria-label="Main navigation">
          <button className={view === 'overview' ? 'nav-item active' : 'nav-item'} onClick={() => setView('overview')}><LayoutDashboard size={17} /> Overview</button>
          <button className={view === 'employees' ? 'nav-item active' : 'nav-item'} onClick={() => setView('employees')}><UsersRound size={17} /> Employee directory<span className="nav-count">{dashboard?.employee_count?.toLocaleString('en') ?? '—'}</span></button>
        </nav>
        <div className="sidebar-footer"><div className="secure-mark"><span /> Local demo · fictional data</div><div className="profile-row"><span className="profile-avatar">HR</span><span><strong>HR Manager</strong><small>ACME Organization</small></span><ChevronDown size={15} /></div></div>
      </aside>

      <main className="main-area">
        <header className="topbar"><div className="crumb"><span>ACME</span><span className="crumb-divider">/</span><span>People &amp; compensation</span></div><div className="topbar-right"><span className="period-label">FY 2026</span><Tooltip title="Compensation figures are annual base salaries and remain separated by currency."><IconButton aria-label="About compensation metrics" size="small"><CircleHelp size={18} /></IconButton></Tooltip><span className="top-avatar">HR</span></div></header>
        <div className="page-content">
          <div className="page-heading"><div><div className="eyebrow">PEOPLE ANALYTICS <span className="eyebrow-line" /></div><h1>{view === 'overview' ? 'Compensation overview' : 'Employee directory'}</h1><p className="subtitle">{view === 'overview' ? 'A clear view of how ACME pays across its global team.' : 'Find a colleague or manage their current compensation details.'}</p></div><Button className="add-button" variant="contained" startIcon={<Plus size={17} />} onClick={startCreate}>Add employee</Button></div>
          {loadError && <Alert severity="error" className="load-alert">{loadError}. Start the Rails API on port 3000 and try refreshing.</Alert>}

          {view === 'overview' && <>
            <section className="metric-strip" aria-label="Organization metrics">
              <div className="metric-item"><span className="metric-label"><UsersRound size={15} /> Active employees</span><strong>{dashboard?.employee_count?.toLocaleString('en') ?? '—'}</strong><small>Across the organization</small></div>
              <div className="metric-item"><span className="metric-label"><Globe2 size={15} /> Countries</span><strong>{dashboard?.country_count ?? '—'}</strong><small>Distinct work locations</small></div>
              <div className="metric-item"><span className="metric-label"><BriefcaseBusiness size={15} /> Departments</span><strong>{dashboard?.department_count ?? '—'}</strong><small>Across the organization</small></div>
              <div className="metric-note"><span className="note-icon"><ChartNoAxesCombined size={18} /></span><span><strong>One global team.</strong><br />Local currencies, clear context.</span></div>
            </section>

            <section className="overview-grid">
              <div className="panel compensation-panel"><div className="panel-heading"><div><div className="section-kicker">PAY SNAPSHOT</div><h2>Average annual base salary</h2></div><span className="panel-icon"><ArrowDownUp size={17} /></span></div><p className="panel-subtitle">Comparable within currency only. No exchange rates applied.</p>
                {dashboard?.compensation_by_currency?.length ? <div className="currency-list">{dashboard.compensation_by_currency.map((entry, index) => <div className="currency-row" key={entry.currency}><span className={`currency-dot tone-${index % 4}`} /><span className="currency-code">{entry.currency}</span><span className="currency-count">{entry.employee_count.toLocaleString('en')} people</span><strong>{formatMoney(entry.average_salary_cents, entry.currency)}</strong></div>)}</div> : <div className="empty-inline">{loading ? 'Loading compensation data…' : 'No salary data available.'}</div>}
                <div className="privacy-note"><span /> Salary averages are descriptive and are not adjusted for role, tenure, or location.</div>
              </div>
              <div className="panel department-panel"><div className="panel-heading"><div><div className="section-kicker">TEAM DISTRIBUTION</div><h2>People by department</h2></div><span className="panel-icon orange"><UsersRound size={17} /></span></div><p className="panel-subtitle">Headcount across the largest departments.</p>
                <div className="department-list">{(dashboard?.departments ?? []).map((entry, index) => <div className="department-row" key={entry.department}><span className="department-name">{entry.department}</span><div className="bar-track"><span className={`bar-fill bar-${index % 4}`} style={{ width: `${Math.max(4, entry.employee_count / maxDepartmentCount * 100)}%` }} /></div><strong>{entry.employee_count.toLocaleString('en')}</strong></div>)}{!dashboard?.departments?.length && <div className="empty-inline">Loading department data…</div>}</div>
                <button className="text-link" onClick={() => setView('employees')}>Browse employee directory <ArrowRight size={15} /></button>
              </div>
            </section>

            <section className="recent-section"><div className="recent-heading"><div><div className="section-kicker">QUICK LOOK</div><h2>From the employee directory</h2></div><button className="text-link" onClick={() => setView('employees')}>View directory <ArrowRight size={15} /></button></div><EmployeeTable employees={employees.slice(0, 5)} loading={loading} onEdit={startEdit} onSort={toggleSort} sort={sort} compact /></section>
          </>}

          {view === 'employees' && <section className="directory-section">
            <div className="directory-toolbar"><div className="search-field"><Search size={17} /><input aria-label="Search employees" placeholder="Search name, title, or email" value={filters.search} onChange={(event) => updateFilter('search', event.target.value)} /><kbd>/</kbd></div><div className="filter-control"><SlidersHorizontal size={15} /><span>Filter</span></div>
              <TextField select size="small" aria-label="Filter by country" value={filters.country} onChange={(event) => updateFilter('country', event.target.value)} className="filter-select"><MenuItem value="All countries">All countries</MenuItem>{COUNTRIES.map((country) => <MenuItem key={country} value={country}>{country}</MenuItem>)}</TextField>
              <TextField select size="small" aria-label="Filter by department" value={filters.department} onChange={(event) => updateFilter('department', event.target.value)} className="filter-select"><MenuItem value="All departments">All departments</MenuItem>{DEPARTMENTS.map((department) => <MenuItem key={department} value={department}>{department}</MenuItem>)}</TextField>
              <TextField select size="small" aria-label="Filter by level" value={filters.level} onChange={(event) => updateFilter('level', event.target.value)} className="filter-select level-filter"><MenuItem value="All levels">All levels</MenuItem>{LEVELS.map((level) => <MenuItem key={level} value={level}>{level}</MenuItem>)}</TextField>
            </div>
            <div className="table-meta"><span><strong>{pagination.total_count.toLocaleString('en')}</strong> people</span><span className="meta-divider" /><span>Showing {firstIndex}–{lastIndex}</span></div>
            <EmployeeTable employees={employees} loading={loading} onEdit={startEdit} onSort={toggleSort} sort={sort} />
            <div className="pagination-bar"><span>Page {page} of {Math.max(1, pagination.total_pages)}</span><div className="page-controls"><Tooltip title="Previous page"><span><IconButton aria-label="Previous page" size="small" disabled={page <= 1 || loading} onClick={() => { setLoading(true); setPage((current) => current - 1) }}><ArrowLeft size={17} /></IconButton></span></Tooltip><Tooltip title="Next page"><span><IconButton aria-label="Next page" size="small" disabled={page >= pagination.total_pages || loading} onClick={() => { setLoading(true); setPage((current) => current + 1) }}><ArrowRight size={17} /></IconButton></span></Tooltip></div></div>
          </section>}
          <footer className="page-footer"><span>ACME PEOPLE OPERATIONS</span><span>Salary data · FY 2026</span></footer>
        </div>
      </main>
      {formOpen && <EmployeeForm employee={editingEmployee} onClose={() => setFormOpen(false)} onSaved={reloadData} notify={notify} />}
      <Snackbar open={notice.open} autoHideDuration={4200} onClose={() => setNotice((current) => ({ ...current, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}><Alert severity={notice.severity} onClose={() => setNotice((current) => ({ ...current, open: false }))} variant="filled">{notice.message}</Alert></Snackbar>
    </div>
  )
}

export default function App() {
  return <ThemeProvider theme={muiTheme}><AppContent /></ThemeProvider>
}