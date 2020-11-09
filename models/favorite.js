const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const favoriteSchema = new Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',  //name of corresponding model
    },
    campsites: [
        {  // <--- [] enables us to store an array of campsite ids in this field
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Campsite',
        }
    ],
}, {
    timestamps: true,
});

const Favorite = mongoose.model("Favorite", favoriteSchema);

module.exports = Favorite;
