require "http/client"
require "json"
require "option_parser"
require "uuid"

# Define the gateways
enum SupportedGateway
  Wigal
  EmergentTechnology
end

# The main Simulator class to handle the USSD flow.
class Simulator
  private property phone : String
  private property url : String
  private property session_key_cache : Hash(Symbol, String) = {:emergent => ""}
  private property session_cache : Hash(String, String) = {} of String => String

  getter provider : SupportedGateway
  getter port : String
  getter message : String?

  # @debug : Bool = false

  # Initializes the simulator by parsing arguments from the command line.
  def initialize(@provider, @port, phone_number : String? = nil)
    @url = "http://localhost:#{@port}"

    # Generate phone number for the session
    if phone_number.nil?
      @phone = generate_phone
    else
      @phone = phone_number
    end
  end

  # Start the USSD session.
  private def make_request(url : String? = nil, user_inut : String? = nil)
    begin
      case @provider
      when SupportedGateway::Wigal
        # For Wigal, we make a GET request.
        response = HTTP::Client.get(url || wigal_reply())
        data = response.body

        @session_cache = parse_response(data)
        @message = @session_cache["userdata"].to_s

        if @session_cache["mode"] == "end"
          exit 0
        end
      when SupportedGateway::EmergentTechnology
        # For Emergent Technology, we make a POST request with a JSON body.
        reply_data = emergent_reply(nil, user_inut)
        response = HTTP::Client.post(reply_data["url"].to_s, body: reply_data["body"].to_json)

        @session_cache = Hash(String, String).from_json(response.body)
        @message = @session_cache["Message"]

        if @session_cache["Type"] == "Release"
          Process.exit(0)
        end
      end
      return self
    rescue ex
      puts "Simulator error: #{ex.message}"
      Process.exit(1)
    end
  end

  def input : Simulator
    case @provider
    when SupportedGateway::Wigal
      return make_request(wigal_reply(nil, nil), nil)
    when SupportedGateway::EmergentTechnology
      data = emergent_reply(nil, nil)
      return make_request(data["url"].to_s, data["body"].to_json)
    end
    return self
  end

  def input(value : String) : Simulator
    case @provider
    when SupportedGateway::Wigal
      if @session_cache.empty?
        input
      end
      return make_request(wigal_reply(@session_cache, value), value)
    when SupportedGateway::EmergentTechnology
      if @session_cache.empty?
        input
      end
      data = emergent_reply(@session_cache, value)
      return make_request(data["url"].to_s, data["body"].to_json)
    end
    return self
  end

  def input(values : Array(String)) : Simulator
    values.each do |v|
      input(v)
    end
    return self
  end

  # Helper method to generate the URL or request body for the next step.
  private def emergent_reply(data : Hash(String, String)? = nil, input : String? = nil) : Hash(String, Hash(String, String) | String)
    if data.nil? || data.empty?
      data = {"Mobile" => "#{@phone}", "Message" => "*714#"}
    end

    data["Message"] = input.try(&.chomp) || data["Message"]

    # Use the session ID from the cache or generate a new one.
    cache = @session_key_cache[:emergent]
    data["SessionId"] = cache || UUID.random.to_s
    data["Type"] = "Initiation"
    data["Mobile"] = @phone
    data["Operator"] = "Vodafone"
    data["ServiceCode"] = "714"

    # Update the cache with the current session ID.
    @session_key_cache[:emergent] = data["SessionId"].to_s

    return {"url" => @url, "body" => data}
  end

  private def wigal_reply(data : Hash(String, String)? = nil, input : String? = nil) : String
    # For Wigal, build a query string.
    body : Hash(String, String) = {} of String => String

    if data.nil? || data.empty?
      body = {"network" => "wigal_mtn_gh", "sessionid" => "#{UUID.random.to_s}", "mode" => "start", "msisdn" => "#{@phone}", "username" => "test_user"}
    else
      body = data
    end

    # URL-encode the input if it contains a hash symbol.
    input = input.try { |i| i.chomp.gsub("#", "%23") }
    session_id : String = body["sessionid"].to_s || UUID.random.to_s

    # req_url : String = "#{@url}?network=#{data["network"]}&sessionid=#{session_id}&mode=#{data["mode"]}&msisdn=#{data["msisdn"]}&userdata=#{input.to_s}&username=#{data["username"]}&trafficid=#{UUID.random.to_s}"
    # log(url)
    params = String.build do |s|
      s << "network=#{body["network"]}"
      s << "&sessionid=#{session_id}"
      s << "&mode=#{body["mode"]}"
      s << "&msisdn=#{body["msisdn"]}"
      s << "&userdata=#{input.to_s}"
      s << "&username=#{body["username"]}"
      s << "&trafficid=#{UUID.random.to_s}"
    end

    "#{@url}?#{params.to_s}"
  end

  # Parses the response from the Wigal gateway.
  private def parse_response(data : String) : Hash(String, String)
    # log(data)

    if @provider == SupportedGateway::Wigal
      resp = data.split("|")
      {
        "network"   => resp[0],
        "mode"      => resp[1],
        "msisdn"    => resp[2],
        "sessionid" => resp[3],
        "userdata"  => resp[4].gsub("^", "\n"),
        "username"  => resp[5],
        "trafficid" => resp[6],
        "other"     => resp[7],
      }
    else
      raise "Response parsing is not implemented for #{@provider}"
    end
  end

  private def generate_phone : String
    number : String = "024"
    while number.size < 10
      number += Random.new.next_int.to_s.gsub('-', "")
    end

    if number.size > 10
      number = number[..9]
    end

    return number
  end
end

# Create a new Simulator instance and run it.
# simulator = Simulator.new(SupportedGateway::Wigal, 332)
# # simulator.init
# simulator.init
