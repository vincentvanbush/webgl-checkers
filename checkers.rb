# TODO: implement kings the international way (now captures are standard, kings English)

class Checkerboard

  attr_reader :board, :turn, :history

  def validate_args a, b
    raise "Expecting a to be an array: #{a.inspect}" unless a.kind_of?(Array)
    raise "Expecting a to be of length 2: #{a.inspect}" unless a.length >= 2
    raise "Expecting b to be an array: #{b.inspect}" unless b.kind_of?(Array)
    raise "Expecting b to be of length 2: #{b.inspect}" unless a.length >= 2
    unless a[0].between?(0, 9) and a[1].between?(0, 9)
      raise "Expecting both coordinates of a to be in [0, 9]: #{a.inspect}"
    end
    unless b[0].between?(0, 9) and b[1].between?(0, 9)
      raise "Expecting both coordinates of b to be in [0, 9]: #{b.inspect}"
    end
  end

  def validate_move a, b
    validate_args a, b
    raise "Illegal move (source empty): #{a}, #{b}" unless occupied?(a)
    raise "Illegal move (opponent's turn): #{a}, #{b}" unless right_color?(a)
    raise "Illegal move (destination occupied): #{a}, #{b}" if occupied?(b)
    raise "Illegal move (not diagonal): #{a}, #{b}" unless diagonal?(a, b)
    # raise "Illegal move (non-king can't fly): #{a}, #{b}" if fly?(a, b) unless king?(a)
    if can_capture? # must capture, can go backward
      raise "Illegal move (not a valid capture): #{a}, #{b}" unless valid_capture_move?(a, b)
    else # can't go backward, must have clear way
      raise "Illegal move (destination behind source): #{a}, #{b}" unless forward?(a, b) or king?(a)
      raise "Illegal move (way is not clear): #{a}, #{b}" unless clear_way?(a, b)
    end
  end

  def can_capture?
    # def compress_spaces(list)
    #   list.map! { |item| ((item != '') && item) or ' ' }
    #   list = list.join.gsub(/\s+/, " ").split(//)
    #   list.map! { |item| ((item != ' ') && item) or '' }
    # end

    capture_pattern_1 = ['w', 'b', ''] if @turn == 'w'
    capture_pattern_1 = ['b', 'w', ''] if @turn == 'b'
    capture_pattern_2 = capture_pattern_1.reverse

    # check for the men
    all_diagonals = [].concat diagonals(:main).concat diagonals(:anti)
    all_diagonals.each do |diagonal|
      # print "#{diagonal}\n"
      diagonal.each_cons(3) do |x|
        x.map! { |item| item.downcase }

        if [capture_pattern_1, capture_pattern_2].include?(x)
          # print_board
          return true
        end
      end
    end

    # now check for the kings
    # all_diagonals.each do |diagonal|
    #   diagonal = compress_spaces(diagonal)
    #   diagonal.map! { |x| ((x.downcase != @turn and x.upcase != x) && x.downcase) or '' }
    #   # print "now moves #{@turn}, #{diagonal}\n"
    # end

    false
  end

  def diagonals type
    ret = []

    raise "Invalid diagonal type: #{type}" unless [:main, :anti].include?(type)

    for i in 0...board.size
      row = []
      for j in 0..i
        k = board.size-1-j if type == :main
        k = j if type == :anti
        row.push @board[i-j][k]
      end
      ret.push row
    end

    for i in 1...board.size
      row = []
      for j in i...board.size
        k = board.size-1-j if type == :main
        k = j if type == :anti
        row.push @board[board.size-1-j+i][k]
      end
      ret.push row
    end

    ret
  end

  def valid_capture_move? a, b
    return false unless diagonal? a, b
    fields = fields_between a, b
    fields.delete_if { |x| x == '' or x.downcase == @turn }
    true if fields.size == 1 # if there's one opponent's piece in the way
  end

  def occupied? field
    true unless board[field[0]][field[1]] == ''
  end

  def right_color? field
    true if board[field[0]][field[1]].downcase == @turn
  end

  def diagonal? a, b
    true if a[0]-a[1] == b[0]-b[1] or a[0] - (9-a[1]) == b[0] - (9-b[1])
  end

  def king? field
    true if board[field[0]][field[1]].upcase == board[field[0]][field[1]]
  end

  # def fly? a, b
  #   margin = 1
  #   margin = 2 if valid_capture_move?(a, b)
  #   true if (a[0]-b[0]).abs > margin
  # end

  def forward? a, b
    if @turn == 'w'
      true if b[0] < a[0]
    else
      true if b[0] > a[0]
    end
  end

  def fields_between a, b
    row_lower = [a[0], b[0]].min + 1
    row_upper = [a[0], b[0]].max - 1
    col_lower = [a[1], b[1]].min + 1
    col_upper = [a[1], b[1]].max - 1
    board_slice = board[row_lower..row_upper].map { |row| row[col_lower..col_upper] }
    board_slice.map! { |row| row.reverse } if b[1] < a[1]
    diagonal = (0...board_slice.size).collect { |i| board_slice[i][i] }
    diagonal
  end

  def do_move a, b
    row_lower = [a[0], b[0]].min + 1
    row_upper = [a[0], b[0]].max - 1
    col_lower = [a[1], b[1]].min + 1
    col_upper = [a[1], b[1]].max - 1
    if valid_capture_move? a, b
      for i in row_lower..row_upper
        board[i][col_lower+(i-row_lower)] = ''
      end
    end
    board[b[0]][b[1]] = board[a[0]][a[1]]
    board[a[0]][a[1]] = '';
  end

  def clear_way? a, b
    fields = fields_between(a, b).delete_if { |x| x == '' }
    true if fields.empty?
  end

  def initialize
    @history = []
    @turn = 'w'
    @board = [
      ['', 'b', '', 'b', '', 'b', '', 'b', '', 'b'],
      ['b', '', 'b', '', 'b', '', 'b', '', 'b', ''],
      ['', 'b', '', 'b', '', 'b', '', 'b', '', 'b'],
      ['b', '', 'b', '', 'b', '', 'b', '', 'b', ''],
      ['', '', '', '', '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', '', '', ''],
      ['', 'w', '', 'w', '', 'w', '', 'w', '', 'w'],
      ['w', '', 'w', '', 'w', '', 'w', '', 'w', ''],
      ['', 'w', '', 'w', '', 'w', '', 'w', '', 'w'],
      ['w', '', 'w', '', 'w', '', 'w', '', 'w', '']
    ]
  end

  def end?
    board.map { |x| x.map { |y| y.downcase } }.map { |row| row.index('b') }.compact.size == 0 \
    or board.map { |x| x.map { |y| y.downcase } }.map { |row| row.index('w') }.compact.size == 0 \
  end

  def swap_turn
    if @turn == 'w'
      @turn = 'b'
    else
      @turn = 'w'
    end
  end

  def move a, b
    validate_move a, b
    is_capture = valid_capture_move? a, b
    do_move a, b
    @history << { player: @turn, move: [a, b] }
    swap_turn unless is_capture and can_capture?
  end

  def print_board
    board.each do |row|
      row.each do |cell|
        print cell, (' ' if cell == '')
      end
      print "\n"
    end
  end

end
