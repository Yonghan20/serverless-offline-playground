# Serverless Offline Playground
This app plays around with serverless plugins.

Typescript Serverless:

-   serverless-plugin-typescript
-   serverless-offline-sns
-   serverless-offline

# MongoDB Atlass

A dummy MongoDB is setup in Atlas for prototyping.
Cluster: Order
Database: order
Collection: order-demo

## Installation

```bash
$ npm install
```

## Running the app in offline serverless mode

```bash
# development
$ serverless offline start
# this will start local server with http://localhost:3000/ as endpoint
```

## Terminal

Terminal / command prompt would show logs

## Test

```bash
# unit tests
$ npm test
```

## Integration test

Assuming integration test will be run in actual environment.
To simulate in local, open 2 terminals:

```bash
# run this in terminal 1
$ serverless offline start
```

```bash
# run this in terminal 2
$ npm run start:integration
```

## API Test

After service is started, you may start to test against the endpoints.  
This application is built with Visual Studio Code and test with extension [REST Client](https://marketplace.visualstudio.com/items?itemName=humao.rest-client).  
Alternately, any other REST client can be used for testing as well, like [POSTMAN](https://www.getpostman.com/).  
Please refer to [rest-client.http](rest-client.http) for list of endpoints
