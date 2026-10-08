module Api
  module Admin
    class AccessRequestsController < ApplicationController
      before_action :authenticate_user!
      before_action :require_admin!
      before_action :verify_csrf_token!, only: %i[approve reject]
      before_action :set_access_request, only: %i[approve reject]

      def index
        requests = User.where(status: "pending", admin: false).order(:created_at)
        render json: { requests: requests.as_json(only: %i[id name email created_at]) }
      end

      def approve
        @access_request.update!(status: "approved")
        render json: { id: @access_request.id, status: @access_request.status }
      end

      def reject
        @access_request.update!(status: "rejected")
        render json: { id: @access_request.id, status: @access_request.status }
      end

      private

      def set_access_request
        @access_request = User.find_by!(id: params[:id], status: "pending", admin: false)
      end
    end
  end
end