require "./ast.cr"

class AstPrinter < Expression::Visitor(String)
  def print(expr : Expression::Expr?) : String?
    if expr.nil?
      return
    end

    expr.accept(self)
  end

  def visit_binary_expr(expr : Expression::Binary) : String
    parenthesize(expr.operator.value,
      expr.left, expr.right)
  end

  def visit_grouping_expr(expr : Expression::Grouping) : String
    parenthesize("group", expr.expression)
  end

  def visit_literal_expr(expr : Expression::Literal) : String
    if expr.value.nil?
      return "null"
    end

    expr.value.to_s
  end

  def visit_unary_expr(expr : Expression::Unary) : String
    parenthesize(expr.operator.value, expr.right)
  end

  private def parenthesize(name : String, *exprs : Expression::Expr) : String
    buffer = String.build do |s|
      s << "(" << name

      exprs.each do |value|
        s << " " << value.accept(self)
      end

      s << ")"
    end

    buffer.to_s
  end
end
