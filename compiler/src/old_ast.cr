require "./lexer.cr"

module AST
  # Base class for all AST nodes
  abstract class ASTNode
    property location : Scanner::Location

    def initialize(@location)
    end
  end

  # Represents a variable interpolation like {{my_var}}
  class VariableInterpolation < ASTNode
    property identifier : String

    def initialize(@identifier, location : Scanner::Location)
      super(location)
    end
  end

  # Represents a part of a string literal, either plain text or an interpolation
  abstract class StringPart < ASTNode
  end

  class TextStringPart < StringPart
    property value : String

    def initialize(@value, location : Scanner::Location)
      super(location)
    end
  end

  class InterpolatedStringPart < StringPart
    property interpolation : VariableInterpolation

    def initialize(@interpolation, location : Scanner::Location)
      super(location)
    end
  end

  # Represents a full string literal, supporting single/double quotes and interpolation
  class StringLiteral < ASTNode
    property parts : Array(AST::StringPart)

    def initialize(@parts, location : Scanner::Location)
      super(location)
    end
  end

  # Represents an identifier (variable name, menu name, etc.)
  class Identifier < ASTNode
    property name : String

    def initialize(@name, location : Scanner::Location)
      super(location)
    end
  end

  # Represents a literal value (number, boolean) - simplified for this example
  class Literal < ASTNode
    property value : String # Store as string for simplicity, convert later if needed

    def initialize(@value, location : Scanner::Location)
      super(location)
    end
  end

  abstract class Statement < ASTNode
  end

  class DisplayStatement < Statement
    property message : StringLiteral

    def initialize(@message, location : Scanner::Location)
      super(location)
    end
  end

  class OptionDestination < ASTNode
  end

  class GotoDestination < OptionDestination
    property menu_identifier : Identifier

    def initialize(@menu_identifier, location : Scanner::Location)
      super(location)
    end
  end

  class ActionParam < ASTNode
    property name : Identifier
    property value : Identifier # Simplified: assuming param values are always identifiers for now

    def initialize(@name, @value, location : Scanner::Location)
      super(location)
    end
  end

  class ActionCall < ASTNode
    property name : Identifier?             # For internal actions
    property external_path : StringLiteral? # For "file:func" style
    property external_js_call : Identifier? # For js.func style
    property params : Array(ActionParam)
    property return_variable : Identifier?

    def initialize(
      @name,
      @external_path,
      @external_js_call,
      @params,
      @return_variable,
      location : Scanner::Location,
    )
      super(location)
    end
  end

  class ActionDestination < OptionDestination
    property action_call : ActionCall

    def initialize(@action_call, location : Scanner::Location)
      super(location)
    end
  end

  class OptionStatement < Statement
    property label : StringLiteral?               # For fixed label options
    property regex_literal : StringLiteral?       # For regex options (simplified to StringLiteral for now)
    property regex_capture_variable : Identifier? # 'as' variable for regex options
    property destination : OptionDestination

    def initialize(
      @label,
      @regex_literal,
      @regex_capture_variable,
      @destination,
      location : Scanner::Location,
    )
      super(location)
    end
  end

  class InputStatement < Statement
    property variable_name : Identifier

    def initialize(@variable_name, location : Scanner::Location)
      super(location)
    end
  end

  class GotoStatement < Statement
    property menu_identifier : Identifier

    def initialize(@menu_identifier, location : Scanner::Location)
      super(location)
    end
  end

  class IfStatement < Statement
    property condition : Identifier # Simplified: just an identifier for now
    property then_branch : Array(Statement)
    property else_branch : Array(Statement)?

    def initialize(@condition, @then_branch, @else_branch, location : Scanner::Location)
      super(location)
    end
  end

  class ForEachStatement < Statement
    property item_variable : Identifier
    property index_variable : Identifier?
    property collection_variable : Identifier
    property body : Array(Statement)

    def initialize(
      @item_variable,
      @index_variable,
      @collection_variable,
      @body,
      location : Scanner::Location,
    )
      super(location)
    end
  end

  class EndStatement < Statement
    def initialize(location : Scanner::Location)
      super(location)
    end
  end

  # --- Top-level Definitions ---
  class MenuDefinition < ASTNode
    property identifier : Identifier
    property statements : Array(Statement)

    def initialize(@identifier, @statements, location : Scanner::Location)
      super(location)
    end
  end

  class Program < ASTNode
    property definitions : Array(ASTNode) # Can contain MenuDefinition or EndDefinition

    def initialize(@definitions, location : Scanner::Location)
      super(location)
    end
  end
end
