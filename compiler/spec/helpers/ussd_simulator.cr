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
  def init(url : String? = nil, request_body : String? = nil)
    begin
      case @provider
      when SupportedGateway::Wigal
        # For Wigal, we make a GET request.
        response = HTTP::Client.get(url || wigal_reply())
        data = response.body
        wigal_response = parse_response(data)

        # Output the display text and check if the session should end.
        # puts ""
        # puts display_text(wigal_response["userdata"].to_s)
        # puts ""
        @message = wigal_response["userdata"].to_s

        if wigal_response["mode"] == "end"
          Process.exit(0)
        end

        # Prompt the user for input and continue the session.
        print "Response: "
        input = STDIN.gets
        return init(wigal_reply(wigal_response, input)["url"])
      when SupportedGateway::EmergentTechnology
        # For Emergent Technology, we make a POST request with a JSON body.
        reply_data = emergent_reply(nil, request_body)
        response = HTTP::Client.post(reply_data["url"].to_s, body: reply_data["body"].to_json)

        # Parse the JSON response.
        json : Hash(String, String) = Hash(String, String).from_json(response.body)

        # puts ""
        # puts display_text(json["Message"].to_s)
        # puts ""
        @message = json["Message"].to_s

        if json["Type"].to_s == "Release"
          Process.exit(0)
        end

        # Prompt the user for input and continue the session with a new POST body.
        print "Response: "
        input = STDIN.gets
        # TODO: find a way to get this from paramters
        reply_data = emergent_reply(json, input)

        return init(reply_data["url"].to_s, reply_data["body"].to_json)
      end
    rescue ex
      # Log any errors that occur during the simulation.
      puts "Simulator error: #{ex.message}"
      # log(ex)
      Process.exit(1)
    end
  end

  # Helper method to generate the URL or request body for the next step.
  private def emergent_reply(data : Hash(String, String)? = nil, input : String? = nil) : Hash(String, Hash(String, String) | String)
    # For Emergent Technology, build a JSON body.
    data ||= {"Mobile" => "#{@phone}", "Message" => "*714#"}
    data["Message"] = input.try(&.chomp) || data["Message"]

    # Use the session ID from the cache or generate a new one.
    cache = @session_key_cache[:emergent]
    data["SessionId"] = cache || UUID.random.to_s
    data["Type"] = "Initiation"
    data["Mobile"] = @phone
    data["Operator"] = "Vodafone"
    data["ServiceCode"] = "714"

    # Update the cache with the current session ID.
    @session_cache[:emergent] = data["SessionId"].to_s

    return {"url" => @url, "body" => data}
  end

  private def wigal_reply(data : Hash(String, String)? = nil, input : String? = nil) : String
    # For Wigal, build a query string.
    data ||= {"network" => "wigal_mtn_gh", "sessionid" => "#{UUID.random.to_s}", "mode" => "start", "msisdn" => "#{@phone}", "username" => "test_user"}

    # URL-encode the input if it contains a hash symbol.
    input = input.try { |i| i.chomp.gsub("#", "%23") }
    session_id : String = data["sessionid"].to_s || UUID.random.to_s

    req_url : String = "#{@url}?network=#{data["network"]}&sessionid=#{session_id}&mode=#{data["mode"]}&msisdn=#{data["msisdn"]}&userdata=#{input.to_s}&username=#{data["username"]}&trafficid=#{UUID.random.to_s}"
    # log(url)
    req_url
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

  # Formats the display text by replacing `^` with newlines.
  # private def display_text(text : String?)
  #   text || "Unable to parse text from response"
  # end

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
