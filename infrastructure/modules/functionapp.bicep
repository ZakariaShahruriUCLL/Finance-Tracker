param location string
param functionAppName string
param storageConnectionString string
param cosmosEndpoint string
param cosmosKey string
param redisHostName string
param redisSslPort int

@secure()
param jwtSecret string

@secure()
param redisPrimaryKey string

@secure()
param serviceBusConnectionString string

resource appServicePlan 'Microsoft.Web/serverfarms@2023-12-01' = {
  name: '${functionAppName}-plan'
  location: location
  sku: {
    name: 'Y1'
    tier: 'Dynamic'
  }
  kind: 'linux'
  properties: {
    reserved: true
  }
}

resource functionApp 'Microsoft.Web/sites@2023-12-01' = {
  name: functionAppName
  location: location
  kind: 'functionapp,linux'
  properties: {
    serverFarmId: appServicePlan.id
    siteConfig: {
      linuxFxVersion: 'Java|21'
      appSettings: [
        { name: 'AzureWebJobsStorage', value: storageConnectionString }
        { name: 'FUNCTIONS_WORKER_RUNTIME', value: 'java' }
        { name: 'FUNCTIONS_EXTENSION_VERSION', value: '~4' }
        { name: 'AZURE_COSMOS_ENDPOINT', value: cosmosEndpoint }
        { name: 'AZURE_COSMOS_KEY', value: cosmosKey }
        { name: 'JWT_SECRET', value: jwtSecret }
        { name: 'AZURE_STORAGE_CONNECTION_STRING', value: storageConnectionString }
        { name: 'AZURE_STORAGE_CONTAINER_NAME', value: 'receipts' }
        { name: 'REDIS_HOST', value: redisHostName }
        { name: 'REDIS_PORT', value: string(redisSslPort) }
        { name: 'REDIS_PASSWORD', value: redisPrimaryKey }
        { name: 'REDIS_SSL', value: 'true' }
        { name: 'SERVICE_BUS_CONNECTION_STRING', value: serviceBusConnectionString }
        { name: 'BUDGET_MONTHLY_LIMIT', value: '500.0' }
      ]
    }
    httpsOnly: true
  }
}

output functionAppName string = functionApp.name
output functionAppUrl string = 'https://${functionApp.properties.defaultHostName}'
