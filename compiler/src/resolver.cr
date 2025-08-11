require "./token.cr"
require "./ast.cr"

class SymbolTable
  # Maps the full canonical name to the menu's AST node
  getter menu_map : Hash(String, AST::MenuStatement) = {} of String => AST::MenuStatement

  def initialize
    # @menu_map = Hash(String, AST::MenuStatement).new
  end

  # Recursively walks the menu tree to build the table
  def populate_menu_table(statements : Array(AST::Stmt))
    statements.each do |stmt|
      if stmt.is_a?(AST::MenuStatement)
        add_menu_and_children(stmt, "")
      end
    end
  end

  private def add_menu_and_children(menu : AST::MenuStatement, parent_name : String)
    # Construct the full, unique name for this menu
    canonical_name : String = parent_name.empty? ? menu.name.value : "#{parent_name}.#{menu.name.value}"

    # Add it to the symbol table
    @menu_map[canonical_name] = menu

    # Recurse for all child menus
    menu.body.statements.each do |stmt|
      if stmt.is_a?(AST::MenuStatement)
        add_menu_and_children(stmt, canonical_name)
      end
    end
  end
end

class NameResolver
  @symbol_table : SymbolTable

  def initialize(@symbol_table : SymbolTable)
  end

  def resolve_program(program : Program)
    program.definitions.each do |menu|
      resolve_statements(menu.statements)
    end
  end

  private def resolve_statements(statements : Array(Statement))
    statements.each do |stmt|
      if stmt.is_a?(GotoStatement)
        # Look up the target name from the statement's target_name string
        target_menu = @symbol_table.lookup(stmt.target_name)

        if target_menu
          # Success: Replace the string with a direct reference to the AST node
          stmt.target_menu = target_menu
        else
          # Failure: Emit a compiler error because the menu doesn't exist
          raise "Error: Undefined menu '#{stmt.target_name}'"
        end
      end
      # Recursively resolve statements within nested structures like if/else or for-each
      if stmt.has_nested_statements
        resolve_statements(stmt.nested_statements)
      end
    end
  end
end
