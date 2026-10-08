module Api
  class SessionsController < ApplicationController
    rate_limit to: 10, within: 3.minutes, by: -> { request.remote_ip },
      with: -> { render json: { error: "Too many login attempts" }, status: :too_many_requests }, only: :create
    before_action :authenticate_user!, except: :create
    before_action :verify_csrf_token!, only: :destroy

    def show
      render json: session_response
    end

    def create
      user = User.find_by(email: params[:email].to_s.strip.downcase)
      if user&.authenticate(params[:password].to_s)
        unless user.approved?
          return render json: { error: "Your account is awaiting administrator approval" }, status: :forbidden
        end

        csrf_token = issue_session(user)
        render json: { user: { email: user.email, admin: user.admin? }, csrf_token: csrf_token }
      else
        render json: { error: "Invalid email or password" }, status: :unauthorized
      end
    end

    def destroy
      current_user.increment!(:token_version)
      clear_session
      head :no_content
    end

    private

    def session_response
      { user: { email: current_user.email, admin: current_user.admin? }, csrf_token: decoded_session.fetch("csrf") }
    end
  end
end