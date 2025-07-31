require "./error.cr"
require "./token.cr"

class Environment
  property values : Hash(String, String) = {} of String => String

  def define(name : String, value : String)
    @values[name] = value
  end

  def get(name : Token) : String
    if @values.has_key?(name.value)
      return @values[name.value]
    end

    raise CompilerError.new("Undefined variable '#{name.value}'", name)
  end
end

class MenuEnvironment
  property menu_references : Hash(String, Tuple(Bool, Token)) = {} of String => Tuple(Bool, Token)
  property children : Hash(String, MenuEnvironment) = {} of String => MenuEnvironment
  property menu : Token? = nil
  property parent : MenuEnvironment? = nil

  def initialize(@menu = nil, @parent = nil)
  end

  def submenu : MenuEnvironment
    sub = MenuEnvironment.new(self)
    @children << sub
    sub
  end

  # Adds a menu name to the env
  # Value is `True`, if the a definition exists for the menu
  def define(menu : Token)
    name : String = menu.value

    if @children.has_key?(name)
      raise CompilerError.new("Duplicate menu definitions! Menu '#{name}' is already defined on #{@children[name].menu.as(Token).location.to_s}", menu)
    end

    sub = MenuEnvironment.new(menu, self)
    @children[name] = sub
    resolve(name)

    return sub
  end

  def referenced(ref : Token) : Bool
    name : String = ref.value

    if @menu_references.has_key?(name)
      if @menu_references[name][0]
        return true
      end

      @menu_references[name] = {!resolve(name).nil?, @menu_references[name][1]}
      return @menu_references[name][0]
      #  ? true : resolve(name)
    end

    @menu_references[name] = {!resolve_nested_call(name).nil?, ref}
    return @menu_references[name][0]
  end

  # def get(name : Token) : Tuple(Bool, Token)
  #   return @names.has_key?(name.value)
  # end

  # Walks the menu tree, and indicates menus that are defined and used
  def resolve_nested_call(name : String) : MenuEnvironment?
    parts : Array(String) = name.split('.')
    result : MenuEnvironment? = resolve(parts.shift)

    # Handle nested menu calls eg. parent.child.child.grandchild
    # Start from the parent (first array item), to the last child (last array item)
    while parts.size > 0
      if result.nil?
        break
      end
      result = result.resolve(parts.shift)
    end

    return result
  end

  def gather_errors(previous_errors : Array(String) = [] of String) : Array(String)
    @menu_references.each do |name, (is_defined, token)|
      if !is_defined
        # Perform final resolution
        is_defined = !resolve_nested_call(token.value).nil?
      end

      if !is_defined
        ref : String = name.split(".").join(" > ")
        previous_errors << CompilerError.report(
          location: token.location,
          where: " at '#{token.value}'",
          message: "Reference to '#{ref}' menu but it is not defined"
        )
      end
    end

    @children.each do |name, env|
      previous_errors = env.gather_errors(previous_errors)
    end

    return previous_errors
  end

  def resolve(name : String) : MenuEnvironment?
    if @children.has_key?(name)
      if @menu_references.has_key?(name)
        @menu_references[name] = {true, @menu_references[name][1]}
      end

      return @children[name]
    end

    if @parent.nil?
      # We are at the root node, stop
      return nil
    end

    return @parent.as(MenuEnvironment).resolve(name)
  end
end
