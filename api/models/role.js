const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const RoleSchema = new Schema({
  id: { type: Number },
  name: { type: String }
});


// Export model
module.exports = mongoose.model("Role", RoleSchema);
