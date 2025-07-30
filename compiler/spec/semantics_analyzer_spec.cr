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

  it "accepts a valid menu definition (input)" do
    source = <<-USSD
      start menu user_age {
        display "Enter age"
        input age
      }
    USSD
    analyze(source).should eq(true)
  end

  it "accepts a valid menu definition (option)" do
    source = <<-USSD
      start menu user_age {
        display "Enter age"
        option 1 "Option 1"
        option 1 "Option 2"
      }
    USSD
    analyze(source).should eq(true)
  end

  it "rejects a menu with both option and input" do
    source = <<-USSD
      start menu welcome {
        display "Hello World"
        option 1 "Option 1"
        option 1 "Option 2"
        input age
      }
    USSD

    expect_raises(CompilerError, /invalid structure/) do
      analyze(source)
    end
  end

  it "rejects if statement with nested menu" do
    source = <<-USSD
      start menu welcome {
        display "Hello World"
        option 1 "Option 1"

        if (age == 1){
          menu enter_age {
            display "Enter your age"
            input age
          }
        }
      }
    USSD

    expect_raises(CompilerError, /Nested menu statement is not allowed in an if block/) do
      analyze(source)
    end
  end

  it "rejects nested if statements" do
    source = <<-USSD
      start menu welcome {
        display "Hello World"
        option 1 "Option 1"

        if (age == 1){
          if (age == 2) {
            option 2 "Option 2"
          }
        }
      }
    USSD

    expect_raises(CompilerError, /Nested if statement is not allowed/) do
      analyze(source)
    end
  end

  it "rejects nested if statements in else block" do
    source = <<-USSD
      start menu welcome {
        display "Hello World"
        option 1 "Option 1"

        if (age == 1){
          option 2 "Option 2"
        } else {
          if (age == 2) {
            option 3 "Option 3"
          }
        }
      }
    USSD

    expect_raises(CompilerError, /Nested if statement is not allowed/) do
      analyze(source)
    end
  end

  it "accepts if statement with no nested ifs" do
    source = <<-USSD
      start menu welcome {
        display "Hello World"
        option 1 "Option 1"

        if (age == 1){
          option 2 "Option 2"
        } else {
          option 3 "Option 3"
        }
      }
    USSD

    analyze(source).should eq(true)
  end

  # TODO: unused menu test
  # TODO: unreferenced menu test

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
