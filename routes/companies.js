const express = require("express");

const db = require("../db");
const router = new express.Router();
const { NotFoundError } = require('../expressError');


/** GET /companies: get a list of all the companies 
 *  - Returns {companies: [{code, name}, ...]}
*/
router.get("/", async function (req, res, next) {
  let result = await db.query(
    `SELECT code, name
      FROM companies;`
  );
  return res.json({companies: result.rows})
});

/** GET /companies/[code]: Gets one specific company
 *  - Returns {company: {code, name, description}}
 */
router.get("/:code", async function (req, res, next) {
  let result = await db.query(
    `SELECT code, name, description
      FROM companies
      WHERE code= $1;`, [req.params.code]);
  
  if (result.rows.length === 0) {
    throw new NotFoundError("Company not found");
  }

  return res.json({companies: result.rows[0]});
});

module.exports = router;