import { APIGatewayProxyEvent, APIGatewayEventRequestContext } from 'aws-lambda'
import {
    payment,
    delivery,
    getOrder,
    cancelOrder,
    createOrder,
} from './handler'
import { findOne, insertOne, updateOne } from './mongo'
import aws from 'aws-sdk'
import awsMock from 'aws-sdk-mock'

// mock
jest.mock('./mongo')
const globalMock: any = global
const mockedFindOne = findOne as jest.Mock
const mockedInsertOne = insertOne as jest.Mock
const mockedUpdateOne = updateOne as jest.Mock
const contextMock = jest.fn<APIGatewayEventRequestContext, []>()

describe('handler', () => {
    it('fail payment', async () => {
        const proxyEventMock = jest.fn<APIGatewayProxyEvent, []>(
            () =>
                <APIGatewayProxyEvent>{
                    body: JSON.stringify({
                        cardNumber: 124,
                    }),
                    headers: {},
                },
        )

        expect(await payment(proxyEventMock(), contextMock())).toEqual({
            body: '{"data":"Declined"}',
            statusCode: 500,
        })
    })

    it('success payment', async () => {
        const proxyEventMock = jest.fn<APIGatewayProxyEvent, []>(() => {
            return <APIGatewayProxyEvent>(<unknown>{
                body: JSON.stringify({
                    cardNumber: 124,
                }),
                headers: { authorization: 'Bearer token' },
            })
        })

        expect(await payment(proxyEventMock(), contextMock())).toEqual({
            body: '{"data":"Success"}',
            statusCode: 200,
        })
    })

    it('createOrder pass', async () => {
        const proxyEventMock = jest.fn<APIGatewayProxyEvent, []>(() => {
            return <APIGatewayProxyEvent>(<unknown>{
                body: JSON.stringify({
                    orderName: 'example order',
                    cardNumber: 124,
                }),
            })
        })

        globalMock.fetch = jest.fn().mockReturnValue({
            status: 200,
        })

        awsMock.setSDKInstance(aws)
        awsMock.mock('SNS', 'publish', () => {})

        mockedInsertOne.mockReturnValue({
            example: 'mockedData',
        })

        mockedUpdateOne.mockReturnValue({
            value: { example: 'cancelled' },
        })

        expect(await createOrder(proxyEventMock(), contextMock())).toEqual({
            body: JSON.stringify({
                insertedId: {
                    example: 'mockedData',
                },
            }),
            statusCode: 200,
        })

        awsMock.restore()
        globalMock.fetch.mockClear()
        delete globalMock.fetch
    })

    it('createOrder fail', async () => {
        const proxyEventMock = jest.fn<APIGatewayProxyEvent, []>(() => {
            return <APIGatewayProxyEvent>(<unknown>{
                body: JSON.stringify({
                    orderName: 'example order',
                    cardNumber: 124,
                }),
            })
        })

        globalMock.fetch = jest.fn().mockReturnValue({
            status: 500,
        })

        mockedInsertOne.mockReturnValue({
            example: 'mockedData',
        })

        mockedUpdateOne.mockReturnValue({
            value: { example: 'cancelled' },
        })

        expect(await createOrder(proxyEventMock(), contextMock())).toEqual({
            body: JSON.stringify({
                insertedId: {
                    example: 'mockedData',
                },
            }),
            statusCode: 500,
        })

        globalMock.fetch.mockClear()
        delete globalMock.fetch
    })

    it('getOrder success', async () => {
        const proxyEventMock = jest.fn<APIGatewayProxyEvent, []>(() => {
            return <APIGatewayProxyEvent>(<unknown>{
                pathParameters: {
                    orderId: 123,
                },
            })
        })
        mockedFindOne.mockReturnValue({
            example: 'mockedData',
        })

        expect(await getOrder(proxyEventMock(), contextMock())).toEqual({
            body: JSON.stringify({
                data: {
                    example: 'mockedData',
                },
            }),
            statusCode: 200,
        })
    })

    it('getOrder fail', async () => {
        const proxyEventMock = jest.fn<APIGatewayProxyEvent, []>(() => {
            return <APIGatewayProxyEvent>(<unknown>{})
        })

        expect(await getOrder(proxyEventMock(), contextMock())).toEqual({
            body: JSON.stringify({
                data: 'Path /{orderId} is not specified',
            }),
            statusCode: 500,
        })
    })

    it('cancelOrder success', async () => {
        const proxyEventMock = jest.fn<APIGatewayProxyEvent, []>(() => {
            return <APIGatewayProxyEvent>(<unknown>{
                pathParameters: {
                    orderId: 123,
                },
            })
        })
        mockedUpdateOne.mockReturnValue({
            value: { example: 'cancelled' },
        })

        expect(await cancelOrder(proxyEventMock(), contextMock())).toEqual({
            body: JSON.stringify({
                data: {
                    example: 'cancelled',
                },
            }),
            statusCode: 200,
        })
    })

    it('cancelOrder fail', async () => {
        const proxyEventMock = jest.fn<APIGatewayProxyEvent, []>(() => {
            return <APIGatewayProxyEvent>(<unknown>{})
        })

        expect(await cancelOrder(proxyEventMock(), contextMock())).toEqual({
            body: JSON.stringify({
                data: 'Path /{orderId} is not specified',
            }),
            statusCode: 500,
        })
    })

    it('delivery', async () => {
        const mockEvent = {
            Records: [
                {
                    EventSource: 'aws:sns',
                    EventVersion: '1.0',
                    EventSubscriptionArn:
                        'arn:aws:sns:us-east-1:123456789:service-1474781718017-1:fdaa4474-f0ff-4777-b1c4-79b96f5a504f',
                    Sns: {
                        Type: 'Notification',
                        MessageId: '52ed5e3d-5fgf-56bf-923d-0e5c3b503c2a',
                        TopicArn:
                            'arn:aws:sns:us-east-1:123456789:service-1474781718017-1',
                        Subject: '',
                        Message: '5de29190ccaf9732c4fb4287',
                        Timestamp: '2016-09-25T05:37:51.150Z',
                        SignatureVersion: '1',
                        Signature:
                            'V5QL/dhow62Thr9PXYsoHA7bOsDFkLdWZVd8D6LyptA6mrq0Mvldvj/XNtai3VaPp84G3bD2nQbiuwYbYpu9u9uHZ3PFMAxIcugV0dkOGWmYgKxSjPApItIoAgZyeH0HzcXHPEUXXO5dVT987jZ4eelD4hYLqBwgulSsECO9UDCdCS0frexiBHRGoLbWpX+2Nf2AJAL+olEEAAgxfiPEJ6J1ArzfvTFZXdd4XLAbrQe+4OeYD2dw39GBzGXQZemWDKf4d52kk+SwXY1ngaR4UfExQ10lDpKyfBVkSwroaq0pzbWFaxT2xrKIr4sk2s78BsPk0NBi55xA4k1E4tr9Pg==',
                        SigningCertUrl:
                            'https://sns.us-east-1.amazonaws.com/SimpleNotificationService-b95095beb82e8f6a0e6b3aafc7f4149a.pem',
                        UnsubscribeUrl:
                            'https://sns.us-east-1.amazonaws.com/?Action=Unsubscribe&SubscriptionArn=arn:aws:sns:us-east-1:123456789:service-1474781718017-1:fdaa4474-f0ff-4777-b1c4-79b96f5a504f',
                        MessageAttributes: {},
                    },
                },
            ],
        }

        mockedUpdateOne.mockReturnValue({
            value: { example: 'delivered' },
        })

        expect(await delivery(mockEvent)).toEqual({
            body: JSON.stringify({
                data: {
                    example: 'delivered',
                },
            }),
            statusCode: 200,
        })
    })
})
