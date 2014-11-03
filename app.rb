

require 'sinatra/base'
require 'json'
require 'httparty'
require 'data_mapper'
require 'slim'

#require 'sinatra/config_file'


# If you want the logs displayed you have to do this before the call to set
DataMapper::Logger.new($stdout, :debug)

# A Postgres connection
DataMapper.setup(:default, ENV['DATABASE_URL'] || 'postgres://localhost/mydb')

class AppPost
  include DataMapper::Resource

  property :id, Serial
  property :comment, Text
  property :author, Text
  property :likes, Integer, :default => 0
  property :dislikes, Integer, :default => 0
  property :emotion, Text
  property :posted_on, DateTime, :default => lambda { Time.now }
end


DataMapper.finalize.auto_upgrade!


class App < Sinatra::Base

  get '/' do
    @posts = AppPost.all :order => :id.desc

    slim :home
  end

  # declare put operation that will update value in db
  # pass id of the object and that is how we are going to
  # identify it and then pass which value we are updating
  # and to what value (only for likes and dislikes) everything
  # else cannot be changed
  get '/update/:id/:value/:field' do
    p = AppPost.get(params[:id])
    status 200 
    # p.update(params[:field] => params[:value])
    if params[:field] == 'like'
      p.likes = params[:value]
    elsif params[:field] == 'dislike'
      p.dislikes = params[:value]
    end
    p.save
  end


  post '/form' do
    p = AppPost.new
    p.comment = h params[:message]
    if params[:author] != ""
      p.author = h params[:author]
    else
      p.author = "Anonymous"
    end
    p.likes = 0
    p.dislikes = 0
    p.posted_on = Time.now
    p.save

    redirect '/'
  end


  not_found do
    halt 404, 'page not found'
  end


  helpers do
    include Rack::Utils
    alias_method :h, :escape_html
  end


end

