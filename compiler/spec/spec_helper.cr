require "spec"
require "../src/compiler"
# require "./helpers/grammar"
require "./helpers/e2e_test_runner"

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

def transform_ast(ast : Array(AST::Stmt)) : TransformedAST
  AstTransformer.new(ast).transform
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
  CodeGenerator.new.generate(transform_ast(ast))
end

struct Grammar
  # <action_stmt>	::= "@" <identifier> "(" (<identifier> ":" <identifier> ",")* ")" ( "as" <identifier>)?
  def self.action(with_params : Bool = true, with_name : Bool = true) : String
    str : String = "@jsFunctionName(param1: 2, param2: value2, param3: \"string\")"
    if !with_params
      str = "@jsFunctionName()"
    end

    if with_name
      return "#{str} as variableName"
    end

    str
  end

  # <goto_stmt>			::= "goto" <space> ( <navigate_stmt> | ( <identifier> ( "." <identifier> )* ))
  # <navigate_stmt>		::= "end" | "start"
  # def self.goto(is_end : Bool = false, start : Bool = false, name : String? = nil) : String
  #   if is_end
  #     return "goto end"
  #   end

  #   if start
  #     return "goto start"
  #   end

  #   if !name.nil?
  #     return "goto #{name}"
  #   end

  #   return "goto menu_name"
  # end
end
