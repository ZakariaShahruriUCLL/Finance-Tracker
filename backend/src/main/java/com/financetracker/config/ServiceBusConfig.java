package com.financetracker.config;

import com.azure.messaging.servicebus.ServiceBusClientBuilder;
import com.azure.messaging.servicebus.ServiceBusSenderClient;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class ServiceBusConfig {

    @Bean
    public ServiceBusSenderClient transactionEventSender(
            @Value("${SERVICE_BUS_CONNECTION_STRING}") String connectionString) {
        return new ServiceBusClientBuilder()
                .connectionString(connectionString)
                .sender()
                .topicName("transaction-events")
                .buildClient();
    }
}
