# TODO: add extensive comments {file naming pattern, code generation}

require "yaml"
require "./test_driver.cr"
# require "../spec_helper.cr"
require "../../src/compiler"
require "option_parser"

class E2eTestRunner
  PROGRAMS_DIR      = "spec/programs"
  OUTPUT_DIR        = "spec/tmp"
  PROGRAM_STUB_FILE = "spec/helpers/program_stub.txt"
  ACTIONS_JS        = "#{PROGRAMS_DIR}/actions.ts"

  # Track list of programs and test files.  {file_name: []}
  private property files : Hash(String, NamedTuple(program: String, test: String?)) = {} of String => NamedTuple(program: String, test: String?)
  private property spacing : Int32 = 0

  # Enable logging of simulator responses
  property debug_mode : Bool = false

  def initialize(@debug_mode = false)
    data : Hash(String, Array(String)) = Dir.children(PROGRAMS_DIR).group_by { |f| File.basename(f, suffix: File.extname(f)) }

    # Scans spec/programs/ for test & program files
    data.each do |key, names|
      if key == "js" || key == "actions"
        # Skip js, action directory/files
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

  # Run tests for all programs in spec/programs directory
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

      File.write("#{OUTPUT_DIR}/#{basename}.ts", new_server)
    end

    # Generate spec files
    dest : String = "#{OUTPUT_DIR}/actions.ts"
    if File.exists?(dest)
      File.delete(dest)
    end

    File.copy(ACTIONS_JS, dest)

    @files.each do |basename, value|
      if value[:test].nil?
        next
      end

      @spacing = 2
      execute_tests(value[:test].as(String), value[:program].gsub(".ussd", ".ts"))
    end
  end

  # Run test for only 1 program
  def run(program_name : String)
    ts_server : String = File.read(PROGRAM_STUB_FILE)
    # TODO: generate code for gateway/session combinations
    ts_server = ts_server.gsub("__GATEWAY__", "'wigal'")
    ts_server = ts_server.gsub("__SESSION__", "'memory'")

    # Generate typescript file
    js = compile(File.read("#{PROGRAMS_DIR}/#{program_name}.ussd"))
    ts_server = ts_server.gsub("__BUSINESS_LOGIN__", js)

    File.write("#{OUTPUT_DIR}/#{program_name}.ts", ts_server)

    # Generate spec files
    dest : String = "#{OUTPUT_DIR}/actions.ts"
    File.copy(ACTIONS_JS, dest)

    @spacing = 2
    execute_tests("#{program_name}.yaml", "#{program_name}.ts")
  end

  def execute_tests(test_file : String, ts_file : String)
    yml = YAML.parse(File.read("#{PROGRAMS_DIR}/#{test_file}"))
    driver : TestDriver = TestDriver.new(ts_file, @debug_mode).start

    log "#{test_file}: #{yml["name"]}"

    @spacing = 4
    yml["tests"].as_a.each_with_index do |t, index|
      test = t.as_h

      if test.has_key?("it")
        if run_test(test: test, index: index, driver: driver)[:ok]
          passed test["it"].as_s
        else
          error test["it"].as_s
        end
      elsif test.has_key?("scenario")
        if !test.has_key?("steps")
          raise Exception.new("Error at '#{test["scenario"]}' scenario. A 'step' block is required")
        end

        previous_steps : Array(String) = [] of String
        log test["scenario"].as_s
        @spacing = 6

        test["steps"].as_a.each_with_index do |step, step_index|
          test = step.as_h
          if !test.has_key?("it")
            raise Exception.new(error "Error at test block #{step_index}. A '- it' is required for a test block.")
          end

          result = run_test(
            test: test,
            index: step_index,
            previous_steps: previous_steps,
            driver: driver
          )

          previous_steps = result[:inputs]
          label : String = test["it"].as_s

          if result[:ok]
            passed label
          else
            error label
          end
        end
      end
    end

    driver.stop
  end

  private def run_test(test : Hash, index : Int32, driver : TestDriver, previous_steps : Array(String) = [] of String) : NamedTuple(inputs: Array(String), ok: Bool)
    label : String = test["it"].as_s
    params : Array(String) = [] of String

    if !test.has_key?("input")
      raise Exception.new(error "An 'input' is required for each scenario. #{label} > scenario #{index}")
    end

    begin
      params = test["input"].as_a.map { |i| i.to_s }
    rescue e : TypeCastError
      params << test["input"].to_s
    rescue e : TypeCastError
      params << test["input"].as_s
    end

    if !previous_steps.empty?
      tmp : Array(String) = previous_steps
      tmp.concat(params)

      params = tmp
    end

    ok : Bool = true
    # driver : TestDriver = TestDriver.new(ts_file, @debug_mode)

    begin
      resp : String? = driver.input(params)

      if resp.nil?
        error("'#{label}' - Response was empty")
        return {inputs: params, ok: false}
      end

      if test.has_key?("output")
        outputs = test["output"].as_a

        outputs.each do |o|
          if !resp.as(String).includes?(o.to_s)
            error "'#{label}' - Expected output '#{o}' not found in response: #{resp}"
            ok = false
          end
        end
      end
    rescue exception
      ok = false
      p! exception
      #   driver.stop
      # ensure
      #   driver.stop
    end

    {inputs: params, ok: ok}
  end

  private def error(msg : String)
    log msg: msg, error: true
  end

  private def passed(msg : String)
    log msg: msg, error: false, success: true
  end

  private def log(msg : String, error : Bool = false, success : Bool = false)
    margin : String = " "*@spacing

    if error
      puts "#{margin}\033[31m#{msg}\033[0m" # red text
    elsif success
      puts "#{margin}\033[32m#{msg}\033[0m" # green text
    else
      puts "#{margin}#{msg}"
    end
  end

  private def compile(source : String)
    scanner = Scanner::Scan.new(source)
    ast = Parser.new(scanner.scan_tokens).parse
    analyzer = SemanticAnalyzer.new(ast)
    analyzer.analyze
    return CodeGenerator.new(AstTransformer.new(ast, analyzer.symbol_table).transform).generate
  end
end

OptionParser.parse do |parser|
  path_msg = "Run e2e test for a program"
  debug_mode : Bool = false

  parser.banner = "E2e tests runner"

  parser.on "-d", "--debug", "Logs simulator responses to console" do
    debug_mode = true
  end

  parser.on "-n NAME", "--name=NAME", path_msg do |program_name|
    E2eTestRunner.new(debug_mode).run(program_name)
    exit
  end

  parser.on "-h", "--help", "Show help" do
    puts parser
    exit
  end

  parser.invalid_option do |flag|
    STDERR.puts "ERROR: #{flag} is not a valid option."
    STDERR.puts parser
    exit(1)
  end
end
