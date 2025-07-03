require "./expression.cr"

class AstPrinter < Expression::Visitor(String)
  def print(expr : Expression::Expr) : String
    return expr.accept(self)
  end

  def visit_binary_expr(expr : Expression::Binary) : String
    return parenthesize(expr.operator.value,
      expr.left, expr.right)
  end

  #  @Override
  # public String visitBinaryExpr(Expr.Binary expr) {
  #   return parenthesize(expr.operator.lexeme,
  #                       expr.left, expr.right);
  # }

  # @Override
  # public String visitGroupingExpr(Expr.Grouping expr) {
  #   return parenthesize("group", expr.expression);
  # }

  # @Override
  # public String visitLiteralExpr(Expr.Literal expr) {
  #   if (expr.value == null) return "nil";
  #   return expr.value.toString();
  # }

  # @Override
  # public String visitUnaryExpr(Expr.Unary expr) {
  #   return parenthesize(expr.operator.lexeme, expr.right);
  # }

  private def parenthesize(name : String, *exprs : Expression::Exr) : String
    buffer = String.build do |s|
      s << "(" << name

      exprs.each do |value|
        s << " " << expr.accept(self)
      end

      s << ")"
    end

    buffer.to_s
  end
end
