require 'sinatra'
require 'json'
require './checkers.rb'

set :public_folder, Proc.new { File.join(root, "public") }
set server: 'thin'

connections = Hash.new([])

def timestamp
  Time.now.strftime("%H:%M:%S")
end

get '/' do
  erb :receiver
end

get '/admin' do
  erb :admin
end

get '/stream/:id', provides: 'text/event-stream' do |id|
  stream :keep_open do |out|
    connections[id] = [out].concat(connections[id])

    out.callback do
      connections.delete(out)
    end
  end
end

post '/push/:id' do |id|
  puts params
  notification = params.merge( {'timestamp' => timestamp} ).to_json
  connections[id].each { |out| out << "data: #{notification}\n\n" }
end
