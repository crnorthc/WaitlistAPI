const { 
    putSignup,
    getSignups,
    updateWaitlistLength,
    getUser,
    deleteUser
} = require('../dynamo')
const {  
    email_to_code, 
    code_to_email
} = require("../utils")
const {
    validate_api,
    validate_email,
    reference_check
} = require('../middleware/api')
const validate_creds = require("../middleware/auth")
const express = require("express")
const router = express.Router()

// Get All Signups on Waitlist
router.get('/:wl_id', validate_creds, (req, res) => {
    const wl_id = req.params.wl_id
    const last_key = req.body.last_key
    if (!wl_id) {
        return res.status(400).json({ msg: "Please provide a wl_id" })
    }

    getSignups(wl_id, last_key).then((signups, last_key) => {
        return res.json({ signups, last_key })
    }).catch(() => {
        return res.status(500).json({ msg: `Error getting waitlists for ${wl_id}`})
    })
})


// Add New User
router.post('/new', [validate_api, validate_email, reference_check], (req, res) => {        
    const created_at = Date.now()
    const first_name = req.body.first_name
    const last_name = req.body.last_name
    const email = req.body.email

    // Update Waitlist Length
    updateWaitlistLength(req.body.wl_id, req.body.user_id, 1, req.body.ref).then(new_position => {
        const item = {
            "wl_id": {"S": req.body.wl_id},
            "email": {"S": email},
            "refs": {"N": "0"},
            "first_name": {"S": first_name || ''},
            "last_name": {"S": last_name || ''},
            "created_at": {"N": created_at.toString()},
            "pos": {"N": new_position}
        }
    
        putSignup(item).then(() => {
            return res.json({ msg: `${email} added to waitlist`, user: item, id: email_to_code(email)})
        }).catch(() => {
            updateWaitlistLength(req.body.wl_id, req.body.user_id, -1)
            return res.status(500).json({ msg: `Error adding ${email}`})
        })        
    })
})


// Get User by ID
router.get('/user/:id', validate_api, (req, res) => {
    const id = req.params.id

    if (!id) {
        return res.status(400).json({ msg: "Please provide a id" })
    }

    getUser(code_to_email(id), req.body.wl_id).then(resp => {
        return res.json({ user: resp })
    }).catch(() => {
        return res.status(400).json({ msg: "No user found" })
    })
})


// Delete User 
router.delete('/', validate_creds, (req, res) => {
    const email = req.body.email
    const wl_id = req.body.wl_id
    const user_id = req.body.user_id

    if (!email || !wl_id || !user_id) {
        return res.status(400).json({ msg: "Please provide a wl_id, user_id, and email" })
    }

    deleteUser(email, wl_id, user_id).then(() => {
        return res.json({ msg: `${email} deleted` })
    })
})


module.exports = router