// dummy database setup in MongoDB Atlas
import { MongoClient, ObjectId } from 'mongodb'

async function connectMongo() {
    // public dummy database
    const url =
        'mongodb+srv://demo:Xza0gixxmIWaJyk2@order-8bnsr.mongodb.net/test?retryWrites=true&w=majority'

    const client = await MongoClient.connect(url, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    return await client.db('order').collection('order-demo')
}

export async function insertOne(orderName: string) {
    const connection = await connectMongo()
    const result = await connection.insertOne({
        orderId: 2,
        orderName: orderName,
        desc: 'test',
        status: 'created',
    })
    return result.insertedId
}

export async function findOne(orderId: string) {
    let connection = await connectMongo()
    return await connection.findOne({ _id: new ObjectId(orderId) })
}

export async function updateOne(orderId: string, orderStatus: string) {
    let connection = await connectMongo()
    return await connection.findOneAndUpdate(
        { _id: new ObjectId(orderId) },
        { $set: { status: orderStatus } },
        { returnOriginal: false },
    )
}
