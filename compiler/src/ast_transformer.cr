require "./ast.cr"
require "./environment.cr"

class AstTransformer < AST::Visitor(Nil)
  property transformed_ast : TransformedAST = TransformedAST.new

  property statements : Array(AST::Stmt) = [] of AST::Stmt
  property menu_env : MenuEnvironment = MenuEnvironment.new
  property if_stmts : Array(Array(AST::IfStatement)) = [] of Array(AST::IfStatement)

  def initialize(@statements)
  end

  def transform
    @statements.each do |stmt|
      stmt.accept(self)
    end

    # TODO: 1. check menu with 'false' values and return errors
    # errors.empty?
    puts @if_stmts.size

    @transformed_ast
  end

  def visit_menu_stmt(stmt : AST::MenuStatement)
    # Group the menu definition by statement types
    grouped_stmt : Hash(String, Array(AST::Stmt)) = {} of String => Array(AST::Stmt)

    # set default values
    ["display", "option", "input", "goto", "action", "end", "menu"].each do |type|
      grouped_stmt[type] = [] of AST::Stmt
    end
    # execute(stmt.body)

    stmt.body.statements.each do |stmt|
      # If the statement is a desugared IfStatement, we group by the type of the
      # single statement it contains in its 'then_branch'.
      # if stmt.is_a?(IfStatement) && stmt.then_branch.size == 1
      #   inner_stmt = stmt.then_branch.first
      #   case inner_stmt
      #   when DisplayStatement
      #     grouped_stmt["display"] << stmt # Group the outer IfStatement
      #   when OptionStatement
      #     grouped_stmt["option"] << stmt
      #   when InputStatement
      #     grouped_stmt["input"] << stmt
      #   when GotoStatement
      #     grouped_stmt["goto"] << stmt
      #   when ActionCall # Now ActionCall is a Statement
      #     grouped_stmt["action"] << stmt
      #   when ForEachStatement
      #     grouped_stmt["for_each"] << stmt
      #   when EndStatement
      #     grouped_stmt["end"] << stmt
      #   else
      #     # Fallback for any other statement types, or if inner_stmt is not recognized
      #     grouped_stmt["other"] << stmt
      #   end
      # else
      # For statements that are not IfStatements (e.g., top-level display, input)
      case stmt
      when AST::DisplayStatement
        grouped_stmt["display"] << stmt
      when AST::OptionStatement
        grouped_stmt["option"] << stmt
      when AST::InputStatement
        grouped_stmt["input"] << stmt
      when AST::GotoStatement
        grouped_stmt["goto"] << stmt
      when AST::ActionStatement
        grouped_stmt["action"] << stmt
        execute(stmt)
        # when ForEachStatement
        #   grouped_stmt["for_each"] << stmt
        # when EndStatement
        #   grouped_stmt["end"] << stmt
      else
        puts "Other Statements #{stmt}"
        p! stmt
        # grouped_stmt["other"] << stmt
      end
      # end
    end

    grouped_stmt["menu"] = [stmt.as(AST::Stmt)]
    @transformed_ast.menu_definitions << grouped_stmt
  end

  def visit_if_stmt(stmt : AST::IfStatement)
    @if_stmts << [stmt] # Push new statement onto the stack

    execute(stmt.then_branch)
    if !stmt.else_branch.nil?
      execute(stmt.else_branch.as(AST::Stmt))
    end

    # TODO: pop stack
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
    @transformed_ast.actions << stmt.expression.func_name.value
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

  private def execute(stmt : AST::Stmt)
    stmt.accept(self)
  end
end
