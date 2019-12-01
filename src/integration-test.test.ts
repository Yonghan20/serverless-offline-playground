// assuming the integration test will be run in real environment
// this will test against the endpoint
const assert = require('assert').strict
const axios = require('axios')

describe('integration test', () => {
    it('create order success', async () => {
        const response = await axios.post(
            'http://localhost:3000/order',
            {
                cardNumber: '4a242',
                orderName: 'integration test order',
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    authorization: 'test',
                },
            },
        )

        expect(response.status).toBe(200)
        expect(response.data).toHaveProperty('insertedId')

        const getResponse = await axios.get(
            `http://localhost:3000/order/${response.data.insertedId}`,
        )

        expect(getResponse.status).toBe(200)
        expect(getResponse.data.data).toMatchObject({
            _id: response.data.insertedId,
            orderName: 'integration test order',
            status: 'delivered',
        })
    })

    it('create order fail payment', async () => {
        try {
            await axios.post(
                'http://localhost:3000/order',
                {
                    orderName: 'integration test order',
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        authorization: 'test',
                    },
                },
            )
        } catch (error) {
            expect(error.response.status).toBe(500)
            expect(error.response.data).toHaveProperty('insertedId')

            const getResponse = await axios.get(
                `http://localhost:3000/order/${error.response.data.insertedId}`,
            )

            expect(getResponse.status).toBe(200)
            expect(getResponse.data.data).toMatchObject({
                _id: error.response.data.insertedId,
                orderName: 'integration test order',
                status: 'cancelled',
            })
        }
    })

    it('get order', async () => {
        const response = await axios.get(
            'http://localhost:3000/order/5de36417a5873c12187b59d4',
        )

        expect(response.status).toBe(200)
        expect(response.data.data).toEqual({
            _id: '5de36417a5873c12187b59d4',
            orderId: 2,
            orderName: 'dummy asdasasd',
            desc: 'test',
            status: 'confirmed',
        })
    })

    it('cancel order', async () => {
        const response = await axios.put(
            'http://localhost:3000/order/5de29190ccaf9732c4fb4287',
        )

        expect(response.status).toBe(200)
        expect(response.data.data).toEqual({
            _id: '5de29190ccaf9732c4fb4287',
            orderId: 2,
            orderName: 'testdemo',
            desc: 'test',
            status: 'cancelled',
        })
    })
})
