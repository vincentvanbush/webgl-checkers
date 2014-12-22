require './checkers.rb'

class Game
  attr_reader :board, :white, :black, :user_streams

  def initialize
    @board = Checkerboard.new
    @user_streams = Hash.new
    @white = nil
    @black = nil
  end

  def join uid, stream
    @user_streams[uid] = stream
  end

  def sit color, uid
    raise "Unknown color: #{color}" unless [:white, :black].include?(color)
    raise "#{uid} is not in game" if @user_streams[uid].nil?
    if color == :white
      @white = uid unless @black == uid or @white != nil
    else
      @black = uid unless @white == uid or @black != nil
    end
  end

  def unsit uid
    @white = nil if @white == uid
    @black = nil if @black == uid
  end

  def leave uid
    raise "#{uid} is not in game" if @user_streams[uid].nil?
    unsit uid
    @user_streams.delete uid
  end

  def move a, b
    @board.move a, b
  end

  def turn
    @board.turn
  end

  def history
    @board.history
  end

  def notify_all data
    @user_streams.values.each { |stream| stream << data }
  end

  def state
    hash = {
      board: @board.board.to_json,
      turn: turn,
      white: @white,
      black: @black
    }
  end

end
