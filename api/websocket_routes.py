"""
WebSocket routes for real-time data ingestion and prediction broadcasting.
"""

import asyncio
import json
import random
from datetime import datetime
from typing import List
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from .realtime import get_state_manager, RealtimeUpdate

router = APIRouter()


class ConnectionManager:
    """Manages WebSocket connections."""
    
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.data_simulator_task = None
    
    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        # Register with state manager
        state_manager = get_state_manager()
        state_manager.connected_clients.append(websocket)
        
    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        state_manager = get_state_manager()
        if websocket in state_manager.connected_clients:
            state_manager.connected_clients.remove(websocket)
    
    async def broadcast(self, message: str):
        disconnected = []
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except Exception:
                disconnected.append(connection)
        for conn in disconnected:
            self.disconnect(conn)


manager = ConnectionManager()


@router.websocket("/ws/predictions")
async def websocket_predictions(websocket: WebSocket):
    """
    WebSocket endpoint for receiving real-time predictions.
    Clients subscribe to this to get live risk updates.
    """
    await manager.connect(websocket)
    
    state_manager = get_state_manager()
    
    try:
        # Send initial state
        initial_data = {
            "type": "init",
            "data": {
                "history": state_manager.get_prediction_history(),
                "trends": state_manager.get_trend_summary(),
                "latest": state_manager.latest_prediction.model_dump() if state_manager.latest_prediction else None
            }
        }
        await websocket.send_text(json.dumps(initial_data, default=str))
        
        # Keep connection alive and wait for messages
        while True:
            # Wait for any message (ping/pong or control)
            data = await websocket.receive_text()
            
            # Handle control messages
            if data == "ping":
                await websocket.send_text(json.dumps({"type": "pong"}))
            elif data == "get_trends":
                trends = state_manager.get_trend_summary()
                await websocket.send_text(json.dumps({"type": "trends", "data": trends}))
            elif data == "get_history":
                history = state_manager.get_prediction_history()
                await websocket.send_text(json.dumps({"type": "history", "data": history}))
                
    except WebSocketDisconnect:
        manager.disconnect(websocket)


@router.websocket("/ws/data-ingest")
async def websocket_data_ingest(websocket: WebSocket):
    """
    WebSocket endpoint for receiving live data from external sources.
    Data format: { "domain": "environmental", "aqi": 150, "temperature": 32 }
    """
    await websocket.accept()
    
    state_manager = get_state_manager()
    
    try:
        while True:
            data = await websocket.receive_text()
            
            try:
                payload = json.loads(data)
                domain = payload.get("domain", "").lower()
                
                # Update appropriate domain
                changed = False
                if domain == "environmental":
                    changed = state_manager.update_environmental(payload)
                elif domain == "health":
                    changed = state_manager.update_health(payload)
                elif domain == "food":
                    changed = state_manager.update_food(payload)
                else:
                    await websocket.send_text(json.dumps({
                        "type": "error",
                        "message": f"Unknown domain: {domain}"
                    }))
                    continue
                
                if changed:
                    # Run inference and broadcast
                    prediction = await state_manager.run_inference()
                    if prediction:
                        await state_manager.broadcast_prediction(prediction)
                        await websocket.send_text(json.dumps({
                            "type": "ack",
                            "inference_time_ms": prediction.inference_time_ms
                        }))
                    else:
                        await websocket.send_text(json.dumps({
                            "type": "ack",
                            "message": "Rate limited, prediction skipped"
                        }))
                else:
                    await websocket.send_text(json.dumps({
                        "type": "ack",
                        "message": "No change detected"
                    }))
                    
            except json.JSONDecodeError:
                await websocket.send_text(json.dumps({
                    "type": "error",
                    "message": "Invalid JSON"
                }))
                
    except WebSocketDisconnect:
        pass


async def simulate_realtime_data():
    """
    Demo data simulator that generates realistic live data
    based on patterns from the existing database.
    """
    state_manager = get_state_manager()
    
    # Base values (simulating Mumbai-like conditions)
    base_aqi = 180
    base_temp = 28
    base_humidity = 65
    base_hospital_load = 0.65
    base_respiratory = 120
    base_volatility = 0.12
    base_supply = 85
    
    while True:
        # Environmental update (every 5 seconds)
        env_data = {
            "aqi": base_aqi + random.uniform(-20, 20),
            "temperature": base_temp + random.uniform(-2, 2),
            "humidity": base_humidity + random.uniform(-5, 5),
            "timestamp": datetime.now()
        }
        state_manager.update_environmental(env_data)
        
        # Health update (every 10 seconds)
        if random.random() > 0.5:
            health_data = {
                "hospital_load": min(1.0, max(0.3, base_hospital_load + random.uniform(-0.1, 0.1))),
                "respiratory_cases": int(base_respiratory + random.uniform(-15, 15)),
                "timestamp": datetime.now()
            }
            state_manager.update_health(health_data)
        
        # Food update (every 15 seconds)
        if random.random() > 0.7:
            food_data = {
                "price_volatility": max(0, min(0.5, base_volatility + random.uniform(-0.05, 0.05))),
                "supply_index": max(50, min(100, base_supply + random.uniform(-5, 5))),
                "timestamp": datetime.now()
            }
            state_manager.update_food(food_data)
        
        # Run inference
        prediction = await state_manager.run_inference()
        if prediction:
            await state_manager.broadcast_prediction(prediction)
            
            # Occasionally shift base values to create trends
            if random.random() > 0.9:
                base_aqi += random.uniform(-10, 10)
                base_aqi = max(50, min(300, base_aqi))
                
            if random.random() > 0.95:
                base_hospital_load += random.uniform(-0.1, 0.1)
                base_hospital_load = max(0.3, min(0.9, base_hospital_load))
        
        await asyncio.sleep(5)  # Update every 5 seconds


# Background task reference
_simulator_task = None


def start_simulator():
    """Start the demo data simulator as a background task."""
    global _simulator_task
    if _simulator_task is None or _simulator_task.done():
        loop = asyncio.get_event_loop()
        _simulator_task = loop.create_task(simulate_realtime_data())
        print("Real-time data simulator started")
    return _simulator_task


def stop_simulator():
    """Stop the demo data simulator."""
    global _simulator_task
    if _simulator_task and not _simulator_task.done():
        _simulator_task.cancel()
        _simulator_task = None
        print("Real-time data simulator stopped")
