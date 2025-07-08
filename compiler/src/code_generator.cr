require "./ast.cr"
require "./environment.cr"

class CodeGenerator < AST::Visitor(Object)
  property environment : Environment = Environment.new

  alias ExpressionType = String | Int32 | Float64 | Bool | AST::Expr | Nil

  def generate(statements : Array(AST::Stmt)) : String?
    begin
      # stmt_instance = StatementGenerator.new
      typescript = String.build do |s|
        statements.each do |statement|
          s << execute(statement) << "\n"
        end
      end

      puts typescript
      return typescript.to_s
    rescue error
      puts error
    end
  end

  def visit_literal_expr(expr : AST::Literal) : String
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

  def visit_grouping_expr(expr : AST::Grouping) : ExpressionType
    "(#{evaluate(expr.expression)})"
  end

  def visit_unary_expr(expr : AST::Unary) : String?
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

  def visit_binary_expr(expr : AST::Binary) : String?
    left : ExpressionType = evaluate(expr.left)
    right : ExpressionType = evaluate(expr.right)
    op : String = expr.operator.value

    "#{left} #{op} #{right}"
  end

  def visit_variable_expr(expr : AST::Variable) : Object
    return @environment.get(expr.name)
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

  private def evaluate(expr : AST::Expr) : ExpressionType
    expr.accept(self)
  end

  # end

  # class StatementGenerator < AST::Visitor(Nil)
  def visit_expression_stmt(stmt : AST::ExpressionStmt) : String
    evaluate(stmt.expression)
  end

  def visit_print_stmt(stmt : AST::Print) : String
    value : ExpressionType = evaluate(stmt.expression)
    return "console.log(#{value});"
  end

  def visit_variable_stmt(stmt : AST::VariableStmt)
    value : String = ""
    if !stmt.initializer.nil?
      value = evaluate(stmt.initializer.as(AST::Expr))
    end

    @environment.define(stmt.name.value, value)
    return "const #{stmt.name.value} = value;"
  end

  def execute(stmt : AST::Stmt) : String
    stmt.accept(self)
  end
end
