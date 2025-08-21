require "socket"
require "./ussd_simulator"

class TestDriver
  TEMP_DIR = "spec/tmp"
  TSX_BIN  = "node_modules/.bin/tsx"

  getter program_name : String

  private property server : Process? = nil
  private property port : String

  def initialize(@program_name, @debug : Bool = false)
    @port = generate_port_number.to_s
  end

  def start
    show_logs : Process::Redirect = @debug ? Process::Redirect::Inherit : Process::Redirect::Close
    @server = Process.new(TSX_BIN, args: ["#{TEMP_DIR}/#{program_name}", port], output: show_logs, error: show_logs)

    sleep Time::Span.new(seconds: 3)
    self
  end

  def finalize
    stop
  end

  def stop
    if !@server.nil? && !@server.as(Process).terminated?
      @server.as(Process).terminate
    end
  rescue e
  end

  def simulator : Simulator
    if @server.nil?
      start
    end

    Simulator.new(provider: SupportedGateway::Wigal, port: port, debug: @debug)
  end

  def input(value : String | Array(String)) : String?
    simulator.input(value).message
  rescue e : Exception
    stop
    nil
  end

  def input : String?
    simulator.input.message
  rescue e : Exception
    stop
    nil
  end

  def generate_port_number : UInt16
    port : UInt16 = 3000
    attempts : Int32 = 0

    loop do
      if attempts == 20
        raise Exception.new("Could not find an unused port after #{attempts} attempts.")
      end

      begin
        attempts += 1
        port = Random.new.rand(UInt16)

        if port <= 1023
          # port 1-1023 are privileged, generate new number
          next
        end

        # Attempt to create a TCP server on the specified port
        server = TCPServer.new("127.0.0.1", port)
        server.close # Close the server if successfully bound
        return port
      rescue e : Socket::Error
        next
      end
    end
  end
end

# puts TestDriver.new("program.ts")
