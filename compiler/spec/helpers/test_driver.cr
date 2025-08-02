require "socket"
require "./ussd_simulator"

class TestDriver
  EXPECTED_DIR = "spec/expected"
  TSX_BIN      = "node_modules/.bin/tsx"

  getter program_name : String
  private property server : Process? = nil
  property simulator : Simulator? = nil

  def initialize(@program_name)
  end

  # TODO: integrate simulator

  def run
    port = generate_port_number.to_s
    @server = Process.new(TSX_BIN, ["#{EXPECTED_DIR}/#{program_name}", port])
    @simulator = Simulator.new(SupportedGateway::Wigal, port)
  end

  def end_test
    if !@server.nil?
      @server.terminate
    end
  end

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

puts TestDriver.new("program.ts").run
