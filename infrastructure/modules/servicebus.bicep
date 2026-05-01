param location string
param namespaceName string

resource namespace 'Microsoft.ServiceBus/namespaces@2021-11-01' = {
  name: namespaceName
  location: location
  sku: {
    name: 'Standard'
    tier: 'Standard'
  }
}

resource topic 'Microsoft.ServiceBus/namespaces/topics@2021-11-01' = {
  parent: namespace
  name: 'transaction-events'
  properties: {
    defaultMessageTimeToLive: 'P14D'
  }
}

resource auditLogSubscription 'Microsoft.ServiceBus/namespaces/topics/subscriptions@2021-11-01' = {
  parent: topic
  name: 'audit-log'
  properties: {
    defaultMessageTimeToLive: 'P14D'
    deadLetteringOnMessageExpiration: true
    maxDeliveryCount: 3
  }
}

resource budgetAlertSubscription 'Microsoft.ServiceBus/namespaces/topics/subscriptions@2021-11-01' = {
  parent: topic
  name: 'budget-alert'
  properties: {
    defaultMessageTimeToLive: 'P14D'
    deadLetteringOnMessageExpiration: true
    maxDeliveryCount: 3
  }
}

resource rootKey 'Microsoft.ServiceBus/namespaces/authorizationRules@2021-11-01' existing = {
  parent: namespace
  name: 'RootManageSharedAccessKey'
}

@secure()
output connectionString string = rootKey.listKeys().primaryConnectionString
