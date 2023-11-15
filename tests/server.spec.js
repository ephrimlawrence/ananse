import { test } from '@japa/runner'
import { promisify } from 'node:util'

test('serve static assets', async ({client}) => {
//   const server = createServer((req, res) => {
//   })
//   server.listen(3333)

  try {
    /**
     * Here, you might make a request to the
     * HTTP server.
     *
     * And write some assertions
     */

    await client.post('/').expect("Hello World")
  } finally {
    await promisify(server.close)()
  }
})
