const { validate } = require('../dynamo')

const validate_creds = (req, res, next) => {
    // Check email structure
    const creds = req.cookies.creds
    if (!creds) {
        return res.status(400).json({ msg: "not authenticated" })
    }

    // Validate Creds
    validate(creds).then(user_id => {
        req.body.user_id = user_id
        next()
    }).catch(() => {
        return res.status(400).json({ msg: "not authenticated" })
    })
}

module.exports = validate_creds