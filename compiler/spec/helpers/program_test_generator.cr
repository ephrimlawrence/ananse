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
    code_stub = code_stub.gsub("__SESSION__", "{type: 'memory'}")

    @files.each do |basename, value|
      # Generate typescript file
      js = generate_js(File.read("#{PROGRAMS_DIR}/#{value[:program]}"))
      code_stub = code_stub.gsub("__BUSINESS_LOGIN__", js)

      File.write("#{EXPECTED_DIR}/#{basename}.ts", code_stub)
      # puts value[:program], value[:test]
    end

    # Copy update actions to js
    dest : String = "#{EXPECTED_DIR}/actions.ts"
    if File.exists?(dest)
      File.delete(dest)
    end

    File.copy(ACTIONS_JS, dest)
  end

  def generate_tests(test_file : String)
    code = String.builder do |s|
      s << "describe CodeGenerator do \n"
      s << "describe \"#{test_file}\" do\n"

      yml = YAML.parse(File.read("#{PROGRAMS_DIR}/#{test_file}"))
      yml["tests"].each do |test|
        s << "describe \"#{test["name"]}\" do\n"
        s << "it \"" << test["description"] << "\" do\n"

        # Add steps as individual test cases
        test["steps"].each do |step|
        end

        s << end_s << end_s
      end

      #   it "goto with menu name" do
      s << end_s << end_s
    end
  end

  def end_s
    "end\n"
  end
end

ProgramTestGenerator.new.run
