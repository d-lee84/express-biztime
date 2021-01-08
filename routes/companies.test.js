const request = require("supertest");
const app = require("../app");
const db = require("../db");

let testCompany;

beforeEach(async function () {
  await db.query("DELETE FROM companies");

  const results = await db.query(`
    INSERT INTO companies(code, name, description)
    VALUES ('sam', 'samsung', 'electronics')
    RETURNING code, name, description`);
  testCompany= results.rows[0];

});

describe("GET /companies", function(){
  test("Gets a list of all companies", async function () {
    const resp = await request(app).get("/companies");
    expect(resp.body).toEqual({
      companies: [
        {
        code: testCompany.code, 
        name: testCompany.name,
        },
      ],
    });
  });
});

describe("GET /companies/[code]", function(){
  test("Gets a specific company", async function () {
    const resp = await request(app).get(`/companies/${testCompany.code}`);
    testCompany.invoices = [];
    expect(resp.body).toEqual({
      company : testCompany,
    });
  });

  test("Responds 404 if company doesn't exist.", async function(){
    const resp = await request(app).get(`/companies/fakecompany`);
    expect(resp.status).toEqual(404);
  });
});

afterAll(async function () {
  await db.end();
});