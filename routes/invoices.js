"use strict";

const express = require("express");

const db = require("../db");
const router = new express.Router();

const { BadRequestError, NotFoundError } = require('../expressError');
const HTTP_STATUS_OK = 200;
const HTTP_STATUS_CREATED = 201;


/** GET /invoices: get a list of all the invoices
 *  - Returns {invoices: [{id, comp_code}, ...]}
*/

router.get(
  "/", 
  async function (req, res, next) {
    let result = await db.query(
      `SELECT id, comp_code 
        FROM invoices;`
    );
    
    let invoices = result.rows;

    return res.json({ invoices });
  }
);

/** GET /invoices/[id]: get a list of all the invoices
 *  - If invoice does not exist, throw 404 error
 *  - Returns {invoice: {id, amt, paid, add_date, paid_date, 
 *             company: {code, name, description}}
*/

router.get(
  "/:id", 
  async function (req, res, next) {
    const { id } = req.params;

    const iResults = await db.query(
      ` SELECT id, amt, paid, add_date, paid_date, comp_code
          FROM invoices
          WHERE id = $1`,
        [id] 
    )
    const invoice = iResults.rows[0];
    
    if(!invoice) throw new NotFoundError("Invoice doesn't exist!")

    const cResults = await db.query(
      `SELECT code, name, description 
        FROM companies
        WHERE code = $1`,
      [invoice.comp_code]
    )
    
    delete invoice.comp_code;
    invoice.company = cResults.rows[0];
    return res.json({ invoice });
  }
);

/** POST /invoices: Creates an invoice
 *  - If comp_code doesn't exist, throw a 400
 *  - Returns {invoice: {id, comp_code, amt, paid, add_date, paid_date}}
*/

router.post(
  "/", 
  async function (req, res, next) {
    const { comp_code, amt } = req.body;

    let result; 
    try {
      result = await db.query(
      `INSERT INTO invoices (comp_code, amt)
            VALUES ($1, $2)
            RETURNING id, comp_code, amt, paid, add_date, paid_date`,
      [comp_code, amt],
    );
    } catch {
      throw new BadRequestError("Company code doesn't exist!");
    }

    const invoice = result.rows[0];
    return res.status(HTTP_STATUS_CREATED).json({ invoice });
  }
);


/** PUT /invoices/[id]: Updates an invoice
 *  - If invoice not found, throw a 404 error 
 *  - Returns {invoice: {id, comp_code, amt, paid, add_date, paid_date}}
 */

router.put(
  "/:id", 
  async function (req, res, next) {
    const { amt } = req.body;
    const { id } = req.params;

    let result = await db.query(
      `UPDATE invoices
        SET amt=$1
        WHERE id=$2
        RETURNING id, comp_code, amt, paid, add_date, paid_date`,
      [amt, id],
    );
    
    let invoice = result.rows[0];

    if (!invoice) throw new NotFoundError("Invoice doesn't exist!");
    
    return res.status(HTTP_STATUS_OK).json({ invoice });
  }
);

/** DELETE /invoices/[id]: Deletes an invoice
 *  - If invoice not found, throw a 404 error 
 *  - Returns {status: "deleted"} if successful
 */

router.delete(
  "/:id", 
  async function (req, res, next) {
    const { id } = req.params;

    let results = await db.query(
      `DELETE FROM invoices WHERE id = $1
      RETURNING id`,
      [id],
    );

    if (!results.rows[0]) throw new NotFoundError("Invoice doesn't exist!");

    return res.json({ status: "deleted" });
  }
);

module.exports = router;