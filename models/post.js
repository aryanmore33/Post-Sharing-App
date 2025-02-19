const mongoose = require('mongoose')
const user = require('./user')

// mongoose.connect("mongodb://127.0.0.1:27017/posts")

const postSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user"
    },
    date: {
        // type: Date,
        // default: Date.now
        type: String, // Store as a formatted string
        default: () => {
            let istDate = new Date().toLocaleString("en-IN", { 
                timeZone: "Asia/Kolkata", 
                hour12: false  // Use 24-hour format
            });

            let [datePart, timePart] = istDate.split(", ");
            let [month, day, year] = datePart.split("/"); // MM/DD/YYYY format
            let [hours, minutes] = timePart.split(":");   // HH:MM:SS format

            return `${day.padStart(2, '0')}-${month.padStart(2, '0')}-${year} / ${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
        }

    },
    content: String,
    dataFiles: Buffer, //for file uploading in post

    likes: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "user"
        }
    ],
    dislikes: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "user"
        }
    ]
})

module.exports = mongoose.model("post", postSchema)