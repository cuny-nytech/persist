require 'rubygems'
require 'sinatra'
require 'sinatra/base'
require 'sinatra/content_for'
require 'sinatra/activerecord'
require 'httparty'
require 'uri'
require 'json'
require 'base64'
require './env'


################################################################################

class ImageHistogramRecord < ActiveRecord::Base
end

################################################################################

class ImageHistogramApi

  include HTTParty
  base_uri 'image-histogram-api.herokuapp.com'

  def self.post_histogram(image_url)
    self.post('/histogram', 
      :body => { 
        'imageUrl' => image_url,
      }.to_json,
      :headers => { 
        'Content-Type' => 'application/json', 
        'Accept'       => 'application/json' 
      })
  end

end

################################################################################

class ImageHistogramApp < Sinatra::Base

  helpers Sinatra::ContentFor
  
  set :root,  File.dirname(__FILE__) 
  set :views, File.join(settings.root, "views")

  get '/' do
    docs = ImageHistogramRecord.order("created_at DESC")

    erb :index,
        :locals => {
          :docs => docs
        }
  end

  post '/' do
    url = get_url_from_params(params)
    locals = {}

    if url == nil
      locals = {
        :error_message => 'Error: please browse for an image to upload.'
      }      
    else
      begin
        response = ImageHistogramApi.post_histogram url

        record = ImageHistogramRecord.new
        record.image_name = File.basename(URI.parse(url).path)
        record.image_url  = url
        record.histogram  = response.body
        record.author     = nil

        if params['author'] != ''
          record.author = params['author']
          record.save
        end
        
        locals = {
          :new_doc => record,
          :success_message => "Histogram for image '#{record.image_name}' successfully computed."
        }
      rescue Exception => e
        locals = {
          :error_message => 'Error: ' + e.to_s
        }
      end
    end

    locals['docs'] = ImageHistogramRecord.order("created_at DESC")

    erb :index, :locals => locals
  end

end

################################################################################

def get_url_from_params(params)
  image = params['image']
  url   = params['url']
  
  if image == nil && url == ''
    nil
  
  elsif !image.nil?
    File.open(File.join(settings.public_folder, 'uploads', image[:filename]), "w") do |f|
      f.write(params['image'][:tempfile].read) 
    end
    File.join(request.scheme + "://" + request.host_with_port, 'uploads', image[:filename])
  
  else
    url
  end
end

################################################################################

def log(str)
  puts '--------------------------------------------'
  puts str
  puts '--------------------------------------------'
end
