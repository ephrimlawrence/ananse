# TODO: Write documentation for `Compiler`
require "./parser.cr"

module Compiler
  VERSION = "0.1.0"

  @@program : String = ""

  def self.run
    file = File.new("spec/program.ussd")
    @@program = file.gets_to_end
    file.close

    p! @@program
  end

  def self.read_script
    # TODO: read path from cli/config file or dedicated file; eg. main.ussd
  end
end

# Call run on script execution
Compiler.run
