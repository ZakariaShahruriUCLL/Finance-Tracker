package com.financetracker;

import com.microsoft.azure.functions.*;
import com.microsoft.azure.functions.annotation.*;
import org.springframework.boot.SpringApplication;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.Optional;
import java.util.Set;
import java.util.logging.Logger;

public class HttpTriggerFunction {

    private static final int SPRING_PORT = 8081;
    private static final HttpClient HTTP_CLIENT = HttpClient.newHttpClient();
    private static final Set<String> SKIP_RESPONSE_HEADERS = Set.of(
            "content-length", "transfer-encoding", "connection", "keep-alive",
            "server", "date");

    private static volatile boolean springStarted = false;
    private static volatile Throwable springError = null;

    static {
        try {
            System.setProperty("server.port", String.valueOf(SPRING_PORT));
            SpringApplication.run(FinanceTrackerApplication.class);
            springStarted = true;
        } catch (Throwable t) {
            springError = t;
        }
    }

    @FunctionName("api")
    public HttpResponseMessage run(
            @HttpTrigger(
                    name = "req",
                    methods = {
                            HttpMethod.GET, HttpMethod.POST, HttpMethod.PUT,
                            HttpMethod.DELETE, HttpMethod.OPTIONS, HttpMethod.PATCH
                    },
                    authLevel = AuthorizationLevel.ANONYMOUS,
                    route = "{*route}")
            HttpRequestMessage<Optional<String>> request,
            ExecutionContext context) {

        Logger log = context.getLogger();

        if (!springStarted) {
            log.severe("Spring Boot failed to start: " + springError);
            return request.createResponseBuilder(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("{\"error\":\"Service unavailable\"}")
                    .header("Content-Type", "application/json")
                    .build();
        }

        try {
            URI original = request.getUri();
            URI target = new URI("http", null, "localhost", SPRING_PORT,
                    original.getPath(), original.getQuery(), null);

            String method = request.getHttpMethod().toString();
            String body = request.getBody().orElse("");

            HttpRequest.Builder proxyReq = HttpRequest.newBuilder()
                    .uri(target)
                    .method(method, HttpRequest.BodyPublishers.ofString(body));

            request.getHeaders().forEach((name, value) -> {
                String lower = name.toLowerCase();
                if (!lower.equals("host") && !lower.equals("content-length")
                        && !lower.equals("connection") && !lower.equals("transfer-encoding")) {
                    try { proxyReq.header(name, value); } catch (Exception ignored) {}
                }
            });

            HttpResponse<String> springResp = HTTP_CLIENT.send(
                    proxyReq.build(), HttpResponse.BodyHandlers.ofString());

            HttpResponseMessage.Builder responseBuilder = request
                    .createResponseBuilder(HttpStatus.valueOf(springResp.statusCode()))
                    .body(springResp.body());

            springResp.headers().map().forEach((name, values) -> {
                if (!name.startsWith(":") && !SKIP_RESPONSE_HEADERS.contains(name.toLowerCase())) {
                    values.forEach(val -> {
                        try { responseBuilder.header(name, val); } catch (Exception ignored) {}
                    });
                }
            });

            return responseBuilder.build();

        } catch (Exception e) {
            log.severe("Proxy error: " + e.getMessage());
            return request.createResponseBuilder(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("{\"error\":\"Internal server error\"}")
                    .header("Content-Type", "application/json")
                    .build();
        }
    }
}
