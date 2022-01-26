const { checkAPIKey, handleRef, getUser } = require('../dynamo')
const { validateEmail, code_to_email } = require('../utils')

const validate_api = (req, res, next) => {
    // Validate api_key
    const api_key = req.body.api_key
    checkAPIKey(api_key).then(resp => {
        req.body.wl_id = resp.id.S
        req.body.user_id = resp.user_id.S
        next()
    }).catch(() => {
        return res.status(400).json({ msg: "Invalid api_key" })
    })
}

const validate_email = (req, res, next) => {
    // Validate Email
    const email = req.body.email
    if (!email || !validateEmail(email)) {
        return res.status(400).json({ msg: "Please provide a valid email" })
    }
    // Check if email is already signed up
    getUser(email, req.body.wl_id).then(resp => {
        if (resp) {
            return res.json({ msg: "User already signed up", user: resp})
        }
        else {
            next()
        }       
    })
}

const reference_check = (req, res, next) => {
    // Reference check
    if (req.query.code) {
        handleRef(code_to_email(req.query.code), req.body.wl_id, req.body.user_id).then(() => {
            next()
        }).catch(() => {
            return res.status(400).json({ msg: "Invalid ref code" })
        })
    }
    else {
        next()
    }
}

module.exports = {
    validate_api,
    validate_email,
    reference_check
}