require "./spec_helper.cr"

# Given that is it tedious to verify the individuals tokens of a given grammar,
# It is acceptable to simply test the number of tokens scanned against the expected number
# The parser tests handles the structure of the generates tokens, which is easier
# than verify the generated tokens in every test
describe Scanner do
  describe "strings" do
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

  describe "display grammar" do
    it "display a string" do
      tokens = scan(%(display "Hello World!"))
      tokens.is_a?(Array(Token)).should eq(true)
      tokens.size.should eq(3)
    end

    it "display a number" do
      tokens = scan(%(display 122334))
      tokens.is_a?(Array(Token)).should eq(true)
      tokens.size.should eq(3)
    end

    it "display a variable" do
      tokens = scan(%(display variable_name))
      tokens.is_a?(Array(Token)).should eq(true)
      tokens.size.should eq(3)
    end
  end

  describe "goto grammar" do
    it "goto with menu name" do
      tokens = scan(Grammar.goto(name: "my_menu"))
      tokens.is_a?(Array(Token)).should eq(true)
      tokens.size.should eq(3)
    end

    it "goto a nested menu" do
      tokens = scan(Grammar.goto(name: "parent.child.grand_child"))
      tokens.is_a?(Array(Token)).should eq(true)
      tokens.size.should eq(7)
    end

    it "goto end" do
      tokens = scan(Grammar.goto(is_end: true))
      tokens.is_a?(Array(Token)).should eq(true)
      tokens.size.should eq(3)
    end

    it "goto start" do
      tokens = scan(Grammar.goto(start: true))
      tokens.is_a?(Array(Token)).should eq(true)
      tokens.size.should eq(3)
    end
  end

  describe "action grammar" do
    it "action with params" do
      tokens = scan(Grammar.action)
      tokens.is_a?(Array(Token)).should eq(true)
      tokens.size.should eq(17)
    end

    it "action with params and a trailing comma before closing bracket" do
      tokens = scan(Grammar.action.gsub(")", ",)"))
      tokens.is_a?(Array(Token)).should eq(true)
      tokens.size.should eq(18)
    end

    it "action without params" do
      tokens = scan(Grammar.action(false))
      tokens.is_a?(Array(Token)).should eq(true)
      tokens.size.should eq(6)
    end

    it "action with params and without variable name" do
      tokens = scan(Grammar.action(with_name: false))
      tokens.is_a?(Array(Token)).should eq(true)
      tokens.size.should eq(15)
    end

    it "action with params and a trailing comma before closing bracket,  and without variable name" do
      tokens = scan(Grammar.action(with_name: false).gsub(")", ",)"))
      tokens.is_a?(Array(Token)).should eq(true)
      tokens.size.should eq(16)
    end

    it "action without params,  and without variable name" do
      tokens = scan(Grammar.action(with_params: false, with_name: false))
      tokens.is_a?(Array(Token)).should eq(true)
      tokens.size.should eq(4)
    end
  end
end
