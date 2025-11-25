const mongoose = require("mongoose");
const logger = require("../logger");

/**
 * Executes a callback within a transaction if supported by the MongoDB environment.
 * If transactions are not supported (e.g., Standalone), it falls back to executing
 * the callback without a transaction.
 *
 * @param {Function} callback - Async function that receives a session object.
 * @returns {Promise<any>} - The result of the callback.
 */
const runInTransaction = async (callback) => {
  const session = await mongoose.startSession();
  let result;

  try {
    // Attempt to start a transaction
    session.startTransaction();
    result = await callback(session);
    await session.commitTransaction();
    return result;
  } catch (error) {
    // Abort the transaction on error
    if (session.inTransaction()) {
      await session.abortTransaction();
    }

    // Check if the error is due to lack of Replica Set (Standalone)
    // Error code 20 is "IllegalOperation", often seen when using transactions on standalone
    // The message usually contains "Transaction numbers are only allowed..."
    const isReplicaSetError =
      error.message &&
      (error.message.includes("Transaction numbers are only allowed on a replica set member") ||
       error.message.includes("This MongoDB deployment does not support retryable writes"));

    if (isReplicaSetError) {
      logger.warn(
        "MongoDB Transaction failed (Standalone detected). Retrying operation without transaction."
      );
      // Retry without transaction
      // We pass 'null' or a dummy session object depending on how the callback uses it.
      // Mongoose operations ignore 'null' session.
      try {
        result = await callback(null);
        return result;
      } catch (retryError) {
        throw retryError;
      }
    }

    // If it's another error, rethrow it
    throw error;
  } finally {
    session.endSession();
  }
};

module.exports = { runInTransaction };
