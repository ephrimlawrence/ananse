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
      "true"  => TokenType::KEYWORD_TRUE,
      "false" => TokenType::KEYWORD_FALSE,
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
        add_token(TokenType::MINUS)
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
        if match '/' # comment start with //
          # A comment goes until the end of the line.
          while peek != '\n' && !is_at_end?
            advance
          end
        else
          add_token TokenType::SLASH
        end
      else
        CompilerError.new.error(Location.new(@line, @column), "Unexpected character.")
      end
    end

    private def add_token(type : TokenType)
      add_token(type, nil)
    end

    private def add_token(type : TokenType, literal : String?)
      location = Location.new(@line, @column)
      @tokens << Token.new(type: type, value: @source[@start...@current], location: location)
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
  end
end
