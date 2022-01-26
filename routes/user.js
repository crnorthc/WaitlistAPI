const express = require("express")
const { createUser, login } = require("../dynamo")
const { check_email } = require("../middleware/user")
const router = express.Router()

const ML_IN_YEAR = 1000 * 60 * 60 * 24 * 365

// Create User
router.post('/', check_email, (req, res) => {    
    const first_name = req.body.first_name
    const last_name = req.body.last_name
    const email = req.body.email
    const password = req.body.password

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
router.get('/', (req, res) => {    
    const email = req.body.email
    const password = req.body.password
    const remember = req.body.remember

    login(email, password).then(user => {
        if (remember) {
            res.cookie("creds", user.key, { httpOnly: true, expires: Date.now() + ML_IN_YEAR })
        }
        else {
            res.cookie("creds", user.key, { httpOnly: true })
        }
        res.json({ user: user.user })
    }).catch(() => {
        res.status(400).json({ msg: "invalid email or password" })
    })
})

module.exports = router