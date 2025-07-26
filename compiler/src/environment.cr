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

    raise RuntimeErr.new("Undefined variable '#{name.value}'", name)
  end
end

class MenuEnvironment
  property names : Hash(String, Bool) = {} of String => Bool

  # Tracks calls to menu definitions
  # {menu_name: (number_of_calls, token)}
  property references : Hash(String, Tuple(Int32, Token)) = {} of String => Tuple(Int32, Token)

  # TODO: track menu calls (name, [tokens]) for verification

  # Adds a menu name to the env
  # Value is `True`, if the a definition exists for the menu
  def add(menu : Token)
    name : String = menu.value

    if @names.has_key?(name)
      raise RuntimeErr.new("Duplicate menu definitions! Menu '#{name}' is already defined", menu)
    end

    @names[name] = true
    @references[name] = {0, menu}
  end

  def referenced(menu : Token) : Void
    name : String = menu.value

    if @references.has_key?(name)
      @references[name] = {@references[name][0] + 1, menu}
    else
      @references[name] = {1, menu}
    end
  end

  def get(name : Token) : Bool
    if @names.has_key?(name.value)
      return @names[name.value]
    end

    return false
  end
end
