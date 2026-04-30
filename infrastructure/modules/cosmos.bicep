param location string
param cosmosAccountName string

resource cosmosAccount 'Microsoft.DocumentDB/databaseAccounts@2024-05-15' = {
  name: cosmosAccountName
  location: location
  kind: 'GlobalDocumentDB'
  properties: {
    databaseAccountOfferType: 'Standard'
    locations: [
      {
        locationName: location
        failoverPriority: 0
        isZoneRedundant: false
      }
    ]
    capabilities: [
      {
        name: 'EnableServerless'
      }
    ]
    consistencyPolicy: {
      defaultConsistencyLevel: 'Session'
    }
  }
}

resource database 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases@2024-05-15' = {
  parent: cosmosAccount
  name: 'financetracker'
  properties: {
    resource: {
      id: 'financetracker'
    }
  }
}

resource usersContainer 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases/containers@2024-05-15' = {
  parent: database
  name: 'users'
  properties: {
    resource: {
      id: 'users'
      partitionKey: {
        paths: [ '/id' ]
        kind: 'Hash'
      }
    }
  }
}

resource categoriesContainer 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases/containers@2024-05-15' = {
  parent: database
  name: 'categories'
  properties: {
    resource: {
      id: 'categories'
      partitionKey: {
        paths: [ '/userId' ]
        kind: 'Hash'
      }
    }
  }
}

resource transactionsContainer 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases/containers@2024-05-15' = {
  parent: database
  name: 'transactions'
  properties: {
    resource: {
      id: 'transactions'
      partitionKey: {
        paths: [ '/userId' ]
        kind: 'Hash'
      }
    }
  }
}

output endpoint string = cosmosAccount.properties.documentEndpoint

@secure()
output primaryKey string = cosmosAccount.listKeys().primaryMasterKey
