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
      resp0 : String? = server.as(TestDriver).input([""])
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

    it "displays main menu" do
      resp0 : String? = server.as(TestDriver).input([""])
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

    describe "transfer money to MoMo user" do
      it "user dials code" do
        resp0 : String? = server.as(TestDriver).input([""])
        resp0.nil?.should eq(false)
        resp0.as(String).includes?("Transfer Money").should eq(true)
        resp0.nil?.should eq(false)
        resp0.as(String).includes?("MoMoPay & Pay Bill").should eq(true)
      end
      it "user selects transfer money" do
        resp1 : String? = server.as(TestDriver).input(["", "1"])
        resp1.nil?.should eq(false)
        resp1.as(String).includes?("MoMo User").should eq(true)
        resp1.nil?.should eq(false)
        resp1.as(String).includes?("None MoMo User").should eq(true)
      end
      it "user selects MoMo user" do
        resp2 : String? = server.as(TestDriver).input(["", "1", "1"])
        resp2.nil?.should eq(false)
        resp2.as(String).includes?("Enter mobile number").should eq(true)
      end
      it "confirms phone" do
        resp3 : String? = server.as(TestDriver).input(["", "1", "1", "024123456"])
        resp3.nil?.should eq(false)
        resp3.as(String).includes?("Confirm number").should eq(true)
      end
    end
  end
end
