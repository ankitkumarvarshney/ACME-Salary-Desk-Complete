require "test_helper"

class Api::DashboardControllerTest < ActionDispatch::IntegrationTest
  test "reports headcount and average pay separately for each currency" do
    Employee.create!(employee_attributes(email: "one@example.com", salary_cents: 8_000_000))
    Employee.create!(employee_attributes(email: "two@example.com", salary_cents: 10_000_000))
    Employee.create!(employee_attributes(
      email: "three@example.com",
      country: "United States",
      salary_currency: "USD",
      salary_cents: 20_000_000
    ))

    get api_dashboard_url

    assert_response :success
    body = response.parsed_body
    assert_equal 3, body.fetch("employee_count")
    assert_equal 2, body.fetch("country_count")
    assert_equal 1, body.fetch("department_count")
    cad = body.fetch("compensation_by_currency").find { |entry| entry.fetch("currency") == "CAD" }
    usd = body.fetch("compensation_by_currency").find { |entry| entry.fetch("currency") == "USD" }
    assert_equal 2, cad.fetch("employee_count")
    assert_equal 9_000_000, cad.fetch("average_salary_cents")
    assert_equal 20_000_000, usd.fetch("average_salary_cents")
  end

  private

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