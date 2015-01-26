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

  serve '/3d_assets', from: 'app/3d_assets';
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
    @uid = params['uid']
    if $players[@uid].nil?
      status 403
      body "Player #{@uid} does not exist"
    else
      @id = id
      $games[id] ||= Game.new
      erb :game
    end
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
        notification = params.merge( {'timestamp' => timestamp} )

        msg_type = params['msg-type']
        uid = params['uid']

        case msg_type

        when 'sit'
          color = case params['color']
            when 'white' then :white
            when 'black' then :black
          end
          $games[id].sit color, uid
          "#{$players[uid]} sits in game #{id} as #{color}"

        when 'unsit'
          $games[id].unsit uid
          "#{$players[uid]} unsits in game #{id}"

        when 'move'
          valid_uid = case $games[id].turn
            when 'w' then $games[id].white
            when 'b' then $games[id].black
          end
          raise "This is #{$players[valid_uid]}'s turn.'" unless uid == valid_uid
          a = [ params['a1'].to_i, params['a2'].to_i ]
          b = [ params['b1'].to_i, params['b2'].to_i ]
          $games[id].move a, b
          notification = notification.merge( { 'turn' => $games[id].turn } )
          "Moved from #{a} to #{b} in game #{id}"

        else
          raise "Unknown message type from #{$players[uid]}: #{msg_type}"
        end

        notification = notification.merge( {'ending' => true} ) if $games[id].end?
        notification = notification.to_json
        notif_data = "data: #{notification}\n\n"
        $games[id].notify_all(notif_data)
        "Patched #{id} succesfully: #{notif_data}"
      end
    rescue Exception
      STDERR.puts "#{$!}"
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
        STDERR.puts "Opening stream for #{id}, #{uid}"
        $games[id].join uid, out
        out.callback do
          $games[id].leave uid
          STDERR.puts "Closing stream for #{id}, #{uid}"
        end
      end
    else
      status 403
      body "Player #{uid} does not exist"
    end
  end

end
