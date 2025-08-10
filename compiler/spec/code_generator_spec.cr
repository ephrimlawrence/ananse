require "./spec_helper"
describe CodeGenerator do
  describe "hello_world.yml: Hello world!" do
    server : TestDriver? = nil

    before_all do
      server = TestDriver.new("hello_world.ts").start
    end

    after_all do
      server.as(TestDriver).stop
    end

    it "Displays hello world!" do
      resp0 : String? = server.as(TestDriver).input
      resp0.nil?.should eq(false)
      resp0.as(String).includes?("Hello World!").should eq(true)
    end
  end
  describe "momo.yaml: Mobile Money App" do
    server : TestDriver? = nil

    before_all do
      server = TestDriver.new("momo.ts").start
    end

    after_all do
      server.as(TestDriver).stop
    end

    it "Verify main menu" do
      resp0 : String? = server.as(TestDriver).input
      resp0.nil?.should eq(false)
      resp0.as(String).includes?("Transfer Money").should eq(true)
      resp0.nil?.should eq(false)
      resp0.as(String).includes?("MoMoPay & Pay Bill").should eq(true)
      resp0.nil?.should eq(false)
      resp0.as(String).includes?("Airtime & Bundles").should eq(true)
      resp0.nil?.should eq(false)
      resp0.as(String).includes?("Allow Cash Out").should eq(true)
      resp0.nil?.should eq(false)
      resp0.as(String).includes?("Financial").should eq(true)
      resp0.nil?.should eq(false)
      resp0.as(String).includes?("My Wallet").should eq(true)
      resp0.nil?.should eq(false)
      resp0.as(String).includes?("Just4U (Offers for you)").should eq(true)
    end
  end
end
