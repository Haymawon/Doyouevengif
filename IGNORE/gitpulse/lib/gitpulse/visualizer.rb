# frozen_string_literal: true

require 'paint'

module GitPulse

  class Visualizer
    def initialize(repo, width: 60, top_authors: 5)
      @repo = repo
      @width = width
      @top_authors = top_authors
    end

    def render
      print_header
      print_sparkline
      print_summary
      print_authors
    end

    private

    def print_header
      puts Paint["\nGitPulse – last #{@repo.daily_counts.size} days", :bold, :cyan]
      puts Paint["Repository: #{File.basename(Dir.pwd)}", :white]
      puts
    end

    def print_sparkline
      # Convert daily counts to a list of values in chronological order.
      dates = @repo.daily_counts.keys.sort
      values = dates.map { |d| @repo.daily_counts[d] }

      max = values.max
      # Avoid division by zero when there are no commits at all.
      max = 1 if max.zero?

      # Build the sparkline using Unicode block characters for finer resolution.
      chars = [' ', '▁', '▂', '▃', '▄', '▅', '▆', '▇', '█']
      spark = values.map do |v|
        idx = (v.to_f / max * (chars.size - 1)).round
        chars[idx]
      end.join

      # Scale down to fit terminal width if necessary.
      if spark.length > @width
        factor = spark.length.to_f / @width
        spark = spark.chars.each_with_index.select { |_, i| (i % factor).zero? }.map(&:first).join
      end

      puts Paint["Commits per day (max #{max}):", :white]
      puts Paint[spark, :green]
      puts
    end

    def print_summary
      total = @repo.daily_counts.values.sum
      average = total.to_f / @repo.daily_counts.size
      puts Paint["Total commits: #{total}", :white]
      puts Paint["Average per day: #{average.round(2)}", :white]
      puts
    end

    def print_authors
      puts Paint["Top #{@top_authors} authors:", :bold, :yellow]

      sorted = @repo.author_counts.sort_by { |_, count| -count }.first(@top_authors)
      max_count = sorted.first&.last || 1

      sorted.each do |author, count|
        bar_width = (count.to_f / max_count * 30).round
        bar = '█' * bar_width
        puts Paint["  %-20s %s %d" % [author, bar, count], :cyan]
      end
    end
  end
end