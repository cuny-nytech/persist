class CreateImageHistogramRecords < ActiveRecord::Migration
  def self.up
    drop_table :image_histogram_records
    create_table :image_histogram_records do |t|
      t.string :image_name
      t.string :image_url
      t.string :author
      t.string :histogram
      t.timestamps
    end
  end

  def self.down
    drop_table :image_histogram_records
  end
end
