

require 'sinatra/base'
require 'json'
require 'httparty'
require 'data_mapper'
require 'slim'

#require 'sinatra/config_file'


# If you want the logs displayed you have to do this before the call to set
DataMapper::Logger.new($stdout, :debug)

# A Postgres connection
DataMapper.setup(:default, 'postgres://pedro1:pjer1976@localhost/tclone')

class AppPost
  include DataMapper::Resource

  property :id, Integer, :key => true
  property :comment, Text
  property :author, Text
  property :likes, Integer
  property :dislikes, Integer
  property :emotion, Text
  property :posted_on, DateTime
end

DataMapper.finalize.auto_upgrade!


class App < Sinatra::Base

  get '/' do
    @posts = AppPost.all :order => :id.desc

    slim :home
  end

end

