require "./spec_helper.cr"

describe CodeGenerator do
  it "verify generated js code\n" do
    E2eTestRunner.new.run
  end
end
