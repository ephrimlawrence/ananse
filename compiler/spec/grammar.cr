struct Grammar
  # <action_stmt>	::= "@" <identifier> "(" (<identifier> ":" <identifier> ",")* ")" ( "as" <identifier>)?
  def self.action(with_params : Bool = true) : String
    if with_params
      return "@jsFunctionName(param1: value1, param2: value2, param3: value3)"
    end

    return "@jsFunctionName()"
    # if with_params
    #   return "@jsFunctionName(param1: value1, param2: value3, param4: value5)"
    # end

    # return "@jsFunctionName()"
  end
end
