param location string
param functionAppName string
param cosmosEndpoint string
param redisHostName string
param redisSslPort int
param frontendUrl string
param kvName string
param appInsightsConnectionString string

resource managedIdentity 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' = {
  name: '${functionAppName}-identity'
  location: location
}

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

var kvRef = 'https://${kvName}.vault.azure.net/secrets'

resource functionApp 'Microsoft.Web/sites@2023-12-01' = {
  name: functionAppName
  location: location
  kind: 'functionapp,linux'
  identity: {
    type: 'UserAssigned'
    userAssignedIdentities: {
      '${managedIdentity.id}': {}
    }
  }
  properties: {
    serverFarmId: appServicePlan.id
    keyVaultReferenceIdentity: managedIdentity.id
    siteConfig: {
      linuxFxVersion: 'Java|21'
      appSettings: [
        { name: 'AzureWebJobsStorage',                  value: '@Microsoft.KeyVault(SecretUri=${kvRef}/storage-connection/)' }
        { name: 'FUNCTIONS_WORKER_RUNTIME',             value: 'java' }
        { name: 'FUNCTIONS_EXTENSION_VERSION',          value: '~4' }
        { name: 'AZURE_COSMOS_ENDPOINT',                value: cosmosEndpoint }
        { name: 'AZURE_COSMOS_KEY',                     value: '@Microsoft.KeyVault(SecretUri=${kvRef}/cosmos-key/)' }
        { name: 'JWT_SECRET',                           value: '@Microsoft.KeyVault(SecretUri=${kvRef}/jwt-secret/)' }
        { name: 'AZURE_STORAGE_CONNECTION_STRING',      value: '@Microsoft.KeyVault(SecretUri=${kvRef}/storage-connection/)' }
        { name: 'AZURE_STORAGE_CONTAINER_NAME',         value: 'receipts' }
        { name: 'REDIS_HOST',                           value: redisHostName }
        { name: 'REDIS_PORT',                           value: string(redisSslPort) }
        { name: 'REDIS_PASSWORD',                       value: '@Microsoft.KeyVault(SecretUri=${kvRef}/redis-password/)' }
        { name: 'REDIS_SSL',                            value: 'true' }
        { name: 'SERVICE_BUS_CONNECTION_STRING',        value: '@Microsoft.KeyVault(SecretUri=${kvRef}/servicebus-connection/)' }
        { name: 'BUDGET_MONTHLY_LIMIT',                 value: '500.0' }
        { name: 'FRONTEND_URL',                         value: frontendUrl }
        { name: 'APPLICATIONINSIGHTS_CONNECTION_STRING', value: appInsightsConnectionString }
        { name: 'AZURE_CLIENT_ID',                      value: managedIdentity.properties.clientId }
      ]
    }
    httpsOnly: true
  }
}

output functionAppName string = functionApp.name
output functionAppUrl string = 'https://${functionApp.properties.defaultHostName}'
output managedIdentityPrincipalId string = managedIdentity.properties.principalId
