package com.llamaviz.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.llamaviz.service.PythonApiClient;
import com.llamaviz.websocket.ProgressHandler;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

import java.util.Map;

@RestController
@RequestMapping("/api/ablation")
public class AblationController {

    private final PythonApiClient pythonApi;
    private final ProgressHandler progressHandler;

    public AblationController(PythonApiClient pythonApi, ProgressHandler progressHandler) {
        this.pythonApi = pythonApi;
        this.progressHandler = progressHandler;
    }

    @PostMapping("/run")
    public Mono<JsonNode> runAblation(@RequestBody Map<String, Object> body) {
        progressHandler.broadcastProgress("{\"stage\":\"ablation\",\"status\":\"started\"}");

        return pythonApi.runAblation(body)
                .doOnNext(result ->
                    progressHandler.broadcastProgress("{\"stage\":\"ablation\",\"status\":\"completed\"}")
                )
                .doOnError(e ->
                    progressHandler.broadcastProgress("{\"stage\":\"ablation\",\"status\":\"error\"}")
                );
    }
}
