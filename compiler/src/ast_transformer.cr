require "./ast.cr"
require "./environment.cr"

class AstTransformer < AST::Visitor(Nil)
  getter statements : Array(AST::Stmt) = [] of AST::Stmt
  getter transformed_ast : TransformedAST = TransformedAST.new

  # Tracks current menu(s) currently being evaluation
  #
  # The stack is used to
  # 1. build parent-child menu relationships
  #
  # Item is popped off the stack after evaluation
  private getter menu_stack : Array(AST::MenuStatement) = [] of AST::MenuStatement

  private property menu_env : MenuEnvironment = MenuEnvironment.new
  private property if_stmts : Array(Array(AST::IfStatement)) = [] of Array(AST::IfStatement)

  def initialize(@statements)
  end

  def transform
    @statements.each do |stmt|
      stmt.accept(self)
    end

    # TODO: 1. check menu with 'false' values and return errors
    # errors.empty?
    # puts @if_stmts.size

    @transformed_ast
  end

  def visit_menu_stmt(stmt : AST::MenuStatement)
    # Push menu onto the stack.
    # If the stack is not empty, then the first item is the parent of this menu.
    if !@menu_stack.empty?
      stmt.parent = @menu_stack.first
    end
    @menu_stack.unshift(stmt)

    # Group the menu definition by statement types
    grouped_stmt : TransformedAST::GroupedStatements = @transformed_ast.add_menu(stmt.name, group_statements(stmt.body))
    grouped_stmt[:menu] << stmt

    # Group if statements by sub-sub statements
    grouped_stmt[:if].each do |item|
      # TODO: add value back to tree
      if_stmt : AST::IfStatement = item.as(AST::IfStatement)

      grouped_then = group_statements(if_stmt.then_branch)
      grouped_else : TransformedAST::GroupedStatements = TransformedAST.new_group

      if !if_stmt.else_branch.nil?
        grouped_else = group_statements(if_stmt.else_branch.as(AST::Stmt))
      end

      # Reconstruct the if statement for each group
      grouped_then.each do |key, value|
        if value.size == 0
          next
        end

        else_block : Array(AST::Stmt) = [] of AST::Stmt
        if grouped_else.has_key?(key)
          else_block = grouped_else[key].clone
        end

        reconstructed_if = AST::IfStatement.new(
          if_stmt.condition,
          AST::BlockStatement.new(value, value.first.location),
          AST::BlockStatement.new(else_block, else_block.empty? ? Location.new(0, 0) : else_block.first.location),
          if_stmt.location
        )
        grouped_stmt[key] << reconstructed_if
      end

      # Re-create if-condition for statements in the else branch without corresponding
      # statements in then branch
      grouped_else.each do |key, value|
        if value.size == 0
          next
        end

        reconstructed_if = AST::IfStatement.new(
          if_stmt.condition,
          AST::BlockStatement.new([] of AST::Stmt, if_stmt.location),
          AST::BlockStatement.new(value, if_stmt.location),
          if_stmt.location
        )
        grouped_stmt[key] << reconstructed_if
      end
    end

    execute(stmt.body)

    # Remove menu from the stack
    @menu_stack.shift
  end

  def visit_if_stmt(stmt : AST::IfStatement)
    @if_stmts << [stmt] # Push new statement onto the stack

    execute(stmt.then_branch)
    if !stmt.else_branch.nil?
      execute(stmt.else_branch.as(AST::Stmt))
    end
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
  end

  def visit_goto_expr(expr : AST::Goto) : Nil
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

  def visit_end_stmt(stmt : AST::EndStatement)
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

  def visit_interpolation_expr(str : AST::InterpolatedString)
  end

  # Group list of statements account to statement type
  private def group_statements(block : AST::BlockStatement) : TransformedAST::GroupedStatements
    # Group the menu definition by statement types
    grouped : TransformedAST::GroupedStatements = TransformedAST.new_group

    block.statements.each do |stmt|
      case stmt
      when AST::DisplayStatement
        grouped[:display] << stmt
      when AST::OptionStatement
        grouped[:option] << stmt
      when AST::InputStatement
        grouped[:input] << stmt
      when AST::GotoStatement
        grouped[:goto] << stmt
      when AST::ActionStatement
        grouped[:action] << stmt
        execute(stmt)
        # when ForEachStatement
        #   grouped_stmt["for_each"] << stmt
        # when EndStatement
        #   grouped_stmt["end"] << stmt
      when AST::MenuStatement
        # TODO: think about how to handle nested menu code generation
        # TODO: menu name nested to be tracked as well
        visit_menu_stmt(stmt)
      when AST::IfStatement
        grouped[:if] << stmt
      when AST::EndStatement
        grouped[:end] << stmt
      else
        grouped[:other] << stmt
      end
    end

    grouped
  end

  private def execute(stmt : AST::Stmt)
    stmt.accept(self)
  end
end
