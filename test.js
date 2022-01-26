const email_to_code = (email) => {
    var code = ''
    
    for (let i = 0; i < email.length; i++) {
        var hex = email.charCodeAt(i).toString(16)
        code += hex
    }

    return code
}

console.log(email_to_code("crnorthc105@gmail.com"))