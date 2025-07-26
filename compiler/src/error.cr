class CompilerError < Exception
  def initialize(message : String)
    super(message)
  end

  def initialize(message : String, token : Token)
    puts "here", message
    if (token.type == TokenType::EOF)
      super report(token.location, " at end", message)
    else
      super report(token.location, " at '" + token.value + "'", message)
    end
  end

  def initialize(location : Location, message : String)
    super("Error at #{location.line}:#{location.column}: #{message}")
  end

  def initialize(location : Location, message : String)
    super report(location, "", message)
  end

  # def self.error(token : Token, message : String)
  # end

  # def self.error(message : String)
  #   if (token.type == TokenType::EOF)
  #     report(token.location, " at end", message)
  #   else
  #     report(token.location, " at '" + token.value + "'", message)
  #   end
  # end

  # runtimeError(RuntimeError error) {
  #   System.err.println(error.getMessage() +
  #       "\n[line " + error.token.line + "]");
  #   hadRuntimeError = true;
  # }

  private def report(location : Location, where : String, message : String)
    return "[line #{location.line}:#{location.column}] Error #{where} : #{message}"
  end

  def backtrace?
    false
  end

  def backtrace?
    [] of String
  end
end

class RuntimeErr < Exception
  property token : Token

  def initialize(message : String, @token : Token)
    puts "Error at #{@token.location.line}:#{@token.location.column}: #{message}"
    exit 1
  end

  def to_s(io : IO)
    io << "Error at #{@token.location.line}:#{@token.location.column}: #{message}"
  end
end

class ParseError < Exception
  property token : Token

  def backtrace?
    false
  end

  def backtrace?
    [] of String
  end

  def initialize(message : String, @token : Token)
    super(message)
  end

  def to_s(io : IO)
    io << "Parse Error at #{@token.location.line}:#{@token.location.column}: #{message}"
  end
end
