/** BizTime express application. */

const express = require("express");
const { NotFoundError } = require("./expressError");

const app = express();

/** Parses JSON request into req.body */
app.use(express.json());

/** Routes handlers for '/companies' */
const companiesRoutes = require("./routes/companies");
app.use("/companies", companiesRoutes);

/** 404 handler: matches unmatched routes; raises NotFoundError. */
app.use(function (req, res, next) {
  return next(new NotFoundError());
});

/** Error handler: logs stacktrace and returns JSON error message. */
app.use(function (err, req, res, next) {
  const status = err.status || 500;
  const message = err.message;
  if (process.env.NODE_ENV !== "test") console.error(status, err.stack);
  return res.status(status).json({ error: { message, status } });
});



module.exports = app;
