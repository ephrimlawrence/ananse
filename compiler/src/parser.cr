require "./token.cr"
require "./ast.cr"

class Parser
  property tokens : Array(Token) = [] of Token
  property current : Int32 = 0

  def initialize(@tokens)
  end

  def parse : Array(AST::Stmt)
    statements : Array(AST::Stmt) = [] of AST::Stmt
    while !is_at_end?
      val = declaration()
      if !val.nil?
        statements << val
      end
    end

    statements
  end

  private def expression : AST::Expr
    equality
  end

  private def declaration : AST::Stmt?
    begin
      if match(TokenType::VAR)
        return var_declaration()
      end
      return statement()
    rescue exception
      synchronize()
      return nil
    end
  end

  private def statement : AST::Stmt
    if match(TokenType::DISPLAY)
      return display_statement
    end

    # if match(TokenType::PRINT)
    #   return print_statement()
    # end

    return expression_statement()
  end

  private def display_statement : AST::DisplayStmt
    expr : AST::Expr = expression()
    consume(TokenType::NEW_LINE, "Expected new line after value.")
    return AST::DisplayStmt.new(expr)
  end

  private def print_statement : AST::Print
    value : AST::Expr = expression()
    #  TODO: remove this, not needed in our grammar
    consume(TokenType::SEMICOLON, "Expect ';' after value.")
    return AST::Print.new(value)
  end

  private def var_declaration : AST::VariableStmt
    name : Token = consume(TokenType::IDENTIFIER, "Expect variable name.")
    initializer : AST::Expr? = nil
    if match(TokenType::EQUAL)
      initializer = expression()
    end

    consume(TokenType::SEMICOLON, "Expect ';' after variable declaration.")
    return AST::VariableStmt.new(name, initializer)
  end

  private def expression_statement : AST::ExpressionStmt
    expr : AST::Expr = expression()
    consume(TokenType::SEMICOLON, "Expect ';' after expression.")
    return AST::ExpressionStmt.new(expr)
  end

  private def equality : AST::Expr
    expr : AST::Expr = comparison

    while (match(TokenType::BANG_EQUAL, TokenType::EQUAL_EQUAL))
      operator : Token = previous
      right : AST::Expr = comparison
      expr = AST::Binary.new(expr, operator, right)
    end

    expr
  end

  private def comparison : AST::Expr
    expr : AST::Expr = term()

    while (match(TokenType::GREATER, TokenType::GREATER_EQUAL, TokenType::LESS, TokenType::LESS_EQUAL))
      operator : Token = previous
      right : AST::Expr = term
      expr = AST::Binary.new(expr, operator, right)
    end

    expr
  end

  private def term : AST::Expr
    expr : AST::Expr = factor()

    while match(TokenType::MINUS, TokenType::PLUS)
      operator : Token = previous
      right : AST::Expr = factor
      expr = AST::Binary.new(expr, operator, right)
    end

    expr
  end

  private def factor : AST::Expr
    expr : AST::Expr = unary

    while match(TokenType::SLASH, TokenType::STAR)
      operator : Token = previous
      right : AST::Expr = unary
      expr = AST::Binary.new(expr, operator, right)
    end

    expr
  end

  private def unary : AST::Expr
    if match(TokenType::BANG, TokenType::MINUS)
      operator : Token = previous()
      right : AST::Expr = unary()
      return AST::Unary.new(operator, right)
    end

    primary
  end

  private def primary : AST::Expr
    if match(TokenType::FALSE)
      return AST::Literal.new(peek, false)
    end

    if match(TokenType::TRUE)
      return AST::Literal.new(peek, true)
    end

    if match(TokenType::NUMBER, TokenType::STRING)
      return AST::Literal.new(peek, previous.literal)
    end

    if match(TokenType::IDENTIFIER)
      return AST::Variable.new(previous())
    end

    if match(TokenType::LEFT_PAREN)
      expr : AST::Expr = expression()
      consume(TokenType::RIGHT_PAREN, "Expect ')' after expression.")
      return AST::Grouping.new(expr)
    end

    raise error(peek, "Expect expression.")
  end

  private def synchronize
    advance

    while !is_at_end?
      if previous.type == TokenType::SEMICOLON
        return
      end

      case peek.type
      when TokenType::MENU
      when TokenType::DISPLAY
      when TokenType::OPTION
      when TokenType::INPUT
      when TokenType::ACTION
      when TokenType::WITH
      when TokenType::AS
        # TODO: add other keywords
        # when FUN:
        # when VAR:
        # when FOR:
        # when IF:
        # when WHILE:
        # when PRINT:
        # when RETURN:
        #     return;
      end

      advance
    end
  end

  private def consume(type : TokenType, message : String) : Token | ParseError
    if check(type)
      return advance
    end

    error(peek, message)
  end

  private def error(token : Token, message : String) : Token
    CompilerError.new.error(token, message)
    raise ParseError.new(message, token)
  end

  private def match(*types : TokenType) : Bool
    types.each do |type|
      if check(type)
        advance
        return true
      end
    end

    false
  end

  private def check(type : TokenType) : Bool
    if is_at_end?
      return false
    end

    return peek.type == type
  end

  private def advance : Token
    if !is_at_end?
      @current += 1
    end

    previous
  end

  private def is_at_end? : Bool
    peek.type == TokenType::EOF
  end

  private def peek : Token
    tokens[@current]
  end

  private def previous : Token
    tokens[@current - 1]
  end
end

class ParseError < Exception
  property token : Token

  def initialize(message : String, @token : Token)
    super(message)
  end

  def to_s(io : IO)
    io << "Parse Error at #{@token.location.line}:#{@token.location.column}: #{message}"
  end
end
