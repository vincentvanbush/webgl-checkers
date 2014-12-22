context 'players' do
  let(:uid) do
    post '/players', params = { 'nick' => 'janusz' }
    last_response.body
  end

  context 'create' do
    it 'saves the user\'s uid' do
      expect($players[uid]).to eq('janusz')
    end
  end

  context 'delete' do
    it 'removes the user' do
      expect { delete "/players/#{uid}" }.to change { $players[uid] }
      .from('janusz')
      .to(nil)
    end
  end

end
