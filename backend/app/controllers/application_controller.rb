class ApplicationController < ActionController::API
	include ActionController::Cookies

	SESSION_COOKIE = "acme_session".freeze
	SESSION_TTL = 15.minutes
	SESSION_ISSUER = "acme-salary-desk".freeze

	private

	def authenticate_user!
		render json: { error: "Authentication required" }, status: :unauthorized unless current_user&.approved?
	end

	def require_admin!
		render json: { error: "Administrator access required" }, status: :forbidden unless current_user&.admin?
	end

	def current_user
		return @current_user if defined?(@current_user)

		payload = decoded_session
		@current_user = User.find_by(id: payload["sub"], token_version: payload["ver"]) if payload
	end

	def issue_session(user)
		csrf_token = SecureRandom.urlsafe_base64(32)
		expires_at = SESSION_TTL.from_now
		payload = {
			sub: user.id,
			ver: user.token_version,
			csrf: csrf_token,
			iss: SESSION_ISSUER,
			aud: SESSION_ISSUER,
			exp: expires_at.to_i
		}
		token = JWT.encode(payload, Rails.application.secret_key_base, "HS256")

		cookies[SESSION_COOKIE] = {
			value: token,
			httponly: true,
			secure: Rails.env.production?,
			same_site: :strict,
			expires: expires_at,
			path: "/"
		}
		csrf_token
	end

	def clear_session
		cookies.delete(SESSION_COOKIE, path: "/", same_site: :strict, secure: Rails.env.production?)
	end

	def verify_csrf_token!
		expected = decoded_session&.fetch("csrf", nil)
		supplied = request.headers["X-CSRF-Token"].to_s
		valid = expected.present? && supplied.bytesize == expected.bytesize &&
			ActiveSupport::SecurityUtils.secure_compare(supplied, expected)
		render json: { error: "Invalid CSRF token" }, status: :forbidden unless valid
	end

	def decoded_session
		return @decoded_session if defined?(@decoded_session)

		token = cookies[SESSION_COOKIE]
		@decoded_session = if token.present?
			JWT.decode(
				token,
				Rails.application.secret_key_base,
				true,
				algorithm: "HS256",
				iss: SESSION_ISSUER,
				verify_iss: true,
				aud: SESSION_ISSUER,
				verify_aud: true
			).first
		end
	rescue JWT::DecodeError
		@decoded_session = nil
	end
end
