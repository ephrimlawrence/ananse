require "./spec_helper.cr"

describe Parser do
  describe "strings" do
    it "raw string" do
      stmts = parse %(display "Hello World!")
      stmts[0].is_a?(AST::DisplayStatement).should eq(true)
      stmt = stmts[0].as(AST::DisplayStatement)
      stmt.expression.is_a?(AST::Literal).should eq(true)
    end

    it "interpolated string" do
      stmts = parse %(display "Your lucky number {{ 23 + 445 }}")
      # p! stmts
      stmts[0].is_a?(AST::DisplayStatement).should eq(true)
      stmt = stmts[0].as(AST::DisplayStatement)
      stmt.expression.is_a?(AST::InterpolatedString).should eq(true)
      #   tokens = scan(%("Count {{ 1+2 }}"))
      #   tokens.is_a?(Array(Token)).should eq(true)
      #   tokens.size.should eq(8)
    end
  end

  describe "display grammar" do
    it "display a string" do
      stmts = parse(%(display "Hello World!"))
      stmts[0].is_a?(AST::DisplayStatement).should eq(true)
      stmt = stmts[0].as(AST::DisplayStatement)
      stmt.expression.is_a?(AST::Literal).should eq(true)
    end

    it "display a number" do
      stmts = parse(%(display 3443))
      stmt = stmts[0].as(AST::DisplayStatement)
      stmt.expression.is_a?(AST::Literal).should eq(true)
    end

    it "display an expression" do
      stmts = parse(%(display 2+3+4))
      stmt = stmts[0].as(AST::DisplayStatement)
      stmt.expression.is_a?(AST::Binary).should eq(true)
    end

    it "display a variable" do
      stmts = parse(%(display variable_name))
      stmt = stmts[0].as(AST::DisplayStatement)
      stmt.expression.is_a?(AST::Variable).should eq(true)
    end
  end

  describe "goto grammar" do
    it "goto with menu name" do
      ["cameCaseName", "snake_case_name"].each do |name|
        stmts = parse("goto #{name}")
        stmts.size.should eq(1)
        stmts[0].is_a?(AST::GotoStatement).should eq(true)

        stmt = stmts[0].as(AST::GotoStatement)
        stmt.menu.name.value.should eq(name)
      end
    end

    it "goto a nested menu" do
      ["parentMenu.child_menu.grandChild", "parent_menu.childMenu.grandChild.father"].each do |name|
        stmts = parse("goto #{name}")
        stmts.size.should eq(1)
        stmts[0].is_a?(AST::GotoStatement).should eq(true)

        stmt = stmts[0].as(AST::GotoStatement)
        stmt.menu.name.value.should eq(name)
      end
    end

  end

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

      stmt.expression.name.as(Token).value.should eq("variableName")
    end

    it "action with params without a variable name" do
      stmts = parse(Grammar.action(with_name: false))
      stmts.size.should eq(1)
      stmts[0].is_a?(AST::ActionStatement).should eq(true)

      stmt = stmts[0].as(AST::ActionStatement)
      stmt.expression.func_name.value.should eq("jsFunctionName")
      stmt.expression.params.size.should eq(3)

      params = [{"param1", "value1"}, {"param2", "value2"}, {"param3", "value3"}]
      stmt.expression.params.each_with_index do |item, idx|
        item[0].value.should eq(params[idx][0])
      end

      stmt.expression.name.nil?.should eq(true)
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

    it "action without params and without a variable name" do
      stmts = parse(Grammar.action(with_params: false, with_name: false))
      stmts.size.should eq(1)
      stmts[0].is_a?(AST::ActionStatement).should eq(true)

      stmt = stmts[0].as(AST::ActionStatement)
      stmt.expression.func_name.value.should eq("jsFunctionName")
      params = [{"param1", "value1"}, {"param2", "value2"}, {"param3", "value3"}]

      stmt.expression.params.size.should eq(0)
      stmt.expression.name.nil?.should eq(true)
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
