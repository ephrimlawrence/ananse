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
    # begin
    if match(TokenType::VAR)
      return var_declaration()
    end
    statement()
    # rescue exception
    #   synchronize()
    #   return nil
    # end
  end

  private def statement : AST::Stmt
    if match(TokenType::IF)
      return if_statement()
    end

    if match(TokenType::START)
      return menu_statement(true)
    end

    if match(TokenType::MENU)
      return menu_statement()
    end

    if match(TokenType::DISPLAY)
      return display_statement()
    end

    if match(TokenType::INPUT)
      return input_statement()
    end

    if match(TokenType::OPTION)
      return options()
    end

    if match(TokenType::ACTION)
      return AST::ActionStatement.new(action())
    end

    if match(TokenType::GOTO)
      return AST::GotoStatement.new(parse_goto(shorthand: false))
    end

    if match(TokenType::END)
      val : Token = previous
      skip_newlines
      return AST::EndStatement.new(val)
    end

    if match(TokenType::LEFT_BRACE)
      return block_statements
    end

    # if check(TokenType::INTERPOLATION_START)
    #   p! expression()
    # end
    # if match(TokenType::PRINT)
    #   return print_statement()
    # end

    error(peek, "Unexpected token")
    # return expression_statement()
  end

  private def if_statement : AST::IfStatement
    location : Location = previous.location

    consume(TokenType::LEFT_PAREN, "Expect '(' after 'if'.")
    condition : AST::Expr = expression()
    consume(TokenType::RIGHT_PAREN, "Expect ')' after if condition.")

    thenBranch : AST::BlockStatement = statement().as(AST::BlockStatement)
    elseBranch : AST::BlockStatement? = nil

    if match(TokenType::ELSE)
      elseBranch = statement().as(AST::BlockStatement)
    end

    AST::IfStatement.new(condition, thenBranch, elseBranch, location)
  end

  # Parse menu statement
  private def menu_statement(is_start_menu : Bool = false) : AST::MenuStatement
    start : Token? = nil
    if is_start_menu
      start = previous
      consume(TokenType::MENU, "Expected 'menu' after 'start'")
    end

    menu_name : Token = consume(TokenType::IDENTIFIER, "Expected name after 'menu'")

    consume(TokenType::LEFT_BRACE, "Expected '{' after menu name")

    AST::MenuStatement.new(menu_name, block_statements, start)
  end

  # Parse block statements
  private def block_statements : AST::BlockStatement
    location : Location = previous.location
    statements : Array(AST::Stmt) = [] of AST::Stmt
    skip_newlines # Skip newline after '{'

    while !check(TokenType::RIGHT_BRACE) && !is_at_end?
      statements << statement()
    end

    consume(TokenType::RIGHT_BRACE, "Expected '}' after menu definition")
    skip_newlines
    AST::BlockStatement.new(statements, location)
  end

  private def options : AST::OptionStatement
    target : Token
    if check(TokenType::NUMBER) || check(TokenType::STRING) # TODO: add regex
      target = peek
      advance()
    else
      error(peek, "Expected a number, string or regex after option")
    end

    # If target is a number, quote the value
    if target.type == TokenType::NUMBER
      target.value = "'#{target.value}'"
    end

    label : Token = consume(TokenType::STRING, "Expected label after option target")
    next_menu : AST::Goto? = nil

    if match(TokenType::ARROW)
      # Next menu is defined, parse it
      next_menu = parse_goto(shorthand: true)
    end

    opt_action : AST::Action? = if match(TokenType::ACTION)
      action()
    else
      nil
    end

    skip_newlines

    # TODO: peek next, and group options
    option = AST::Option.new(target, label, next_menu, opt_action)
    AST::OptionStatement.new([option], target.location)
  end

  private def action : AST::Action
    func_name = previous

    consume(TokenType::LEFT_PAREN, "Expected '(' after function name")

    params : Hash(Token, Token) = {} of Token => Token

    if check(TokenType::RIGHT_PAREN) # Empty params
      advance()
    else
      while !check(TokenType::RIGHT_PAREN) && !is_at_end?
        param_name = consume(TokenType::IDENTIFIER, "Expected parameter name")
        consume(TokenType::COLON, "Expected ':' after parameter name")

        if match(TokenType::STRING, TokenType::NUMBER, TokenType::TRUE, TokenType::FALSE, TokenType::IDENTIFIER)
          params[param_name] = previous
        else
          raise CompilerError.new("Expected a value after parameter", peek)
        end

        # ',' is required after value but optional right before ')' eg. ',)'
        if check(TokenType::EOF) || check(TokenType::RIGHT_PAREN)
          break
        end

        if check(TokenType::COMMA) && peek_next.type == TokenType::RIGHT_PAREN
          advance()
        else
          consume(TokenType::COMMA, "Expected ',' after value")
        end
      end
      consume(TokenType::RIGHT_PAREN, "Expected closing ')'")
    end

    # puts peek
    variable_name : Token? = nil

    if match(TokenType::AS)
      variable_name = consume(TokenType::IDENTIFIER, "Expected variable name after 'as'")
    end

    skip_newlines

    AST::Action.new(func_name, params, variable_name)
  end

  # Parse display statement
  #   "display" <expression> "\n"
  #
  # Example:
  # ```
  # display "Welcome to first menu"
  # display "Welcome {{ username }}"
  # display "Welcome {{ 2 }}"
  # display 3
  # ```
  private def display_statement : AST::DisplayStatement
    location : Location = previous.location
    expr : AST::Expr = expression()
    skip_newlines

    AST::DisplayStatement.new(expr, location)
  end

  # Parse input statement
  #   "input" <identifier> "\n"
  #
  # Example:
  # ```
  # input variable_name
  # ```
  private def input_statement : AST::InputStatement
    name : Token = consume(TokenType::IDENTIFIER, "Expect variable name.")
    consume(TokenType::NEW_LINE, "Expected new line after variable.")
    skip_newlines
    AST::InputStatement.new(name)
  end

  # Parse goto statement
  #  <goto_stmt>			::= "goto" <space> ( <identifier> ( "." <identifier> )* )
  #
  # Example:
  # ```
  # goto welcome
  # goto parent_menu.child_menu
  # goto parent_menu.child_menu.grandchild.great_grand_child
  # ```
  private def parse_goto(shorthand : Bool) : AST::Goto
    # name : Token = if check(TokenType::START, TokenType::END)
    #   advance()
    # else
    # Parse call to nested menu
    nested_names : Array(Token) = [] of Token

    err : String = shorthand ? "Expected next menu name after '->'" : "Expected a menu name, 'back', 'start' or 'end' after 'goto'"
    nested_names << consume(TokenType::IDENTIFIER, err)

    while match(TokenType::DOT)
      nested_names << consume(TokenType::IDENTIFIER, "Expected a menu name after '.'.")
    end

    new_name : String = nested_names.map(&.value).join(".")
    name = Token.new(
      type: TokenType::IDENTIFIER,
      value: new_name,
      location: Location.new(
        nested_names.first?.as(Token).location.line,
        nested_names.last?.as(Token).location.column
      ),
      literal: nil
    )
    # end

    if check(TokenType::NEW_LINE)
      advance()
    end

    AST::Goto.new(name)
  end

  private def var_definition : AST::Variable
    name : Token = consume(TokenType::IDENTIFIER, "Expect variable name.")
    AST::Variable.new(name)
  end

  # @deprecated
  # TODO: remove this
  private def print_statement : AST::Print
    value : AST::Expr = expression()
    #  TODO: remove this, not needed in our grammar
    consume(TokenType::SEMICOLON, "Expect ';' after value.")
    AST::Print.new(value)
  end

  # @deprecated
  # TODO: remove this
  private def var_declaration : AST::VariableStmt
    name : Token = consume(TokenType::IDENTIFIER, "Expect variable name.")
    initializer : AST::Expr? = nil
    if match(TokenType::EQUAL)
      initializer = expression()
    end

    consume(TokenType::SEMICOLON, "Expect ';' after variable declaration.")
    AST::VariableStmt.new(name, initializer)
  end

  private def expression_statement : AST::ExpressionStmt
    expr : AST::Expr = expression()
    consume(TokenType::SEMICOLON, "Expect ';' after expression.")
    AST::ExpressionStmt.new(expr)
  end

  private def equality : AST::Expr
    expr : AST::Expr = comparison

    while match(TokenType::BANG_EQUAL, TokenType::EQUAL_EQUAL)
      operator : Token = previous
      right : AST::Expr = comparison
      expr = AST::Binary.new(expr, operator, right)
    end

    expr
  end

  private def comparison : AST::Expr
    expr : AST::Expr = term()

    while match(TokenType::GREATER, TokenType::GREATER_EQUAL, TokenType::LESS, TokenType::LESS_EQUAL)
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

    if match(TokenType::NUMBER)
      return AST::Literal.new(previous, previous.literal)
    end

    if match(TokenType::STRING)
      str_literal = AST::Literal.new(previous, previous.value).as(AST::Expr)

      if match(TokenType::INTERPOLATION_START)
        results : Array(AST::Expr) = [str_literal]

        # advance()
        while !check(TokenType::INTERPOLATION_END) && !is_at_end?
          results << expression()
        end

        consume(TokenType::INTERPOLATION_END, "Expect '}}'.")

        # Parse remaining parts of the string
        results << expression()

        return AST::InterpolatedString.new(results)
      end

      return str_literal
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

  # private def synchronize
  #   advance

  #   while !is_at_end?
  #     if previous.type == TokenType::SEMICOLON
  #       return
  #     end

  #     case peek.type
  #     when TokenType::MENU
  #     when TokenType::DISPLAY
  #     when TokenType::OPTION
  #     when TokenType::INPUT
  #     when TokenType::ACTION
  #     when TokenType::WITH
  #     when TokenType::AS
  #       # TODO: add other keywords
  #       # when FUN:
  #       # when VAR:
  #       # when FOR:
  #       # when IF:
  #       # when WHILE:
  #       # when PRINT:
  #       # when RETURN:
  #       #     return;
  #     end

  #     advance
  #   end
  # end

  private def consume(type : TokenType, message : String) : Token
    if check(type)
      return advance
    end

    error(peek, message)
  end

  private def error(token : Token, message : String) : Token
    raise CompilerError.new(message, token)
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

  private def check(*types : TokenType) : Bool
    if is_at_end?
      return false
    end

    types.each do |type|
      if peek.type == type
        return true
      end
    end

    false
  end

  private def advance : Token
    if !is_at_end?
      @current += 1
    end

    previous
  end

  private def skip_newlines
    while check(TokenType::NEW_LINE)
      advance
    end
  end

  private def is_at_end? : Bool
    peek.type == TokenType::EOF
  end

  private def peek : Token
    tokens[@current]
  end

  private def peek_next : Token
    if !is_at_end?
      return @tokens[@current + 1]
    end
    peek
  end

  private def previous : Token
    tokens[@current - 1]
  end
end
