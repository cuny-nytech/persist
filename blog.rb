require 'sinatra'
require 'data_mapper'

DataMapper.setup(:default, "sqlite3://#{Dir.pwd}/blog.db")

class Post
  include DataMapper::Resource
  property :id, Serial
  property :post_title, Text, required: true
  property :content, Text, required: true
  property :created_at, DateTime
  property :updated_at, DateTime
end

DataMapper.auto_upgrade!

get '/' do
  @posts = Post.all order: :id.desc
  erb :home
end

post '/' do
  p = Post.new
  p.post_title = params[:post_title]
  p.content = params[:content]
  p.created_at = Time.now
  p.updated_at = Time.now
  p.save
  redirect '/'
end

get '/:id/' do
  # retreive post from database
  @post = Post.get params[:id]
  @title = 'Edit blog post'
  erb :edit
end

put '/:id' do

  p = Post.get params[:id]
  p.post_title = params[:post_title]
  p.content = params[:content]
  p.updated_at = Time.now
  p.save
  redirect '/'
end
