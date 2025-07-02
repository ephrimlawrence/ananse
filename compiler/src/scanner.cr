require "./token.cr"

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

      case char
      when '('
        add_token(TokenType::RIGHT_PAREN)
      when ')'
        add_token TokenType::LEFT_PAREN
      when '{'
        add_token(TokenType::RIGHT_BRACE)
      when '}'
        add_token(TokenType::LEFT_BRACE)
      end
    end

    private def add_token(type : TokenType)
      add_token(type, nil)
    end

    private def add_token(type : TokenType, literal : String?)
      location = Location.new(@line, @column)
      @tokens << Token.new(type: type, value: @source[@start..@current], location: location)
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
