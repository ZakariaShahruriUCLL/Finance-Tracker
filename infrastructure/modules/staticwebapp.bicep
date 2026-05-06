param swaName string
param functionAppName string

resource swa 'Microsoft.Web/staticSites@2023-12-01' = {
  name: swaName
  location: 'westeurope'
  sku: {
    name: 'Free'
    tier: 'Free'
  }
  properties: {
    buildProperties: {
      skipGithubActionWorkflowGeneration: true
    }
  }
}

resource linkedBackend 'Microsoft.Web/staticSites/linkedBackends@2023-12-01' = {
  parent: swa
  name: 'default'
  properties: {
    backendResourceId: resourceId('Microsoft.Web/sites', functionAppName)
    region: 'francecentral'
  }
}

output swaName string = swa.name
output swaUrl string = 'https://${swa.properties.defaultHostname}'
