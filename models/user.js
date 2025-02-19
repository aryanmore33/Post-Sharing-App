const mongoose = require('mongoose');

mongoose.connect("mongodb://127.0.0.1:27017/post_sharing_users")

const userSchema = mongoose.Schema({
    username: String,
    name: String,
    age: Number,
    email: String,
    password: String,
    // dp: Buffer, //for porfile picture
    dp: {
            type: Buffer,  
            default: "default.jpg"
        },
    posts: [{   type: mongoose.Schema.Types.ObjectId, ref:"post"  }]
})

module.exports = mongoose.model('user', userSchema);