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

  private def report(location : Location, where : String, message : String)
    puts "[line #{location.line}:#{location.column}] Error #{where} : #{message}"
  end
end
