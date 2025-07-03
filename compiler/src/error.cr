struct CompilerError
  def error(location : Location, message : String)
    report(location, "", message)
  end

  def error(token : Token, message : String)
    if (token.type == TokenType::EOF)
      report(token.location, " at end", message)
    else
      report(token.location, " at '" + token.value + "'", message)
    end
  end

  # runtimeError(RuntimeError error) {
  #   System.err.println(error.getMessage() +
  #       "\n[line " + error.token.line + "]");
  #   hadRuntimeError = true;
  # }

  private def report(location : Location, where : String, message : String)
    puts "[line #{location.line}:#{location.column}] Error #{where} : #{message}"
  end
end

# class RuntimeError < Exception
#   property token : Token

#   def initialize(message : String, @token : Token)
#     super(message)
#   end

#   def to_s(io : IO)
#     io << "Parse Error at #{@token.location.line}:#{@token.location.column}: #{message}"
#   end
# end
