class Employee < ApplicationRecord
  SUPPORTED_CURRENCIES = %w[AUD CAD EUR GBP SGD USD].freeze

  validates :name, :email, :country, :department, :job_title, :level, presence: true
  validates :email, format: { with: URI::MailTo::EMAIL_REGEXP }, uniqueness: { case_sensitive: false }
  validates :salary_currency, inclusion: { in: SUPPORTED_CURRENCIES }
  validates :salary_cents, numericality: { only_integer: true, greater_than_or_equal_to: 0 }
  validate :salary_cents_was_submitted_as_an_integer

  before_validation :normalize_identity_fields

  private

  def normalize_identity_fields
    self.name = name&.strip
    self.email = email&.strip&.downcase
    self.salary_currency = salary_currency&.strip&.upcase
  end

  def salary_cents_was_submitted_as_an_integer
    value = salary_cents_before_type_cast
    return if value.nil? || value.is_a?(Integer) || value.to_s.match?(/\A-?\d+\z/)

    errors.add(:salary_cents, "must be an integer")
  end
end