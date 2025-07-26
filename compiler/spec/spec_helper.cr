require "spec"
require "./grammar.cr"
require "../src/compiler"

def scan(source : String)
  scanner = Scanner::Scan.new(source)
  scanner.scan_tokens
end

def parse(tokens : Array(Token))
  parser = Parser.new(tokens)
  parser.parse
end

def parse(source : String)
  parser = Parser.new(scan(source))
  parser.parse
end

def analyze(ast : Array(AST::Stmt)) : Bool
  analyzer = SemanticAnalyzer.new(ast)
  analyzer.analyze
end

def analyze(source : String)
  tokens = scan(source)
  ast = parse(tokens)
  analyze(ast)
end

def generate_js(source : String)
  tokens = scan(source)
  ast = parse(tokens)
  analyze(ast)
  CodeGenerator.new.generate(ast)
end
