const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const PrincipalSchema = new Schema(
  {
    PrincipalName: String,
    PrincipalPassword: String,
  },
  {
    timestamps: true,
  }
);

const Principal = mongoose.model("Principal", PrincipalSchema);
module.exports = Principal;
