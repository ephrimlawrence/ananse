require "./ast.cr"
require "./environment.cr"
require "./resolver"

class SemanticAnalyzer < AST::Visitor(Nil)
  getter symbol_table : SymbolTable = SymbolTable.new

  property statements : Array(AST::Stmt) = [] of AST::Stmt
  # property menu_env : MenuEnvironment = MenuEnvironment.new
  property is_start_menu_defined : Bool = false
  property is_evaluating_if_stmt : Bool = false

  # property menus_pending_resolution : Array(MenuEnvironment) = [] of MenuEnvironment

  def initialize(@statements)
  end

  def analyze : Bool
    @symbol_table.populate_menu_table(@statements)

    # pp @symbol_table.menu_map
    @statements.each do |stmt|
      #   if (stmt.is_a?(AST::MenuStatement))
      #     @menus_pending_resolution.unshift(@menu_env.define(stmt.name))
      #   end

      stmt.accept(self)
    end

    if !@is_start_menu_defined
      raise CompilerError.new("No start menu defined")
    end

    # # Report unused menu definitions
    # errors : Array(String) = @menu_env.gather_errors
    # if !errors.empty?
    #   raise CompilerError.new(errors.join("\n"))
    # end
    # pp errors
    # pp @menu_env

    # @menu_env.references.each do |name, (count, token)|
    #   if count == 0
    #     raise CompilerError.new("Menu '#{name}' is defined but never used", token)
    #   end
    # end

    # # Report referenced but undefined menus
    # @menu_env.references.each do |name, (count, token)|
    #   if count > 0 && !@menu_env.get(token)
    #     raise CompilerError.new("Menu '#{name}' is referenced but not defined", token)
    #   end
    # end

    true
  end

  def visit_menu_stmt(stmt : AST::MenuStatement)
    # TODO: implement reference to nested menus

    # env : MenuEnvironment = @menus_pending_resolution.first?.as(MenuEnvironment)

    if @is_start_menu_defined && stmt.start?
      raise CompilerError.new("Start menu is already defined", stmt.name)
    end

    if stmt.start?
      # The start menu is marked as referenced
      # since it is the first menu called in the runtime by default
      # @menu_env.referenced(stmt.name)
      @is_start_menu_defined = true
    end

    statements = stmt.body.statements

    # Check if the menu has a valid structure
    # A menu can either have a group of {display, options} or {display, input, goto, actions, end}
    msg : String = "Menu '#{stmt.name.value}' has invalid structure. A menu can have a group of {display, options} or {display, input, goto, actions, end}"

    has_option_stmt : Bool = false
    has_input_stmt : Bool = false

    stmt.body.statements.each do |s|
      if s.is_a?(AST::OptionStatement)
        has_option_stmt = true
      end

      if s.is_a?(AST::InputStatement)
        has_input_stmt = true
      end

      if has_option_stmt
        if s.is_a?(AST::InputStatement) || s.is_a?(AST::GotoStatement) || s.is_a?(AST::ActionStatement)
          raise CompilerError.new(msg, stmt.name)
        end
      end

      if has_input_stmt
        if s.is_a?(AST::OptionStatement)
          raise CompilerError.new(msg, stmt.name)
        end
      end

      if s.is_a?(AST::IfStatement)
        @is_evaluating_if_stmt = true
        execute(s)
        @is_evaluating_if_stmt = false
      end

      # Sub menu
      # if s.is_a?(AST::MenuStatement)
      #   # Push new menu to the stack
      #   @menus_pending_resolution.unshift(env.define(s.name))
      # end

      execute(s)
    end

    # Pop resolved menu from the stack
    # @menus_pending_resolution.shift
  end

  def visit_if_stmt(stmt : AST::IfStatement)
    execute(stmt.then_branch)

    if !stmt.else_branch.nil?
      execute(stmt.else_branch.as(AST::BlockStatement))
    end
  end

  def visit_block_stmt(block : AST::BlockStatement)
    block.statements.each do |stmt|
      if @is_evaluating_if_stmt && stmt.is_a?(AST::IfStatement)
        raise CompilerError.new("Nested if statement is not allowed")
      end

      if @is_evaluating_if_stmt && stmt.is_a?(AST::MenuStatement)
        raise CompilerError.new("Nested menu statement is not allowed in an if block", stmt.name)
      end
    end
  end

  def visit_display_stmt(stmt : AST::DisplayStatement)
    # Check display expression validity
  end

  def visit_input_stmt(stmt : AST::InputStatement)
    # Check input variable validity
  end

  def visit_print_stmt(stmt : AST::Print)
    # Check input variable validity
  end

  def visit_goto_stmt(stmt : AST::GotoStatement)
    evaluate(stmt.menu)
  end

  def visit_goto_expr(expr : AST::Goto) : Nil
    @symbol_table.lookup_goto_target(expr.name)
    # menu_name : String = expr.name
    # @menus_pending_resolution.first?.as(MenuEnvironment).referenced(expr.name)
  end

  def visit_action_stmt(stmt : AST::ActionStatement)
    # Check input variable validity
  end

  def visit_expression_stmt(stmt : AST::ExpressionStmt)
    # Check input variable validity
  end

  def visit_variable_stmt(stmt : AST::VariableStatement)
    # Check input variable validity
  end

  def visit_variable_stmt(stmt : AST::VariableStmt)
    # Check input variable validity
  end

  def visit_end_stmt(stmt : AST::EndStatement)
  end

  def visit_option_stmt(stmt : AST::OptionStatement)
    # Check options group validity
    stmt.group.each(&.accept(self))
  end

  def visit_literal_expr(expr : AST::Literal) : Nil
  end

  def visit_grouping_expr(expr : AST::Grouping) : Nil
  end

  def visit_unary_expr(expr : AST::Unary) : Nil
  end

  def visit_binary_expr(expr : AST::Binary) : Nil
  end

  def visit_variable_expr(expr : AST::Variable) : Nil
  end

  def visit_option_expr(expr : AST::Option) : Nil
    if !expr.next_menu.nil?
      evaluate(expr.next_menu.as(AST::Goto))
    end
  end

  def visit_action_expr(expr : AST::Action) : Nil
  end

  def visit_interpolation_expr(str : AST::InterpolatedString) : String
    # puts expr
  end

  private def evaluate(stmt : AST::Expr)
    stmt.accept(self)
  end

  private def execute(stmt : AST::Stmt)
    stmt.accept(self)
  end
end
