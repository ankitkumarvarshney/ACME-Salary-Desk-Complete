module Api
  class EmployeesController < ApplicationController
    EMPLOYEE_FIELDS = %i[
      id name email country department job_title level salary_currency salary_cents created_at updated_at
    ].freeze
    SORT_FIELDS = %w[name country department level salary_cents].freeze
    DEFAULT_PER_PAGE = 20
    MAX_PER_PAGE = 100

    before_action :authenticate_user!
    before_action :verify_csrf_token!, only: %i[create update]
    before_action :set_employee, only: %i[show update]

    def index
      relation = filtered_employees
      total_count = relation.count
      page = positive_integer(params[:page], 1)
      per_page = positive_integer(params[:per_page], DEFAULT_PER_PAGE).clamp(1, MAX_PER_PAGE)
      sort = SORT_FIELDS.include?(params[:sort]) ? params[:sort] : "name"
      direction = params[:direction] == "desc" ? :desc : :asc
      employees = relation.order(sort => direction, id: :asc).offset((page - 1) * per_page).limit(per_page)

      render json: {
        employees: employees.as_json(only: EMPLOYEE_FIELDS),
        pagination: {
          current_page: page,
          per_page: per_page,
          total_count: total_count,
          total_pages: (total_count.to_f / per_page).ceil
        }
      }
    end

    def show
      render json: @employee.as_json(only: EMPLOYEE_FIELDS)
    end

    def create
      employee = Employee.new(employee_params)
      if employee.save
        render json: employee.as_json(only: EMPLOYEE_FIELDS), status: :created
      else
        render json: { errors: employee.errors.to_hash }, status: :unprocessable_entity
      end
    end

    def update
      if @employee.update(employee_params)
        render json: @employee.as_json(only: EMPLOYEE_FIELDS)
      else
        render json: { errors: @employee.errors.to_hash }, status: :unprocessable_entity
      end
    end

    private

    def set_employee
      @employee = Employee.find(params[:id])
    end

    def filtered_employees
      relation = Employee.all
      search = params[:search].to_s.strip
      if search.present?
        term = "%#{search}%"
        relation = relation.where("(name ILIKE :term OR email ILIKE :term OR job_title ILIKE :term)", term: term)
      end
      %i[country department level salary_currency].each do |filter|
        relation = relation.where(filter => params[filter]) if params[filter].present?
      end
      relation
    end

    def employee_params
      params.require(:employee).permit(
        :name, :email, :country, :department, :job_title, :level, :salary_currency, :salary_cents
      )
    end

    def positive_integer(value, fallback)
      parsed = Integer(value, 10)
      parsed.positive? ? parsed : fallback
    rescue ArgumentError, TypeError
      fallback
    end
  end
end