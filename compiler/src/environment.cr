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
