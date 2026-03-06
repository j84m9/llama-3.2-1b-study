package com.llamaviz.service;

import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class SessionService {

    private final Map<String, SessionState> sessions = new ConcurrentHashMap<>();

    public SessionState getOrCreate(String sessionId) {
        return sessions.computeIfAbsent(sessionId, k -> new SessionState());
    }

    public void remove(String sessionId) {
        sessions.remove(sessionId);
    }

    public static class SessionState {
        private String currentPrompt;
        private JsonNode lastInferenceResult;
        private JsonNode lastAttentionResult;

        public String getCurrentPrompt() { return currentPrompt; }
        public void setCurrentPrompt(String prompt) { this.currentPrompt = prompt; }

        public JsonNode getLastInferenceResult() { return lastInferenceResult; }
        public void setLastInferenceResult(JsonNode result) { this.lastInferenceResult = result; }

        public JsonNode getLastAttentionResult() { return lastAttentionResult; }
        public void setLastAttentionResult(JsonNode result) { this.lastAttentionResult = result; }
    }
}
