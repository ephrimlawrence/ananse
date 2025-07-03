require "./expression.cr"

class CodeGenerator < Expression::Visitor(Object)
  def visit_literal_expr(expr : Expression::Literal) : Object
    expr.value
  end

  def visit_grouping_expr(expr : Expression::Grouping) : Object
    evaluate(expr.expression)
  end

  def visit_unary_expr(expr : Expression::Unary) : Object
    right : Object = evaluate(expr.right)

    case (expr.operator.type)
    when TokenType::BANG
      return "!#{is_truthy?(right)}"
    when TokenType::MINUS
      # return -(double)right;
      return "-#{right}"
    end

    # Unreachable.
    return nil
  end

  def visit_binary_expr(expr : Expression::Binary) : Object
    left : Object = evaluate(expr.left)
    right : Object = evaluate(expr.right)

    case expr.operator.type
    when TokenType::MINUS
      return "#{left} - #{right}"
    when TokenType::SLASH
      return "#{left} / #{right}"
    when TokenType::STAR
      return "#{left} * #{right}"
    end

    # // Unreachable.
    return nil
  end

  private def is_truthy?(object : Object) : Bool
    if object == "null"
      return false
    end

    if object.is_a?(Bool)
      return object.as(Bool)
    end

    return true
  end

  private def evaluate(expr : Expression::Expr) : Object
    expr.accept(self)
  end
end
