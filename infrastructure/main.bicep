targetScope = 'resourceGroup'

param location string = resourceGroup().location
param storageAccountName string = 'finflow'
param cosmosAccountName string = 'cne-handson-finflow'
param functionAppName string = 'finflow-api'
param redisName string = 'finflow-cache'

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
  }
}

output functionAppUrl string = functionapp.outputs.functionAppUrl
