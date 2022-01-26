const KEY_COMBO = 'AaBbCcDdEeFfGgHhIiJjKkLlMmNnOoPpQqRrSsTtUuVvWwXxYyZz11111222223333344444555556666677777888889999900000'

const new_key = () => {
    var api_key = ''

    for (let i = 0; i < 20; i++) {        
        api_key += KEY_COMBO.charAt(Math.floor(Math.random() * KEY_COMBO.length))
    }

    return api_key
}

const new_uid = (length) => {
    var api_key = ''

    for (let i = 0; i < length; i++) {        
        api_key += KEY_COMBO.charAt(Math.floor(Math.random() * KEY_COMBO.length))
    }

    return api_key
}

const validateEmail = (email) => {
    const re = /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/
    return re.test(email)
};

const email_to_code = (email) => {
    var code = ''
    
    for (let i = 0; i < email.length; i++) {
        var hex = email.charCodeAt(i).toString(16)
        code += hex
    }

    return code
}

const code_to_email = (code) => {
    var email = ''

    for (let i = 0; i < code.length; i += 2) {
        var hex = code.substr(i, 2)
        email += String.fromCharCode(parseInt(hex, 16))
    }

    return email
}

module.exports = {
    newAPIKey: new_key,
    newUID: new_uid,
    validateEmail,
    code_to_email,
    email_to_code
}