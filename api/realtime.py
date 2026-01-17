"""
Real-time state management and WebSocket infrastructure.
Maintains rolling state per domain and triggers ML inference on updates.
"""

import asyncio
from datetime import datetime, timedelta
from collections import deque
from typing import Dict, Optional, Any, List
import json
from pydantic import BaseModel

# Import ML engine for inference
from .ml import MLEngine


class RealtimeUpdate(BaseModel):
    """Schema for incoming real-time data updates."""
    domain: str  # "environmental", "health", "food"
    timestamp: Optional[datetime] = None
    # Environmental fields
    aqi: Optional[float] = None
    temperature: Optional[float] = None
    humidity: Optional[float] = None
    # Health fields
    hospital_load: Optional[float] = None
    respiratory_cases: Optional[int] = None
    # Food fields
    price_volatility: Optional[float] = None
    supply_index: Optional[float] = None


class PredictionRecord(BaseModel):
    """A single prediction with timestamp."""
    timestamp: datetime
    environmental_risk: str
    environmental_prob: float
    health_risk: str
    health_prob: float
    food_security_risk: str
    food_security_prob: float
    confidence: float
    inference_time_ms: float


class RealtimeStateManager:
    """
    Manages real-time state across domains.
    Maintains rolling window of predictions for trend visualization.
    """
    
    # Rolling window size (1 hour at 1 prediction per minute = 60 records)
    WINDOW_SIZE = 60
    # Stale threshold in seconds
    STALE_THRESHOLD = 60
    # Max inference rate (per second)
    MAX_INFERENCE_RATE = 2
    
    def __init__(self):
        # Latest state per domain
        self.environmental_state: Dict[str, Any] = {
            "aqi": None,
            "temperature": None,
            "humidity": None,
            "timestamp": None
        }
        self.health_state: Dict[str, Any] = {
            "hospital_load": None,
            "respiratory_cases": None,
            "timestamp": None
        }
        self.food_state: Dict[str, Any] = {
            "price_volatility": None,
            "supply_index": None,
            "timestamp": None
        }
        
        # Rolling window of predictions (deque for efficient append/pop)
        self.prediction_history: deque = deque(maxlen=self.WINDOW_SIZE)
        
        # Latest prediction
        self.latest_prediction: Optional[PredictionRecord] = None
        
        # Rate limiting
        self._last_inference_time: float = 0
        
        # Connected WebSocket clients
        self.connected_clients: List[Any] = []
        
    def update_environmental(self, data: Dict[str, Any]) -> bool:
        """Update environmental state. Returns True if state changed."""
        changed = False
        timestamp = data.get("timestamp", datetime.now())
        
        if data.get("aqi") is not None:
            self.environmental_state["aqi"] = data["aqi"]
            changed = True
        if data.get("temperature") is not None:
            self.environmental_state["temperature"] = data["temperature"]
            changed = True
        if data.get("humidity") is not None:
            self.environmental_state["humidity"] = data["humidity"]
            changed = True
            
        if changed:
            self.environmental_state["timestamp"] = timestamp
            
        return changed
    
    def update_health(self, data: Dict[str, Any]) -> bool:
        """Update health state. Returns True if state changed."""
        changed = False
        timestamp = data.get("timestamp", datetime.now())
        
        if data.get("hospital_load") is not None:
            self.health_state["hospital_load"] = data["hospital_load"]
            changed = True
        if data.get("respiratory_cases") is not None:
            self.health_state["respiratory_cases"] = data["respiratory_cases"]
            changed = True
            
        if changed:
            self.health_state["timestamp"] = timestamp
            
        return changed
    
    def update_food(self, data: Dict[str, Any]) -> bool:
        """Update food state. Returns True if state changed."""
        changed = False
        timestamp = data.get("timestamp", datetime.now())
        
        if data.get("price_volatility") is not None:
            self.food_state["price_volatility"] = data["price_volatility"]
            changed = True
        if data.get("supply_index") is not None:
            self.food_state["supply_index"] = data["supply_index"]
            changed = True
            
        if changed:
            self.food_state["timestamp"] = timestamp
            
        return changed
    
    def get_confidence(self) -> float:
        """
        Calculate overall confidence based on data freshness.
        Returns value between 0 and 1.
        """
        now = datetime.now()
        confidences = []
        
        for state in [self.environmental_state, self.health_state, self.food_state]:
            ts = state.get("timestamp")
            if ts is None:
                confidences.append(0.5)  # Default for missing data
            else:
                age_seconds = (now - ts).total_seconds()
                if age_seconds < self.STALE_THRESHOLD:
                    confidences.append(1.0)
                elif age_seconds < self.STALE_THRESHOLD * 2:
                    confidences.append(0.8)
                elif age_seconds < self.STALE_THRESHOLD * 5:
                    confidences.append(0.5)
                else:
                    confidences.append(0.3)
                    
        return sum(confidences) / len(confidences)
    
    def get_merged_state(self) -> Dict[str, Any]:
        """Get merged state from all domains for ML inference."""
        return {
            # Environmental
            "aqi": self.environmental_state.get("aqi") or 100,
            "temperature": self.environmental_state.get("temperature") or 25,
            "humidity": self.environmental_state.get("humidity") or 60,
            # Health
            "hospital_load": self.health_state.get("hospital_load") or 0.5,
            "respiratory_cases": self.health_state.get("respiratory_cases") or 100,
            "bed_occupancy_percent": (self.health_state.get("hospital_load") or 0.5) * 100,
            # Food
            "price_volatility": self.food_state.get("price_volatility") or 0.1,
            "crop_supply_index": self.food_state.get("supply_index") or 80,
            # Metadata
            "confidence": self.get_confidence()
        }
    
    async def run_inference(self) -> Optional[PredictionRecord]:
        """
        Run ML inference on current state.
        Rate-limited to MAX_INFERENCE_RATE per second.
        """
        import time
        
        # Rate limiting
        current_time = time.time()
        if current_time - self._last_inference_time < (1.0 / self.MAX_INFERENCE_RATE):
            return None
        
        self._last_inference_time = current_time
        start_time = time.time()
        
        try:
            # Get merged state
            state = self.get_merged_state()
            confidence = state.pop("confidence")
            
            # Run ML inference using CascadingRiskEngine.predict_cascading_risks
            engine = MLEngine.get_instance()
            
            # Prepare metrics for prediction (matching expected format)
            metrics = {
                "temperature": state.get("temperature", 25),
                "aqi": state.get("aqi", 100),
                "humidity": state.get("humidity", 60),
                "respiratory_cases": state.get("respiratory_cases", 100),
                "price_volatility": state.get("price_volatility", 0.1),
                "bed_occupancy_percent": state.get("bed_occupancy_percent", 50),
                "crop_supply_index": state.get("crop_supply_index", 80)
            }
            
            # Get predictions from cascading engine (correct method name)
            result = engine.predict_cascading_risks(metrics)
            
            inference_time_ms = (time.time() - start_time) * 1000
            
            # Extract predictions from result structure
            env_pred = result.get("environmental", {})
            health_pred = result.get("health", {})
            food_pred = result.get("food_security", {})
            
            # Create prediction record
            record = PredictionRecord(
                timestamp=datetime.now(),
                environmental_risk=env_pred.get("risk_level", "medium"),
                environmental_prob=env_pred.get("high_prob", 0.5),
                health_risk=health_pred.get("risk_level", "low"),
                health_prob=health_pred.get("high_prob", 0.2),
                food_security_risk=food_pred.get("risk_level", "low"),
                food_security_prob=food_pred.get("high_prob", 0.1),
                confidence=confidence,
                inference_time_ms=inference_time_ms
            )
            
            # Store in history
            self.prediction_history.append(record)
            self.latest_prediction = record
            
            return record
            
        except Exception as e:
            print(f"Inference error: {e}")
            import traceback
            traceback.print_exc()
            return None
    
    def get_prediction_history(self) -> List[Dict[str, Any]]:
        """Get prediction history for trend visualization."""
        return [
            {
                "timestamp": p.timestamp.isoformat(),
                "environmental_risk": p.environmental_risk,
                "environmental_prob": p.environmental_prob,
                "health_risk": p.health_risk,
                "health_prob": p.health_prob,
                "food_security_risk": p.food_security_risk,
                "food_security_prob": p.food_security_prob,
                "confidence": p.confidence
            }
            for p in self.prediction_history
        ]
    
    def get_trend_summary(self) -> Dict[str, Any]:
        """
        Compute trend summary (direction and magnitude).
        Compares recent predictions to older ones.
        """
        if len(self.prediction_history) < 5:
            return {"status": "insufficient_data", "message": "Need more data points"}
        
        history = list(self.prediction_history)
        recent = history[-5:]  # Last 5 predictions
        older = history[-15:-5] if len(history) >= 15 else history[:-5]
        
        if not older:
            return {"status": "insufficient_data", "message": "Need more data points"}
        
        # Calculate averages
        recent_env_avg = sum(p.environmental_prob for p in recent) / len(recent)
        older_env_avg = sum(p.environmental_prob for p in older) / len(older)
        
        recent_health_avg = sum(p.health_prob for p in recent) / len(recent)
        older_health_avg = sum(p.health_prob for p in older) / len(older)
        
        recent_food_avg = sum(p.food_security_prob for p in recent) / len(recent)
        older_food_avg = sum(p.food_security_prob for p in older) / len(older)
        
        def get_trend_direction(recent, older):
            diff = recent - older
            if diff > 0.05:
                return "increasing"
            elif diff < -0.05:
                return "decreasing"
            else:
                return "stable"
        
        return {
            "status": "ok",
            "environmental": {
                "direction": get_trend_direction(recent_env_avg, older_env_avg),
                "current": recent_env_avg,
                "change": recent_env_avg - older_env_avg
            },
            "health": {
                "direction": get_trend_direction(recent_health_avg, older_health_avg),
                "current": recent_health_avg,
                "change": recent_health_avg - older_health_avg
            },
            "food_security": {
                "direction": get_trend_direction(recent_food_avg, older_food_avg),
                "current": recent_food_avg,
                "change": recent_food_avg - older_food_avg
            }
        }
    
    async def broadcast_prediction(self, prediction: PredictionRecord):
        """Broadcast prediction to all connected WebSocket clients."""
        if not self.connected_clients:
            return
            
        message = json.dumps({
            "type": "prediction",
            "data": {
                "timestamp": prediction.timestamp.isoformat(),
                "environmental_risk": prediction.environmental_risk,
                "environmental_prob": prediction.environmental_prob,
                "health_risk": prediction.health_risk,
                "health_prob": prediction.health_prob,
                "food_security_risk": prediction.food_security_risk,
                "food_security_prob": prediction.food_security_prob,
                "confidence": prediction.confidence,
                "inference_time_ms": prediction.inference_time_ms
            },
            "trends": self.get_trend_summary()
        })
        
        # Send to all connected clients
        disconnected = []
        for client in self.connected_clients:
            try:
                await client.send_text(message)
            except Exception:
                disconnected.append(client)
        
        # Clean up disconnected clients
        for client in disconnected:
            self.connected_clients.remove(client)


# Global instance
_state_manager: Optional[RealtimeStateManager] = None


def get_state_manager() -> RealtimeStateManager:
    """Get the global state manager instance."""
    global _state_manager
    if _state_manager is None:
        _state_manager = RealtimeStateManager()
    return _state_manager
