const { validate } = require('../dynamo')

const validate_creds = (req, res, next) => {
    
    const creds = req.cookies.creds
    if (!creds) {
        return res.status(400).json({ msg: "not authenticated" })
    }

    // Validate Creds
    validate(creds).then(user => {
        req.body.user = user
        req.body.user_id = user.user_id.S
        next()
    }).catch(() => {
        return res.status(400).json({ msg: "not authenticated" })
    })
}

module.exports = validate_creds