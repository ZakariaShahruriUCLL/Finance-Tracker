targetScope = 'resourceGroup'

param location string = resourceGroup().location
param storageAccountName string = 'finflow'
param cosmosAccountName string = 'cne-handson-finflow'
param functionAppName string = 'finflow-api'
param redisName string = 'finflow-cache'
param serviceBusName string = 'finflow-bus'

@secure()
param jwtSecret string

module storage 'modules/storage.bicep' = {
  name: 'storage'
  params: {
    location: location
    storageAccountName: storageAccountName
  }
}

module cosmos 'modules/cosmos.bicep' = {
  name: 'cosmos'
  params: {
    location: location
    cosmosAccountName: cosmosAccountName
  }
}

module redis 'modules/redis.bicep' = {
  name: 'redis'
  params: {
    location: location
    redisName: redisName
  }
}

module servicebus 'modules/servicebus.bicep' = {
  name: 'servicebus'
  params: {
    location: location
    namespaceName: serviceBusName
  }
}

var staticWebUrl = storage.outputs.staticWebUrl
var frontendOrigin = endsWith(staticWebUrl, '/') ? substring(staticWebUrl, 0, max(0, length(staticWebUrl) - 1)) : staticWebUrl

module functionapp 'modules/functionapp.bicep' = {
  name: 'functionapp'
  params: {
    location: location
    functionAppName: functionAppName
    storageConnectionString: storage.outputs.connectionString
    cosmosEndpoint: cosmos.outputs.endpoint
    cosmosKey: cosmos.outputs.primaryKey
    jwtSecret: jwtSecret
    redisHostName: redis.outputs.redisHostName
    redisSslPort: redis.outputs.redisSslPort
    redisPrimaryKey: redis.outputs.redisPrimaryKey
    serviceBusConnectionString: servicebus.outputs.connectionString
    frontendUrl: frontendOrigin
  }
}

output functionAppUrl string = functionapp.outputs.functionAppUrl
output frontendUrl string = frontendOrigin
