# TODO: add extensive comments {file naming pattern, code generation}
class ProgramTestGenerator
  PROGRAMS_DIR = "spec/programs"

  # Track list of programs and test files.  {file_name: []}
  private property files : Hash(String, NamedTuple(program: String, test: String?)) = {} of String => NamedTuple(program: String, test: String?)

  def initialize
    data : Hash(String, Array(String)) = Dir.children(PROGRAMS_DIR).group_by { |f| File.basename(f, suffix: File.extname(f)) }
    data.each do |key, names|

      program : String? = names.find { |n| File.extname(n) == ".ussd" }
      if program.nil?
        puts "Could not fine .ussd program file for '#{PROGRAMS_DIR}/#{key}', existing..."
        exit 1
      end

      @files[key] = {program: program, test: names.find { |n| /\.(yaml|yml)/.match(File.extname(n)) }}
    end

    puts @files
  end
end

ProgramTestGenerator.new
