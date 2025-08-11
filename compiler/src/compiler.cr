# TODO: Write documentation for `Compiler`
require "file_watcher"
require "./scanner.cr"
require "./parser.cr"
require "./error.cr"
require "./code_generator.cr"
require "./ast.cr"
require "./semantic_analyzer"
require "./ast_transformer.cr"
require "option_parser"
require "option_parser"

module Compiler
  VERSION = "0.1.0"

  def self.run(path : String?)
    if path.nil?
      raise CompilerError.new("No source file/directory provided! Specify path to the .ussd file")
    end

    if !File.exists?(path)
      raise CompilerError.new("No file exists at #{path}")
    end

    source : String = File.read(path)

    begin
      scanner : Scanner::Scan = Scanner::Scan.new(source)

      parser : Parser = Parser.new(scanner.scan_tokens)
      program : Array(AST::Stmt) = parser.parse

      analyzer : SemanticAnalyzer = SemanticAnalyzer.new(program)
      analyzer.analyze

      transformed_ast = AstTransformer.new(program, analyzer.symbol_table).transform
      code = CodeGenerator.new(transformed_ast).generate

      # Save generated code to output file
      output_file = "#{File.dirname(path)}/#{File.basename(path, suffix: File.extname(path))}.ts"
      File.write(output_file, code)
      # STDOUT.puts code
    rescue err
      STDERR.puts err.message
    end
  end
end

path : String? = nil

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
