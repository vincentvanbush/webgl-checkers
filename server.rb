require 'sinatra'
require 'sinatra/assetpack'
require "sinatra/namespace"
require 'securerandom'

require 'json'
require './game.rb'
require './helpers.rb'

set server: 'thin'
set :raise_errors, true
set :dump_errors, false
set :show_exceptions, false

enable :sessions

$games = Hash.new
$players = Hash.new

register Sinatra::AssetPack

assets do
  js :application, ['/js/*.js']
  css :application, ['/css/*.css']
end

def register_player nick
  uid = SecureRandom.uuid
  $players[uid] = nick
  uid
end

def unregister_player uid
  $players[uid] = nil
end

get '/' do
  erb :index
end

post '/players' do
  nick = params['nick']
  uid = register_player nick
  body uid
end

delete '/players/:uid' do |uid|
  unregister_player uid
end

namespace '/games' do
  get '/:id' do |id|
    @id = id
    erb :game
  end

  post do
    id = params['id']
    $games[id] = Game.new
    redirect "/games/#{id}"
  end

  patch '/:id' do |id|
    begin
      if $games[id].nil?
        status 403
        body "Game #{id} does not exist"
      else
        msg_type = params['msg-type']
        uid = params['uid']

        case msg_type
        when 'sit'
          color = case params['color']
            when 'white' then :white
            when 'black' then :black
          end
          $games[id].sit color, uid
          "#{uid} sits in game #{id} as #{color}"
        when 'unsit'
          $games[id].unsit uid
          "#{uid} unsits in game #{id}"
        when 'move'
          valid_uid = case $games[id].turn
            when 'w' then $games[id].white
            when 'b' then $games[id].black
          end
          raise "invalid uid #{uid}, expected #{valid_uid}" unless uid == valid_uid
          a = [ params['a1'].to_i, params['a2'].to_i ]
          b = [ params['b1'].to_i, params['b2'].to_i ]
          $games[id].move a, b
          "Moved from #{a} to #{b} in game #{id}"
        else
          raise "Unknown message type from #{uid}: #{msg_type}"
        end

        notification = params.merge( {'timestamp' => timestamp} ).to_json
        notif_data = "data: #{notification}\n\n"
        $games[id].notify_all(notif_data)
        "Patched #{id} succesfully: #{notif_data}"
      end
    rescue Exception
      puts "#{$!}"
      status 403
      body "Error: #{$!}"
    end
  end

  get '/:id/state' do |id|
    state = $games[id].state
    state[:white] = $players[state[:white]]
    state[:black] = $players[state[:black]]
    state.to_json
  end

  get '/:id/stream', provides: 'text/event-stream' do |id|
    uid = params['uid']
    unless $players[uid] == nil
      stream :keep_open do |out|
        puts "Opening stream for #{id}, #{uid}"
        $games[id].join uid, out
        out.callback { $games[id].leave uid
          puts "Closing stream for #{id}, #{uid}" }
      end
    else
      status 403
      body "Player #{uid} does not exist"
    end
  end

end
