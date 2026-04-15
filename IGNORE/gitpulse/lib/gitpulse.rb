# frozen_string_literal: true

# GitPulse – visual heartbeat of your repository.
# Run it, get a sense of when and who has been committing.

require_relative 'gitpulse/cli'
require_relative 'gitpulse/repo'
require_relative 'gitpulse/visualizer'

module GitPulse
  VERSION = '0.1.0'
end