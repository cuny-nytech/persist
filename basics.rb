
require 'rubygems'
require 'sinatra'
require 'pg'


get '/about' do 
	erb :about
end

get '/contact' do 
	erb :contact
end

get '/' do 
	erb :index
end

get '/:page' do
	erb :index
end

post '/' do 
	if(params[:name]!="" && params[:avatarimg] !="" && params[:post]!="" && params[:name]!="...person your impersonating here......" && params[:avatarimg] !="....(copy url address of image here....." )
		conn= PG::Connection.new(host:'ec2-54-83-201-96.compute-1.amazonaws.com', user: 'tylozwhavlzite',dbname:'d7ceioa8vs7n4d',port:'5432')
		t=Time.now
   		t.getlocal("-04:00")
   		lastid=10
   		conn.exec_params("SELECT * FROM post ORDER BY id DESC LIMIT 1") do |result|
       		result.each do |row|
          	  lastid=row['id'].to_i
          	  lastid=lastid+1
       		end
    	end
    	conn.exec_params("INSERT INTO post (id, posttime, username, avatar, userpost) VALUES ('#{lastid}', '#{t}', '#{params[:name]}', '#{params[:avatarimg]}', '#{params[:post]}')")
    	params[:name]==""
    	params[:avatarimg] =="" 
    	params[:post]=="" 
    end

	erb :index
end

not_found do 
	status 404 
	'not found'
end


