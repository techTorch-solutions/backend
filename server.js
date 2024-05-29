const app = require("./app");
const port = process.env.PORT || 5000
const { connectDB } = require('./config/database')

console.log("Connecting to database")
connectDB()
app.listen(port, () => {
    console.log(`Server is Running on Port: ${port}`)
})

