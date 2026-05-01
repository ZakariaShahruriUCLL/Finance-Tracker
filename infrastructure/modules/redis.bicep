param location string
param redisName string

resource redis 'Microsoft.Cache/redis@2023-08-01' = {
  name: redisName
  location: location
  properties: {
    sku: {
      name: 'Basic'
      family: 'C'
      capacity: 0
    }
    enableNonSslPort: false
    minimumTlsVersion: '1.2'
    redisVersion: '6'
  }
}

output redisHostName string = redis.properties.hostName
output redisSslPort int = redis.properties.sslPort

@secure()
output redisPrimaryKey string = redis.listKeys().primaryKey
