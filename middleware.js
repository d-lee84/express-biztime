"use strict";

const db = require("./db");
const { NotFoundError } = require('./expressError');


/** Checks the database to see if there is a company with a given code
 *  - If the company does not exist, throw 404 error
 */

async function doesCompanyExist(req, res, next){
  let result = await db.query(
    `SELECT code, name, description
      FROM companies
      WHERE code= $1;`, [req.params.code]);
  
  if (result.rows.length === 0) {
    throw new NotFoundError("Company not found");
  }
  req.foundComp = result.rows[0];
  
  return next();
}

module.exports = { doesCompanyExist };