require "./spec_helper"

describe SemanticAnalyzer do
  it "accepts a valid menu" do
    source = <<-USSD
      menu welcome {
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
