require "./spec_helper.cr"

describe Parser do
  describe "action grammar" do
    it "action with params" do
      stmts = parse(Grammar.action)
      stmts.size.should eq(1)
      stmts[0].is_a?(AST::ActionStatement).should eq(true)

      stmt = stmts[0].as(AST::ActionStatement)
      stmt.expression.func_name.value.should eq("jsFunctionName")
      stmt.expression.params.size.should eq(3)

      params = [{"param1", "value1"}, {"param2", "value2"}, {"param3", "value3"}]
      stmt.expression.params.each_with_index do |item, idx|
        item[0].value.should eq(params[idx][0])
      end
    end

    it "action with params and a trailing comma before closing bracket" do
      stmts = parse(Grammar.action.gsub(")", ",)"))
      stmts.size.should eq(1)
      stmts[0].is_a?(AST::ActionStatement).should eq(true)

      stmt = stmts[0].as(AST::ActionStatement)
      stmt.expression.func_name.value.should eq("jsFunctionName")
      stmt.expression.params.size.should eq(3)

      params = [{"param1", "value1"}, {"param2", "value2"}, {"param3", "value3"}]
      stmt.expression.params.each_with_index do |item, idx|
        item[0].value.should eq(params[idx][0])
      end
    end

    it "action without params" do
      stmts = parse(Grammar.action(false))
      stmts.size.should eq(1)
      stmts[0].is_a?(AST::ActionStatement).should eq(true)

      stmt = stmts[0].as(AST::ActionStatement)
      stmt.expression.func_name.value.should eq("jsFunctionName")
      params = [{"param1", "value1"}, {"param2", "value2"}, {"param3", "value3"}]

      stmt.expression.params.size.should eq(0)
    end

    it "reject action without a function name" do
      expect_raises(CompilerError, /Expected an Typescript function name after '@'/) do
        stmts = parse("@")
      end
    end

    it "reject action without an opening '('" do
      expect_raises(CompilerError, /Expected '\(' after/) do
        stmts = parse("@someFunctionName")
      end
    end

    it "reject action without an closing ')'" do
      expect_raises(CompilerError, /Expected closing '\)'/) do
        stmts = parse("@someFunctionName(")
        puts stmts
      end
    end
  end
end
