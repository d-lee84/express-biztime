const request = require("supertest");
const app = require("../app");
const db = require("../db");

let testCompany, testCompany2, testInvoice, testInvoice2;

beforeEach(async function () {
  await db.query("DELETE FROM companies");
  await db.query("DELETE FROM invoices");

  let results = await db.query(`
    INSERT INTO companies (code, name, description)
      VALUES ('sam', 'samsung', 'electronics')
      RETURNING code, name, description`);
  testCompany = results.rows[0];

  results = await db.query(`
    INSERT INTO companies (code, name, description)
      VALUES ('apple', 'Apple Comps', 'Apple Store')
      RETURNING code, name, description`);
  testCompany2 = results.rows[0];

  results = await db.query(`
    INSERT INTO invoices (comp_code, amt)
      VALUES ('sam', 50)
      RETURNING id, comp_code, amt, paid, add_date, paid_date`);
  testInvoice = results.rows[0];

  results = await db.query(`
    INSERT INTO invoices (comp_code, amt)
      VALUES ('apple', 25)
      RETURNING id, comp_code, amt, paid, add_date, paid_date`);
    testInvoice2 = results.rows[0];

});

describe("GET /invoices", function(){
  test("Gets a list of all the invoices", async function () {
    const resp = await request(app).get("/invoices");
    expect(resp.body).toEqual({
      invoices: [
        {
          id: testInvoice.id, 
          comp_code: testInvoice.comp_code
        },
        {
          id: testInvoice2.id, 
          comp_code: testInvoice2.comp_code
        }
      ],
    });
  });
});

describe("GET /invoices/[id]", function(){
  test("Gets a specific invoice", async function () {
    const resp = await request(app).get(`/invoices/${testInvoice.id}`);

    expect(resp.body).toEqual({
      invoice : {
        id: testInvoice.id,
        paid: expect.any(Boolean),
        paid_date: null,
        add_date: expect.any(String),
        amt: String(testInvoice.amt),
        company: testCompany
      }
    });
  });

  test("Responds 404 if invoice doesn't exist.", async function(){
    const resp = await request(app).get(`/invoices/0`);
    expect(resp.status).toEqual(404);
  });
});


describe("POST /invoices", function(){
  test("Create a new invoice successfully", async function () {
    let newInv = {
      amt: 25.00, 
      comp_code: testCompany2.code
    };

    const resp = await request(app)
      .post(`/invoices`)
      .send(newInv);
    
    expect(resp.body).toEqual({
      invoice : {
        id: expect.any(Number),
        comp_code: testCompany2.code,
        amt: `${newInv.amt}.00`,
        paid: expect.any(Boolean),
        add_date: expect.any(String),
        paid_date: null
      },
    });
  });

  test("Responds 400 if company code doesn't exist.", async function(){
    const resp = await request(app)
      .post(`/invoices`)
      .send({
        comp_code: "new",
        amt: 12345
      });
    
    expect(resp.status).toEqual(400);
  });
});


// describe("PUT /companies/[code]", function(){
//   test("Edit an existing company successfully", async function () {
//     let editedComp = {
//       name: "new company",
//       description: "this is the new company"
//     };

//     const resp = await request(app)
//       .put(`/companies/${testCompany.code}`)
//       .send(editedComp);
    
//     expect(resp.body).toEqual({
//       company : {
//         code: testCompany.code,
//         name: editedComp.name,
//         description: editedComp.description
//       },
//     });
//   });

//   test("Responds 400 if company name is taken.", async function(){
//     const resp = await request(app)
//       .put(`/companies/${testCompany.code}`)
//       .send({
//         name: testCompany2.name,
//         description: "new"
//       });
    
//     expect(resp.status).toEqual(400);
//   });

//   test("Responds 404 if company code does not exist.", async function(){
//     const resp = await request(app)
//       .post(`/companies/notReal`)
//       .send({
//         name: "new",
//         description: "new"
//       });
    
//     expect(resp.status).toEqual(404);
//   });
// });

// describe("DELETE /companies/[code]", function(){
//   test("Delete an existing company successfully", async function () {
//     const resp = await request(app).delete(`/companies/${testCompany.code}`);
    
//     expect(resp.body).toEqual({ status: "deleted" });
//   });

//   test("Responds 404 if company code does not exist.", async function(){
//     const resp = await request(app).delete(`/companies/noCompany`);
    
//     expect(resp.status).toEqual(404);
//   });
// });


afterAll(async function () {
  await db.end();
});