const Transaction = require("../models/Transaction");

const checkIdempotency = async (idempotencyKey) => {

  if (!idempotencyKey) {
    return null;
  }

  return await Transaction.findOne({
    idempotencyKey
  });

};


module.exports = {
  checkIdempotency
};
