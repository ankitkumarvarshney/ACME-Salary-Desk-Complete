module Api
  class DashboardController < ApplicationController
    def show
      currency_counts = Employee.group(:salary_currency).count
      currency_averages = Employee.group(:salary_currency).average(:salary_cents)
      compensation = currency_counts.map do |currency, count|
        {
          currency: currency,
          employee_count: count,
          average_salary_cents: currency_averages.fetch(currency).to_f.round
        }
      end

      departments = Employee.group(:department).count
        .sort_by { |department, count| [-count, department] }
        .first(8)
        .map { |department, count| { department: department, employee_count: count } }

      render json: {
        employee_count: Employee.count,
        country_count: Employee.distinct.count(:country),
        department_count: Employee.distinct.count(:department),
        compensation_by_currency: compensation,
        departments: departments
      }
    end
  end
end