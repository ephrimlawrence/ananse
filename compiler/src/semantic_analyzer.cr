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

    # Report unused menu definitions
    @menu_env.references.each do |name, (count, token)|
      if count == 0
        raise RuntimeErr.new("Menu '#{name}' is defined but never used", token)
      end
    end

    # Report referenced but undefined menus
    @menu_env.references.each do |name, (count, token)|
      if count > 0 && !@menu_env.get(token)
        raise RuntimeErr.new("Menu '#{name}' is referenced but not defined", token)
      end
    end
  end

  # def visit_menu_stmt(stmt : AST::MenuStatement)
  #   # Check menu name uniqueness, etc.
  #   # Check menu body for valid structure
  #   stmt.body.accept(self)
  # end

  def visit_menu_stmt(stmt : AST::MenuStatement)
    @menu_env.add(stmt.name)

    statements = stmt.body.statements
    if !is_menu_structure_valid?(statements)
      msg : String = "Menu '#{stmt.name.value}' has invalid structure. A menu can have a group of {display, options} or {display, input, goto, actions, end}"

      raise RuntimeErr.new(msg, stmt.name)
    end

    stmt.body.accept(self)
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
    @menu_env.referenced(stmt.menu)
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

  private def is_menu_structure_valid?(stmts : Array(AST::Stmt)) : Bool
    valid : Bool = false
    has_option_stmt : Bool = !stmts.find { |s| s.is_a?(AST::OptionStatement) }.nil?
    has_input_stmt : Bool = !has_option_stmt

    stmts.each do |s|
      if has_option_stmt
        if s.is_a?(AST::InputStatement) || s.is_a?(AST::GotoStatement) || s.is_a?(AST::ActionStatement)
          return false
        end
      end

      if has_input_stmt
        if s.is_a?(AST::OptionStatement)
          return false
        end
      end
    end

    return true
  end
end
