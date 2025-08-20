require "./spec_helper.cr"

describe Scanner do
  describe "menu statement" do
    it "start menu" do
      str = <<-USSD
        start menu welcome {}
      USSD
      tokens = scan(str)
      tokens.size.should eq(6)

      tokens[0].type.should eq(TokenType::START)
      tokens[0].literal.should eq("start")
      tokens[0].value.should eq("start")

      tokens[1].type.should eq(TokenType::MENU)
      tokens[1].literal.should eq("menu")
      tokens[1].value.should eq("menu")

      tokens[2].type.should eq(TokenType::IDENTIFIER)
      tokens[2].literal.should eq("welcome")
      tokens[2].value.should eq("welcome")

      tokens[3].type.should eq(TokenType::LEFT_BRACE)
      tokens[3].literal.should eq(nil)
      tokens[3].value.should eq("{")

      tokens[4].type.should eq(TokenType::RIGHT_BRACE)
      tokens[4].literal.should eq(nil)
      tokens[4].value.should eq("}")

      tokens[5].type.should eq(TokenType::EOF)
    end
    it "menu + name" do
      str = <<-USSD
        menu welcome {}
      USSD
      tokens = scan(str)
      tokens.size.should eq(5)

      tokens[0].type.should eq(TokenType::MENU)
      tokens[0].literal.should eq("menu")
      tokens[0].value.should eq("menu")

      tokens[1].type.should eq(TokenType::IDENTIFIER)
      tokens[1].literal.should eq("welcome")
      tokens[1].value.should eq("welcome")

      tokens[2].type.should eq(TokenType::LEFT_BRACE)
      tokens[2].literal.should eq(nil)
      tokens[2].value.should eq("{")

      tokens[3].type.should eq(TokenType::RIGHT_BRACE)
      tokens[3].literal.should eq(nil)
      tokens[3].value.should eq("}")

      tokens[4].type.should eq(TokenType::EOF)
    end
  end

  describe "if statement" do
    it "if" do
      str = <<-USSD
        if (3 == 2) {}
      USSD
      tokens = scan(str)
      tokens.size.should eq(9)

      tokens[0].type.should eq(TokenType::IF)
      tokens[0].literal.should eq("if")
      tokens[0].value.should eq("if")

      tokens[1].type.should eq(TokenType::LEFT_PAREN)
      tokens[1].literal.should eq(nil)
      tokens[1].value.should eq("(")

      tokens[2].type.should eq(TokenType::NUMBER)
      tokens[2].literal.should eq(3.0)
      tokens[2].value.should eq("3")

      tokens[3].type.should eq(TokenType::EQUAL_EQUAL)
      tokens[3].literal.should eq(nil)
      tokens[3].value.should eq("==")

      tokens[4].type.should eq(TokenType::NUMBER)
      tokens[4].literal.should eq(2.0)
      tokens[4].value.should eq("2")

      tokens[5].type.should eq(TokenType::RIGHT_PAREN)
      tokens[5].literal.should eq(nil)
      tokens[5].value.should eq(")")

      tokens[6].type.should eq(TokenType::LEFT_BRACE)
      tokens[6].literal.should eq(nil)
      tokens[6].value.should eq("{")

      tokens[7].type.should eq(TokenType::RIGHT_BRACE)
      tokens[7].literal.should eq(nil)
      tokens[7].value.should eq("}")

      tokens[8].type.should eq(TokenType::EOF)
    end

    it "if + else" do
      str = <<-USSD
        if (3 == 2) {} else {}
      USSD
      tokens = scan(str)
      tokens.size.should eq(12)

      tokens[0].type.should eq(TokenType::IF)
      tokens[0].literal.should eq("if")
      tokens[0].value.should eq("if")

      tokens[1].type.should eq(TokenType::LEFT_PAREN)
      tokens[1].literal.should eq(nil)
      tokens[1].value.should eq("(")

      tokens[2].type.should eq(TokenType::NUMBER)
      tokens[2].literal.should eq(3.0)
      tokens[2].value.should eq("3")

      tokens[3].type.should eq(TokenType::EQUAL_EQUAL)
      tokens[3].literal.should eq(nil)
      tokens[3].value.should eq("==")

      tokens[4].type.should eq(TokenType::NUMBER)
      tokens[4].literal.should eq(2.0)
      tokens[4].value.should eq("2")

      tokens[5].type.should eq(TokenType::RIGHT_PAREN)
      tokens[5].literal.should eq(nil)
      tokens[5].value.should eq(")")

      tokens[6].type.should eq(TokenType::LEFT_BRACE)
      tokens[6].literal.should eq(nil)
      tokens[6].value.should eq("{")

      tokens[7].type.should eq(TokenType::RIGHT_BRACE)
      tokens[7].literal.should eq(nil)
      tokens[7].value.should eq("}")

      tokens[8].type.should eq(TokenType::ELSE)
      tokens[8].literal.should eq("else")
      tokens[8].value.should eq("else")

      tokens[9].type.should eq(TokenType::LEFT_BRACE)
      tokens[9].literal.should eq(nil)
      tokens[9].value.should eq("{")

      tokens[10].type.should eq(TokenType::RIGHT_BRACE)
      tokens[10].literal.should eq(nil)
      tokens[10].value.should eq("}")

      tokens[11].type.should eq(TokenType::EOF)
    end
  end

  describe "option statement scanning" do
    it "option with target + label" do
      tokens = scan(%(option 1 "Label"))
      tokens.is_a?(Array(Token)).should eq(true)
      tokens.size.should eq(4)

      tokens[0].type.should eq(TokenType::OPTION)
      tokens[0].literal.should eq("option")
      tokens[0].value.should eq("option")

      tokens[1].type.should eq(TokenType::NUMBER)
      tokens[1].literal.should eq(1.0)
      tokens[1].value.should eq("1")

      tokens[2].type.should eq(TokenType::STRING)
      tokens[2].literal.should eq("Label")
      tokens[2].value.should eq(%("Label"))

      tokens[3].type.should eq(TokenType::EOF)
    end

    it "option with target + label + goto" do
      tokens = scan(%(option 1 "Label" -> my_menu))
      tokens.is_a?(Array(Token)).should eq(true)
      tokens.size.should eq(6)

      tokens[0].type.should eq(TokenType::OPTION)
      tokens[0].literal.should eq("option")
      tokens[0].value.should eq("option")

      tokens[1].type.should eq(TokenType::NUMBER)
      tokens[1].literal.should eq(1.0)
      tokens[1].value.should eq("1")

      tokens[2].type.should eq(TokenType::STRING)
      tokens[2].literal.should eq("Label")
      tokens[2].value.should eq(%("Label"))

      tokens[3].type.should eq(TokenType::ARROW)
      tokens[3].literal.should eq(nil)
      tokens[3].value.should eq("->")

      tokens[4].type.should eq(TokenType::IDENTIFIER)
      tokens[4].literal.should eq("my_menu")
      tokens[4].value.should eq("my_menu")

      tokens[5].type.should eq(TokenType::EOF)
    end

    it "option with target + label + target" do
      tokens = scan(%{option 1 "Label" @jsFunc()})
      tokens.is_a?(Array(Token)).should eq(true)
      tokens.size.should eq(7)

      tokens[0].type.should eq(TokenType::OPTION)
      tokens[0].literal.should eq("option")
      tokens[0].value.should eq("option")

      tokens[1].type.should eq(TokenType::NUMBER)
      tokens[1].literal.should eq(1.0)
      tokens[1].value.should eq("1")

      tokens[2].type.should eq(TokenType::STRING)
      tokens[2].literal.should eq("Label")
      tokens[2].value.should eq(%("Label"))

      tokens[3].type.should eq(TokenType::ACTION)
      tokens[3].literal.should eq("jsFunc")
      tokens[3].value.should eq("jsFunc")

      tokens[4].type.should eq(TokenType::LEFT_PAREN)
      tokens[4].literal.should eq(nil)
      tokens[4].value.should eq("(")

      tokens[5].type.should eq(TokenType::RIGHT_PAREN)
      tokens[5].literal.should eq(nil)
      tokens[5].value.should eq(")")

      tokens[6].type.should eq(TokenType::EOF)
    end
  end

  it "input statement" do
    tokens = scan("input variable_name")
    tokens.is_a?(Array(Token)).should eq(true)
    tokens.size.should eq(3)

    tokens[0].type.should eq(TokenType::INPUT)
    tokens[0].literal.should eq("input")
    tokens[0].value.should eq("input")

    tokens[1].type.should eq(TokenType::IDENTIFIER)
    tokens[1].literal.should eq("variable_name")
    tokens[1].value.should eq("variable_name")

    tokens[2].type.should eq(TokenType::EOF)
  end

  describe "strings scanning" do
    it "scans simple string" do
      tokens = scan(%("Hello World!"))
      tokens.is_a?(Array(Token)).should eq(true)
      tokens.size.should eq(2)
      tokens[0].type.should eq(TokenType::STRING)
      tokens[0].literal.should eq("Hello World!")
      tokens[0].value.should eq(%("Hello World!"))
      tokens[1].type.should eq(TokenType::EOF)
    end

    it "scans string with 1 interpolation" do
      tokens = scan(%("Count {{ 1+2 }}"))
      tokens.is_a?(Array(Token)).should eq(true)
      tokens.size.should eq(8)

      tokens[0].type.should eq(TokenType::STRING)
      tokens[0].literal.should eq("Count")
      tokens[0].value.should eq(%("Count ))

      tokens[1].type.should eq(TokenType::INTERPOLATION_START)
      tokens[1].value.should eq("{{")

      tokens[2].type.should eq(TokenType::NUMBER)
      tokens[2].value.should eq("1")
      tokens[2].literal.should eq(1.0)

      tokens[3].type.should eq(TokenType::PLUS)
      tokens[3].value.should eq("+")
      tokens[3].literal.should eq(nil)

      tokens[4].type.should eq(TokenType::NUMBER)
      tokens[4].value.should eq("2")
      tokens[4].literal.should eq(2.0)

      tokens[5].type.should eq(TokenType::INTERPOLATION_END)
      tokens[5].value.should eq("}}")

      tokens[6].type.should eq(TokenType::STRING)
      tokens[6].value.should eq("\"")
      tokens[6].literal.should eq("")

      tokens[7].type.should eq(TokenType::EOF)
    end

    it "scans string with 2 interpolations" do
      tokens = scan(%("Hi {{ 1 }} {{ 2 }}"))
      tokens.is_a?(Array(Token)).should eq(true)
      tokens.size.should eq(10)

      tokens[0].type.should eq(TokenType::STRING)
      tokens[0].literal.should eq("Hi")
      tokens[0].value.should eq(%("Hi ))

      tokens[1].type.should eq(TokenType::INTERPOLATION_START)
      tokens[1].value.should eq("{{")

      tokens[2].type.should eq(TokenType::NUMBER)
      tokens[2].value.should eq("1")
      tokens[2].literal.should eq(1.0)

      tokens[3].type.should eq(TokenType::INTERPOLATION_END)
      tokens[3].value.should eq("}}")

      tokens[4].type.should eq(TokenType::STRING)
      tokens[4].literal.should eq("")
      tokens[4].value.should eq(" ")

      tokens[5].type.should eq(TokenType::INTERPOLATION_START)
      tokens[5].value.should eq("{{")

      tokens[6].type.should eq(TokenType::NUMBER)
      tokens[6].value.should eq("2")
      tokens[6].literal.should eq(2.0)

      tokens[7].type.should eq(TokenType::INTERPOLATION_END)
      tokens[7].value.should eq("}}")

      tokens[8].type.should eq(TokenType::STRING)
      tokens[8].value.should eq("\"")
      tokens[8].literal.should eq("")

      tokens[9].type.should eq(TokenType::EOF)
    end
  end

  describe "display statement" do
    it "displays a string" do
      tokens = scan(%(display "Hello World!"))
      tokens.is_a?(Array(Token)).should eq(true)
      tokens.size.should eq(3)

      tokens[0].type.should eq(TokenType::DISPLAY)
      tokens[0].literal.should eq("display")
      tokens[0].value.should eq("display")

      tokens[1].type.should eq(TokenType::STRING)
      tokens[1].literal.should eq("Hello World!")
      tokens[1].value.should eq(%("Hello World!"))

      tokens[2].type.should eq(TokenType::EOF)
    end

    it "display a number" do
      tokens = scan(%(display 122334))
      tokens.is_a?(Array(Token)).should eq(true)
      tokens.size.should eq(3)

      tokens[0].type.should eq(TokenType::DISPLAY)
      tokens[0].literal.should eq("display")
      tokens[0].value.should eq("display")

      tokens[1].type.should eq(TokenType::NUMBER)
      tokens[1].literal.should eq(122334.0)
      tokens[1].value.should eq("122334")

      tokens[2].type.should eq(TokenType::EOF)
    end

    it "display a variable" do
      tokens = scan(%(display variable_name))
      tokens.is_a?(Array(Token)).should eq(true)
      tokens.size.should eq(3)

      tokens[0].type.should eq(TokenType::DISPLAY)
      tokens[0].literal.should eq("display")
      tokens[0].value.should eq("display")

      tokens[1].type.should eq(TokenType::IDENTIFIER)
      tokens[1].literal.should eq("variable_name")
      tokens[1].value.should eq("variable_name")

      tokens[2].type.should eq(TokenType::EOF)
    end
  end

  describe "goto statement" do
    it "goto with menu name" do
      tokens = scan("goto my_menu")
      tokens.is_a?(Array(Token)).should eq(true)
      tokens.size.should eq(3)

      tokens[0].type.should eq(TokenType::GOTO)
      tokens[0].literal.should eq("goto")
      tokens[0].value.should eq("goto")

      tokens[1].type.should eq(TokenType::IDENTIFIER)
      tokens[1].literal.should eq("my_menu")
      tokens[1].value.should eq("my_menu")

      tokens[2].type.should eq(TokenType::EOF)
    end

    it "goto a nested menu" do
      tokens = scan("goto parent.child.grand_child")
      tokens.is_a?(Array(Token)).should eq(true)
      tokens.size.should eq(7)

      tokens[0].type.should eq(TokenType::GOTO)
      tokens[0].literal.should eq("goto")
      tokens[0].value.should eq("goto")

      tokens[1].type.should eq(TokenType::IDENTIFIER)
      tokens[1].literal.should eq("parent")
      tokens[1].value.should eq("parent")

      tokens[2].type.should eq(TokenType::DOT)
      tokens[2].value.should eq(".")

      tokens[3].type.should eq(TokenType::IDENTIFIER)
      tokens[3].literal.should eq("child")
      tokens[3].value.should eq("child")

      tokens[4].type.should eq(TokenType::DOT)
      tokens[4].value.should eq(".")

      tokens[5].type.should eq(TokenType::IDENTIFIER)
      tokens[5].literal.should eq("grand_child")
      tokens[5].value.should eq("grand_child")

      tokens[6].type.should eq(TokenType::EOF)
    end
  end

  describe "action grammar" do
    it "action with params" do
      tokens = scan("@jsFunctionName(param1: 2, param2: value2)")
      tokens.is_a?(Array(Token)).should eq(true)
      tokens.size.should eq(11)

      tokens[0].type.should eq(TokenType::ACTION)
      tokens[0].literal.should eq("jsFunctionName")
      tokens[0].value.should eq("jsFunctionName")

      tokens[1].type.should eq(TokenType::LEFT_PAREN)
      tokens[1].literal.should eq(nil)
      tokens[1].value.should eq("(")

      tokens[2].type.should eq(TokenType::IDENTIFIER)
      tokens[2].literal.should eq("param1")
      tokens[2].value.should eq("param1")

      tokens[3].type.should eq(TokenType::COLON)
      tokens[3].literal.should eq(nil)
      tokens[3].value.should eq(":")

      tokens[4].type.should eq(TokenType::NUMBER)
      tokens[4].literal.should eq(2.0)
      tokens[4].value.should eq("2")

      tokens[5].type.should eq(TokenType::COMMA)
      tokens[5].literal.should eq(nil)
      tokens[5].value.should eq(",")

      tokens[6].type.should eq(TokenType::IDENTIFIER)
      tokens[6].literal.should eq("param2")
      tokens[6].value.should eq("param2")

      tokens[7].type.should eq(TokenType::COLON)
      tokens[7].literal.should eq(nil)
      tokens[7].value.should eq(":")

      tokens[8].type.should eq(TokenType::IDENTIFIER)
      tokens[8].literal.should eq("value2")
      tokens[8].value.should eq("value2")

      tokens[9].type.should eq(TokenType::RIGHT_PAREN)
      tokens[9].literal.should eq(nil)
      tokens[9].value.should eq(")")

      tokens[10].type.should eq(TokenType::EOF)
    end

    it "action with params and a trailing comma before closing bracket" do
      tokens = scan("@js(param1: 2,)")
      tokens.is_a?(Array(Token)).should eq(true)
      tokens.size.should eq(8)

      tokens[0].type.should eq(TokenType::ACTION)
      tokens[0].literal.should eq("js")
      tokens[0].value.should eq("js")

      tokens[1].type.should eq(TokenType::LEFT_PAREN)
      tokens[1].literal.should eq(nil)
      tokens[1].value.should eq("(")

      tokens[2].type.should eq(TokenType::IDENTIFIER)
      tokens[2].literal.should eq("param1")
      tokens[2].value.should eq("param1")

      tokens[3].type.should eq(TokenType::COLON)
      tokens[3].literal.should eq(nil)
      tokens[3].value.should eq(":")

      tokens[4].type.should eq(TokenType::NUMBER)
      tokens[4].literal.should eq(2.0)
      tokens[4].value.should eq("2")

      tokens[5].type.should eq(TokenType::COMMA)
      tokens[5].literal.should eq(nil)
      tokens[5].value.should eq(",")

      tokens[6].type.should eq(TokenType::RIGHT_PAREN)
      tokens[6].literal.should eq(nil)
      tokens[6].value.should eq(")")

      tokens[7].type.should eq(TokenType::EOF)
    end

    it "action without params" do
      tokens = scan("@jsFunctionName()")
      tokens.is_a?(Array(Token)).should eq(true)
      tokens.size.should eq(4)
      tokens[0].type.should eq(TokenType::ACTION)
      tokens[0].literal.should eq("jsFunctionName")
      tokens[0].value.should eq("jsFunctionName")

      tokens[1].type.should eq(TokenType::LEFT_PAREN)
      tokens[1].literal.should eq(nil)
      tokens[1].value.should eq("(")

      tokens[2].type.should eq(TokenType::RIGHT_PAREN)
      tokens[2].literal.should eq(nil)
      tokens[2].value.should eq(")")

      tokens[3].type.should eq(TokenType::EOF)
    end

    it "action a string in params" do
      tokens = scan(%{@jsFunctionName(param3: "str")})
      tokens.is_a?(Array(Token)).should eq(true)
      tokens.size.should eq(7)
      tokens[0].type.should eq(TokenType::ACTION)
      tokens[0].literal.should eq("jsFunctionName")
      tokens[0].value.should eq("jsFunctionName")

      tokens[1].type.should eq(TokenType::LEFT_PAREN)
      tokens[1].literal.should eq(nil)
      tokens[1].value.should eq("(")

      tokens[2].type.should eq(TokenType::IDENTIFIER)
      tokens[2].literal.should eq("param3")
      tokens[2].value.should eq("param3")

      tokens[3].type.should eq(TokenType::COLON)
      tokens[3].literal.should eq(nil)
      tokens[3].value.should eq(":")

      tokens[4].type.should eq(TokenType::STRING)
      tokens[4].literal.should eq("str")
      tokens[4].value.should eq(%("str"))

      tokens[5].type.should eq(TokenType::RIGHT_PAREN)
      tokens[5].literal.should eq(nil)
      tokens[5].value.should eq(")")

      tokens[6].type.should eq(TokenType::EOF)
    end

    it "action with params and without variable name" do
      tokens = scan("@js(param: 2) as variableName")
      tokens.is_a?(Array(Token)).should eq(true)
      tokens.size.should eq(9)

      tokens[0].type.should eq(TokenType::ACTION)
      tokens[0].literal.should eq("js")
      tokens[0].value.should eq("js")

      tokens[1].type.should eq(TokenType::LEFT_PAREN)
      tokens[1].literal.should eq(nil)
      tokens[1].value.should eq("(")

      tokens[2].type.should eq(TokenType::IDENTIFIER)
      tokens[2].literal.should eq("param")
      tokens[2].value.should eq("param")

      tokens[3].type.should eq(TokenType::COLON)
      tokens[3].literal.should eq(nil)
      tokens[3].value.should eq(":")

      tokens[4].type.should eq(TokenType::NUMBER)
      tokens[4].literal.should eq(2.0)
      tokens[4].value.should eq("2")

      tokens[5].type.should eq(TokenType::RIGHT_PAREN)
      tokens[5].literal.should eq(nil)
      tokens[5].value.should eq(")")

      tokens[6].type.should eq(TokenType::AS)
      tokens[6].literal.should eq("as")
      tokens[6].value.should eq("as")

      tokens[7].type.should eq(TokenType::IDENTIFIER)
      tokens[7].literal.should eq("variableName")
      tokens[7].value.should eq("variableName")

      tokens[8].type.should eq(TokenType::EOF)
    end
  end
end
