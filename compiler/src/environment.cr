require "./error.cr"

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

  # Adds a menu name to the env
  # Value is `True`, if the a definition exists for the menu
  def define(name : String, value : Bool)
    @names[name] = value
  end

  def get(name : Token) : Bool
    if @names.has_key?(name.value)
      return @names[name.value]
    end

    raise RuntimeErr.new("Undefined menu '#{name.value}'", name)
  end
end
