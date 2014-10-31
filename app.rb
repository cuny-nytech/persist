require 'sinatra'
require 'sinatra/activerecord'
require './config/environments' #database configuration
require './models/model'

get '/' do
	"Hello World!"
end