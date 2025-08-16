require "./token.cr"

module AST
  # Visitor interface
  abstract class Visitor(R)
    #
    # Expression visitors
    #
    abstract def visit_binary_expr(expr : Binary) forall R
    # abstract def visit_call_expr(expr : Call) : R
    # abstract def visit_get_expr(expr : Get) : R
    abstract def visit_grouping_expr(expr : Grouping) forall R
    abstract def visit_literal_expr(expr : Literal) forall R
    # abstract def visit_logical_expr(expr : Logical) : R
    # abstract def visit_set_expr(expr : Set) : R
    # abstract def visit_super_expr(expr : Super) : R
    # abstract def visit_this_expr(expr : This) : R
    abstract def visit_unary_expr(expr : Unary) forall R
    abstract def visit_variable_expr(expr : Variable) forall R
    abstract def visit_option_expr(expr : Option) forall R
    abstract def visit_action_expr(expr : Action) forall R
    abstract def visit_goto_expr(expr : Goto) forall R
    abstract def visit_interpolation_expr(str : InterpolatedString) forall R

    #
    # Statement visitors
    #
    abstract def visit_if_stmt(stmt : IfStatement) forall R
    abstract def visit_print_stmt(stmt : Print) forall R
    abstract def visit_expression_stmt(stmt : ExpressionStmt) forall R
    abstract def visit_variable_stmt(stmt : VariableStatement) forall R
    abstract def visit_display_stmt(stmt : DisplayStatement) forall R
    abstract def visit_input_stmt(stmt : InputStatement) forall R
    abstract def visit_goto_stmt(stmt : GotoStatement) forall R
    abstract def visit_block_stmt(block : BlockStatement) forall R
    abstract def visit_menu_stmt(stmt : MenuStatement) forall R
    abstract def visit_option_stmt(stmt : OptionStatement) forall R
    abstract def visit_action_stmt(stmt : ActionStatement) forall R
    abstract def visit_end_stmt(stmt : EndStatement) forall R

    # TODO: remove this
    abstract def visit_variable_stmt(stmt : VariableStmt) forall R
    # R visitFunctionStmt(Function stmt);
    # R visitPrintStmt(Print stmt);
    # R visitReturnStmt(Return stmt);
    # R visitVarStmt(Var stmt);
    # R visitWhileStmt(While stmt);
  end

  # Statement AST #
  abstract class Stmt
    property location : Location

    def initialize(@location)
    end

    abstract def accept(visitor : Visitor(R)) forall R
  end

  class ExpressionStmt < Stmt
    property expression : Expr

    def initialize(@expression, @location)
    end

    def accept(visitor : Visitor(R)) forall R
      visitor.visit_expression_stmt(self)
    end

    def clone
      ExpressionStmt.new(@expression, @location)
    end
  end

  # @deprecated
  # TODO: remove this
  class VariableStmt < Stmt
    property name : Token
    property initializer : Expr?

    def initialize(@name, @initializer)
      @location = name.location
    end

    def accept(visitor : Visitor(R)) forall R
      visitor.visit_variable_stmt(self)
    end

    def clone
      VariableStmt.new(@name, @initializer)
    end
  end

  # @deprecated
  # TODO: remove this
  class Print < Stmt
    property expression : Expr

    def initialize(@expression, @location)
    end

    def accept(visitor : Visitor(R)) forall R
      visitor.visit_print_stmt(self)
    end

    def clone
      Print.new(@expression, @location)
    end
  end

  class IfStatement < Stmt
    property condition : Expr
    property then_branch : BlockStatement
    property else_branch : BlockStatement?

    def initialize(@condition, @then_branch, @else_branch, @location)
    end

    def accept(visitor : Visitor(R)) forall R
      visitor.visit_if_stmt(self)
    end

    def clone
      IfStatement.new(@condition, @then_branch, @else_branch, @location)
    end
  end

  class MenuStatement < Stmt
    getter start : Token?
    getter name : Token
    getter body : BlockStatement

    # Parent menu, if this menu is nested in another menu.
    # NB: Value is filled in the AST transformation phase
    property parent : MenuStatement? = nil

    def initialize(@name, @body, @start, @parent = nil)
      @location = if @start.nil?
                    name.location
                  else
                    start.as(Token).location
                  end
    end

    def accept(visitor : Visitor(R)) forall R
      visitor.visit_menu_stmt(self)
    end

    def start?
      !@start.nil?
    end

    # Returns runtime name that is used for this menu in the generated TS code
    #
    # Runtime name is the concatenation of this menu's name and its parent(s) names
    def runtime_id : String
      if @parent.nil?
        return @name.value
      end

      return "#{@parent.as(MenuStatement).runtime_id}_#{@name.value}"
    end

    def clone
      MenuStatement.new(@name, @body, @start)
    end
  end

  class BlockStatement < Stmt
    property statements : Array(Stmt)

    def initialize(@statements, @location)
    end

    def accept(visitor : Visitor(R)) forall R
      visitor.visit_block_stmt(self)
    end

    def clone
      BlockStatement.new(@statements, @location)
    end
  end

  class OptionStatement < Stmt
    property group : Array(Option)

    def initialize(@group, @location)
    end

    def accept(visitor : Visitor(R)) forall R
      visitor.visit_option_stmt(self)
    end

    def clone
      OptionStatement.new(@group, @location)
    end
  end

  class DisplayStatement < Stmt
    property expression : Expr

    def initialize(@expression, @location)
    end

    def accept(visitor : Visitor(R)) forall R
      visitor.visit_display_stmt(self)
    end

    def clone
      DisplayStatement.new(@expression, @location)
    end
  end

  class InputStatement < Stmt
    property variable : Token

    def initialize(@variable)
      @location = @variable.location
    end

    def accept(visitor : Visitor(R)) forall R
      visitor.visit_input_stmt(self)
    end

    def clone
      InputStatement.new(@variable)
    end
  end

  class GotoStatement < Stmt
    property menu : Goto

    def initialize(@menu)
      @location = menu.name.location
    end

    def accept(visitor : Visitor(R)) forall R
      visitor.visit_goto_stmt(self)
    end

    def clone
      GotoStatement.new(@menu)
    end
  end

  class VariableStatement < Stmt
    property name : Expr

    def initialize(@name, @location)
    end

    def accept(visitor : Visitor(R)) forall R
      visitor.visit_variable_stmt(self)
    end

    def clone
      VariableStatement.new(@name, @location)
    end
  end

  class ActionStatement < Stmt
    property expression : Action

    def initialize(@expression)
      @location = @expression.func_name.location
    end

    def accept(visitor : Visitor(R)) forall R
      visitor.visit_action_stmt(self)
    end

    def clone
      ActionStatement.new(@expression)
    end
  end

  class EndStatement < Stmt
    property token : Token

    def initialize(@token)
      @location = @token.location
    end

    def accept(visitor : Visitor(R)) forall R
      visitor.visit_end_stmt(self)
    end

    def clone
      EndStatement.new(@token)
    end
  end

  # Expression AST #
  abstract class Expr
    abstract def accept(visitor : Visitor(R)) forall R
  end

  class Binary < Expr
    property left : Expr
    property operator : Token
    property right : Expr

    def initialize(@left, @operator, @right)
    end

    def accept(visitor : Visitor(R)) forall R
      visitor.visit_binary_expr(self)
    end

    def clone
      Binary.new(@left, @operator, @right)
    end
  end

  class Unary < Expr
    property operator : Token
    property right : Expr

    def initialize(@operator, @right)
    end

    def accept(visitor : Visitor(R)) forall R
      visitor.visit_unary_expr(self)
    end

    def clone
      Unary.new(@operator, @right)
    end
  end

  class Literal < Expr
    property token : Token
    property value : String? | Int32? | Float64? | Bool?

    def initialize(@token, @value)
    end

    def accept(visitor : Visitor(R)) forall R
      visitor.visit_literal_expr(self)
    end

    def clone
      Literal.new(@token, @value)
    end
  end

  class InterpolatedString < Expr
    property expressions : Array(Expr) = [] of Expr

    def initialize(@expressions)
    end

    def accept(visitor : Visitor(R)) forall R
      visitor.visit_interpolation_expr(self)
    end

    def clone
      InterpolatedString.new(@expressions)
    end
  end

  class Grouping < Expr
    property expression : Expr

    def initialize(@expression)
    end

    def accept(visitor : Visitor(R)) forall R
      visitor.visit_grouping_expr(self)
    end

    def clone
      Grouping.new(@expression)
    end
  end

  class Variable < Expr
    property name : Token

    def initialize(@name)
    end

    def accept(visitor : Visitor(R)) forall R
      visitor.visit_variable_expr(self)
    end

    def clone
      Variable.new(@name)
    end
  end

  class Goto < Expr
    property name : Token

    # Runtime id of the associated menu. Filled in at AST transformation phase
    #
    # property runtime_id : String? = nil

    def initialize(@name)
    end

    def accept(visitor : Visitor(R)) forall R
      visitor.visit_goto_expr(self)
    end

    def clone
      Goto.new(@name)
    end
  end

  class Option < Expr
    property target : Token
    property label : Token
    # should this be goto stmt?
    property next_menu : Goto?
    property action : Action?

    def initialize(@target, @label, @next_menu, @action)
    end

    def accept(visitor : Visitor(R)) forall R
      visitor.visit_option_expr(self)
    end

    def clone
      Option.new(@target, @label, @next_menu, @action)
    end
  end

  class Action < Expr
    property func_name : Token
    property params : Hash(Token, Token) = {} of Token => Token # Name: Value
    property name : Token?

    def initialize(@func_name, @params, @name)
    end

    def accept(visitor : Visitor(R)) forall R
      visitor.visit_action_expr(self)
    end

    def clone
      Action.new(@func_name, @params, @name)
    end
  end
end

class TransformedAST
  alias GroupedStatements = NamedTuple(
    display: Array(AST::Stmt),
    option: Array(AST::Stmt),
    input: Array(AST::Stmt),
    goto: Array(AST::Stmt),
    action: Array(AST::Stmt),
    end: Array(AST::Stmt),
    other: Array(AST::Stmt),
    if: Array(AST::Stmt),
    menu: Array(AST::Stmt) # only 1 item, the menu
)

  getter menus : Hash(Token, GroupedStatements) = {} of Token => GroupedStatements
  property symbol_table : SymbolTable = SymbolTable.new

  # List of action names (javascript functions)
  property actions : Array(String) = [] of String

  def add_menu(name : Token, values : GroupedStatements)
    @menus[name] = values
    return @menus[name]
  end

  def self.new_group : GroupedStatements
    return {
      display: [] of AST::Stmt,
      option:  [] of AST::Stmt,
      input:   [] of AST::Stmt,
      goto:    [] of AST::Stmt,
      action:  [] of AST::Stmt,
      end:     [] of AST::Stmt,
      other:   [] of AST::Stmt,
      if:      [] of AST::Stmt,
      menu:    [] of AST::Stmt, # only 1 item, the menu
    }
  end
end
