class CompilerError < Exception
  def initialize(message : String)
    super(message)
  end

  def initialize(message : String, token : Token)
    if (token.type == TokenType::EOF)
      super CompilerError.report(token.location, " at end", message)
    else
      super CompilerError.report(token.location, " at '" + token.value + "'", message)
    end
  end

  def initialize(location : Location, message : String)
    super("Error at #{location.line}:#{location.column}: #{message}")
  end

  def initialize(location : Location, message : String)
    super CompilerError.report(location, "", message)
  end

  def self.report(location : Location, where : String, message : String)
    return "[line #{location.line}:#{location.column}] Error #{where} : #{message}"
  end

  def backtrace?
    false
  end

  def backtrace?
    [] of String
  end
end
