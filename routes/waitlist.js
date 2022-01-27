const express = require("express")
const { putWaitlist, getWaitlists, addAPIKey, deleteWaitlist } = require('../dynamo')
const { newAPIKey, newUID } = require("../utils")
const validate_creds  = require("../middleware/auth")
const router = express.Router()

// Get User's Waitlists
router.get('/', validate_creds, (req, res) => {
    const user_id = req.body.user_id

    getWaitlists(user_id).then(resp => {
        return res.json({ waitlists: resp })
    }).catch(() => {
        return res.status(500).json({ msg: `Error getting waitlists for ${user_id}`})
    })
})


// Create New Waitlist
router.post('/new', validate_creds, (req, res) => {
    const user_id = req.body.user_id
    const name = req.body.name
    
    if (!user_id || !name) {
        return res.status(400).json({ msg: "Please provide a user_id and name" })
    }

    const origin_urls = req.body.origin_urls || ['']
    const ref_num = req.body.ref_num || 5
    const created_at = Date.now()
    
    const api_key = newAPIKey()
    const uid = newUID(20)
    addAPIKey(api_key, uid, user_id)

    const item = {
        "user_id": {"S": user_id},
        "uid": {"S": uid},
        "name": {"S": name},
        "api_key": {"S": api_key},
        "ref_num": {"N": ref_num.toString()},
        "origin_urls": {"SS": origin_urls},
        "created_at": {"N": created_at.toString()},
        "length": {"N": "0"},
        "referrals" : {"N": "0"}
    }

    putWaitlist(item).then(() => {
        return res.json({ msg: `${name} was created successfully`, waitlist: item})
    }).catch(() => {
        return res.status(500).json({ msg: `Error creating ${name}`})
    })
})


// Delete Waitlist
router.delete('/', validate_creds, (req, res) => {
    const user_id = req.body.user_id
    const wl_id = req.body.wl_id

    // Data check
    if (!user_id || !wl_id) {
        return res.status(400).json({ msg: "Please provide a user_id and wl_id" })
    }

    deleteWaitlist(user_id, wl_id).then((name) => {
        return res.json({ msg: `${name} deleted` })
    })
})


// Change Waitlist name, origin_urls, and/or ref_num
router.put('/update', validate_creds, (req, res) => {
    var waitlist = req.body.waitlist

    if (!waitlist) {
        return res.status(400).json({ msg: "Please provide a new waitlist object" })
    }

    putWaitlist(waitlist).then(() => {
        return res.json({ msg: "Update Successful", waitlist})
    }).catch(() => {
        return res.status(500).json({ msg: "Error Updating"})
    })
})


// New API Key
router.put('/new-key', validate_creds, (req, res) => {
    var waitlist = req.body.waitlist
    var api_key = newAPIKey()

    addAPIKey(api_key, waitlist.uid.S, waitlist.user_id.S)

    waitlist.api_key = {"S": api_key}

    putWaitlist(waitlist).then(() => {
        return res.json({ msg: 'New key created', waitlist})
    }).catch(() => {
        return res.status(500).json({ msg: "Error creating new key"})
    })
})


module.exports = router