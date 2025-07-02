enum TokenType
  KEYWORD_MENU
  KEYWORD_DISPLAY
  KEYWORD_OPTION
  KEYWORD_INPUT
  KEYWORD_ACTION
  KEYWORD_WITH
  KEYWORD_AS
  KEYWORD_IF
  KEYWORD_ELSE
  KEYWORD_FOR
  KEYWORD_EACH
  KEYWORD_IN
  KEYWORD_GOTO
  KEYWORD_END
  KEYWORD_JS # for js.
  KEYWORD_TRUE
  KEYWORD_FALSE

  IDENTIFIER
  NUMBER_LITERAL
  STRING_LITERAL # For the content of "..." or '...'
  REGEX_LITERAL  # For the content of /.../

  # Operators and Symbols
  LEFT_PAREN        # (
  RIGHT_PAREN        # )
  LEFT_BRACE        # {
  RIGHT_BRACE        # }
  SEMICOLON     # ;
  ASSIGN        # =
  COLON         # :
  PLUS          # +
  MINUS         # -
  STAR         # *
  COMMA         # ,
  ARROW         # ->
  DOUBLE_LBRACE # {{
  DOUBLE_RBRACE # }}
  SLASH         # / (for regex start/end)

  # One or two character tokens.
  BANG         # !
  BANG_EQUAL   # !=
  EQUAL        # =
  EQUAL_EQUAL  # ==
  GREATER      # >
  GREATER_EQUAL # >=
  LESS         # <
  LESS_EQUAL    # <=

  EOF     # End of File
  UNKNOWN # For unrecognised characters
end

struct Location
  property line : Int32
  property column : Int32

  def initialize(@line, @column)
  end

  def to_s
    "line #{@line}, column #{@column}"
  end
end

struct Token
  property type : TokenType
  property value : String
  property location : Location

  def initialize(@type, @value, @location)
  end

  def to_s
    "Token(#{type}, '#{value}', #{location})"
  end
end
