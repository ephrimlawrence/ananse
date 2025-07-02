struct CompilerError
  def error(location : Location, message : String)
    report(location, "", message)
  end

  private def report(location : Location, where : String, message : String)
    puts "[line #{location.line}:#{location.column}] Error #{where} : #{message}"
  end
end
