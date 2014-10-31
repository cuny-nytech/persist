
require 'rubygems'
require 'sinatra'
require 'pg'


get '/' do 
	erb :index
end

get '/about' do 
	erb :about
end

get '/contact' do 
	erb :contact
end

not_found do 
	status 404 
	'not found'
end


