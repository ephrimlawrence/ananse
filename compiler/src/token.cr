enum TokenType
  MENU
  DISPLAY
  OPTION
  INPUT
  ACTION
  WITH
  AS
  IF
  ELSE
  FOR
  EACH
  IN
  GOTO
  START
  END
  # JS # for js.
  TRUE
  FALSE

  IDENTIFIER
  NUMBER
  STRING        # For the content of "..." or '...'
  REGEX_LITERAL # For the content of /.../

  # Operators and Symbols
  LEFT_PAREN    # (
  RIGHT_PAREN   # )
  LEFT_BRACE    # {
  RIGHT_BRACE   # }
  SEMICOLON     # ;
  ASSIGN        # =
  COLON         # :
  PLUS          # +
  MINUS         # -
  STAR          # *
  COMMA         # ,
  ARROW         # ->
  DOUBLE_LBRACE # {{
  DOUBLE_RBRACE # }}
  SLASH         # / (for regex start/end)

  # One or two character tokens.
  BANG          # !
  BANG_EQUAL    # !=
  EQUAL         # =
  EQUAL_EQUAL   # ==
  GREATER       # >
  GREATER_EQUAL # >=
  LESS          # <
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
  property value : String                        # same as lexeme
  property literal : String? | Int32? | Float64? | Bool? # Raw value passed, eg. string with quotes
  property location : Location

  def initialize(@type, @value, @location, @literal)
  end

  def to_s
    "Token(#{type}, '#{value}', #{location})"
  end
end

enum LiteralType
  String
  Bool
end
