const { test } = require('@japa/runner')

test.group('Maths.add', () => {
  test('add two numbers', ({ assert }) => {
    // Test logic goes here
    assert.equal(1 + 1, 2)
  })
})
