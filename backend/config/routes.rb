Rails.application.routes.draw do
  get "up" => "rails/health#show", as: :rails_health_check

  namespace :api do
    resource :session, only: %i[show create destroy], controller: "sessions"
    resource :registration, only: :create, controller: "registrations"
    namespace :admin do
      resources :access_requests, only: :index do
        member do
          patch :approve
          patch :reject
        end
      end
    end
    get "dashboard", to: "dashboard#show"
    resources :employees, only: %i[index show create update]
  end
end
