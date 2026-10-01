raise "Demo seed data is not intended for production" if Rails.env.production?

Employee.delete_all
Employee.connection.reset_pk_sequence!("employees")

first_names = %w[Alex Amara Anika Ben Chloe Daniel Elena Fatima Grace Ibrahim Jamie Kai Leila Mateo Maya Noah Priya Sam Sofia]
last_names = %w[Adams Bennett Chen Das Evans Flores Garcia Hassan Ito Johnson Khan Lee Morgan Novak Patel Quinn Rivera Singh Taylor]
departments = %w[Engineering Product Design People Finance Sales Operations Legal]
levels = %w[L1 L2 L3 L4 L5 L6]
locations = [
	["United States", "USD", 9_500_000],
	["United Kingdom", "GBP", 4_600_000],
	["Germany", "EUR", 5_200_000],
	["Canada", "CAD", 8_000_000],
	["Australia", "AUD", 9_200_000],
	["Singapore", "SGD", 7_000_000]
]
random = Random.new(20_261_001)
seeded_at = Time.utc(2026, 1, 1)

10.times do |batch|
	rows = 1_000.times.map do |offset|
		sequence = batch * 1_000 + offset + 1
		country, currency, salary_baseline = locations[(sequence - 1) % locations.length]
		first_name = first_names[random.rand(first_names.length)]
		last_name = last_names[random.rand(last_names.length)]
		level = levels[random.rand(levels.length)]
		department = departments[random.rand(departments.length)]

		{
			name: "#{first_name} #{last_name}",
			email: "employee#{sequence.to_s.rjust(5, "0")}@acme.example",
			country: country,
			department: department,
			job_title: "#{level} #{department.singularize} #{%w[Analyst Specialist Partner Lead Manager Director][random.rand(6)]}",
			level: level,
			salary_currency: currency,
			salary_cents: salary_baseline + levels.index(level) * 1_250_000 + random.rand(-750_000..750_000),
			created_at: seeded_at,
			updated_at: seeded_at
		}
	end

	Employee.insert_all!(rows)
end

puts "Seeded #{Employee.count} employees across #{locations.length} countries."
