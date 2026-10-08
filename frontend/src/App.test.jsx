import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import App from './App.jsx'

const employee = {
  id: 1,
  name: 'Alex Rivera',
  email: 'alex.rivera@example.com',
  country: 'Canada',
  department: 'Engineering',
  job_title: 'Software Engineer',
  level: 'L3',
  salary_currency: 'CAD',
  salary_cents: 9_500_000,
}

function jsonResponse(body, status = 200) {
  return { ok: status < 400, status, json: async () => body }
}

describe('salary workspace', () => {
  let fetchMock
  let submittedEmployee

  beforeEach(() => {
    submittedEmployee = null
    fetchMock = vi.fn((path, options = {}) => {
      if (path === '/api/session') {
        return Promise.resolve(jsonResponse({ user: { email: 'hr@example.com' }, csrf_token: 'test-csrf-token' }))
      }
      if (path === '/api/dashboard') {
        return Promise.resolve(jsonResponse({
          employee_count: 10_000,
          country_count: 6,
          department_count: 8,
          compensation_by_currency: [{ currency: 'CAD', employee_count: 1_600, average_salary_cents: 9_500_000 }],
          departments: [{ department: 'Engineering', employee_count: 1_200 }],
        }))
      }
      if (path === '/api/employees' && options.method === 'POST') {
        submittedEmployee = JSON.parse(options.body).employee
        return Promise.resolve(jsonResponse({ ...submittedEmployee, id: 2 }, 201))
      }
      return Promise.resolve(jsonResponse({
        employees: [employee],
        pagination: { current_page: 1, per_page: 20, total_count: 1, total_pages: 1 },
      }))
    })
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('shows currency-aware metrics and sends directory filters to the API', async () => {
    render(<App />)

    expect(await screen.findByRole('heading', { name: 'Compensation overview' })).toBeInTheDocument()
    expect((await screen.findAllByText('CA$95,000')).length).toBeGreaterThan(0)
    expect(screen.getByText('10,000', { selector: 'strong' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Employee directory/ }))
    expect(await screen.findByRole('heading', { name: 'Employee directory' })).toBeInTheDocument()
    fireEvent.change(screen.getByRole('textbox', { name: 'Search employees' }), { target: { value: 'jordan' } })

    await waitFor(() => {
      expect(fetchMock.mock.calls.some(([path]) => String(path).includes('search=jordan'))).toBe(true)
    })
  })

  it('converts entered major currency units to integer minor units when adding an employee', async () => {
    render(<App />)
    await screen.findByText('Alex Rivera')
    fireEvent.click(screen.getByRole('button', { name: 'Add employee' }))

    fireEvent.change(screen.getByRole('textbox', { name: 'Full name' }), { target: { value: 'Jordan Lee' } })
    fireEvent.change(screen.getByRole('textbox', { name: 'Work email' }), { target: { value: 'jordan@example.com' } })
    fireEvent.change(screen.getByRole('textbox', { name: 'Job title' }), { target: { value: 'Product Manager' } })
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Annual base salary' }), { target: { value: '95000.25' } })
    fireEvent.click(screen.getAllByRole('button', { name: 'Add employee' }).at(-1))

    await waitFor(() => expect(submittedEmployee?.salary_cents).toBe(9_500_025))
    expect(submittedEmployee).toMatchObject({ name: 'Jordan Lee', email: 'jordan@example.com', salary_currency: 'USD' })
    expect(await screen.findByText('Employee added to the directory')).toBeInTheDocument()
  })

  it('shows the login form when no valid session exists and submits credentials', async () => {
    fetchMock.mockImplementation((path, options = {}) => {
      if (path === '/api/session' && options.method === 'POST') {
        return Promise.resolve(jsonResponse({ user: { email: 'hr@example.com' }, csrf_token: 'test-csrf-token' }))
      }
      if (path === '/api/session') return Promise.reject(new Error('Authentication required'))
      if (path === '/api/dashboard') {
        return Promise.resolve(jsonResponse({ employee_count: 0, country_count: 0, department_count: 0, compensation_by_currency: [], departments: [] }))
      }
      if (String(path).startsWith('/api/employees')) {
        return Promise.resolve(jsonResponse({ employees: [], pagination: { current_page: 1, per_page: 20, total_count: 0, total_pages: 0 } }))
      }
      return Promise.resolve(jsonResponse({}))
    })
    render(<App />)

    fireEvent.change(await screen.findByRole('textbox', { name: 'Work email' }), { target: { value: 'hr@example.com' } })
    fireEvent.change(document.querySelector('input[type="password"]'), { target: { value: 'correct horse battery staple' } })
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }))

    expect(await screen.findByRole('heading', { name: 'Compensation overview' })).toBeInTheDocument()
    expect(fetchMock.mock.calls.some(([path, options]) => path === '/api/session' && options.method === 'POST')).toBe(true)
  })

  it('returns to sign-in when an authenticated API request reports an expired session', async () => {
    fetchMock.mockImplementation((path) => {
      if (path === '/api/session') return Promise.resolve(jsonResponse({ user: { email: 'hr@example.com' }, csrf_token: 'test-csrf-token' }))
      if (path === '/api/dashboard') return Promise.resolve(jsonResponse({ error: 'Authentication required' }, 401))
      return Promise.resolve(jsonResponse({ employees: [], pagination: { current_page: 1, per_page: 20, total_count: 0, total_pages: 0 } }))
    })
    render(<App />)

    expect(await screen.findByRole('heading', { name: 'Sign in' })).toBeInTheDocument()
  })

  it('submits a registration request without creating a client session', async () => {
    let registration
    fetchMock.mockImplementation((path, options = {}) => {
      if (path === '/api/session') return Promise.reject(new Error('Authentication required'))
      if (path === '/api/registration') {
        registration = JSON.parse(options.body)
        return Promise.resolve(jsonResponse({ message: 'Pending approval' }, 202))
      }
      return Promise.resolve(jsonResponse({}))
    })
    render(<App />)

    fireEvent.click(await screen.findByRole('button', { name: 'Request access' }))
    fireEvent.change(screen.getByRole('textbox', { name: 'Full name' }), { target: { value: 'New HR User' } })
    fireEvent.change(screen.getByRole('textbox', { name: 'Work email' }), { target: { value: 'new-hr@example.com' } })
    fireEvent.change(document.querySelector('input[type="password"]'), { target: { value: 'correct horse battery staple' } })
    fireEvent.click(screen.getByRole('button', { name: 'Submit request' }))

    expect(await screen.findByText(/must approve your account before you can sign in/i)).toBeInTheDocument()
    expect(registration).toEqual({ name: 'New HR User', email: 'new-hr@example.com', password: 'correct horse battery staple' })
  })

  it('shows the approval queue only to admins and sends approval with the CSRF token', async () => {
    let approvalOptions
    fetchMock.mockImplementation((path, options = {}) => {
      if (path === '/api/session') return Promise.resolve(jsonResponse({ user: { email: 'admin@example.com', admin: true }, csrf_token: 'admin-csrf' }))
      if (path === '/api/dashboard') return Promise.resolve(jsonResponse({ employee_count: 0, country_count: 0, department_count: 0, compensation_by_currency: [], departments: [] }))
      if (path === '/api/admin/access-requests') return Promise.resolve(jsonResponse({ requests: [{ id: 4, name: 'New HR User', email: 'new-hr@example.com', created_at: '2026-10-08T10:00:00Z' }] }))
      if (String(path).endsWith('/approve')) {
        approvalOptions = options
        return Promise.resolve(jsonResponse({ id: 4, status: 'approved' }))
      }
      return Promise.resolve(jsonResponse({ employees: [], pagination: { current_page: 1, per_page: 20, total_count: 0, total_pages: 0 } }))
    })
    render(<App />)

    fireEvent.click(await screen.findByRole('button', { name: 'Access requests' }))
    expect(await screen.findByText('new-hr@example.com')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Approve new-hr@example.com' }))

    await waitFor(() => expect(approvalOptions?.method).toBe('PATCH'))
    expect(approvalOptions.headers['X-CSRF-Token']).toBe('admin-csrf')
    expect(await screen.findByText('new-hr@example.com approved')).toBeInTheDocument()
  })
})