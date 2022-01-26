const express = require('express')

const app = express()

// Body Parser Middleware
app.use(express.json())
app.use(express.urlencoded({extended: false}))

// Waitlist APIs
app.use('/api/waitlist', require('./routes/waitlist'))

// Signup APIs
app.use('/api/signup', require('./routes/signup'))

// User APIs
app.use('/api/user', require('./routes/user'))

const PORT = process.env.PORT || 5000

app.listen(PORT, () => {
	console.log(`Server Started on port: ${PORT}`)
})