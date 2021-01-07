"use strict";

const db = require("./db");
const { NotFoundError } = require('./expressError');

async function doesCompanyExist(req, res, next){
  let result = await db.query(
    `SELECT code, name, description
      FROM companies
      WHERE code= $1;`, [req.params.code]);
  
  if (result.rows.length === 0) {
    throw new NotFoundError("Company not found");
  }
  return next();
}

module.exports = { doesCompanyExist };