require "test_helper"

class Api::EmployeesControllerTest < ActionDispatch::IntegrationTest
  setup do
    Rails.cache.clear
      @user = User.create!(name: "HR Manager", email: "hr@example.com", password: "correct horse battery staple", status: "approved")
    @csrf_token = authenticate
    @alex = Employee.create!(employee_attributes(
      name: "Alex Rivera",
      email: "alex.rivera@example.com",
      salary_cents: 8_000_000
    ))
    Employee.create!(employee_attributes(
      name: "Jordan Lee",
      email: "jordan.lee@example.com",
      country: "United States",
      department: "Design",
      salary_currency: "USD",
      salary_cents: 12_000_000
    ))
    Employee.create!(employee_attributes(
      name: "Alexandra Stone",
      email: "stone@example.com",
      country: "United States"
    ))
  end

  test "filters by search and country and paginates on the server" do
    get api_employees_url, params: { search: "alex", country: "Canada", per_page: 1 }

    assert_response :success
    body = response.parsed_body
    assert_equal [@alex.id], body.fetch("employees").map { |employee| employee.fetch("id") }
    assert_equal 1, body.dig("pagination", "total_count")
    assert_equal 1, body.dig("pagination", "per_page")
  end

  test "caps page size and supports stable pagination" do
    get api_employees_url, params: { per_page: 500 }

    assert_response :success
    assert_equal 100, response.parsed_body.dig("pagination", "per_page")
    assert_equal 3, response.parsed_body.fetch("employees").length
  end

  test "creates an employee and reports validation errors" do
    post api_employees_url, params: { employee: employee_attributes(email: "new@example.com") }, as: :json,
      headers: csrf_headers

    assert_response :created
    assert_equal "new@example.com", response.parsed_body.fetch("email")

    post api_employees_url, params: { employee: employee_attributes(salary_cents: -100) }, as: :json,
      headers: csrf_headers

    assert_response :unprocessable_entity
    assert response.parsed_body.fetch("errors").key?("salary_cents")
  end

  test "updates employee details" do
    patch api_employee_url(@alex), params: { employee: { job_title: "Staff Engineer" } }, as: :json,
      headers: csrf_headers

    assert_response :success
    assert_equal "Staff Engineer", @alex.reload.job_title
  end

  private

  def authenticate
    post api_session_url, params: { email: @user.email, password: "correct horse battery staple" }, as: :json
    assert_response :success
    response.parsed_body.fetch("csrf_token")
  end

  def csrf_headers
    { "X-CSRF-Token" => @csrf_token }
  end

  def employee_attributes(overrides = {})
    {
      name: "Alex Rivera",
      email: "alex@example.com",
      country: "Canada",
      department: "Engineering",
      job_title: "Software Engineer",
      level: "L3",
      salary_currency: "CAD",
      salary_cents: 9_000_000
    }.merge(overrides)
  end
end