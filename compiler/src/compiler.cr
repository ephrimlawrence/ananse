# TODO: Write documentation for `Compiler`
require "./scanner.cr"
require "./parser.cr"
require "./error.cr"
# require "./ast_printer.cr"
require "./code_generator.cr"
require "./ast.cr"
require "./semantic_analyzer"
require "./ast_transformer.cr"
require "option_parser"
require "option_parser"

# require "./lexer.cr"

module Compiler
  VERSION = "0.1.0"

  # @@program : String = ""
  # @@had_error : Bool = false

  def self.run
    source : String = File.read("spec/program.ussd")
    # @@program = file.gets_to_end
    # file.close

    # p! @@program

    # // Stop if there was a syntax error.
    # if @@had_error
    #   return
    # end

    # puts program
    # puts AstPrinter.new.print(expression)

    begin
      scanner : Scanner::Scan = Scanner::Scan.new(source)

      parser : Parser = Parser.new(scanner.scan_tokens)
      program : Array(AST::Stmt) = parser.parse

      p! program
      analyzer : SemanticAnalyzer = SemanticAnalyzer.new(program)
      analyzer.analyze

      transformed_ast = AstTransformer.new(program).transform
      code = CodeGenerator.new.generate(transformed_ast)
      STDOUT.puts code
      # raise CompilerError.new("message")
    rescue err
      STDERR.puts err.message
    end
    # code_gen.generate(expression.as(Expression::Expr))

    # puts scanner.scan_tokens

    # p! scanner
    # lexer = Scanner::Lexer.new(@@program)

    # parser = Parser.new(lexer)
    # program = parser.parse_program
    # puts "Parsing successful! Generated AST (simplified output):"
    # p! program

    # loop do
    #   token = lexer.next_token
    #   puts token
    #   break if token.type == Scanner::TokenType::EOF
    # end
  end

  def self.read_script
    # TODO: read path from cli/config file or dedicated file; eg. main.ussd
  end
end

# Call run on script execution
# Compiler.run

build : Bool = false

OptionParser.parse do |parser|
  parser.banner = "Ananse USSD Compiler"

  parser.on "-b", "--build", "Generate Typescript code" do
    build = true
    Compiler.run
  end

  parser.on "-v", "--version", "Show version" do
    puts "version 1.0"
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
