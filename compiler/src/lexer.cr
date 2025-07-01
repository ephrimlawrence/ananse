module Lexer
  # --- Lexer (Tokenization) ---
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
    LPAREN        # (
    RPAREN        # )
    LBRACE        # {
    RBRACE        # }
    SEMICOLON     # ;
    ASSIGN        # =
    COLON         # :
    COMMA         # ,
    ARROW         # ->
    DOUBLE_LBRACE # {{
    DOUBLE_RBRACE # }}
    SLASH         # / (for regex start/end)

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

  class Lexer
    property source : String

    # current position in input (points to current char)
    property position : Int32

    # current reading position in input (after current char)
    property read_position : Int32

    # current char under examination
    property char : Char

    property line : Int32
    property column : Int32

    KEYWORDS = {
      "menu"    => TokenType::KEYWORD_MENU,
      "display" => TokenType::KEYWORD_DISPLAY,
      "option"  => TokenType::KEYWORD_OPTION,
      "input"   => TokenType::KEYWORD_INPUT,
      "action"  => TokenType::KEYWORD_ACTION,
      "with"    => TokenType::KEYWORD_WITH,
      "as"      => TokenType::KEYWORD_AS,
      "if"      => TokenType::KEYWORD_IF,
      "else"    => TokenType::KEYWORD_ELSE,
      "for"     => TokenType::KEYWORD_FOR,
      "each"    => TokenType::KEYWORD_EACH,
      "in"      => TokenType::KEYWORD_IN,
      "goto"    => TokenType::KEYWORD_GOTO,
      "end"     => TokenType::KEYWORD_END,
      # "js"      => TokenType::KEYWORD_JS,
      "true"    => TokenType::KEYWORD_TRUE,
      "false"   => TokenType::KEYWORD_FALSE,
    }

    def initialize(@source : String)
      @position = 0
      @read_position = 0
      @line = 1
      @column = 0
      @char = ' '
      read_char # Initialize char with the first character
    end

    private def read_char
      if @read_position >= @source.size
        @char = '\0' # EOF character
      else
        @char = @source[@read_position]
      end

      @position = @read_position
      @read_position += 1
      @column += 1
    end

    private def peek_char : Char
      if @read_position >= @source.size
        '\0'
      else
        @source[@read_position]
      end
    end

    private def skip_whitespace
      while @char.whitespace? || @char == '\n' || @char == '\r'
        if @char == '\n'
          @line += 1
          @column = 0 # Reset column for new line
        end
        read_char
      end
    end

    private def skip_single_line_comment
      if @char == '/' && peek_char == '/'
        while @char != '\n' && @char != '\0'
          read_char
        end
        # After comment, the char is '\n' or '\0'.
        # The next skip_whitespace will handle the newline.
      end
    end

    private def read_identifier : String
      pos = @position
      while @char.ascii_letter? || @char.ascii_number? || @char == '_'
        read_char
      end
      @source[pos...@position]
    end

    private def read_number : String
      pos = @position
      while @char.ascii_number?
        read_char
      end

      if @char == '.' && peek_char.ascii_number?
        read_char # consume '.'
        while @char.ascii_number?
          read_char
        end
      end
      @source[pos...@position]
    end

    # Reads string literal content, handling escapes and interpolation markers.
    # The interpolation markers ({{...}}) are kept in the string value for the parser
    # to later break down into InterpolatedStringPart.
    private def read_string(quote_char : Char) : String
      pos = @position + 1 # Start after the opening quote
      read_char           # Consume the opening quote

      buffer = String.build do |s|
        while @char != quote_char && @char != '\0' && @char != '\n'
          if @char == '\\'                       # Handle escape sequences
            s.puts(@char)                         # Put the backslash
            read_char                            # Consume the escaped char
            s.puts(@char)                         # Put the escaped char
          elsif @char == '{' && peek_char == '{' # Handle {{ interpolation markers
            s.puts(@char)                         # Put first {
            read_char
            s.puts(@char) # Put second {
            read_char
            # Read until closing }}
            while !(@char == '}' && peek_char == '}') && @char != '\0' && @char != '\n'
              s.puts(@char)
              read_char
            end
            if @char == '}' && peek_char == '}'
              s.puts(@char) # Put first }
              read_char
              s.puts(@char) # Put second }
            else
              # Error: unclosed interpolation, for simplicity just put chars as is
              s.puts(@char)
            end
          else
            s.puts(@char)
          end
          read_char
        end
      end

      # Check for unclosed string literal
      if @char != quote_char
        raise "Unclosed string literal starting at #{Location.new(@line, pos)}"
      end

      read_char # Consume the closing quote
      buffer.to_s
    end

    # Reads a regex literal, including pattern and flags
    private def read_regex : String
      pos = @position + 1 # Start after the opening '/'
      read_char           # Consume opening '/'

      # Read pattern
      while @char != '/' && @char != '\0' && @char != '\n'
        if @char == '\\' # Handle escaped / within regex pattern
          read_char      # consume backslash
          # For simplicity, any char after backslash is considered part of escape
        end
        read_char
      end

      pattern = @source[pos...@position]

      if @char != '/'
        raise "Unclosed regex literal starting at #{Location.new(@line, pos)}"
      end
      read_char # Consume closing '/'

      # Read flags (e.g., i, g, m)
      flags_pos = @position
      while @char.ascii_letter?
        read_char
      end
      flags = @source[flags_pos...@position]

      # Return pattern and flags combined, e.g., "pattern/flags"
      "#{pattern}/#{flags}"
    end

    # Main method to get the next token
    def next_token : Token
      skip_whitespace
      skip_single_line_comment # Check for comments after skipping initial whitespace
      skip_whitespace          # Re-skip whitespace after comment, as comment might be followed by more whitespace/newlines

      current_location = Location.new(@line, @column)
      token = case @char
              when '(' then Token.new(TokenType::LPAREN, @char.to_s, current_location)
              when ')' then Token.new(TokenType::RPAREN, @char.to_s, current_location)
              when '{'
                if peek_char == '{'
                  # This is handled by read_string for now, as {{ is part of string content.
                  # If you want to tokenize {{ and }} separately, this logic needs to change.
                  # For string interpolation, the lexer just passes the whole string
                  # and the parser breaks down the interpolation.
                  Token.new(TokenType::UNKNOWN, @char.to_s, current_location) # Should not happen if read_string works as intended
                else
                  Token.new(TokenType::LBRACE, @char.to_s, current_location)
                end
              when '}'
                if peek_char == '}'
                  # Same as above, handled by read_string
                  Token.new(TokenType::UNKNOWN, @char.to_s, current_location) # Should not happen
                else
                  Token.new(TokenType::RBRACE, @char.to_s, current_location)
                end
              when ';' then Token.new(TokenType::SEMICOLON, @char.to_s, current_location)
              when '=' then Token.new(TokenType::ASSIGN, @char.to_s, current_location)
              # when ':' then Token.new(TokenType::COLON, @char.to_s, current_location)
              when ',' then Token.new(TokenType::COMMA, @char.to_s, current_location)
              when '-'
                if peek_char == '>'
                  read_char # consume -
                  Token.new(TokenType::ARROW, "->", current_location)
                else
                  Token.new(TokenType::UNKNOWN, @char.to_s, current_location)
                end
              when '/'
                # Could be start of regex or comment. Comment handled earlier.
                # If it's not a comment, it's the start of a regex literal.
                value = read_regex
                return Token.new(TokenType::REGEX_LITERAL, value, current_location)
              when '"'
                value = read_string('"')
                return Token.new(TokenType::STRING_LITERAL, value, current_location)
              when '\''
                value = read_string('\'')
                return Token.new(TokenType::STRING_LITERAL, value, current_location)
              when '\0' then Token.new(TokenType::EOF, "", current_location)
              else
                if @char.ascii_letter? || @char == '_'
                  value = read_identifier
                  type = KEYWORDS[value]? || TokenType::IDENTIFIER
                  return Token.new(type, value, current_location)
                elsif @char.ascii_number?
                  value = read_number
                  return Token.new(TokenType::NUMBER_LITERAL, value, current_location)
                else
                  Token.new(TokenType::UNKNOWN, @char.to_s, current_location)
                end
              end

      read_char

      return token
    end
  end
end
