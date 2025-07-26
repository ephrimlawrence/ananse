require "./spec_helper.cr"

describe Parser do
  describe "action grammar" do
    it "action with params" do
      stmts = parse(Grammar.action)
      puts stmts
      # tokens.is_a?(Array(Token)).should eq(true)
      # tokens.size.should eq(15)
    end

    # it "action with params and a trailing comma before closing bracket" do
    #   tokens = scan(Grammar.action.gsub(")", ",)"))
    #   tokens.is_a?(Array(Token)).should eq(true)
    #   tokens.size.should eq(16)
    # end

    # it "action without params" do
    #   tokens = scan(Grammar.action(false))
    #   tokens.is_a?(Array(Token)).should eq(true)
    #   tokens.size.should eq(4)
    # end
  end
end
