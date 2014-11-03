require 'sinatra'
require 'sinatra/activerecord'
require './environments'

SITE_TITLE = 'Lebanese Recipes'
SITE_DESCRIPTION = 'Famous Recipes from the Lebanese Kitchen'

class Recipe < ActiveRecord::Base
end

helpers do
  include Rack::Utils
  alias_method :h, :escape_html
end

get '/' do
  @recipes = Recipe.order('Created_at DESC')
  @title = 'Recipes'
  erb :home
end

post '/' do
  r = Recipe.new
  r.recipe_title = params[:recipe_title]
  r.content = params[:content]
  r.created_at = Time.now
  r.updated_at = Time.now
  r.save
  redirect '/'
end

get '/more/*' do
  @title = "Add Recipe ##{params[:id]}"
  erb :create
end

get '/:id' do
  @recipe = Recipe.find(params[:id])
  @title = "Edit Recipe ##{params[:id]}"
  erb :edit
end

put '/:id' do
  r = Recipe.find(params[:id])
  r.content = params[:content]
  r.updated_at = Time.now
  r.save
  redirect '/'
end

get '/:id/view' do
  @recipe = Recipe.find(params[:id])
  @title = "View ##{params[:id]}"
  erb :view
end

get '/:id/delete' do
  @recipe = Recipe.find(params[:id])
  @title = "Confirm deletion of Recipe ##{params[:id]}"
  erb :delete
end

delete '/:id' do
  r = Recipe.find(params[:id])
  r.destroy
  redirect '/'
end
