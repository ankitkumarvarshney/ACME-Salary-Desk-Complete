class CreateEmployees < ActiveRecord::Migration[8.1]
  def change
    create_table :employees do |t|
      t.string :name, null: false
      t.string :email, null: false
      t.string :country, null: false
      t.string :department, null: false
      t.string :job_title, null: false
      t.string :level, null: false
      t.string :salary_currency, null: false, limit: 3
      t.bigint :salary_cents, null: false

      t.timestamps
    end

    add_index :employees, "lower(email)", unique: true, name: "index_employees_on_lower_email"
    add_index :employees, :country
    add_index :employees, :department
    add_index :employees, :level
    add_index :employees, %i[salary_currency department]
  end
end