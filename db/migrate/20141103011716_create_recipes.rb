class CreateRecipes < ActiveRecord::Migration
  def self.up
    create_table :recipes do |t|
      t.text :recipe_title
      t.text :content
      t.timestamps
    end
  end

  def self.down
    drop_table :recipes
  end
end
