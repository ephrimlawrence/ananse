# TODO: Write documentation for `Compiler`
require "./scanner.cr"
require "./parser.cr"
require "./ast_printer.cr"
require "./code_generator.cr"
require "./stmt.cr"

# require "./lexer.cr"

module Compiler
  VERSION = "0.1.0"

  # @@program : String = ""
  @@had_error : Bool = false

  def self.run
    source : String = File.read("spec/program.ussd")
    # @@program = file.gets_to_end
    # file.close

    # p! @@program
    scanner : Scanner::Scan = Scanner::Scan.new(source)
    parser : Parser = Parser.new(scanner.scan_tokens)
    program : Array(Statement::Stmt) = parser.parse

    # // Stop if there was a syntax error.
    if @@had_error
      return
    end

    puts program
    # puts AstPrinter.new.print(expression)
    # code_gen = CodeGenerator.new
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
Compiler.run
