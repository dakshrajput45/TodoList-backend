const mongoose = require('mongoose');

// Define the User Details schema with an inline TaskSchema for tasks
const UserDetailsSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    tasks: {
        type: [{
            title: {
                type: String,
                required: true,
            },
            desc: {
                type: String,
                required: true,
            },
            dueDate: {
                type: Date,
                required: true,
            },
            status: {
                type:String,
                required:true,
            }
        }],
        default: []
    }
}, {
        collection: "UserInfo",
});

mongoose.model("UserInfo",UserDetailsSchema);