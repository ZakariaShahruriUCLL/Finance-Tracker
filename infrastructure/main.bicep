targetScope = 'resourceGroup'

param location string = resourceGroup().location
param storageAccountName string = 'finflow'
param cosmosAccountName string = 'cne-handson-finflow'
param functionAppName string = 'finflow-api'
param redisName string = 'finflow-cache'
param serviceBusName string = 'finflow-bus'
param kvName string = 'finflow-kv'

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

module appinsights 'modules/appinsights.bicep' = {
  name: 'appinsights'
  params: {
    location: location
    functionAppName: functionAppName
  }
}

var staticWebUrl = storage.outputs.staticWebUrl
var frontendOrigin = endsWith(staticWebUrl, '/') ? substring(staticWebUrl, 0, max(0, length(staticWebUrl) - 1)) : staticWebUrl

module functionapp 'modules/functionapp.bicep' = {
  name: 'functionapp'
  params: {
    location: location
    functionAppName: functionAppName
    cosmosEndpoint: cosmos.outputs.endpoint
    redisHostName: redis.outputs.redisHostName
    redisSslPort: redis.outputs.redisSslPort
    frontendUrl: frontendOrigin
    kvName: kvName
    appInsightsConnectionString: appinsights.outputs.connectionString
  }
}

module keyvault 'modules/keyvault.bicep' = {
  name: 'keyvault'
  params: {
    location: location
    kvName: kvName
    managedIdentityPrincipalId: functionapp.outputs.managedIdentityPrincipalId
    cosmosKey: cosmos.outputs.primaryKey
    jwtSecret: jwtSecret
    redisPrimaryKey: redis.outputs.redisPrimaryKey
    serviceBusConnectionString: servicebus.outputs.connectionString
    storageConnectionString: storage.outputs.connectionString
  }
}

output functionAppUrl string = functionapp.outputs.functionAppUrl
output frontendUrl string = frontendOrigin
output kvUri string = keyvault.outputs.kvUri
output appInsightsName string = '${functionAppName}-insights'
