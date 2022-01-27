const { validateEmail } = require("../utils")
const { emailExists } = require("../dynamo")

const check_email = (req, res, next) => {
    // Check email structure
    if (!req.body.email || !validateEmail(req.body.email)) {
        return res.status(400).json({ msg: "Invalid email" })
    }

    // Check to see if email exists
    emailExists(req.body.email).then(item => {
        if (item) {
            return res.status(400).json({ msg: "Email taken" })
        }
        else {
            next()
        }
    })
}

module.exports = {
    check_email
}