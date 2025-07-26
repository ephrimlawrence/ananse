require "./spec_helper.cr"

# Given that is it tedious to verify the individuals tokens of a given grammar,
# It is acceptable to simply test the number of tokens scanned against the expected number
# The parser tests handles the structure of the generates tokens, which is easier
# than verify the generated tokens in every test
describe Scanner do
  describe "action grammar" do
    it "action with params" do
      tokens = scan(Grammar.action)
      tokens.is_a?(Array(Token)).should eq(true)
      tokens.size.should eq(15)
    end

    it "action with params and a trailing comma before closing bracket" do
      tokens = scan(Grammar.action.gsub(")", ",)"))
      tokens.is_a?(Array(Token)).should eq(true)
      tokens.size.should eq(16)
    end

    it "action without params" do
      tokens = scan(Grammar.action(false))
      tokens.is_a?(Array(Token)).should eq(true)
      tokens.size.should eq(4)
    end
  end
end
