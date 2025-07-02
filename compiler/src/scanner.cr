require "./token.cr"

module Scanner

  # enum TokenType
  #   KEYWORD_MENU
  #   KEYWORD_DISPLAY
  #   KEYWORD_OPTION
  #   KEYWORD_INPUT
  #   KEYWORD_ACTION
  #   KEYWORD_WITH
  #   KEYWORD_AS
  #   KEYWORD_IF
  #   KEYWORD_ELSE
  #   KEYWORD_FOR
  #   KEYWORD_EACH
  #   KEYWORD_IN
  #   KEYWORD_GOTO
  #   KEYWORD_END
  #   KEYWORD_JS # for js.
  #   KEYWORD_TRUE
  #   KEYWORD_FALSE

  #   IDENTIFIER
  #   NUMBER_LITERAL
  #   STRING_LITERAL # For the content of "..." or '...'
  #   REGEX_LITERAL  # For the content of /.../

  #   # Operators and Symbols
  #   LPAREN        # (
  #   RPAREN        # )
  #   LBRACE        # {
  #   RBRACE        # }
  #   SEMICOLON     # ;
  #   ASSIGN        # =
  #   COLON         # :
  #   COMMA         # ,
  #   ARROW         # ->
  #   DOUBLE_LBRACE # {{
  #   DOUBLE_RBRACE # }}
  #   SLASH         # / (for regex start/end)

  #   EOF     # End of File
  #   UNKNOWN # For unrecognised characters
  # end

  class Scan
    def initialize
      p! TokenType::KEYWORD_MENU
    end
  end
end
