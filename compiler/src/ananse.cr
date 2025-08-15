# TODO: Write documentation for `Compiler`
require "file_watcher"
require "option_parser"
require "./compiler"

OptionParser.parse do |parser|
  path_msg = "Compiles the USSD project located at the specified path."

  parser.banner = "Ananse USSD Compiler"

  parser.on "build", "Compiles USSD code" do
    parser.on "-p PATH", "--path=PATH", path_msg do |src|
      path = src

      Compiler.run(path)
      exit
    end
  end

  parser.on "watch", "Starts compiler in watch mode USSD code on file changes" do
    parser.on "-p PATH", "--path=PATH", path_msg do |src|
      # Trigger initial build
      Compiler.run(src)

      FileWatcher.watch(src) do |event|
        puts event.path
        Compiler.run(src)
      end
    end
  end

  parser.on "-v", "--version", "Show version" do
    puts Compiler::VERSION
    exit
  end

  parser.on "-h", "--help", "Show help" do
    puts parser
    exit
  end

  parser.invalid_option do |flag|
    STDERR.puts "ERROR: #{flag} is not a valid option."
    STDERR.puts parser
    exit(1)
  end
end
