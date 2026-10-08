class User < ApplicationRecord
  has_secure_password

  before_validation :normalize_email

  validates :name, presence: true
  validates :email, presence: true, format: { with: URI::MailTo::EMAIL_REGEXP }, uniqueness: { case_sensitive: false }
  validates :password, length: { minimum: 12 }, if: -> { password.present? }
  validates :status, inclusion: { in: %w[pending approved rejected] }

  def approved?
    status == "approved"
  end

  private

  def normalize_email
    self.email = email&.strip&.downcase
  end
end