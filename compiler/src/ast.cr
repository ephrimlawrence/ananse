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
    abstract def visit_grouping_expr(expr : Grouping) : R
    abstract def visit_literal_expr(expr : Literal) : R
    # abstract def visit_logical_expr(expr : Logical) : R
    # abstract def visit_set_expr(expr : Set) : R
    # abstract def visit_super_expr(expr : Super) : R
    # abstract def visit_this_expr(expr : This) : R
    abstract def visit_unary_expr(expr : Unary) : R
    abstract def visit_variable_expr(expr : Variable) : R
    abstract def visit_option_expr(expr : Option) : R
    abstract def visit_action_expr(expr : Action) : R

    #
    # Statement visitors
    #
    abstract def visit_print_stmt(stmt : Print) forall R
    #     R visitBlockStmt(Block stmt);
    # R visitClassStmt(Class stmt);
    abstract def visit_expression_stmt(stmt : ExpressionStmt) forall R
    abstract def visit_variable_stmt(stmt : VariableStatement) forall R
    abstract def visit_display_stmt(stmt : DisplayStatement) forall R
    abstract def visit_input_stmt(stmt : InputStatement) forall R
    abstract def visit_goto_stmt(stmt : GotoStatement) forall R
    abstract def visit_block_stmt(block : BlockStatement) forall R
    abstract def visit_menu_stmt(stmt : MenuStatement) forall R
    abstract def visit_option_stmt(stmt : OptionStatement) forall R
    abstract def visit_action_stmt(stmt : ActionStatement) forall R

    # TODO: remove this
    abstract def visit_variable_stmt(stmt : VariableStmt) forall R
    # R visitFunctionStmt(Function stmt);
    # R visitIfStmt(If stmt);
    # R visitPrintStmt(Print stmt);
    # R visitReturnStmt(Return stmt);
    # R visitVarStmt(Var stmt);
    # R visitWhileStmt(While stmt);
  end

  # Statement AST #
  abstract class Stmt
    abstract def accept(visitor : Visitor(R)) forall R
  end

  class ExpressionStmt < Stmt
    property expression : Expr

    def initialize(@expression)
    end

    def accept(visitor : Visitor(R)) forall R
      visitor.visit_expression_stmt(self)
    end
  end

  # @deprecated
  # TODO: remove this
  class VariableStmt < Stmt
    property name : Token
    property initializer : Expr?

    def initialize(@name, @initializer)
    end

    def accept(visitor : Visitor(R)) forall R
      visitor.visit_variable_stmt(self)
    end
  end

  # @deprecated
  # TODO: remove this
  class Print < Stmt
    property expression : Expr

    def initialize(@expression)
    end

    def accept(visitor : Visitor(R)) forall R
      visitor.visit_print_stmt(self)
    end
  end

  class MenuStatement < Stmt
    property name : Token
    property body : BlockStatement

    def initialize(@name, @body)
    end

    def accept(visitor : Visitor(R)) forall R
      visitor.visit_menu_stmt(self)
    end
  end

  class BlockStatement < Stmt
    property statements : Array(Stmt)

    def initialize(@statements)
    end

    def accept(visitor : Visitor(R)) forall R
      visitor.visit_block_stmt(self)
    end
  end

  class OptionStatement < Stmt
    property group : Array(Option)

    def initialize(@group)
    end

    def accept(visitor : Visitor(R)) forall R
      visitor.visit_option_stmt(self)
    end
  end

  class DisplayStatement < Stmt
    property expression : Expr

    def initialize(@expression)
    end

    def accept(visitor : Visitor(R)) forall R
      visitor.visit_display_stmt(self)
    end
  end

  class InputStatement < Stmt
    property variable : Token

    def initialize(@variable)
    end

    def accept(visitor : Visitor(R)) forall R
      visitor.visit_input_stmt(self)
    end
  end

  class GotoStatement < Stmt
    property menu : Token

    def initialize(@menu)
    end

    def accept(visitor : Visitor(R)) forall R
      visitor.visit_goto_stmt(self)
    end
  end

  class VariableStatement < Stmt
    property name : Expr

    def initialize(@name)
    end

    def accept(visitor : Visitor(R)) forall R
      visitor.visit_variable_stmt(self)
    end
  end

  class ActionStatement < Stmt
    property expression : Action

    def initialize(@expression)
    end

    def accept(visitor : Visitor(R)) forall R
      visitor.visit_action_stmt(self)
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
  end

  class Unary < Expr
    property operator : Token
    property right : Expr

    def initialize(@operator, @right)
    end

    def accept(visitor : Visitor(R)) forall R
      visitor.visit_unary_expr(self)
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
  end

  class Grouping < Expr
    property expression : Expr

    def initialize(@expression)
    end

    def accept(visitor : Visitor(R)) forall R
      visitor.visit_grouping_expr(self)
    end
  end

  class Variable < Expr
    property name : Token

    def initialize(@name)
    end

    def accept(visitor : Visitor(R)) forall R
      visitor.visit_variable_expr(self)
    end
  end

  class Option < Expr
    property target : Token
    property label : Token
    property next_menu : Token?
    property action : Action?

    def initialize(@target, @label, @next_menu, @action)
    end

    def accept(visitor : Visitor(R)) forall R
      visitor.visit_option_expr(self)
    end
  end

  class Action < Expr
    property func_name : Token
    property params : Hash(Token, Token) = {} of Token => Token
    property name : Token?

    def initialize(@func_name, @params, @name)
    end

    def accept(visitor : Visitor(R)) forall R
      visitor.visit_action_expr(self)
    end
  end
end
