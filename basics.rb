
require 'rubygems'
require 'sinatra'
require 'pg'


get '/' do 
	erb :index
end

post '/' do
	conn= PG::Connection.new(host:'localhost',dbname:'singlepurp',port:'5432')
	t=Time.now
    t.getlocal("-04:00")
    conn.exec_params("SELECT * FROM post ORDER BY posttime DESC LIMIT 1") do |result|
        result.each do |row|
            lastid=row.id
        end
    end
    conn.exec_params("INSERT INTO post (id, postttime, username, avatar, userpost) VALUES ('#{lastid}', '#{t}', '#{params[:name]}', '#{params[:avatarimg]}', '#{params[:post]}')")

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


