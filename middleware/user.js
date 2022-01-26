const { validateEmail } = require("../utils")
const { emailExists } = require("../dynamo")

const check_email = (req, res, next) => {
    // Check email structure
    if (!validateEmail(req.body.email)) {
        res.status(400).json({ msg: "invalid email" })
    }

    // Check to see if email exists
    emailExists(req.body.email).then(item => {
        if (item) {
            res.status(400).json({ msg: "email taken" })
        }
        else {
            next()
        }
    })
}

module.exports = {
    check_email
}