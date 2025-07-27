const { Schema, model, Types } = require("mongoose");

const userSchema = new Schema(
  {
    email: {
      type: String,
      required: [true, "Email is required."],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required."],
    },
    name: {
      type: String,
      required: [true, "Name is required."],
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    favoriteJournals: [{ type: Types.ObjectId, ref: "Journal" }],
    favoriteRecipes: [{ type: Types.ObjectId, ref: "Recipe" }],
  },
  {
    timestamps: true,
  }
);

const User = model("User", userSchema);
module.exports = User;
