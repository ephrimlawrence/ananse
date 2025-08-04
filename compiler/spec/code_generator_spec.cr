require "./spec_helper" 
describe CodeGenerator do 
describe "program.yaml" do 
describe "Verifies a successful balance check from the main menu." do
  server : TestDriver? = nil
  before_all do
    server = TestDriver.new("program.ussd")
  end

  after_all do
    server.as(TestDriver).stop
  end
  describe "Successful Balance Check" do
    it "Verifies a successful balance check from the main menu." do
resp1543142789 : String? = server.as(TestDriver).input(["sdd","bb"])
resp1543142789.nil?.should eq(false)
resp1543142789.as(String).includes?("Enter your account number:").should eq(true)
resp321843327 : String? = server.as(TestDriver).input(["12345"])
resp321843327.nil?.should eq(false)
resp321843327.as(String).includes?("Your balance is: GHS 123.45").should eq(true)
resp321843327.nil?.should eq(false)
resp321843327.as(String).includes?("Last updated: 2025-08-01").should eq(true)
resp321843327.nil?.should eq(false)
resp321843327.as(String).includes?("0. Back").should eq(true)
end
end
end
end
end
