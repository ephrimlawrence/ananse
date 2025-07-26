require "./spec_helper"

describe SemanticAnalyzer do
  it "rejects program without a start menu" do
    source = <<-USSD
      menu welcome {
        display "Hello World"
      }
    USSD

    expect_raises(CompilerError, "No start menu defined") do
      analyze(source)
    end
  end

  it "accepts a program with a start menu" do
    source = <<-USSD
      start menu welcome {
        display "Hello World"
      }
    USSD
    analyze(source).should eq(true)
  end

  # it "rejects a menu with both option and input" do
  #   source = <<-USSD
  #     menu bad {
  #       display "Oops"
  #       option 1 "Next"
  #       input foo
  #     }
  #   USSD
  #   tokens = Scanner::Scan.new(source).scan_tokens
  #   ast = Parser.new(tokens).parse
  #   analyzer = SemanticAnalyzer.new(ast)
  #   expect { analyzer.analyze }.to raise_error(RuntimeErr, /invalid structure/)
  # end
end
