require "./expression.cr"
require "./stmt.cr"

class CodeGenerator < Statement::Visitor(Nil)
  alias ExpressionType = String | Int32 | Float64 | Bool | Expression::Expr | Nil

  def generate(statements : Array(Statement::Stmt))
    begin
      # stmt_instance = StatementGenerator.new

      statements.each do |statement|
        execute(statement)
      end
    rescue error
      puts error
    end
  end

  # class ExpressionGenerator < Expression::Visitor(Object)
  # def generate(expression : Expression::Expr)
  #   begin
  #     value = evaluate(expression)
  #     puts value
  #     # System.out.println(stringify(value));
  #   rescue error
  #     puts error
  #     # raise CompilerError.error(expression.type, error.message)
  #   end
  # end

  def visit_literal_expr(expr : Expression::Literal) : String
    value = expr.value
    case value
    when String
      "\"#{value}\""
    when Nil
      "null"
    else
      value.to_s
    end
  end

  def visit_grouping_expr(expr : Expression::Grouping) : ExpressionType
    "(#{evaluate(expr.expression)})"
  end

  def visit_unary_expr(expr : Expression::Unary) : String?
    right : ExpressionType = evaluate(expr.right)
    op : String = expr.operator.value

    "#{op}#{right}"
    # case (expr.operator.type)
    # when TokenType::BANG
    #   return "!#{is_truthy?(right)}"
    # when TokenType::MINUS
    #   # return -(double)right;
    #   return "-#{right}"
    # end

    # # Unreachable.
    # return nil
  end

  def visit_binary_expr(expr : Expression::Binary) : String?
    left : ExpressionType = evaluate(expr.left)
    right : ExpressionType = evaluate(expr.right)
    op : String = expr.operator.value

    "#{left} #{op} #{right}"
  end

  # private def is_truthy?(object : ExpressionType) : Bool
  #   if object == "null"
  #     return false
  #   end

  #   if object.is_a?(Bool)
  #     return object.as(Bool)
  #   end

  #   return true
  # end

  private def evaluate(expr : Expression::Expr) : ExpressionType
    expr.accept(self)
  end

  # end

  # class StatementGenerator < Statement::Visitor(Nil)
  def visit_expression_stmt(stmt : Statement::Expression) : Nil
    evaluate(stmt.expression)
    return nil
  end

  def visit_print_stmt(stmt : Statement::Print) : Nil
    value : ExpressionType = evaluate(stmt.expression)
    puts "console.log(#{value})"
    return nil
  end

  def execute(stmt : Statement::Stmt) : String
    stmt.accept(self)
  end

  # private def evaluate(expr : Expression::Expr) : ExpressionType
  #   expr.accept(self)
  # end
  # end
end

# class CodeGenerator < Statement::Visitor(Nil)
#   extend ExpressionCodeGenerator
# end
