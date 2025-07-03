require "./expression.cr"

class CodeGenerator < Expression::Visitor(Object)
  alias ExpressionType = String | Int32 | Float64 | Bool | Expression::Expr | Nil

  def generate(expression : Expression::Expr)
    begin
      value = evaluate(expression)
      puts value
      # System.out.println(stringify(value));
    rescue error
      puts error
      # raise CompilerError.error(expression.type, error.message)
    end
  end

  def visit_literal_expr(expr : Expression::Literal) : String? | Int32? | Float64? | Bool?
    expr.value
  end

  def visit_grouping_expr(expr : Expression::Grouping) : ExpressionType
    evaluate(expr.expression)
  end

  def visit_unary_expr(expr : Expression::Unary) : String?
    right : ExpressionType = evaluate(expr.right)

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

  def visit_binary_expr(expr : Expression::Binary) : String?
    left : ExpressionType = evaluate(expr.left)
    right : ExpressionType = evaluate(expr.right)

    case expr.operator.type
    when TokenType::MINUS
      return "#{left} - #{right}"
    when TokenType::PLUS
      if left.is_a?(Float) && right.is_a?(Float)
        return "#{left} + #{right}"
      end

      if left.is_a?(String) && right.is_a?(String)
        return "#{left} #{right}"
      end
    when TokenType::SLASH
      return "#{left} / #{right}"
    when TokenType::STAR
      return "#{left} * #{right}"
    end

    # // Unreachable.
    return nil
  end

  private def is_truthy?(object : ExpressionType) : Bool
    if object == "null"
      return false
    end

    if object.is_a?(Bool)
      return object.as(Bool)
    end

    return true
  end

  private def evaluate(expr : Expression::Expr) : ExpressionType
    expr.accept(self)
  end
end
