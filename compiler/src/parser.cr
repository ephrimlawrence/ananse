require "./expression.cr"
require "./token.cr"

class Parser
  property tokens : Array(Token) = [] of Token
  property current : Int32 = 0

  def initialize(@tokens)
  end

  def parse
    begin
      return expression()
    rescue error : ParseError
      return nil
    end
  end

  private def expression : Expression::Expr
    equality
  end

  private def equality : Expression::Expr
    expr : Expression::Expr = comparison

    while (match(TokenType::BANG_EQUAL, TokenType::EQUAL_EQUAL))
      operator : Token = previous
      right : Expression::Expr = comparison
      expr = Expression::Binary.new(expr, operator, right)
    end

    expr
  end

  private def comparison : Expression::Expr
    expr : Expression::Expr = term()

    while (match(TokenType::GREATER, TokenType::GREATER_EQUAL, TokenType::LESS, TokenType::LESS_EQUAL))
      operator : Token = previous
      right : Expression::Expr = term
      expr = Expression::Binary.new(expr, operator, right)
    end

    expr
  end

  private def term : Expression::Expr
    expr : Expression::Expr = factor()

    while match(TokenType::MINUS, TokenType::PLUS)
      operator : Token = previous
      right : Expression::Expr = factor
      expr = Expression::Binary.new(expr, operator, right)
    end

    expr
  end

  private def factor : Expression::Expr
    expr : Expression::Expr = unary

    while match(TokenType::SLASH, TokenType::STAR)
      operator : Token = previous
      right : Expression::Expr = unary
      expr = Expression::Binary.new(expr, operator, right)
    end

    expr
  end

  private def unary : Expression::Expr
    if match(TokenType::BANG, TokenType::MINUS)
      operator : Token = previous()
      right : Expression::Expr = unary()
      return Expression::Unary.new(operator, right)
    end

    primary
  end

  private def primary : Expression::Expr
    if match(TokenType::FALSE)
      return Expression::Literal.new(peek, false)
    end

    if match(TokenType::TRUE)
      return Expression::Literal.new(peek, true)
    end

    if match(TokenType::NUMBER, TokenType::STRING)
      return Expression::Literal.new(peek, previous.literal)
    end

    if match(TokenType::LEFT_PAREN)
      expr : Expression::Expr = expression()
      consume(TokenType::RIGHT_PAREN, "Expect ')' after expression.")
      return Expression::Grouping.new(expr)
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

  private def error(token : Token, message : String) : ParseError
    CompilerError.new.error(token, message)
    ParseError.new(message, token)
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
