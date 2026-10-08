require "test_helper"

class Api::SessionsControllerTest < ActionDispatch::IntegrationTest
  setup do
    Rails.cache.clear
    @user = User.create!(name: "HR Manager", email: "hr@example.com", password: "correct horse battery staple", status: "approved")
  end

  test "login issues an HttpOnly strict same-site cookie, not a readable token" do
    post api_session_url, params: { email: @user.email, password: "correct horse battery staple" }, as: :json

    assert_response :success
    assert_equal "hr@example.com", response.parsed_body.dig("user", "email")
    assert response.parsed_body.key?("csrf_token")
    assert_not response.parsed_body.key?("token")
    assert_match(/httponly/i, response.headers["Set-Cookie"])
    assert_match(/samesite=strict/i, response.headers["Set-Cookie"])
  end

  test "rejects invalid credentials and protects writes from missing CSRF tokens" do
    post api_session_url, params: { email: @user.email, password: "incorrect password" }, as: :json
    assert_response :unauthorized

    post api_session_url, params: { email: @user.email, password: "correct horse battery staple" }, as: :json
    post api_employees_url, params: { employee: {} }, as: :json
    assert_response :forbidden
  end

  test "logout revokes the active JWT" do
    post api_session_url, params: { email: @user.email, password: "correct horse battery staple" }, as: :json
    csrf_token = response.parsed_body.fetch("csrf_token")

    delete api_session_url, headers: { "X-CSRF-Token" => csrf_token }

    assert_response :no_content
    get api_session_url
    assert_response :unauthorized
  end

  test "employee API requires authentication" do
    get api_employees_url

    assert_response :unauthorized
  end

  test "registration creates a pending account and cannot self-approve" do
    post api_registration_url, params: {
      name: "New HR User",
      email: "new-hr@example.com",
      password: "correct horse battery staple",
      status: "approved",
      admin: true
    }, as: :json

    assert_response :accepted
    user = User.find_by!(email: "new-hr@example.com")
    assert_equal "pending", user.status
    assert_not user.admin?
    assert_not response.parsed_body.key?("csrf_token")

    post api_session_url, params: { email: user.email, password: "correct horse battery staple" }, as: :json
    assert_response :forbidden
    assert_includes response.parsed_body.fetch("error"), "awaiting administrator approval"
  end

  test "only admins can list and approve access requests" do
    pending_user = User.create!(name: "Pending HR", email: "pending@example.com", password: "correct horse battery staple")

    post api_session_url, params: { email: @user.email, password: "correct horse battery staple" }, as: :json
    get api_admin_access_requests_url
    assert_response :forbidden

    admin = User.create!(name: "Administrator", email: "admin@example.com", password: "correct horse battery staple", status: "approved", admin: true)
    post api_session_url, params: { email: admin.email, password: "correct horse battery staple" }, as: :json
    csrf_token = response.parsed_body.fetch("csrf_token")
    get api_admin_access_requests_url

    assert_response :success
    assert_equal [pending_user.email], response.parsed_body.fetch("requests").map { |request| request.fetch("email") }

    patch approve_api_admin_access_request_url(pending_user), headers: { "X-CSRF-Token" => csrf_token }

    assert_response :success
    assert_equal "approved", pending_user.reload.status
    post api_session_url, params: { email: pending_user.email, password: "correct horse battery staple" }, as: :json
    assert_response :success
  end

  test "throttles repeated login attempts by client IP" do
    10.times do
      post api_session_url, params: { email: @user.email, password: "wrong password" }, as: :json
      assert_response :unauthorized
    end
    post api_session_url, params: { email: @user.email, password: "wrong password" }, as: :json

    assert_response :too_many_requests
  ensure
    Rails.cache.clear
  end
end