module Api
  class RegistrationsController < ApplicationController
    rate_limit to: 5, within: 1.hour, by: -> { request.remote_ip },
      with: -> { render json: { error: "Too many registration attempts" }, status: :too_many_requests }, only: :create

    def create
      user = User.new(registration_params.merge(status: "pending", admin: false))
      if user.save
        render json: registration_response, status: :accepted
      elsif user.errors.details.dig(:email)&.any? { |error| error[:error] == :taken }
        render json: registration_response, status: :accepted
      else
        render json: { errors: user.errors.to_hash }, status: :unprocessable_entity
      end
    end

    private

    def registration_params
      params.permit(:name, :email, :password)
    end

    def registration_response
      { message: "If the details are valid, your request is pending administrator approval." }
    end
  end
end