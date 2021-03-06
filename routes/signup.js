const { 
    putSignup,
    getSignups,
    updateWaitlistLength,
    getSignup,
    deleteUsers,
    increaseOffboard,
    newOffboard
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
    const last_key = req.query.last_key

    if (!wl_id) {
        return res.status(400).json({ msg: "Please provide a wl_id" })
    }

    getSignups(wl_id, last_key).then((resp) => {
        return res.json({ signups: resp.signups, last_key:resp.last_key })
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

    getSignup(code_to_email(id), req.body.wl_id).then(resp => {
        return res.json({ user: resp })
    }).catch(() => {
        return res.status(400).json({ msg: "No user found" })
    })
})


// Delete User 
router.post('/delete', validate_creds, (req, res) => {
    const emails = req.body.emails
    const wl_id = req.body.wl_id
    const user_id = req.body.user_id

    if (!emails || !wl_id || !user_id) {
        return res.status(400).json({ msg: "Please provide a wl_id, user_id, and email" })
    }

    deleteUsers(emails, wl_id, user_id).then(() => {
        getSignups(wl_id, null).then((resp) => {
            return res.json({ msg: 'Users Deleted', signups: resp.signups })
        })        
    }).catch((err) => {
        getSignups(wl_id, null).then((resp) => {
            return res.status(500).json({ msg: err.msg, signups: resp.signups })
        })
    })
})


// Offboard User
router.put('/off', validate_creds, (req, res) => {        
    const wl_id = req.body.wl_id
    const email = req.body.email
    const user_id = req.body.user_id

    getSignup(email, wl_id).then(user => {
        deleteUsers([email], wl_id, user_id).then(() => {                
            increaseOffboard(wl_id, user_id, 1).then((num_offs) => {                
                // Increase offboard number
                const offed = Date.now()
                user.offed = {N: offed.toString()}
                user.og_pos = user.pos
                delete user.pos
                user.off_pos = {N: num_offs}
                newOffboard(user).then(offboards => {
                    return res.json({ msg: "Offboarded User", offboards })
                }).catch(() => {
                    increaseOffboard(wl_id, user_id, -1)
                    return res.status(400).json({ msg: "Error creating offboard" })
                })               
            }).catch(() => {            
                return res.status(400).json({ msg: "Error updating waitlist" })
            })
        }).catch(() => { 
            return res.status(400).json({ msg: "Error deleting user" })
        })
    }).catch(() => {
        return res.status(400).json({ msg: "No user found" })
    })
})


module.exports = router