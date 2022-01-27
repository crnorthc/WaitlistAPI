const express = require('express')
const cors = require('cors')
const cookieParser = require('cookie-parser')

const app = express()

var whitelist = [
	'http://127.0.0.1:3000'
]

var corsOptions = {
    origin: function(origin, callback){
        var originIsWhitelisted = whitelist.indexOf(origin) !== -1;
        callback(null, originIsWhitelisted);
    },
    credentials: true
};

// Body Parser Middleware
app.use(express.json())
app.use(express.urlencoded({extended: false}))

// Except requests from client
app.use(cors(corsOptions))

// Cookie Parser
app.use(cookieParser())

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