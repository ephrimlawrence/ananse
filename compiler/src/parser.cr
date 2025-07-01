require "./lexer.cr"
require "./ast.cr"

class Parser
  include AST

  property lexer : Scanner::Lexer
  property current_token : Scanner::Token
  property peek_token : Scanner::Token

  def initialize(@lexer : Scanner::Lexer)
    # Read two tokens, current and peek
    @current_token = @lexer.next_token
    @peek_token = @lexer.next_token
  end

  private def consume(token_type : Scanner::TokenType) : Scanner::Token
    token = @current_token
    if token.type != token_type
      raise ParseError.new("Expected #{token_type}, got #{token.type} ('#{token.value}') at #{token.location}", token.location)
    end

    @current_token = @peek_token
    @peek_token = @lexer.next_token
    token
  end

  private def expect(token_type : Scanner::TokenType) : Scanner::Token
    if @current_token.type == token_type
      consume(token_type)
    else
      raise ParseError.new("Expected #{token_type}, got #{@current_token.type} ('#{@current_token.value}') at #{@current_token.location}", @current_token.location)
    end
  end

  private def peek(token_type : Scanner::TokenType) : Bool
    @current_token.type == token_type
  end

  private def peek_next(token_type : Scanner::TokenType) : Bool
    @peek_token.type == token_type
  end

  # --- Parsing Rules (based on BNF) ---
  def parse_program : AST::Program
    definitions = Array(AST::ASTNode).new
    program_location = @current_token.location # Location of the start of the program

    while @current_token.type != Scanner::TokenType::EOF
      case @current_token.type
      when Scanner::TokenType::KEYWORD_MENU
        definitions << parse_menu_definition
      when Scanner::TokenType::KEYWORD_END
        definitions << parse_end_definition
      else
        raise ParseError.new("Unexpected token at top level: #{@current_token.type} ('#{@current_token.value}') at #{@current_token.location}", @current_token.location)
      end
    end

    Program.new(definitions, program_location)
  end

  def parse_menu_definition : AST::MenuDefinition
    menu_location = expect(Scanner::TokenType::KEYWORD_MENU).location
    identifier_token = expect(Scanner::TokenType::IDENTIFIER)
    identifier = AST::Identifier.new(identifier_token.value, identifier_token.location)

    expect(Scanner::TokenType::LBRACE)
    statements = parse_statement_list
    expect(Scanner::TokenType::RBRACE)

    AST::MenuDefinition.new(identifier, statements, menu_location)
  end

  def parse_end_definition : EndStatement
    end_location = expect(Scanner::TokenType::KEYWORD_END).location
    expect(Scanner::TokenType::SEMICOLON) # 'end;' as a statement
    EndStatement.new(end_location)
  end

  def parse_statement_list : Array(Statement)
    statements = Array(Statement).new
    while @current_token.type != Scanner::TokenType::RBRACE && @current_token.type != Scanner::TokenType::EOF
      statements << parse_statement
    end
    statements
  end

  def parse_statement : Statement
    case @current_token.type
    when Scanner::TokenType::KEYWORD_DISPLAY
      parse_display_statement
    when Scanner::TokenType::KEYWORD_OPTION
      parse_option_statement
    when Scanner::TokenType::KEYWORD_INPUT
      parse_input_statement
    when Scanner::TokenType::KEYWORD_GOTO
      parse_goto_statement
    when Scanner::TokenType::KEYWORD_IF
      parse_if_statement
    when Scanner::TokenType::KEYWORD_FOR
      parse_for_each_statement
    when Scanner::TokenType::KEYWORD_END
      # If 'end' is a statement within a menu, it's also an EndStatement
      parse_end_statement
    when Scanner::TokenType::KEYWORD_ACTION
      parse_action_call_statement
    else
      raise ParseError.new("Unexpected statement type: #{@current_token.type} ('#{@current_token.value}') at #{@current_token.location}", @current_token.location)
    end
  end

  def parse_display_statement : DisplayStatement
    display_location = expect(Scanner::TokenType::KEYWORD_DISPLAY).location
    message = parse_string_literal
    expect(Scanner::TokenType::SEMICOLON)
    DisplayStatement.new(message, display_location)
  end

  def parse_string_literal : StringLiteral
    string_token = expect(Scanner::TokenType::STRING_LITERAL)
    location = string_token.location
    raw_value = string_token.value # The lexer already handles interpolation markers {{...}}

    parts = Array(StringPart).new
    current_pos = 0
    while (match = raw_value.match(/\{\{([a-zA-Z0-9_.]+)\}\}/, current_pos))
      # Add text before interpolation
      if match.begin(0) > current_pos
        parts << TextStringPart.new(raw_value[current_pos...match.begin(0)], location)
      end

      # Add interpolation
      identifier_name = match[1]
      interpolation_id = Identifier.new(identifier_name, location) # Use string_token's location for simplicity
      interpolation_var = VariableInterpolation.new(identifier_name, location)
      parts << InterpolatedStringPart.new(interpolation_var, location)

      current_pos = match.end(0)
    end

    # Add any remaining text after the last interpolation
    if current_pos < raw_value.size
      parts << TextStringPart.new(raw_value[current_pos...raw_value.size], location)
    end

    StringLiteral.new(parts, location)
  end

  def parse_option_statement : OptionStatement
    option_location = expect(Scanner::TokenType::KEYWORD_OPTION).location
    label : StringLiteral? = nil
    regex_literal : StringLiteral? = nil
    regex_capture_variable : Identifier? = nil

    if peek(Scanner::TokenType::STRING_LITERAL)
      label = parse_string_literal
    elsif peek(Scanner::TokenType::REGEX_LITERAL)
      # The lexer already returns the entire regex as a string literal (e.g., "/[0-9]{4}/")
      regex_token = expect(Scanner::TokenType::REGEX_LITERAL)
      regex_literal = StringLiteral.new([TextStringPart.new(regex_token.value, regex_token.location)].map(&.as(StringPart)), regex_token.location)

      # The display label for the regex option (e.g., "Enter 3 digits")
      label = parse_string_literal

      if peek(Scanner::TokenType::KEYWORD_AS)
        consume(Scanner::TokenType::KEYWORD_AS)
        id_token = expect(Scanner::TokenType::IDENTIFIER)
        regex_capture_variable = Identifier.new(id_token.value, id_token.location)
      end
    else
      raise ParseError.new("Expected string literal or regex literal for option label at #{@current_token.location}", @current_token.location)
    end

    destination = parse_option_destination
    expect(Scanner::TokenType::SEMICOLON)

    OptionStatement.new(label, regex_literal, regex_capture_variable, destination, option_location)
  end

  def parse_option_destination : OptionDestination
    destination_location = @current_token.location
    if peek(Scanner::TokenType::ARROW)
      consume(Scanner::TokenType::ARROW)
      menu_id_token = expect(Scanner::TokenType::IDENTIFIER)
      menu_id = Identifier.new(menu_id_token.value, menu_id_token.location)
      GotoDestination.new(menu_id, destination_location)
    elsif peek(Scanner::TokenType::KEYWORD_ACTION)
      consume(Scanner::TokenType::KEYWORD_ACTION)
      action_call = parse_action_call(destination_location)
      ActionDestination.new(action_call, destination_location)
    else
      raise ParseError.new("Expected '->' or 'action' for option destination at #{@current_token.location}", @current_token.location)
    end
  end

  def parse_input_statement : InputStatement
    input_location = expect(Scanner::TokenType::KEYWORD_INPUT).location
    variable_token = expect(Scanner::TokenType::IDENTIFIER)
    variable_name = Identifier.new(variable_token.value, variable_token.location)
    expect(Scanner::TokenType::SEMICOLON)
    InputStatement.new(variable_name, input_location)
  end

  def parse_goto_statement : GotoStatement
    goto_location = expect(Scanner::TokenType::KEYWORD_GOTO).location
    menu_id_token = expect(Scanner::TokenType::IDENTIFIER)
    menu_id = Identifier.new(menu_id_token.value, menu_id_token.location)
    expect(Scanner::TokenType::SEMICOLON)
    GotoStatement.new(menu_id, goto_location)
  end

  def parse_if_statement : IfStatement
    if_location = expect(Scanner::TokenType::KEYWORD_IF).location
    expect(Scanner::TokenType::LPAREN)
    # Simplified condition to just an identifier for this example
    condition_token = expect(Scanner::TokenType::IDENTIFIER)
    condition = Identifier.new(condition_token.value, condition_token.location)
    expect(Scanner::TokenType::RPAREN)

    expect(Scanner::TokenType::LBRACE)
    then_branch = parse_statement_list
    expect(Scanner::TokenType::RBRACE)

    else_branch : Array(Statement)? = nil
    if peek(Scanner::TokenType::KEYWORD_ELSE)
      consume(Scanner::TokenType::KEYWORD_ELSE)
      expect(Scanner::TokenType::LBRACE)
      else_branch = parse_statement_list
      expect(Scanner::TokenType::RBRACE)
    end

    IfStatement.new(condition, then_branch, else_branch, if_location)
  end

  def parse_for_each_statement : ForEachStatement
    for_location = expect(Scanner::TokenType::KEYWORD_FOR).location
    expect(Scanner::TokenType::KEYWORD_EACH)
    expect(Scanner::TokenType::LPAREN)

    item_var_token = expect(Scanner::TokenType::IDENTIFIER)
    item_variable = Identifier.new(item_var_token.value, item_var_token.location)

    index_variable : Identifier? = nil
    if peek(Scanner::TokenType::COMMA)
      consume(Scanner::TokenType::COMMA)
      index_var_token = expect(Scanner::TokenType::IDENTIFIER)
      index_variable = Identifier.new(index_var_token.value, index_var_token.location)
    end

    expect(Scanner::TokenType::KEYWORD_IN)
    collection_var_token = expect(Scanner::TokenType::IDENTIFIER)
    collection_variable = Identifier.new(collection_var_token.value, collection_var_token.location)
    expect(Scanner::TokenType::RPAREN)

    expect(Scanner::TokenType::LBRACE)
    body = parse_statement_list
    expect(Scanner::TokenType::RBRACE)

    ForEachStatement.new(item_variable, index_variable, collection_variable, body, for_location)
  end

  def parse_action_call_statement : ActionCall
    action_location = expect(Scanner::TokenType::KEYWORD_ACTION).location
    parse_action_call(action_location, true) # Pass true to expect semicolon
  end

  # Helper for parsing ActionCall, used by OptionDestination and ActionCallStatement
  def parse_action_call(location : Scanner::Location, expect_semicolon : Bool = false) : ActionCall
    action_name : Identifier? = nil
    external_path : StringLiteral? = nil
    external_js_call : Identifier? = nil

    if peek(Scanner::TokenType::KEYWORD_JS) && peek_next(Scanner::TokenType::IDENTIFIER)
      consume(Scanner::TokenType::KEYWORD_JS) # consume 'js'
      action_name_token = expect(Scanner::TokenType::IDENTIFIER)
      external_js_call = Identifier.new(action_name_token.value, action_name_token.location)
    elsif peek(Scanner::TokenType::STRING_LITERAL) # For "file:func"
      external_path = parse_string_literal
    elsif peek(Scanner::TokenType::IDENTIFIER) # For internal named action
      action_name_token = expect(Scanner::TokenType::IDENTIFIER)
      action_name = Identifier.new(action_name_token.value, action_name_token.location)
    else
      raise ParseError.new("Expected action name, 'js.', or string literal for action call at #{@current_token.location}", @current_token.location)
    end

    params = Array(ActionParam).new
    if peek(Scanner::TokenType::KEYWORD_WITH)
      consume(Scanner::TokenType::KEYWORD_WITH)
      expect(Scanner::TokenType::LBRACE)
      while !peek(Scanner::TokenType::RBRACE)
        param_name_token = expect(Scanner::TokenType::IDENTIFIER)
        expect(Scanner::TokenType::ASSIGN)
        param_value_token = expect(Scanner::TokenType::IDENTIFIER) # Simplified: assuming param value is always an identifier
        params << ActionParam.new(Identifier.new(param_name_token.value, param_name_token.location), Identifier.new(param_value_token.value, param_value_token.location), param_name_token.location)
        if peek(Scanner::TokenType::COMMA)
          consume(Scanner::TokenType::COMMA)
        end
      end
      expect(Scanner::TokenType::RBRACE)
    end

    return_variable : Identifier? = nil
    if peek(Scanner::TokenType::KEYWORD_AS)
      consume(Scanner::TokenType::KEYWORD_AS)
      return_var_token = expect(Scanner::TokenType::IDENTIFIER)
      return_variable = Identifier.new(return_var_token.value, return_var_token.location)
    end

    expect(Scanner::TokenType::SEMICOLON) if expect_semicolon # Only consume semicolon if expected

    ActionCall.new(action_name, external_path, external_js_call, params, return_variable, location)
  end

  def parse_end_statement : AST::EndStatement
    end_location = expect(Scanner::TokenType::KEYWORD_END).location
    expect(Scanner::TokenType::SEMICOLON)
    AST::EndStatement.new(end_location)
  end
end

# Custom error class for parsing
class ParseError < Exception
  property location : Scanner::Location

  def initialize(message : String, @location : Scanner::Location)
    super(message)
  end

  def to_s(io : IO)
    io << "Parse Error at #{location}: #{message}"
  end
end
