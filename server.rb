require 'rubygems'
require 'sinatra/base'
require 'sinatra/content_for'
require 'httparty'
require 'uri'
require 'json'
require 'base64'


################################################################################

class ImageHistogramApi

  include HTTParty
  base_uri 'localhost:9906'

  def self.post_histogram(image_url, author)
    self.post('/histogram', 
      :body => { 
        'url' => image_url,
        'author' => author 
      }.to_json,
      :headers => { 
        'Content-Type' => 'application/json', 
        'Accept'       => 'application/json' 
      })
  end

  def self.get_docs
    self.get('/histogram/docs', 
      :headers => { 
        'Accept' => 'application/json' 
      })
  end

  def self.get_doc(id)
    self.post('/histogram/docs/' + id, 
      :headers => { 
        'Accept' => 'application/json' 
      })
  end

end

################################################################################

class ImageHistogramApp < Sinatra::Base

  helpers Sinatra::ContentFor
  
  set :root,  File.dirname(__FILE__) 
  set :views, File.join(settings.root, "views")

  get  '/' do
    docs = []

    begin
      docs = ImageHistogramApi.get_docs
    rescue Exception => e
      puts e
    end

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
        response = ImageHistogramApi.post_histogram url, 'Raphael'
        puts response.body

        locals = {
          :image_url => 'uploads/' + params['image'][:filename],
          :success_message => "Histogram for image '#{params['image'][:filename]}' successfully computed."
        }
      rescue Exception => e
        locals = {
          :error_message => 'Error: ' + e.to_s
        }
      end
    end

    locals['docs'] = []

    begin
      locals['docs'] = ImageHistogramApi.get_docs
    rescue Exception => e
      # ignore
    end

    erb :index, :locals => locals
  end

end

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
