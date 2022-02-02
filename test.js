const { putSignup } = require('./dynamo')

var pos = 6
const ML = 3600000 * 12
var date = Date.now()

for (let i =  0; i < 200; i++) {
    var item = {
        "wl_id": {"S": '3S1T48DBz47u4260155O'},
        "email": {"S": `crnorthc${10 + i}@gmail.com`},
        "refs": {"N": "0"},
        "first_name": {"S": 'Caleb'},
        "last_name": {"S": 'Northcott'},
        "created_at": {"N": (date - (ML * i)).toString()},
        "pos": {"N": `${pos + i}`}
    }

    putSignup(item)
}