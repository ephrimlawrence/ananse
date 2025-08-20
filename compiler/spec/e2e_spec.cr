require "./spec_helper.cr"

describe CodeGenerator
  it "verify generated js code" do
    E2eTestRunner.new.run
  end
end
