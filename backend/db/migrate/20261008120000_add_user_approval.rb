class AddUserApproval < ActiveRecord::Migration[8.1]
  def change
    add_column :users, :name, :string, null: false, default: "HR Manager"
    change_column_default :users, :name, from: "HR Manager", to: nil
    add_column :users, :status, :string, null: false, default: "pending"
    add_column :users, :admin, :boolean, null: false, default: false
    add_index :users, :status
  end
end