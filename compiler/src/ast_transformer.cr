require "./ast.cr"
require "./environment.cr"

class AstTransformer < AST::Visitor(Nil)
  property statements : Array(AST::Stmt) = [] of AST::Stmt
  property menu_env : MenuEnvironment = MenuEnvironment.new

  def initialize(@statements)
  end

  def transform
    @statements.each do |stmt|
      stmt.accept(self)
    end

    # TODO: 1. check menu with 'false' values and return errors
    # errors.empty?
  end

  def visit_menu_stmt(stmt : AST::MenuStatement)
  end

  def visit_if_stmt(stmt : AST::IfStatement)
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
end
