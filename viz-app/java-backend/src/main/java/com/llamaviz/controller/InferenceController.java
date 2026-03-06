package com.llamaviz.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.llamaviz.service.CacheService;
import com.llamaviz.service.PythonApiClient;
import com.llamaviz.service.SessionService;
import com.llamaviz.websocket.ProgressHandler;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

import java.util.Map;

@RestController
@RequestMapping("/api/infer")
public class InferenceController {

    private final PythonApiClient pythonApi;
    private final CacheService cacheService;
    private final SessionService sessionService;
    private final ProgressHandler progressHandler;

    public InferenceController(PythonApiClient pythonApi, CacheService cacheService,
                               SessionService sessionService, ProgressHandler progressHandler) {
        this.pythonApi = pythonApi;
        this.cacheService = cacheService;
        this.sessionService = sessionService;
        this.progressHandler = progressHandler;
    }

    @PostMapping
    public Mono<JsonNode> infer(@RequestBody Map<String, Object> body,
                                @RequestHeader(value = "X-Session-Id", required = false) String sessionId) {
        String text = (String) body.getOrDefault("text", "");
        boolean includeAttention = (boolean) body.getOrDefault("include_attention", false);
        String cacheKey = cacheService.computeKey("infer", text, String.valueOf(includeAttention));

        JsonNode cached = cacheService.get(cacheKey);
        if (cached != null) {
            return Mono.just(cached);
        }

        progressHandler.broadcastProgress("{\"stage\":\"inference\",\"status\":\"started\"}");

        return pythonApi.infer(body)
                .doOnNext(result -> {
                    cacheService.put(cacheKey, result);
                    if (sessionId != null) {
                        SessionService.SessionState state = sessionService.getOrCreate(sessionId);
                        state.setCurrentPrompt(text);
                        state.setLastInferenceResult(result);
                    }
                    progressHandler.broadcastProgress("{\"stage\":\"inference\",\"status\":\"completed\"}");
                })
                .doOnError(e ->
                    progressHandler.broadcastProgress("{\"stage\":\"inference\",\"status\":\"error\",\"message\":\"" + e.getMessage() + "\"}")
                );
    }

    @PostMapping("/attention")
    public Mono<JsonNode> inferAttention(@RequestBody Map<String, Object> body,
                                         @RequestHeader(value = "X-Session-Id", required = false) String sessionId) {
        String text = (String) body.getOrDefault("text", "");
        Object layer = body.getOrDefault("layer", 0);
        Object head = body.get("head");
        String cacheKey = cacheService.computeKey("attention", text, String.valueOf(layer), String.valueOf(head));

        JsonNode cached = cacheService.get(cacheKey);
        if (cached != null) {
            return Mono.just(cached);
        }

        return pythonApi.inferAttention(body)
                .doOnNext(result -> {
                    cacheService.put(cacheKey, result);
                    if (sessionId != null) {
                        sessionService.getOrCreate(sessionId).setLastAttentionResult(result);
                    }
                });
    }
}
