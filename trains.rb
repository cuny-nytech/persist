require 'sinatra'
require 'sinatra/activerecord'
require './environments'

class Post < ActiveRecord::Base
end

get "/" do
  @posts = Post.order("created_at DESC")
  erb :"posts/home"
end

get "/posts/create" do
  @post = Post.new
  erb :"posts/create"
end

post "/posts" do
  @post = Post.new(params[:post])
  if @post.save
    redirect "/posts/#{@post.id}"
  else
    erb :"posts/create"
  end
end

get "/posts/:id" do
  @post = Post.find(params[:id])
  @title = @post.date
  erb :"posts/post"
end
