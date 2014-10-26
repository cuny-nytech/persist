require 'sinatra'
require 'sinatra/activerecord'

db = URI.parse('postgres:/entries')

ActiveRecord::Base.establish_connection(
  :adapter => db.scheme == 'postgres' ? 'postgresql' : db.scheme,
  :host => db.host,
  :username => db.user,
  :passowrd => db.password,
  :database => db.path[1..-1],
  :encoding => 'utf8'
)

class Note < ActiveRecord::Base
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
