module Util
  def self.generate_identifier_name(prefix = "var_")
    # Generate a random string of alphanumeric characters
    random_chars = Random::Secure.hex(4)
    # Combine the prefix with the random characters
    "#{prefix}#{random_chars}"
  end
end
