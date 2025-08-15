# TODO: Write documentation for `Compiler`
require "./scanner.cr"
require "./parser.cr"
require "./error.cr"
require "./code_generator.cr"
require "./ast.cr"
require "./semantic_analyzer"
require "./ast_transformer.cr"

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
