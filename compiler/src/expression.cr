require "./token.cr"

module Expression
  # Visitor interface
  abstract  class Visitor(R)
    # abstract def visit_assign_expr(expr : Assign) : R
    abstract def visit_binary_expr(expr : Binary) forall R
    # abstract def visit_call_expr(expr : Call) : R
    # abstract def visit_get_expr(expr : Get) : R
    # abstract def visit_grouping_expr(expr : Grouping) : R
    # abstract def visit_literal_expr(expr : Literal) : R
    # abstract def visit_logical_expr(expr : Logical) : R
    # abstract def visit_set_expr(expr : Set) : R
    # abstract def visit_super_expr(expr : Super) : R
    # abstract def visit_this_expr(expr : This) : R
    # abstract def visit_unary_expr(expr : Unary) : R
    # abstract def visit_variable_expr(expr : Variable) : R
  end

  # Base class for all expressions
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
end
