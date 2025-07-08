require "./ast.cr"
require "./environment.cr"

# todo: create a map/enum/const for ananse typescript types
class CodeGenerator < AST::Visitor(Object)
  property environment : Environment = Environment.new
  property menus_environment : MenuEnvironment = MenuEnvironment.new

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

  def visit_option_expr(expr : AST::Option) : String
    # TODO: generate code
    code = String.build do |s|
      # TODO: check token type, if number/string, add to label
      s << "{" << "choice: #{expr.target.value},"
      s << "display: #{expr.label.value},"
      s << "next_menu: [GOTO]"
      s << "}"
    end
    return code.to_s
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

  def visit_menu_stmt(stmt : AST::MenuStatement) : String
    @menus_environment.define(stmt.name.value, true)

    code = String.build do |s|
      s << "\n\nMenuRouter.menu('#{stmt.name.value}')"
      s << execute(stmt.body)
      # s << ";"
    end

    return code.to_s
  end

  def visit_block_stmt(block : AST::BlockStatement) : String
    code = String.build do |s|
      block.statements.each do |stmt|
        s << execute(stmt)
      end
    end

    return code.to_s
  end

  # Generates corresponding Menu.message function
  def visit_display_stmt(stmt : AST::DisplayStatement) : String
    value : ExpressionType = evaluate(stmt.expression)
    code = String.build do |s|
      s << ".message(async(req, res)  => {\n"
      s << "return " << value << ";"
      s << "\n})"
    end
    return code.to_s
  end

  # Generates corresponding Menu.input function
  def visit_input_stmt(stmt : AST::InputStatement) : String
    # TODO: store the variable definitions, along with their types somewhere to type generation
    name = stmt.variable.value
    @environment.define(name, "true")

    code = String.build do |s|
      s << ".input(async (req, res) => {\n"
      s << "await req.session.set(\"#{name}\", "
      s << "req.input!" << "\");"
      s << "\n})"
    end
    return code.to_s
  end

  def visit_option_stmt(stmt : AST::OptionStatement)
    group : Array(AST::Option) = stmt.group

    # name = stmt.variable.value
    # @environment.define(name, "true")

    code = String.build do |s|
      s << ".actions(["
      group.each do |opt|
        s << evaluate(opt)
      end
      s << "])"
    end

    return code.to_s
  end

  def visit_goto_stmt(stmt : AST::GotoStatement) : String
    name = stmt.menu.value
    # TODO: check if menu is already defined
    @menus_environment.define(name, false)

    return ".next(\"#{name}\")"
  end

  # TODO: remove this
  # FIXME: rename to log?
  def visit_print_stmt(stmt : AST::Print) : String
    value : ExpressionType = evaluate(stmt.expression)
    return "console.log(#{value});"
  end

  # TODO: remove this
  def visit_variable_stmt(stmt : AST::VariableStmt)
    # value : String = ""
    # if !stmt.initializer.nil?
    #   value = evaluate(stmt.initializer.as(AST::Expr))
    # end

    @environment.define(stmt.name.value, "false")
    return "const #{stmt.name.value} = value;"
  end

  def visit_variable_stmt(stmt : AST::VariableStatement) : String
    name = evaluate(stmt.name)
    # @environment.define(stmt.name, false)
    # TODO: relook at this
    return "#TODO: to be implemented"
  end

  def execute(stmt : AST::Stmt) : String
    stmt.accept(self)
  end
end
