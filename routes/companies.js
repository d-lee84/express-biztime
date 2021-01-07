const express = require("express");

const db = require("../db");
const router = new express.Router();
const middleware = require("../middleware");

const { BadRequestError } = require('../expressError');
const HTTP_UPDATED = 200;
const HTTP_CREATED = 201;

/** GET /companies: get a list of all the companies 
 *  - Returns {companies: [{code, name}, ...]}
*/

router.get(
  "/", 
  async function (req, res, next) {
    let result = await db.query(
      `SELECT code, name
        FROM companies;`
    );
    return res.json({companies: result.rows})
  }
);

/** GET /companies/[code]: Gets one specific company
 *  - If company does not exist, throw 404 error (middleware)
 *  - Returns {company: {code, name, description}}
 */

router.get(
  "/:code", 
  middleware.doesCompanyExist, 
  async function (req, res, next) {
  
    let result = await db.query(
      `SELECT code, name, description
        FROM companies
        WHERE code= $1;`, [req.params.code]);


    return res.json({companies: result.rows[0]}); 
  }
);

/** POST /companies Creates one a company
 *  - If company name or code is not unqiue, throw a 400 error (middleware)
 *  - Returns {company: {code, name, description}}
 */

router.post(
  "/", 
  async function (req, res, next) {
    const { code, name, description } = req.body;

    let result; 
    try {
      result = await db.query(
      `INSERT INTO companies (code, name, description)
            VALUES ($1, $2, $3)
            RETURNING code, name, description`,
      [code, name, description],
    );
    } catch {
      throw new BadRequestError("Company code and name must be unique.");
    }

    const company = result.rows[0];
    return res.status(HTTP_CREATED).json({ company });
  }
);

/** PUT /companies/[code] Updates a company
 *  - If company not found, throw a 404 error (middleware)
 *  - If company name or code is not unqiue, throw a 400 error
 *  - Returns {company: {code, name, description}}
 */

router.put(
  "/:code", 
  middleware.doesCompanyExist, 
  async function (req, res, next) {
    const { name, description } = req.body;

    let result;

    //Check if company name is unique, if not throw a 400 error
    try {
      result = await db.query(
        `UPDATE companies
          SET name=$1,
              description=$2
          WHERE code=$3
          RETURNING code, name, description`,
      [name, description, req.params.code],
    );
    } catch {
      throw new BadRequestError("Company name already exists.");
    }
    
    const company = result.rows[0];
    return res.status(HTTP_UPDATED).json({ company });
  }
);

/** DELETE /companies/[code] Deletes a company
 *  - If company not found, throw a 404 error (middleware)
 *  - Returns {status: "deleted"}
 */

router.delete(
  "/:code", 
  middleware.doesCompanyExist,
  async function (req, res, next) {

    await db.query(
      "DELETE FROM companies WHERE code = $1",
      [req.params.code],
    );
    return res.json({ status: "deleted" });
  }
);

module.exports = router;