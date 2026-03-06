package com.llamaviz.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.llamaviz.service.CacheService;
import com.llamaviz.service.PythonApiClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/api/model")
public class ModelInfoController {

    private final PythonApiClient pythonApi;
    private final CacheService cacheService;
    private static final String MODEL_INFO_KEY = "model_info";

    public ModelInfoController(PythonApiClient pythonApi, CacheService cacheService) {
        this.pythonApi = pythonApi;
        this.cacheService = cacheService;
    }

    @GetMapping("/info")
    public Mono<JsonNode> getModelInfo() {
        JsonNode cached = cacheService.get(MODEL_INFO_KEY);
        if (cached != null) {
            return Mono.just(cached);
        }
        return pythonApi.getModelInfo()
                .doOnNext(result -> cacheService.put(MODEL_INFO_KEY, result));
    }
}
