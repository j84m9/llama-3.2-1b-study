package com.llamaviz.service;

import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.util.Map;

@Service
public class PythonApiClient {

    private final WebClient webClient;

    public PythonApiClient(@Value("${python.api.url}") String pythonApiUrl) {
        this.webClient = WebClient.builder()
                .baseUrl(pythonApiUrl)
                .codecs(configurer -> configurer.defaultCodecs().maxInMemorySize(50 * 1024 * 1024))
                .build();
    }

    public Mono<JsonNode> getModelInfo() {
        return webClient.get()
                .uri("/model/info")
                .retrieve()
                .bodyToMono(JsonNode.class)
                .timeout(Duration.ofSeconds(30));
    }

    public Mono<JsonNode> infer(Map<String, Object> body) {
        return webClient.post()
                .uri("/infer")
                .bodyValue(body)
                .retrieve()
                .bodyToMono(JsonNode.class)
                .timeout(Duration.ofSeconds(60));
    }

    public Mono<JsonNode> inferAttention(Map<String, Object> body) {
        return webClient.post()
                .uri("/infer/attention")
                .bodyValue(body)
                .retrieve()
                .bodyToMono(JsonNode.class)
                .timeout(Duration.ofSeconds(60));
    }

    public Mono<JsonNode> getLayerActivations(int layerIdx, Map<String, Object> body) {
        return webClient.post()
                .uri("/activations/layer/{idx}", layerIdx)
                .bodyValue(body)
                .retrieve()
                .bodyToMono(JsonNode.class)
                .timeout(Duration.ofSeconds(60));
    }

    public Mono<JsonNode> runAblation(Map<String, Object> body) {
        return webClient.post()
                .uri("/ablation/run")
                .bodyValue(body)
                .retrieve()
                .bodyToMono(JsonNode.class)
                .timeout(Duration.ofSeconds(120));
    }

    public Mono<JsonNode> health() {
        return webClient.get()
                .uri("/health")
                .retrieve()
                .bodyToMono(JsonNode.class)
                .timeout(Duration.ofSeconds(5));
    }
}
