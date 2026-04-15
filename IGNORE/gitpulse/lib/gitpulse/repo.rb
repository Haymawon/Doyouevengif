# frozen_string_literal: true

require 'date'
require 'open3'

module GitPulse
  # Extracts and aggregates commit data from the local Git repository.
  # Uses `git log` with a custom format for speed and simplicity.
  class Repo
    attr_reader :daily_counts, :author_counts, :first_date, :last_date

    def initialize(history_since: 90)
      @since_days = history_since
      @daily_counts = Hash.new(0)
      @author_counts = Hash.new(0)
      @first_date = Date.today - history_since
      @last_date = Date.today

      fetch_commits
    end

    private

    def fetch_commits
      # Format: UNIX timestamp and author name, one per line.
      # We use %at for timestamp, then %an for author.
      command = %Q(git log --since="#{@since_days}.days.ago" --format="%at|%an")
      output, status = Open3.capture2(command)

      unless status.success?
        abort Paint["Error: git log failed. Is this a valid repository?", :red]
      end

      parse_log(output)
      fill_missing_days
    end

    def parse_log(output)
      output.each_line do |line|
        next if line.strip.empty?

        timestamp_str, author = line.chomp.split('|', 2)
        next unless timestamp_str && author

        date = Time.at(timestamp_str.to_i).to_date
        @daily_counts[date] += 1
        @author_counts[author] += 1
      end
    end

    # Ensures that days with zero commits still appear in the dataset.
    def fill_missing_days
      current = @first_date
      while current <= @last_date
        @daily_counts[current] ||= 0
        current += 1
      end
    end
  end
end