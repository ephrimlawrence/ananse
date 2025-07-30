struct Grammar
  # <action_stmt>	::= "@" <identifier> "(" (<identifier> ":" <identifier> ",")* ")" ( "as" <identifier>)?
  def self.action(with_params : Bool = true, with_name : Bool = true) : String
    str : String = "@jsFunctionName(param1: 2, param2: value2, param3: \"string\")"
    if !with_params
      str = "@jsFunctionName()"
    end

    if with_name
      return "#{str} as variableName"
    end

    return str
  end

  # <goto_stmt>			::= "goto" <space> ( <navigate_stmt> | ( <identifier> ( "." <identifier> )* ))
  # <navigate_stmt>		::= "end" | "back" | "start"
  def self.goto(back : Bool = false, is_end : Bool = false, start : Bool = false, name : String? = nil) : String
    if back
      return "goto back"
    end

    if is_end
      return "goto end"
    end

    if start
      return "goto start"
    end

    if !name.nil?
      return "goto #{name}"
    end

    return "goto menu_name"
  end
end
