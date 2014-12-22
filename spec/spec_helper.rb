# spec/spec_helper.rb
require 'rack/test'

require File.expand_path '../../server.rb', __FILE__

ENV['RACK_ENV'] = 'test'

module RSpecMixin
  include Rack::Test::Methods
  def app() Sinatra::Application end
end

# For RSpec 2.x
RSpec.configure do |c|
  c.include RSpecMixin
  c.deprecation_stream = '/dev/null'
end
