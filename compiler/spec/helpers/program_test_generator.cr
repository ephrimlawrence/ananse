# TODO: add extensive comments {file naming pattern, code generation}
require "../spec_helper.cr"

class ProgramTestGenerator
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

      File.write("#{PROGRAMS_DIR}/js/#{basename}.ts", code_stub)
      # puts value[:program], value[:test]
    end

    # Copy update actions to js
    dest : String = "#{PROGRAMS_DIR}/js/actions.ts"
    if File.exists?(dest)
      File.delete(dest)
    end

    File.copy(ACTIONS_JS, dest)
  end
end

ProgramTestGenerator.new.run
