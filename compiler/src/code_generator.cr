require "./ast.cr"
require "./environment.cr"
require "./utils.cr"

# todo: create a map/enum/const for ananse typescript types
class CodeGenerator < AST::Visitor(Object)
  property environment : Environment = Environment.new
  # property menus_environment : MenuEnvironment = MenuEnvironment.new

  alias ExpressionType = String | Int32 | Float64 | Bool | AST::Expr | Nil

  def generate(ast : TransformedAST) : String?
    typescript = String.build do |s|
      ast.menu_definitions.each do |definition|
        menu : AST::MenuStatement = definition["menu"].first.as(AST::MenuStatement)
        stmts : Hash(String, Array(AST::Stmt)) = definition
        s << execute(menu)
        s << generate_input_function(menu.name.value, definition["input"])
        s << generate_display_function(menu.name.value, definition["display"])
        s << generate_options_code(definition["option"])
        s << generate_action_function(definition["action"])
        s << generate_goto_function(menu.name.value, definition["goto"])
        # message() code generation
        s << "}\n"
      end
    end

    return typescript.to_s
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
      if !expr.next_menu.nil?
        s << "next_menu: '#{expr.next_menu.as(Token).literal}',"
      end
      if !expr.action.nil?
        s << "next_menu: async(req, res) => {"
        s << evaluate(expr.action.as(AST::Action))
        s << "},"
      end
      s << "}"
    end
    return code.to_s
  end

  def visit_action_expr(expr : AST::Action) : String
    code = String.build do |s|
      var_name = Util.generate_identifier_name

      s << "const #{var_name} = " << "await " << expr.func_name.value << "({"
      expr.params.each_key do |key|
        s << key.value << ":"
        s << "await req.session.get('" << expr.params[key].value << "')"
      end
      s << "});"

      s << "await req.session.set('#{var_name}', #{var_name});"
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

  def visit_if_stmt(stmt : AST::IfStatement) : String
    code = String.build do |s|
      s << "if (" << evaluate(stmt.condition) << "){"
      s << execute(stmt.then_branch) << "}"
      if !stmt.else_branch.nil?
        s << "else {" << execute(stmt.else_branch.as(AST::Stmt)) << "}"
      end
    end

    return code.to_s
  end

  # Generates menu class definition code stub
  def visit_menu_stmt(stmt : AST::MenuStatement) : String
    class_name = "Menu_#{Util.generate_identifier_name(stmt.name.value)}".camelcase
    code = "export class #{class_name} extends BaseMenu #{opening_brace}"
    if !stmt.start.nil?
      code = <<-JS
        #{code}
        isStart(): Promise<boolean> | boolean {
          return true;
        }
      JS
    end
    return code
  end

  def visit_block_stmt(block : AST::BlockStatement) : String
    code = String.build do |s|
      block.statements.each do |stmt|
        s << execute(stmt)
      end
    end

    return code.to_s
  end

  # Generates corresponding `action` function
  def generate_action_function(stmts : Array(AST::Stmt))
    code = String.build do |s|
      s << "async action() #{opening_brace}"

      if stmts.empty?
        s << "return undefined; #{closing_brace}"
        return s.to_s
      end

      variable_name = "actions_list" # variable name for options
      s << "const #{variable_name}: MenuAction[] = [];\n"
      stmts.each do |stmt|
        value = execute(stmt)
        s << value.gsub(/\sreq\./, " this.request") # replace "req" which is for option closure with "this.request", class variable
      end

      s << closing_brace
    end

    return code.to_s
  end

  def generate_options_code(stmts : Array(AST::Stmt))
    code = String.build do |s|
      s << "async actions() #{opening_brace}"

      if stmts.empty?
        s << "return []; #{closing_brace}"
        return s.to_s
      end

      variable_name = "actions_list" # variable name for options
      s << "const #{variable_name}: MenuAction[] = [];\n"
      stmts.each do |stmt|
        s << execute(stmt)
      end

      s << "return " << variable_name << ";"
      s << closing_brace
    end

    return code.to_s
  end

  # Generates corresponding `nextMenu` function
  def generate_goto_function(menu : String, stmts : Array(AST::Stmt))
    code = String.build do |s|
      # TODO: implement 'input()' api for BaseMenu in the runtime
      s << "async nextMenu() #{opening_brace}"

      if stmts.empty?
        s << "return undefined; #{closing_brace}"
        return s.to_s
      end

      item = stmts.find { |s| s.is_a?(AST::GotoStatement) }
      if item.nil?
        raise Exception.new("No goto statement found in '#{menu}' menu")
      end
      item = item.as(AST::GotoStatement)

      variable_name = Util.generate_identifier_name
      s << "let #{variable_name} = #{execute(item)};\n"
      stmts.each do |stmt|
        if stmt.is_a?(AST::GotoStatement)
          s << "#{variable_name} = #{execute(item)};\n"
        else
          s << execute(stmt)
        end
      end

      s << "return " << variable_name << ";"
      s << closing_brace
    end

    return code.to_s
  end

  # Generates corresponding `message` function
  def generate_display_function(menu : String, stmts : Array(AST::Stmt))
    code = String.build do |s|
      # TODO: implement 'input()' api for BaseMenu in the runtime
      s << "async message() #{opening_brace}"

      if stmts.empty?
        s << "return undefined; #{closing_brace}"
        return s.to_s
      end

      first_input = stmts.find { |s| s.is_a?(AST::DisplayStatement) }
      if first_input.nil?
        raise Exception.new("No display statement found in '#{menu}' menu")
      end
      first_input = first_input.as(AST::DisplayStatement)

      variable_name = Util.generate_identifier_name
      s << "let #{variable_name} = #{evaluate(first_input.expression)};\n"
      stmts.each do |stmt|
        if stmt.is_a?(AST::DisplayStatement)
          s << "#{variable_name} = #{evaluate(first_input.expression)};\n"
        else
          s << execute(stmt)
        end
      end

      s << "return " << variable_name << ";"
      s << closing_brace
    end

    return code.to_s
  end

  # Generates corresponding input function
  def generate_input_function(menu : String, stmts : Array(AST::Stmt))
    code = String.build do |s|
      # TODO: implement 'input()' api for BaseMenu in the runtime
      s << "async input() #{opening_brace}"

      if stmts.empty?
        s << "return undefined; #{closing_brace}"
        return s.to_s
      end

      first_input = stmts.find { |s| s.is_a?(AST::InputStatement) }
      if first_input.nil?
        raise Exception.new("No input statement found in '#{menu}' menu")
      end

      stmts.each do |stmt|
        s << execute(stmt)
      end

      s << closing_brace
    end

    return code.to_s
  end

  def visit_input_stmt(stmt : AST::InputStatement) : String
    return "await this.request.session.set(\"#{stmt.variable.value}\", this.request.input!);"
  end

  def visit_option_stmt(stmt : AST::OptionStatement)
    group : Array(AST::Option) = stmt.group
    code = String.build do |s|
      s << "actions_list.push("
      group.each do |opt|
        s << evaluate(opt)
      end
      s << ");\n"
    end

    return code.to_s
  end

  def visit_action_stmt(stmt : AST::ActionStatement) : String
    # TODO: save js fun to environment
    # TODO: save action var name to environment

    expr : AST::Action = stmt.expression

    if !expr.name.nil?
      # Add action variable to environment
      @environment.define(expr.name.as(Token).value, "true")
    end

    return evaluate(expr)
  end

  def visit_goto_stmt(stmt : AST::GotoStatement) : String
    return "\"#{stmt.menu.value}\""
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

  def visit_display_stmt(stmt : AST::DisplayStatement) : String
    evaluate(stmt.expression)
  end

  # Returns a closing brace with a newline
  private def closing_brace : String
    "}\n"
  end

  private def opening_brace : String
    "{\n"
  end

  def execute(stmt : AST::Stmt) : String
    stmt.accept(self)
  end
end
