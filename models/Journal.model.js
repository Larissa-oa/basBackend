const { Schema, model } = require("mongoose");

const journalSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    mainImage: {
      type: String,
      required: false,
      trim: true,
    },
    images: [
      {
        type: String,
        required: false,
        trim: true,
      }
    ],
    text: {
      type: String,
      required: false,
      trim: true,
    }
  },
  {
    timestamps: true,
  }
);

const Journal = model("Journal", journalSchema);

module.exports = Journal;