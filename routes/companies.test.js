const request = require("supertest");
const app = require("../app");
const db = require("../db");

let testCompany;
let testCompany2;

beforeEach(async function () {
  await db.query("DELETE FROM companies");

  const results = await db.query(`
    INSERT INTO companies(code, name, description)
    VALUES ('sam', 'samsung', 'electronics')
    RETURNING code, name, description`);
  testCompany = results.rows[0];

  const results2 = await db.query(`
    INSERT INTO companies(code, name, description)
    VALUES ('apple', 'Apple Comps', 'Apple Store')
    RETURNING code, name, description`);
  testCompany2 = results2.rows[0];

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
        {
          code: testCompany2.code,
          name: testCompany2.name
        }
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


describe("POST /companies", function(){
  test("Create a new company successfully", async function () {
    let newComp = {
      code: "NC",
      name: "new company",
      description: "this is the new company"
    };

    const resp = await request(app)
      .post(`/companies`)
      .send(newComp);
    
    expect(resp.body).toEqual({
      company : newComp,
    });
  });

  test("Responds 400 if company name is taken.", async function(){
    const resp = await request(app)
      .post(`/companies`)
      .send({
        code: "new",
        name: testCompany.name,
        description: "new"
      });
    
    expect(resp.status).toEqual(400);
  });

  test("Responds 400 if company code is taken.", async function(){
    const resp = await request(app)
      .post(`/companies`)
      .send({
        code: testCompany.code,
        name: "new",
        description: "new"
      });
    
    expect(resp.status).toEqual(400);
  });
});


describe("PUT /companies/[code]", function(){
  test("Edit an existing company successfully", async function () {
    let editedComp = {
      name: "new company",
      description: "this is the new company"
    };

    const resp = await request(app)
      .put(`/companies/${testCompany.code}`)
      .send(editedComp);
    
    expect(resp.body).toEqual({
      company : {
        code: testCompany.code,
        name: editedComp.name,
        description: editedComp.description
      },
    });
  });

  test("Responds 400 if company name is taken.", async function(){
    const resp = await request(app)
      .put(`/companies/${testCompany.code}`)
      .send({
        name: testCompany2.name,
        description: "new"
      });
    
    expect(resp.status).toEqual(400);
  });

  test("Responds 404 if company code does not exist.", async function(){
    const resp = await request(app)
      .put(`/companies/notReal`)
      .send({
        name: "new",
        description: "new"
      });
    
    expect(resp.status).toEqual(404);
  });
});

describe("DELETE /companies/[code]", function(){
  test("Delete an existing company successfully", async function () {
    const resp = await request(app).delete(`/companies/${testCompany.code}`);
    
    expect(resp.body).toEqual({ status: "deleted" });
  });

  test("Responds 404 if company code does not exist.", async function(){
    const resp = await request(app).delete(`/companies/noCompany`);
    
    expect(resp.status).toEqual(404);
  });
});


afterAll(async function () {
  await db.end();
});