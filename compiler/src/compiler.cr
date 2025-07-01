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
    lexer = Lexer::Lexer.new(@@program)
    loop do
      token = lexer.next_token
      puts token
      break if token.type == Lexer::TokenType::EOF
    end
  end

  def self.read_script
    # TODO: read path from cli/config file or dedicated file; eg. main.ussd
  end
end

# Call run on script execution
Compiler.run
