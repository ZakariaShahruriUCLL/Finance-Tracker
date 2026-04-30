targetScope = 'resourceGroup'

param location string = resourceGroup().location
param storageAccountName string = 'finflow'
param cosmosAccountName string = 'cne-handson-finflow'
param functionAppName string = 'finflow-api'

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

module functionapp 'modules/functionapp.bicep' = {
  name: 'functionapp'
  params: {
    location: location
    functionAppName: functionAppName
    storageConnectionString: storage.outputs.connectionString
    cosmosEndpoint: cosmos.outputs.endpoint
    cosmosKey: cosmos.outputs.primaryKey
    jwtSecret: jwtSecret
  }
}

output functionAppUrl string = functionapp.outputs.functionAppUrl
