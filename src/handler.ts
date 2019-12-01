import {
    APIGatewayProxyEvent,
    APIGatewayEventRequestContext,
    SNSEvent,
} from 'aws-lambda'
import { findOne, insertOne, updateOne } from './mongo'
import { SNS } from 'aws-sdk'

export const createOrder = async (
    event: APIGatewayProxyEvent,
    _context: APIGatewayEventRequestContext,
) => {
    const body = event.body ? JSON.parse(event.body) : {}
    const id = await insertOne(body.orderName)

    // assuming payment app is hosted in different api gateway
    const response = await fetch('http://localhost:3000/payment', {
        method: 'post',
        body: JSON.stringify({
            cardNumber: body.cardNumber,
        }),
        headers: {
            Accept: 'application/json',
            Authorization: 'Bearer dummytoken',
        },
    })

    const orderStatus = response.status == 200 ? 'confirmed' : 'cancelled'

    if (response.status == 200) {
        console.log(response.status)
        // event to change order status to delivery
        const sns = await new SNS({
            endpoint: 'http://127.0.0.1:4002',
            region: 'us-east-1',
        })
        await sns.publish(
            {
                Message: `{"default": "${id}"}`,
                MessageStructure: 'json',
                TopicArn: 'arn:aws:sns:us-east-1:123456789012:test-topic',
            },
            (err, data) => {
                console.log(err)
                console.log(data)
            },
        )
    }

    await updateOne(id as string, orderStatus)

    return {
        statusCode: response.status,
        body: JSON.stringify({
            insertedId: id,
        }),
    }
}

export const getOrder = async (
    event: APIGatewayProxyEvent,
    _context: APIGatewayEventRequestContext,
) => {
    console.log(`=> get order event trigger`)

    const pathParameters = event.pathParameters

    if (pathParameters) {
        const result = await findOne(pathParameters.orderId)
        return {
            statusCode: 200,
            body: JSON.stringify({
                data: result,
            }),
        }
    }

    return {
        statusCode: 500,
        body: JSON.stringify({
            data: 'Path /{orderId} is not specified',
        }),
    }
}

export const cancelOrder = async (
    event: APIGatewayProxyEvent,
    _context: APIGatewayEventRequestContext,
) => {
    console.log(`=> cancel order event trigger`)

    const pathParameters = event.pathParameters

    if (pathParameters) {
        const result = await updateOne(pathParameters.orderId, 'cancelled')
        return {
            statusCode: 200,
            body: JSON.stringify({
                data: result.value,
            }),
        }
    }

    return {
        statusCode: 500,
        body: JSON.stringify({
            data: 'Path /{orderId} is not specified',
        }),
    }
}

export const delivery = async (event: SNSEvent) => {
    console.log('=> delivery event trigger')

    const objectId = event.Records[0].Sns.Message
    const result = await updateOne(objectId as string, 'delivered')

    console.log(`=> Order ${objectId} is delivered.`)
    console.log(`=> ${JSON.stringify(result.value)}`)

    return {
        statusCode: 200,
        body: JSON.stringify({
            data: result.value,
        }),
    }
}

export const payment = async (
    event: APIGatewayProxyEvent,
    _context: APIGatewayEventRequestContext,
) => {
    console.log(`=> payment event trigger`)

    const { headers, body } = event
    const { authorization = '' } = headers
    const { cardNumber } = JSON.parse(body as string)

    // mock payment response
    if (!cardNumber || !authorization) {
        console.log(
            `=> Order declined please provide card number or auth header`,
        )
        return {
            statusCode: 500,
            body: JSON.stringify({
                data: 'Declined',
            }),
        }
    }

    console.log(`=> Order is paid with card number - ${cardNumber}`)
    return {
        statusCode: 200,
        body: JSON.stringify({
            data: 'Success',
        }),
    }
}
