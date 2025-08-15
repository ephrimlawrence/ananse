# TODO: add extensive comments {file naming pattern, code generation}

require "yaml"
require "./test_driver.cr"
# require "../spec_helper.cr"
require "../../src/compiler"

class E2eTestRunner
  # EXPECTED_DIR      = "spec/expected"
  PROGRAMS_DIR      = "spec/programs"
  OUTPUT_DIR        = "spec/tmp"
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

      File.write("#{OUTPUT_DIR}/#{basename}.ts", new_server)
    end

    # Generate spec files
    dest : String = "#{OUTPUT_DIR}/actions.ts"
    if File.exists?(dest)
      File.delete(dest)
    end

    File.copy(ACTIONS_JS, dest)

    puts "CodeGenerator"

    @files.each do |basename, value|
      if value[:test].nil?
        next
      end

      generate_tests(value[:test].as(String), value[:program].gsub(".ussd", ".ts"))
    end
  end

  def generate_tests(test_file : String, ts_file : String)
    yml = YAML.parse(File.read("#{PROGRAMS_DIR}/#{test_file}"))
    puts "  #{test_file}: #{yml["name"]}"

    # TODO: accept debug from cli

    yml["tests"].as_a.each_with_index do |t, index|
      test = t.as_h

      if test.has_key?("it")
        generate_it(test: test, index: index, ts_file: ts_file)
      elsif test.has_key?("scenario")
        if !test.has_key?("steps")
          raise Exception.new("Error at '#{test["scenario"]}' scenario. A 'step' block is required")
        end

        previous_steps : Array(String) = [] of String

        puts "\t\t#{test["scenario"].as_s}"

        test["steps"].as_a.each_with_index do |step, step_index|
          result = generate_it(
            test: step.as_h,
            index: step_index,
            previous_steps: previous_steps,
            ts_file: ts_file
          )

          previous_steps = result[:inputs]
        end
      end
    end
  end

  private def generate_it(test : Hash, index : Int32, ts_file : String, previous_steps : Array(String) = [] of String) : NamedTuple(inputs: Array(String))
    if !test.has_key?("it")
      raise Exception.new("Error at test block #{index}. A '- it' is required for a test block.")
    end

    label : String = test["it"].as_s
    # TODO: color label based on success/error
    puts "\t\t#{label}"

    params : Array(String) = [] of String
    begin
      params = test["input"].as_a.map { |i| i.to_s }
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

    if !test.has_key?("input")
      raise Exception.new("An 'input' is required for each scenario. #{label} > scenario #{index}")
    end

    # TODO: read debug from cli
    ok : Bool = false
    driver : TestDriver = TestDriver.new(ts_file)

    begin
      resp : String? = driver.start.input(params)

      if resp.nil?
        log_error("   failed: '#{label}' - Response was empty")
        return {inputs: params}
      end

      if test.has_key?("output")
        outputs = test["output"].as_a

        outputs.each do |o|
          unless resp.as(String).includes?(o.to_s)
            log "failed: '#{label}' - Expected output '#{o}' not found in response: #{resp}", true
            # break
          end
        end
      end
    rescue exception
      p! exception
    ensure
      driver.stop
    end

    {inputs: params}
  end

  private def log_error(msg : String)
    log msg, true
  end

  private def log(msg : String, is_error : Bool = false)
    if is_error
      puts "\033[31m#{msg}\033[0m" # red text
    else
      puts "\033[32m#{msg}\033[0m" # green text
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

E2eTestRunner.new.run
