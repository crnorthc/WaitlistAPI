const express = require("express")
const { createUser, login } = require("../dynamo")
const { check_email } = require("../middleware/user")
const validate_creds = require('../middleware/auth')
const { handle_password } = require('../utils')
const router = express.Router()

const ML_IN_YEAR = 1000 * 60 * 60 * 24 * 365

// Create User
router.post('/', check_email, (req, res) => {    
    const first_name = req.body.first_name
    const last_name = req.body.last_name
    const email = req.body.email
    const password = handle_password(req.body.password)

    const item = {
        email: {S: email},
        first_name: {S: first_name},
        last_name: {S: last_name},
        password: {S: password}
    }

    createUser(item).then((user) => {
        return res.json({ msg: `${email} created`, user: user})
    }).catch(() => {
        return res.status(400).json({ msg: `could not create ${email}`})
    })
})


// Validate User
router.get('/login', (req, res) => {    
    const email = req.query.email
    const password = handle_password(req.query.password)
    const remember = req.query.remember

    login(email, password).then(user => {
        if (remember) {
            res.cookie("creds", user.key, { httpOnly: true, expires: Date.now() + ML_IN_YEAR })
        }
        else {
            res.cookie("creds", user.key, { httpOnly: true })
        }
        res.json({ user: user.user })
    }).catch(() => {
        res.status(400).json({ msg: "Invalid email or password" })
    })
})


// Get User
router.get('/', validate_creds, (req, res) => {    
    res.json({ user: req.body.user })
})


module.exports = router