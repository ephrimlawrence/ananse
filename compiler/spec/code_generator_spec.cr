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
resp34454 : String? = server.as(TestDriver).input([""])
resp34454.nil?.should eq(false)
resp34454.as(String).includes?("Hello World").should eq(true)
end
end
end
end
end
