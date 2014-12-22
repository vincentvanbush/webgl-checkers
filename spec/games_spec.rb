context 'games' do
  it 'creates a new game' do
    expect do
      post '/games', params = { 'id' => 'abcdef' }
    end.to change{ $games.count }.from(0).to(1)
  end

  context 'patch' do
    before do
      post '/games', params = { 'id' => 'abcdef' }
      $games['abcdef'].join uid, 'pseudo_stream_1'
      $games['abcdef'].join uid2, 'pseudo_stream_2'
    end

    let(:uid) do
      post '/players', params = { 'nick' => 'janusz' }
      last_response.body
    end

    let(:uid2) do
      post '/players', params = { 'nick' => 'mariusz' }
      last_response.body
    end

    let(:game) { $games['abcdef'] }

    context 'invalid message type' do
      it 'returns error message' do
        patch '/games/abcdef', params = { 'msg-type' => 'dupa' }
        expect(last_response.status).to eq(403)
        expect(last_response.body).to include('Unknown message type')
      end
    end

    context 'valid message type' do

      before do
        patch '/games/abcdef', params = {
          'msg-type' => 'sit', 'color' => 'white', 'uid' => uid
        }
        patch '/games/abcdef', params = {
          'msg-type' => 'sit', 'color' => 'black', 'uid' => uid2
        }
      end

      context 'sit message' do
        context 'with valid params' do
          it 'sets white uid' do
            expect(game.white).to eq(uid)
          end

          it 'sets black uid' do
            expect(game.black).to eq(uid2)
          end

        end

        context 'with invalid params' do
          it 'gives error for nonexisting game' do
            patch '/games/fdjsafksadjf'
            expect(last_response.body).to include("does not exist")
          end

          it 'doesn\'t set white uid if already assigned to black' do
            expect {
              patch '/games/abcdef', params = {
                'msg-type' => 'sit', 'color' => 'white',
                'uid' => uid2
              }
            }.not_to change { game.white }
          end

          it 'doesnt set white uid if white already taken' do
            expect {
              patch '/games/abcdef', params = {
                'msg-type' => 'unsit', 'uid' => uid2
              }
              patch '/games/abcdef', params = {
                'msg-type' => 'sit', 'color' => 'white',
                'uid' => uid2
              }
            }.not_to change { game.white }
          end

        end

      end

      context 'unsit message' do
        context 'with valid params' do

          it 'unsits only white player' do
            expect { patch '/games/abcdef', params = { 'msg-type' => 'unsit', 'uid' => uid } }
              .to change { game.white }.from(uid).to(nil)
            expect(game.black).to eq(uid2)
          end

          it 'unsits only black player' do
            expect { patch '/games/abcdef', params = { 'msg-type' => 'unsit', 'uid' => uid2 } }
              .to change { game.black }.from(uid2).to(nil)
            expect(game.white).to eq(uid)
          end

        end

      end

      context 'move message' do

        it 'changes history for a sequence of two valid moves' do
          expect {
            patch '/games/abcdef', params = { 'msg-type' => 'move', 'uid' => uid,
              'a1' => '6', 'a2' => '1', 'b1' => '5', 'b2' => '0' }
            patch '/games/abcdef', params = { 'msg-type' => 'move', 'uid' => uid2,
              'a1' => '3', 'a2' => '0', 'b1' => '4', 'b2' => '1' }
          }.to change { game.history.size }.from(0).to(2)
        end

        it 'doesnt change history for an invalid move' do
          expect {
            patch '/games/abcdef', params = { 'msg-type' => 'move', 'uid' => uid,
              'a1' => '6', 'a2' => '0', 'b1' => '5', 'b2' => '0' }
          }.not_to change { game.history }
        end

        it 'doesnt change history for invalid uid' do
          patch '/games/abcdef', params = { 'msg-type' => 'move', 'uid' => uid2,
            'a1' => '6', 'a2' => '1', 'b1' => '5', 'b2' => '0' }
          expect(last_response.status).to eq(403)
          expect(last_response.body).to include('invalid uid')
        end

      end

      it 'pushes jsonized params to streams' do
        patch '/games/abcdef', params = { 'msg-type' => 'move', 'uid' => uid,
          'a1' => '6', 'a2' => '1', 'b1' => '5', 'b2' => '0' }
        game.user_streams.values.each do |stream|
          params.values.each { |val| expect(stream).to include(val) }
        end
      end

    end

  end

  context 'state' do
    before do
      post '/games', params = { 'id' => 'abcdef' }
      get '/games/abcdef/state'
    end

    let(:parsed) { JSON.parse(last_response.body) }
    let(:board) { JSON.parse(parsed['board']) }
    let(:game) { $games['abcdef'] }

    it 'returns proper board size' do
      expect(board.size).to eq(10)
      board.each { |row| expect(row.size).to eq(10) }
    end

    it 'returns proper turn' do
      expect(parsed['turn']).to eq('w')
    end

    it 'returns proper white and black uids' do
      expect(parsed['white']).to eq(nil)
      expect(parsed['black']).to eq(nil)
    end

    context 'after player joins the game' do
      let(:uid) do
        post '/players', params = { 'nick' => 'janusz' }
        uid = last_response.body
        $games['abcdef'].join uid, 'pseudo_stream'
        uid
      end

      it 'returns proper white nick' do
        patch '/games/abcdef', params = { 'uid' => uid, 'msg-type' => 'sit',
          'color' => 'white' }
        get '/games/abcdef/state'
        parsed = JSON.parse(last_response.body)
        expect(parsed['white']).to eq('janusz')
      end

      it 'returns proper black nick' do
        patch '/games/abcdef', params = { 'uid' => uid, 'msg-type' => 'sit',
          'color' => 'black' }
        get '/games/abcdef/state'
        parsed = JSON.parse(last_response.body)
        expect(parsed['black']).to eq('janusz')
      end

      context 'and makes a move' do
        before do
          patch '/games/abcdef', params = { 'uid' => uid, 'msg-type' => 'sit',
            'color' => 'white' }
          patch '/games/abcdef', params = { 'msg-type' => 'move', 'uid' => uid,
            'a1' => '6', 'a2' => '1', 'b1' => '5', 'b2' => '0' }
        end

        it 'returns a changed board' do
          actual_board = game.board.board
          get '/games/abcdef/state'
          parsed_board = JSON.parse(JSON.parse(last_response.body)['board'])
          expect(parsed_board).to eq(actual_board)
        end

      end

    end

  end

end
