param swaName string
param functionAppName string

// SWA is not available in francecentral — westeurope is the nearest supported region
resource swa 'Microsoft.Web/staticSites@2023-12-01' = {
  name: swaName
  location: 'westeurope'
  sku: {
    name: 'Free'
    tier: 'Free'
  }
  properties: {
    // We manage the GitHub Actions workflow ourselves
    buildProperties: {
      skipGithubActionWorkflowGeneration: true
    }
  }
}

// Proxy /api/* on the SWA URL transparently to the Function App
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
