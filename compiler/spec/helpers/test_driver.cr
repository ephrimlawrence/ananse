require "socket"
require "./ussd_simulator"

class TestDriver
  EXPECTED_DIR = "spec/expected"
  TSX_BIN      = "node_modules/.bin/tsx"

  getter program_name : String

  # property simulator : Simulator? = nil
  private property server : Process? = nil
  private property port : String

  def initialize(@program_name)
    @port = generate_port_number.to_s
  end

  def start
    @server = Process.new(TSX_BIN, args: ["#{EXPECTED_DIR}/#{program_name}", port], output: Process::Redirect::Inherit, error: Process::Redirect::Inherit)
    @server.as(Process).wait
    self
  end

  def finalize
    stop
  end

  # def start
  # end

  def stop
    begin
      if !@server.nil? && !@server.as(Process).terminated?
        @server.as(Process).terminate
      end
    rescue e
    end
  end

  def input(value : String | Array(String)) : String?
    begin
      # @server.as(Process).output.gets_to_end
      simulator = Simulator.new(SupportedGateway::Wigal, port)
      # if simulator.nil?
      #   stop
      #   start
      # end

      resp = simulator.input(value).message
      # @server.as(Process).output.gets_to_end
      puts resp
      return resp
    rescue e : Exception
      stop
      return nil
    end
  end

  # def result : String?
  #   if @simulator.nil?
  #     return nil
  #   end

  #   @simulator.message
  # end

  def generate_port_number : UInt16
    port : UInt16 = 3000
    attempts : Int32 = 0

    while true
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
