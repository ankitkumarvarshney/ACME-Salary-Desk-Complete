require "test_helper"

class EmployeeTest < ActiveSupport::TestCase
  test "normalizes name, email and salary currency" do
    employee = Employee.new(employee_attributes(name: "  Alex Rivera ", email: "  ALEX@EXAMPLE.COM ", salary_currency: "cad"))

    assert employee.valid?
    assert_equal "Alex Rivera", employee.name
    assert_equal "alex@example.com", employee.email
    assert_equal "CAD", employee.salary_currency
  end

  test "requires non-negative integer salary and valid currency code" do
    employee = Employee.new(employee_attributes(salary_currency: "ZZZ", salary_cents: -1))

    assert_not employee.valid?
    assert_includes employee.errors.attribute_names, :salary_currency
    assert_includes employee.errors.attribute_names, :salary_cents
  end

  test "enforces case-insensitive email uniqueness" do
    Employee.create!(employee_attributes)
    duplicate = Employee.new(employee_attributes(email: "ALEX@example.com"))

    assert_not duplicate.valid?
    assert_includes duplicate.errors.attribute_names, :email
  end

  test "rejects fractional minor currency units" do
    employee = Employee.new(employee_attributes(salary_cents: 100.5))

    assert_not employee.valid?
    assert_includes employee.errors.attribute_names, :salary_cents
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