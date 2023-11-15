import { configure, processCLIArgs, run } from '@japa/runner'
import { assert } from '@japa/assert'
import { apiClient } from '@japa/api-client'
import { expectTypeOf } from '@japa/expect-type'
import { snapshot } from '@japa/snapshot'

processCLIArgs(process.argv.splice(2))
configure({
  files: ['tests/**/*.spec.js'],
  plugins: [
    assert(),
    apiClient('http://localhost:3333'),
    expectTypeOf(),
    snapshot(),
  ],
})

run()