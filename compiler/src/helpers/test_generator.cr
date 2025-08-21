# TODO: add extensive comments {file naming pattern, code generation}

require "yaml"
# require "../spec_helper.cr"
require "../compiler"

class ProgramTestGenerator
  EXPECTED_DIR      = "spec/expected"
  PROGRAMS_DIR      = "spec/programs"
  PROGRAM_STUB_FILE = "spec/helpers/program_stub.txt"
  ACTIONS_JS        = "#{PROGRAMS_DIR}/actions.ts"

  # Track list of programs and test files.  {file_name: []}
  private property files : Hash(String, NamedTuple(program: String, test: String?)) = {} of String => NamedTuple(program: String, test: String?)

  # Scans spec/programs/ for test & program files
  def initialize
    data : Hash(String, Array(String)) = Dir.children(PROGRAMS_DIR).group_by { |f| File.basename(f, suffix: File.extname(f)) }

    data.each do |key, names|
      if key == "js" || key == "actions"
        # Skip js, action director/files
        next
      end

      program : String? = names.find { |n| File.extname(n) == ".ussd" }
      if program.nil?
        puts "Could not fine .ussd program file for '#{PROGRAMS_DIR}/#{key}', existing..."
        exit 1
      end

      @files[key] = {program: program, test: names.find { |n| /\.(yaml|yml)/.match(File.extname(n)) }}
    end
  end

  def run
    ts_server : String = File.read(PROGRAM_STUB_FILE)
    # TODO: generate code for gateway/session combinations
    ts_server = ts_server.gsub("__GATEWAY__", "'wigal'")
    ts_server = ts_server.gsub("__SESSION__", "'memory'")

    # Generate typescript file
    @files.each do |basename, value|
      new_server : String = ts_server

      js = compile(File.read("#{PROGRAMS_DIR}/#{value[:program]}"))
      new_server = new_server.gsub("__BUSINESS_LOGIN__", js)

      File.write("#{EXPECTED_DIR}/#{basename}.ts", new_server)
    end

    # Generate spec files
    spec = String.build do |s|
      s << %(require "./spec_helper" \n)
      s << "describe CodeGenerator do \n"

      @files.each do |_, value|
        if value[:test].nil?
          next
        end

        s << generate_tests(value[:test].as(String), value[:program].gsub(".ussd", ".ts"))
        s << end_s
      end
      s << end_s
    end

    dest : String = "#{EXPECTED_DIR}/actions.ts"
    if File.exists?(dest)
      File.delete(dest)
    end

    File.copy(ACTIONS_JS, dest)
    File.write("spec/code_generator_spec.cr", spec.to_s)
  end

  def generate_tests(test_file : String, ts_file : String) : String
    yml = YAML.parse(File.read("#{PROGRAMS_DIR}/#{test_file}"))
    code = String.build do |s|
      s << %(describe "#{test_file}: #{yml["name"]}" do\n)

      s << <<-CR
          server : TestDriver? = nil

          before_all do
            server = TestDriver.new("#{ts_file}").start
          end

          after_all do
            server.as(TestDriver).stop
          end\n\n
        CR

      yml["tests"].as_a.each_with_index do |t, index|
        test = t.as_h
        if test.has_key?("it")
          s << generate_it(test: test, index: index)[:code]
        elsif test.has_key?("scenario")
          if !test.has_key?("steps")
            raise Exception.new("Error at '#{test["scenario"]}' scenario. A 'step' block is required")
          end

          # steps = test["steps"].as_a
          previous_steps : Array(String) = [] of String

          s << %(\n describe "#{test["scenario"].as_s}" do\n)

          test["steps"].as_a.each_with_index do |step, step_index|
            result = generate_it(
              test: step.as_h,
              index: step_index,
              previous_steps: previous_steps,
            )

            previous_steps = result[:inputs]

            s << result[:code]
          end

          s << end_s
        end
        # s << %(it "#{test["it"]}" do\n)

        # scenario = test.as_h

        # if !scenario.has_key?("input")
        #   raise Exception.new("An 'input' is required for each scenario. #{test["name"]} > scenario #{index}")
        # end

        # params : String = ""
        # begin
        #   params = scenario["input"].as_a.map { |i| %("#{i}") }.join(',')
        # rescue e : TypeCastError
        #   params = %("#{scenario["input"].as_s}")
        # end

        # var_name : String = "resp#{index}"
        # s << "#{var_name} : String? = server.as(TestDriver).input"
        # s << if params.empty?
        #   "()\n"
        # elsif params == "\"\"" # empty quote
        #   "()\n"
        # else
        #   "([#{params}])\n"
        # end

        # if scenario.has_key?("output")
        #   outputs = scenario["output"].as_a
        #   outputs.each do |o|
        #     s << %(#{var_name}.nil?.should eq(false)\n)
        #     s << %(#{var_name}.as(String).includes?("#{o}").should eq(true)\n)
        #   end

        #   s << "\n"
        # end

        # s << end_s
      end

      # s << end_s
    end

    code.to_s
  end

  private def generate_it(test : Hash, index : Int32, previous_steps : Array(String) = [] of String) : NamedTuple(inputs: Array(String), code: String)
    # yml = YAML.parse(File.read("#{PROGRAMS_DIR}/#{test_file}"))

    if !test.has_key?("it")
      raise Exception.new("Error at test block #{index}. A '- it' is required for a test block.")
    end
    label : String = test["it"].as_s

    params : Array(String) = [] of String
    begin
      params = test["input"].as_a.map(&.to_s)
    rescue e : TypeCastError
      params << test["input"].to_s
      # if !val.empty? && val != "\"\""
      #   params <<
    rescue e : TypeCastError
      params << test["input"].as_s
    end

    if !previous_steps.empty?
      tmp : Array(String) = previous_steps
      tmp.concat(params)

      params = tmp
    end

    code = String.build do |s|
      s << %(it "#{label}" do\n)

      if !test.has_key?("input")
        raise Exception.new("An 'input' is required for each scenario. #{label} > scenario #{index}")
      end

      var_name : String = "resp#{index}"
      s << "#{var_name} : String? = server.as(TestDriver).input"
      s << if params.empty?
        "()\n"
      elsif params == "\"\"" # empty quote
        "()\n"
      else
        "([#{params.map { |i| %("#{i}") }.join(',')}])\n"
      end

      if test.has_key?("output")
        s << %(#{var_name}.nil?.should eq(false)\n)

        outputs = test["output"].as_a
        outputs.each do |o|
          s << %(#{var_name}.as(String).includes?("#{o}").should eq(true)\n)
        end

        s << "\n"
      end

      s << end_s
    end

    # s << end_s
    # end
    {inputs: params, code: code.to_s}
    # code.to_s
  end

  private def end_s
    "end\n"
  end

  private def compile(source : String)
    scanner = Scanner::Scan.new(source)
    ast = Parser.new(scanner.scan_tokens).parse
    analyzer = SemanticAnalyzer.new(ast)
    analyzer.analyze
    CodeGenerator.new(AstTransformer.new(ast, analyzer.symbol_table).transform).generate
  end
end

ProgramTestGenerator.new.run
