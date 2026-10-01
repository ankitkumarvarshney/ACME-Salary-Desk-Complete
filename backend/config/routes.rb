Rails.application.routes.draw do
  get "up" => "rails/health#show", as: :rails_health_check

  namespace :api do
    get "dashboard", to: "dashboard#show"
    resources :employees, only: %i[index show create update]
  end
end
