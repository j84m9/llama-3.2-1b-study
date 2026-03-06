package com.llamaviz.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.llamaviz.service.CacheService;
import com.llamaviz.service.PythonApiClient;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

import java.util.Map;

@RestController
@RequestMapping("/api/activations")
public class ActivationController {

    private final PythonApiClient pythonApi;
    private final CacheService cacheService;

    public ActivationController(PythonApiClient pythonApi, CacheService cacheService) {
        this.pythonApi = pythonApi;
        this.cacheService = cacheService;
    }

    @PostMapping("/layer/{idx}")
    public Mono<JsonNode> getLayerActivations(@PathVariable int idx, @RequestBody Map<String, Object> body) {
        String text = (String) body.getOrDefault("text", "");
        String cacheKey = cacheService.computeKey("layer", text, String.valueOf(idx));

        JsonNode cached = cacheService.get(cacheKey);
        if (cached != null) {
            return Mono.just(cached);
        }

        return pythonApi.getLayerActivations(idx, body)
                .doOnNext(result -> cacheService.put(cacheKey, result));
    }
}
