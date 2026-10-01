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
    expect(await screen.findByText('CA$95,000')).toBeInTheDocument()
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
})