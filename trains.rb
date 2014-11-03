require 'sinatra'
require 'sinatra/activerecord'
require './environments'
require 'time'
require 'sinatra/flash'
require 'sinatra/redirect_with_flash'

enable :sessions


class Post < ActiveRecord::Base
 train_lines = ['1','2','3','4','5','6','7',
  'A','C','E','B','D','F','M','G','J','Z','L','N','Q','R','S',
  'a','c','e','b','d','f','m','g','j','z','l','n','q','r','s']
  validates :title, presence: true
  validates :line, inclusion: {in: train_lines} 
  validates :date, presence: true
  validates :body, presence: true
end


get "/" do
  @posts = Post.order("created_at DESC")
  erb :home
end

get "/posts/create" do
  @post = Post.new
  erb :create
end

post "/posts" do
  @post = Post.new(params[:post])
  if @post.save
    redirect "/posts/#{@post.id}"
  else
    redirect "posts/create", :error =>  'Make sure all entries are filled and that your train line is a valid NYC subway line'
  end
end

get "/posts/:id" do
  @post = Post.find(params[:id])
  @title = @post.date
  erb :post
end

helpers do
  include Rack::Utils
  alias_method :h, :escape_html
end
