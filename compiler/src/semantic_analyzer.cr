require "./ast.cr"
require "./environment.cr"

class SemanticAnalyzer < AST::Visitor(Nil)
  property statements : Array(AST::Stmt) = [] of AST::Stmt
  property menu_env : MenuEnvironment = MenuEnvironment.new

  def initialize(@statements)
  end

  def analyze
    @statements.each do |stmt|
      stmt.accept(self)
    end
    # TODO: 1. check menu with 'false' values and return errors
    # errors.empty?
  end

  # def visit_menu_stmt(stmt : AST::MenuStatement)
  #   # Check menu name uniqueness, etc.
  #   # Check menu body for valid structure
  #   stmt.body.accept(self)
  # end

  def visit_menu_stmt(stmt : AST::MenuStatement)
    menu_env.define(stmt.name.value, true)

    statements = stmt.body.statements
    p! is_options_menu?(statements)
    p! is_input_menu?(statements)
    if !(is_options_menu?(statements) || is_input_menu?(statements))
      msg : String = "Menu '#{stmt.name.value}' has invalid structure. A menu can have a group of {display, options} or {display, input, goto, actions, end}"

      raise RuntimeErr.new(msg, stmt.name)
    end

    stmt.body.accept(self)
  end

  def visit_block_stmt(block : AST::BlockStatement)
    block.statements.each { |stmt| stmt.accept(self) }
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
    # Check input variable validity
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

  def visit_option_stmt(stmt : AST::OptionStatement)
    # Check options group validity
    stmt.group.each { |opt| opt.accept(self) }
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
  end

  def visit_action_expr(expr : AST::Action) : Nil
  end

  # A menu can contain
  private def is_options_menu?(stmts : Array(AST::Stmt)) : Bool
    # Keep statement which is not 'display' | 'action'
    # TODO: add if, foreach statement
    stmts.reject! { |s| s.is_a?(AST::DisplayStatement) || s.is_a?(AST::OptionStatement) }
    # Check for [display, input, goto, action, end] pattern
    p! stmts
    stmts.size == 0
  end

  # A menu can contain
  private def is_input_menu?(stmts : Array(AST::Stmt)) : Bool
    # TODO: add if, foreach, end statement
    stmts.reject! { |s| s.is_a?(AST::DisplayStatement) || s.is_a?(AST::InputStatement) || s.is_a?(AST::GotoStatement) || s.is_a?(AST::ActionStatement) }

    stmts.size == 0
  end
end
