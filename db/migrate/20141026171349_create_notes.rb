=begin
class CreateNotes < ActiveRecord::Migration
  def change
  end
end
=end

class CreateNotes < ActiveRecord::Migration
  def self.up
    create_table :posts do |t|
      t.string :line
      t.string :date
      t.text :body
      t.timestamps
    end
  end

  def self.down
    drop_table :posts
  end
end
