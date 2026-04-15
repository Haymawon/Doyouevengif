# frozen_string_literal: true

require 'optimist'
require 'paint'

module GitPulse

  class CLI
    def self.start(args)
      opts = Optimist.options(args) do
        banner <<~BANNER
          GitPulse – show the heartbeat of a Git repository.

          Usage:
            gitpulse [options]

          Options:
        BANNER
        opt :days, "Number of days to look back", type: :integer, default: 90
        opt :width, "Width of the sparkline in characters", type: :integer, default: 60
        opt :authors, "Number of top authors to display", type: :integer, default: 5
        opt :no_color, "Disable color output", type: :boolean, default: false
      end

      Paint.mode = 0 if opts[:no_color]

      unless inside_git_repo?
        abort Paint["Error: not inside a Git repository.", :red]
      end

      repo = Repo.new(history_since: opts[:days])
      Visualizer.new(repo, width: opts[:width], top_authors: opts[:authors]).render
    end

    def self.inside_git_repo?
      system('git rev-parse --git-dir > /dev/null 2>&1')
    end
  end
end