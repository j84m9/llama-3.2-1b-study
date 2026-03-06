package com.llamaviz.websocket;

import org.springframework.stereotype.Component;
import org.springframework.web.reactive.socket.WebSocketHandler;
import org.springframework.web.reactive.socket.WebSocketSession;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.publisher.Sinks;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class ProgressHandler implements WebSocketHandler {

    private final Map<String, Sinks.Many<String>> sessions = new ConcurrentHashMap<>();

    @Override
    public Mono<Void> handle(WebSocketSession session) {
        String sessionId = session.getId();
        Sinks.Many<String> sink = Sinks.many().multicast().onBackpressureBuffer();
        sessions.put(sessionId, sink);

        Flux<String> output = sink.asFlux();

        return session.send(output.map(session::textMessage))
                .doFinally(signal -> sessions.remove(sessionId));
    }

    public void sendProgress(String sessionId, String message) {
        Sinks.Many<String> sink = sessions.get(sessionId);
        if (sink != null) {
            sink.tryEmitNext(message);
        }
    }

    public void broadcastProgress(String message) {
        sessions.values().forEach(sink -> sink.tryEmitNext(message));
    }
}
