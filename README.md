# Running the tests

* Create and migrate the test database
  * Install postgres
  * `createdb real-time-server-test`
  * `DATABASE_URL=postgres://localhost:5432/real-time-server-test pg-migrate up`
* Create `.env` file at the root defining `TEST_DATABASE_URL=postgres://localhost:5432/real-time-server-test`
* Run `npm test`
