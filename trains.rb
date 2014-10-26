require 'sinatra'
require 'sinatra/activerecord'
require './environments'

class Post < ActiveRecord::Base
end

get "/" do
  @notes = Note.order("created_at DESC")
  "Hello World"
end

get "/new" do
end

post "/new" do
  @note = Note.new(params[:note])
  if @note.save
    redirect "note/#{@note.id}"
  end
end
