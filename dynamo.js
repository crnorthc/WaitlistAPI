const { DynamoDBClient, PutItemCommand, QueryCommand, GetItemCommand, DeleteItemCommand } = require("@aws-sdk/client-dynamodb")
const AWS_config = require('./config')



const putWaitlist = (item) => new Promise((myResolve, myReject) => {
    const client = new DynamoDBClient(AWS_config)

    var params = {
        TableName: 'WAITLIST',
        Item: item
    }

    const command = new PutItemCommand(params)

    client.send(command)
    .then(() => {
        myResolve()
    }).catch((err) => {
        myReject()
    })
})


const addAPIKey = (api_key, waitlist_id, user_id) => {
    const client = new DynamoDBClient(AWS_config)

    var params = {
        TableName: 'APIS',
        Item: {
            'api_key': {'S': api_key},
            'id': {'S': waitlist_id},
            'user_id': {'S': user_id}
        }
    }

    const command = new PutItemCommand(params)

    client.send(command)
}


const checkAPIKey = (api_key) => new Promise((myResolve, myReject) => {
    const client = new DynamoDBClient(AWS_config)
    const params = {
        TableName: 'APIS',
        Key: {
            'api_key': {'S': api_key}
        }
    }    

    const command = new GetItemCommand(params)
    client.send(command).then(resp => {
        myResolve(resp.Item)
    }).catch(() => {
        myReject()
    })
})


const getWaitlists = (user_id) => new Promise((myResolve, myReject) => {
    const client = new DynamoDBClient(AWS_config)

    var params = {
        TableName: 'WAITLIST',
        KeyConditionExpression: "user_id = :k",
        ExpressionAttributeValues: {
            ":k": { "S": user_id}
        }
    }

    const command = new QueryCommand(params)

    client.send(command)
    .then((res) => {
        myResolve(res.Items)
    }).catch((err) => {
        myReject()
    })
})


const handleRef = async function(email, wl_id, user_id) {
        const client = new DynamoDBClient(AWS_config)
        // Get users current refs
        var params = {
            TableName: 'SIGNUP',
            Key: {
                'wl_id': {"S": wl_id},
                'email': {"S": email}
            }
        }    
        var command = new GetItemCommand(params)        
        var response = await client.send(command)
        const refed_user = response.Item
        const position = parseInt(refed_user.pos.N)
    
        // Get number of spots to move user
        params = {
            TableName: 'WAITLIST',
            Key: {
                'uid': {"S": wl_id},
                'user_id': {"S": user_id}
            }
        }
        command = new GetItemCommand(params)
        response = await client.send(command) 
        const waitlist = response.Item
        var start = position - parseInt(waitlist.ref_num.N)
        start < 1 ? start = 1 : start - start
        const end = position - 1
    
        // Update positions of other users
        params = {
            TableName: 'SIGNUP',
            KeyConditionExpression: "wl_id = :k",
            FilterExpression: "pos <= :end and pos >= :start",
            ExpressionAttributeValues: {
                ":k": { "S": wl_id},
                ":end": {"N": end.toString()},
                ":start": {"N": start.toString()}
            }       
        }
        command = new QueryCommand(params)
        response = await client.send(command)
        const users = response.Items
        
    
        users.forEach(user => {
            user.pos.N = (parseInt(user.pos.N) + 1).toString()
            params = {
                TableName: 'SIGNUP',
                Item: user
            }
            command = new PutItemCommand(params)
            client.send(command)
        })
    
        // Update user's position accounting for new reference
        refed_user.pos.N = start.toString()
        refed_user.refs.N = (parseInt(refed_user.refs.N) + 1).toString()
        params = {
            TableName: 'SIGNUP',
            Item: refed_user
        }
        command = new PutItemCommand(params)
        client.send(command)
}


const putSignup = (item) => new Promise((myResolve, myReject) => {
    const client = new DynamoDBClient(AWS_config)

    var params = {
        TableName: 'SIGNUP',
        Item: item
    }

    const command = new PutItemCommand(params)

    client.send(command)
    .then(() => {
        myResolve()
    }).catch(() => {
        myReject()
    })
})


const getSignups = (wl_id, last_key) => new Promise((myResolve, myReject) => {
    const client = new DynamoDBClient(AWS_config)

    var params = {
        TableName: 'SIGNUP',
        KeyConditionExpression: "wl_id = :k",
        ExpressionAttributeValues: {
            ":k": { "S": wl_id}
        }
    }

    if (last_key) {
        params.ExclusiveStartKey = last_key
    }

    const command = new QueryCommand(params)

    client.send(command)
    .then((resp) => {
        myResolve(resp.Items. resp.LastEvaluatedKey)
    }).catch((err) => {
        myReject()
    })
})


const updateWaitlistLength = async function(wl_id, user_id, change) {
    const client = new DynamoDBClient(AWS_config)

    // Get waitlist
    var params = {
        TableName: 'WAITLIST',
        Key: {
            "user_id": {"S": user_id},
            "uid": {"S": wl_id}
        }
    }
    var command = new GetItemCommand(params)
    const response = await client.send(command)
    var waitlist = response.Item
    waitlist.length.N = (parseInt(waitlist.length.N) + change).toString()

    // Update length
    params = {
        TableName: 'WAITLIST',
        Item: waitlist
    }
    command = new PutItemCommand(params)
    client.send(command)
    return waitlist.length.N
}


const getUser = (email, wl_id) => new Promise((myResolve, myReject) => {
    const client = new DynamoDBClient(AWS_config)

    var params = {
        TableName: 'SIGNUP',
        Key: {
            "email": {"S": email},
            "wl_id": {"S": wl_id}
        }
    }

    const command = new GetItemCommand(params)

    client.send(command)
    .then((res) => {
        myResolve(res.Item)
    }).catch(() => {
        myReject()
    })
})


const deleteUser = async function(email, wl_id, user_id) {
    const client = new DynamoDBClient(AWS_config)

    // Get user 
    const user = await getUser(email, wl_id)

    // Update positions of users behind
    var params = {
        TableName: 'SIGNUP',
        KeyConditionExpression: "wl_id = :k",
        FilterExpression: "pos > :start",
        ExpressionAttributeValues: {
            ":k": { "S": wl_id},
            ":start": {"N": user.pos.N}
        }       
    }
    var command = new QueryCommand(params)
    var response = await client.send(command)
    const users = response.Items

    users.forEach(user => {
        user.pos.N = (parseInt(user.pos.N) - 1).toString()
        params = {
            TableName: 'SIGNUP',
            Item: user
        }
        command = new PutItemCommand(params)
        client.send(command)
    })

    // Delete User
    params = {
        TableName: 'SIGNUP',
        Key: {
            "email": {"S": email},
            "wl_id": {"S": wl_id}
        }
    }
    command = new DeleteItemCommand(params)
    client.send(command)

    // Update Waitlist Length
    updateWaitlistLength(wl_id, user_id, -1)
}

const deleteUsers = async function(wl_id, last_key=null) {
    var params = {
        TableName: 'SIGNUP',
        KeyConditionExpression: "wl_id = :k",
        ExpressionAttributeValues: {
            ":k": { "S": wl_id}
        }
    }
    if (last_key) {
        params.ExclusiveStartKey = last_key
    }
    var command = new QueryCommand(params)

    client.send(command).then((resp) => {
        const users = resp.Items
        users.forEach(user => {
            params = {
                TableName: 'SIGNUP',
                Key: {
                    "wl_id": {"S": wl_id},
                    "email": {"S": user.email.S}
                }
            }
            command = new DeleteItemCommand(params)
            client.send(command)
        })
        return resp.LastEvaluatedKey
    })
}

const deleteWaitlist = async function(user_id, wl_id) {
    const client = new DynamoDBClient(AWS_config)

    // Delete Waitlist
    var params = {
        TableName: 'WAITLIST',
        ReturnValues: "ALL_OLD",
        Key: {
            "user_id": {"S": user_id},
            "uid": {"S": wl_id}
        }
    }
    var command = new DeleteItemCommand(params)
    var response = await client.send(command)
    const waitlist = response.Attributes
    

    // Delete API Key reference
    params = {
        TableName: 'APIS',
        Key: {
            "api_key": {"S": waitlist.api_key.S}
        }
    }
    command = new DeleteItemCommand(params)
    client.send(command)


    // Delete Waitlist's users
    var last_key = await deleteUsers(wl_id)
    while (last_key) {
        last_key = await deleteUsers(wl_id)
    }
}

module.exports = {
    putWaitlist,
    getWaitlists,
    handleRef,
    addAPIKey,
    checkAPIKey,
    putSignup,
    getSignups,
    getUser,
    updateWaitlistLength,
    deleteUser,
    deleteWaitlist
}