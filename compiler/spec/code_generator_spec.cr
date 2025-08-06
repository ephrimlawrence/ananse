require "./spec_helper"
describe CodeGenerator do
describe "hello_world.yml" do
describe "Displays hello world!" do
  server : TestDriver? = nil
  before_all do
    server = TestDriver.new("hello_world.ts").start
  end

  after_all do
    server.as(TestDriver).stop
  end
  describe "Hello world!" do
    it "Displays hello world!" do
resp27688 : String? = server.as(TestDriver).input([""])
resp27688.nil?.should eq(false)
resp27688.as(String).includes?("Hello World").should eq(true)
end
end
end
end
end
