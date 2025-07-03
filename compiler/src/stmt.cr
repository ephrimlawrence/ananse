require "./token.cr"
require "./expression.cr"

module Statement
  # Visitor interface
  abstract class Visitor(R)
    abstract def visit_print_stmt(stmt : Print) forall R
    #     R visitBlockStmt(Block stmt);
    # R visitClassStmt(Class stmt);
    abstract def visit_expression_stmt(stmt : ExpressionStmt) forall R
    # R visitFunctionStmt(Function stmt);
    # R visitIfStmt(If stmt);
    # R visitPrintStmt(Print stmt);
    # R visitReturnStmt(Return stmt);
    # R visitVarStmt(Var stmt);
    # R visitWhileStmt(While stmt);
  end

  # Base class for all expressions
  abstract class Stmt
    abstract def accept(visitor : Visitor(R)) forall R
  end

  class ExpressionStmt < Stmt
    property expression : Expression::Expr

    def initialize(@expression)
    end

    def accept(visitor : Visitor(R)) forall R
      visitor.visit_expression_stmt(self)
    end
  end

  class Print < Stmt
    property expression : Expression::Expr

    def initialize(@expression)
    end

    def accept(visitor : Visitor(R)) forall R
      visitor.visit_print_stmt(self)
    end
  end
end
