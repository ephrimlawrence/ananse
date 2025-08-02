# TODO: add extensive comments {file naming pattern, code generation}
require "yaml"
require "../spec_helper.cr"

class ProgramTestGenerator
  EXPECTED_DIR      = "spec/expected"
  PROGRAMS_DIR      = "spec/programs"
  PROGRAM_STUB_FILE = "spec/helpers/program_stub.txt"
  ACTIONS_JS        = "#{PROGRAMS_DIR}/actions.ts"

  # Track list of programs and test files.  {file_name: []}
  private property files : Hash(String, NamedTuple(program: String, test: String?)) = {} of String => NamedTuple(program: String, test: String?)

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
    code_stub : String = File.read(PROGRAM_STUB_FILE)
    # TODO: generate code for gateway/session combinations
    code_stub = code_stub.gsub("__GATEWAY__", "'wigal'")
    code_stub = code_stub.gsub("__SESSION__", "'memory'")

    # Generate typescript file
    @files.each do |basename, value|
      js = generate_js(File.read("#{PROGRAMS_DIR}/#{value[:program]}"))
      code_stub = code_stub.gsub("__BUSINESS_LOGIN__", js)

      File.write("#{EXPECTED_DIR}/#{basename}.ts", code_stub)

      if !value[:test].nil?
        generate_tests(value[:test].as(String), value[:program])
      end
      # puts value[:program], value[:test]
    end

    # Generate spec files
    spec = String.build do |s|
      s << %(require "./spec_helper" \n)
      s << "describe CodeGenerator do \n"

      @files.each do |basename, value|
        if value[:test].nil?
          next
        end

        s << %(describe "#{value[:test]}" do \n)
        s << generate_tests(value[:test].as(String), value[:program])
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
      yml["tests"].as_a.each do |test|
        s << "describe \"#{test["description"]}\" do\n"

        stub = <<-CR
        server : TestDriver? = nil
        before_all do
          server = TestDriver.new("#{ts_file}")
        end\n
      CR
        s << stub

        s << <<-CR
          describe "#{test["name"]}" do
            it "#{test["description"]}" do\n
        CR
        # s << stub
        # s << "describe \"#{test["name"]}\" do\n"

        # TODO: add before all
        # s << "it \"" << test["description"] << "\" do\n"

        # TODO:validate scenario

        # Add steps as individual test cases
        # puts test["scenario"]
        test["scenario"].as_a.each_with_index do |item, index|
          scenario = item.as_h
          if !scenario.has_key?("input")
            raise Exception.new("An 'input' is required for each scenario. #{test["name"]} > scenario #{index}")
          end

          params : String = ""
          begin
            params = scenario["input"].as_a.map { |i| %("#{i}") }.join(',')
          rescue e : TypeCastError
            params = %("#{scenario["input"].as_s}")
          end

          s << "resp : String = server.as(TestDriver).input([#{params}]).message\n"

          if scenario.has_key?("assert_output")
            outputs = scenario["assert_output"].as_a
            outputs.each do |o|
              s << %(resp.includes?("#{o}").should eq(true)\n)
            end
            # puts scenario["assert_output"]
          end

          # s << stub
        end

        s << end_s << end_s
      end

      s << end_s
      #   it "goto with menu name" do
    end

    code.to_s
  end

  def end_s
    "end\n"
  end
end

ProgramTestGenerator.new.run
