require "./token.cr"
require "./error.cr"

module Scanner
  class Scan
    property source : String
    property line : Int32
    property column : Int32
    property tokens : Array(Token) = [] of Token

    # current position in input (points to current char)
    property start : Int32

    # current reading position in input (after current char)
    property current : Int32

    # current char under examination
    # property char : Char

    KEYWORDS = {
      "menu"    => TokenType::MENU,
      "display" => TokenType::DISPLAY,
      "option"  => TokenType::OPTION,
      "input"   => TokenType::INPUT,
      "action"  => TokenType::ACTION,
      "with"    => TokenType::WITH,
      "as"      => TokenType::AS,
      "if"      => TokenType::IF,
      "else"    => TokenType::ELSE,
      "for"     => TokenType::FOR,
      "each"    => TokenType::EACH,
      "in"      => TokenType::IN,
      "goto"    => TokenType::GOTO,
      "end"     => TokenType::END,
      "start"   => TokenType::START,
      "print"   => TokenType::PRINT,
      # "js"      => TokenType::KEYWORD_JS,
      "true"  => TokenType::TRUE,
      "false" => TokenType::FALSE,
    }

    def initialize(@source : String)
      @start = 0
      @current = 0
      @line = 1
      @column = 0
      # @char = ' '

      puts @source
      # read_char # Initialize char with the first character
    end

    def scan_tokens : Array(Token)
      while !is_at_end?
        # We are at the beginning of the next lexeme.
        @start = current
        scan_token
      end

      add_token(TokenType::EOF, "")
      return tokens
    end

    private def scan_token
      char : Char = advance()

      if char == ' ' || char == '\t' || char == '\r'
        return # skip whitespace
      end

      case char
      when '('
        add_token(TokenType::LEFT_PAREN)
      when ')'
        add_token TokenType::RIGHT_PAREN
      when '{'
        add_token(TokenType::LEFT_BRACE)
      when '}'
        add_token(TokenType::RIGHT_BRACE)
      when ','
        add_token(TokenType::COMMA)
        # when '.' # TODO: might have to delete this
        #   add_token(TokenType::DOT)
      when '-'
        add_token(match('>') ? TokenType::ARROW : TokenType::MINUS)
      when '+'
        add_token(TokenType::PLUS)
      when ';'
        add_token(TokenType::SEMICOLON)
      when '*'
        add_token(TokenType::STAR)
      when '!'
        add_token(match('=') ? TokenType::BANG_EQUAL : TokenType::BANG)
      when '='
        add_token(match('=') ? TokenType::EQUAL_EQUAL : TokenType::EQUAL)
      when '<'
        add_token(match('=') ? TokenType::LESS_EQUAL : TokenType::LESS)
      when '>'
        add_token(match('=') ? TokenType::GREATER_EQUAL : TokenType::GREATER)
      when '\n'
        @line += 1
        @column = 0
        # TODO: add '{{'  '}}' for string interpol?
      when '/'
        # TODO: pass regex
        if match '/' # comment start with //
          # A comment goes until the end of the line.
          while peek != '\n' && !is_at_end?
            advance
          end
        else
          add_token TokenType::SLASH
        end
      when '"'
        read_string()
      when .ascii_number?
        read_number
      when .ascii_letter?
        read_identifier
      else
        CompilerError.new.error(get_location, "Unexpected character.")
      end
    end

    private def read_identifier
      while peek.ascii_alphanumeric? || peek == '_'
        advance()
      end

      text : String = @source[@start...@current]
      add_token(KEYWORDS.fetch(text, TokenType::IDENTIFIER), text)
    end

    private def read_number
      while peek.ascii_number?
        advance()
      end

      if peek == '.' && peek_next.ascii_number? # Likely decimal value
        advance()                               # consume '.'
        while peek.ascii_number?
          advance
        end
      end

      add_token(TokenType::NUMBER, @source[@start...@current].to_f)
    end

    private def read_string
      while peek != '"' && !is_at_end?
        if peek == '\n'
          @line += 1
        end
        advance
      end

      if is_at_end?
        CompilerError.new.error(get_location, "Unterminated string.")
        return
      end

      # The closing ".
      advance

      # Trim the surrounding quotes.
      value : String = @source[@start + 1...@current - 1]
      add_token(TokenType::STRING, value)
    end

    private def add_token(type : TokenType)
      add_token(type, nil)
    end

    private def add_token(type : TokenType, literal : String? | Int32? | Float64?)
      # TODO; settle on Token properties
      location = Location.new(@line, @column)
      @tokens << Token.new(
        type: type,
        value: @source[@start...@current],
        location: location,
        literal: literal
      )
    end

    private def match(expected : Char) : Bool
      if is_at_end?
        return false
      end

      if @source[@current] != expected
        return false
      end

      @current += 1
      @column += 1
      return true
    end

    private def peek : Char
      if is_at_end?
        return '\0'
      end

      return @source[@current]
    end

    private def peek_next : Char
      if @current + 1 >= source.size
        return '\0'
      end
      return source[@current + 1]
    end

    private def is_at_end? : Bool
      @current >= @source.size
    end

    # Returns the character at @current and increment current + 1
    private def advance : Char
      value : Char = @source[@current]

      @current += 1
      @column += 1
      return value
    end

    def get_location : Location
      Location.new(@line, @column)
    end
  end
end
