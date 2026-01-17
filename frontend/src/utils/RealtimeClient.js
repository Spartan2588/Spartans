/**
 * WebSocket client for real-time data streaming.
 * Manages connection, reconnection, and message handling.
 */

export class RealtimeClient {
    constructor(options = {}) {
        this.wsUrl = options.wsUrl || `ws://${window.location.hostname}:8000/ws/predictions`;
        this.reconnectDelay = options.reconnectDelay || 3000;
        this.maxReconnectAttempts = options.maxReconnectAttempts || 10;

        this.ws = null;
        this.reconnectAttempts = 0;
        this.isConnected = false;
        this.listeners = new Map();

        // Prediction history buffer
        this.predictionHistory = [];
        this.maxHistorySize = 60; // 1 hour at 1/min

        // Latest values
        this.latestPrediction = null;
        this.latestTrends = null;
        this.confidence = 0;
    }

    /**
     * Connect to WebSocket server.
     */
    connect() {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            console.log('WebSocket already connected');
            return;
        }

        console.log(`Connecting to WebSocket: ${this.wsUrl}`);

        try {
            this.ws = new WebSocket(this.wsUrl);

            this.ws.onopen = () => {
                console.log('WebSocket connected');
                this.isConnected = true;
                this.reconnectAttempts = 0;
                this.emit('connected');
            };

            this.ws.onmessage = (event) => {
                this.handleMessage(event.data);
            };

            this.ws.onclose = () => {
                console.log('WebSocket disconnected');
                this.isConnected = false;
                this.emit('disconnected');
                this.scheduleReconnect();
            };

            this.ws.onerror = (error) => {
                console.error('WebSocket error:', error);
                this.emit('error', error);
            };
        } catch (error) {
            console.error('Failed to create WebSocket:', error);
            this.scheduleReconnect();
        }
    }

    /**
     * Disconnect from WebSocket server.
     */
    disconnect() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        this.isConnected = false;
    }

    /**
     * Schedule reconnection with exponential backoff.
     */
    scheduleReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.log('Max reconnect attempts reached');
            this.emit('reconnect_failed');
            return;
        }

        const delay = this.reconnectDelay * Math.pow(1.5, this.reconnectAttempts);
        this.reconnectAttempts++;

        console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);

        setTimeout(() => {
            this.connect();
        }, delay);
    }

    /**
     * Handle incoming WebSocket message.
     */
    handleMessage(data) {
        try {
            const message = JSON.parse(data);

            switch (message.type) {
                case 'init':
                    // Initial data load
                    if (message.data.history) {
                        this.predictionHistory = message.data.history;
                    }
                    if (message.data.latest) {
                        this.latestPrediction = message.data.latest;
                    }
                    if (message.data.trends) {
                        this.latestTrends = message.data.trends;
                    }
                    this.emit('init', message.data);
                    break;

                case 'prediction':
                    // New prediction received
                    this.latestPrediction = message.data;
                    this.predictionHistory.push(message.data);

                    // Trim history if needed
                    if (this.predictionHistory.length > this.maxHistorySize) {
                        this.predictionHistory.shift();
                    }

                    // Update trends if provided
                    if (message.trends) {
                        this.latestTrends = message.trends;
                    }

                    this.confidence = message.data.confidence || 0;

                    this.emit('prediction', message.data);
                    this.emit('history', this.predictionHistory);
                    break;

                case 'trends':
                    this.latestTrends = message.data;
                    this.emit('trends', message.data);
                    break;

                case 'history':
                    this.predictionHistory = message.data;
                    this.emit('history', message.data);
                    break;

                case 'pong':
                    // Heartbeat response
                    break;

                default:
                    console.log('Unknown message type:', message.type);
            }
        } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
        }
    }

    /**
     * Send message to server.
     */
    send(data) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(typeof data === 'string' ? data : JSON.stringify(data));
        }
    }

    /**
     * Request trends update.
     */
    requestTrends() {
        this.send('get_trends');
    }

    /**
     * Request full history.
     */
    requestHistory() {
        this.send('get_history');
    }

    /**
     * Add event listener.
     */
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
    }

    /**
     * Remove event listener.
     */
    off(event, callback) {
        if (this.listeners.has(event)) {
            const callbacks = this.listeners.get(event);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
    }

    /**
     * Emit event to all listeners.
     */
    emit(event, data) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in ${event} listener:`, error);
                }
            });
        }
    }

    /**
     * Get prediction history for charts.
     * Returns data formatted for easy charting.
     */
    getChartData() {
        return {
            timestamps: this.predictionHistory.map(p => p.timestamp),
            environmental: this.predictionHistory.map(p => p.environmental_prob * 100),
            health: this.predictionHistory.map(p => p.health_prob * 100),
            foodSecurity: this.predictionHistory.map(p => p.food_security_prob * 100)
        };
    }

    /**
     * Get trend direction indicator.
     */
    getTrendIndicator(domain) {
        if (!this.latestTrends || this.latestTrends.status !== 'ok') {
            return { direction: 'stable', icon: '→' };
        }

        const trend = this.latestTrends[domain];
        if (!trend) {
            return { direction: 'stable', icon: '→' };
        }

        switch (trend.direction) {
            case 'increasing':
                return { direction: 'increasing', icon: '↑', color: '#ef4444' };
            case 'decreasing':
                return { direction: 'decreasing', icon: '↓', color: '#22c55e' };
            default:
                return { direction: 'stable', icon: '→', color: '#94a3b8' };
        }
    }
}

// Export singleton instance
export const realtimeClient = new RealtimeClient();
