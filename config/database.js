const mongoose = require("mongoose");

exports.connectDB = async () => {
    try {
        mongoose.set("strictQuery", false);
        const { connection } = await mongoose.connect(process.env.MONGO_URL);
        console.log(`MongoDB Connected: ${connection.host}`);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};