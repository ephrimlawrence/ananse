# TODO: Write documentation for `Compiler`
require "./parser.cr"
require "./lexer.cr"

module Compiler
  VERSION = "0.1.0"

  @@program : String = ""

  def self.run
    @@program = File.read("spec/program.ussd")
    # @@program = file.gets_to_end
    # file.close

    p! @@program
    lexer = Scanner::Lexer.new(@@program)

    parser = Parser.new(lexer)
    program = parser.parse_program
    puts "Parsing successful! Generated AST (simplified output):"
    p! program

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
