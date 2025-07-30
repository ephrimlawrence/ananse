require "./spec_helper.cr"

# Given that is it tedious to verify the individuals tokens of a given grammar,
# It is acceptable to simply test the number of tokens scanned against the expected number
# The parser tests handles the structure of the generates tokens, which is easier
# than verify the generated tokens in every test
describe Scanner do
  describe "goto grammar" do
    it "goto with menu name" do
      tokens = scan(Grammar.goto(name: "my_menu"))
      tokens.is_a?(Array(Token)).should eq(true)
      tokens.size.should eq(3)
    end

    it "goto a nested menu" do
      tokens = scan(Grammar.goto(name: "parent.child.grand_child"))
      tokens.is_a?(Array(Token)).should eq(true)
      tokens.size.should eq(3)
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

    it "goto back" do
      tokens = scan(Grammar.goto(back: true))
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
