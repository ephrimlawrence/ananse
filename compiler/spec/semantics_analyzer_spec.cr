require "./spec_helper"

describe SemanticAnalyzer do
  describe "menu analysis" do
    it "report referenced but undefined menu" do
      # test 1: only 1 menu
      source = <<-USSD
        start menu welcome {
          display "Hello World"
          goto enter_age
        }
      USSD

      expect_raises(CompilerError, "Reference to 'enter_age' menu but it is not defined") do
        analyze(source)
      end

      # test 2: with a nested menu
      source = <<-USSD
        #{source}
        menu enter_age {
          display "Enter Age"
          goto child_menu

          menu child_menu {
            display "Hi"
            goto child_menu2
          }

          menu child_menu2 {
            display "Hi"
            goto child_menu3

            menu child_menu3 {
              display "Hi again"
              goto child_menu4
            }
          }
        }
      USSD

      expect_raises(CompilerError, /Reference to 'child_menu4' menu/) do
        analyze(source)
      end

      # test 3: reference to a nested menu
      expect_raises(CompilerError, /enter_age > child_menu10/m) do
        code = <<-USSD
          #{source}
          menu update_account {
            display "Enter Age"
            goto another_child

            menu another_child {
              display "Hi"
              goto enter_age.child_menu10
            }
          }
        USSD
        analyze(code)
      end

      # Reference in a sub menu to another sub-sub-child
      source = <<-USSD
        #{source}
        menu child_menu4 {
          display "Enter Age"
          goto another_child

          menu another_child {
            display "Hi"
            goto sub_sub_child

            menu sub_sub_child {
              display "Hi"
            }
          }
        }
      USSD

      analyze(source).should eq(true)
    end

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
  end

  describe "if statement analysis" do
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
