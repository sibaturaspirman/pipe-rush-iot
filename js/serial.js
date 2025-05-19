// Remove the import since we're consolidating
// import { addLogEntry } from './logger.js';

var port,
  textEncoder,
  writableStreamClosed,
  writer,
  reader,
  readableStreamClosed;
var baudRate = 9600;
var isConnected = false;  // Track connection status

// Add log container to store logs
const logContainer = {
    entries: [],
    addEntry: function(message, type = "processing") {
        const entry = {
            message,
            type,
            timestamp: new Date().toLocaleTimeString()
        };
        this.entries.push(entry);
        this.updateUI();
    },
    updateUI: function() {
        const logContent = document.getElementById('log-popup-content');
        if (logContent) {
            logContent.innerHTML = this.entries.map(entry => `
                <div class="log-entry ${entry.type}">
                    <span class="log-time">[${entry.timestamp}]</span>
                    <span class="log-message">${entry.message}</span>
                </div>
            `).join('');
            logContent.scrollTop = logContent.scrollHeight;
        }
    },
    clear: function() {
        this.entries = [];
        this.updateUI();
    }
};

// Default style configuration
const defaultStyleConfig = {
    position: {
        connection: { bottom: '20px', left: '20px' },
        logs: { bottom: '20px', left: '150px' }  // Adjusted default spacing
    },
    appearance: {
        background: 'rgba(255, 255, 255, 0.7)',
        backgroundHover: 'rgba(255, 255, 255, 0.9)',
        textColor: '#333333',
        fontSize: '12px',
        borderRadius: '15px',
        padding: '8px 12px',
        gap: '6px'
    },
    shadow: {
        enabled: true,
        color: 'rgba(0, 0, 0, 0.08)',
        hoverColor: 'rgba(0, 0, 0, 0.12)',
        size: '0 2px 8px',
        hoverSize: '0 2px 12px'
    },
    indicator: {
        size: '8px',
        connectedColor: '#4caf50',
        disconnectedColor: '#f44336'
    }
};

// Create and inject the floating status UI
function createFloatingStatus(styleConfig = {}) {
    // Merge default config with provided config
    const config = {
        position: { ...defaultStyleConfig.position, ...styleConfig.position },
        appearance: { ...defaultStyleConfig.appearance, ...styleConfig.appearance },
        shadow: { ...defaultStyleConfig.shadow, ...styleConfig.shadow },
        indicator: { ...defaultStyleConfig.indicator, ...styleConfig.indicator }
    };

    const style = document.createElement('style');
    style.textContent = `
        .floating-status {
            position: fixed;
            bottom: ${config.position.connection.bottom};
            left: ${config.position.connection.left};
            background: ${config.appearance.background};
            padding: ${config.appearance.padding};
            border-radius: ${config.appearance.borderRadius};
            ${config.shadow.enabled ? `box-shadow: ${config.shadow.size} ${config.shadow.color};` : ''}
            display: flex;
            align-items: center;
            gap: ${config.appearance.gap};
            z-index: 1000;
            transition: all 0.3s ease;
            cursor: pointer;
            user-select: none;
            font-size: ${config.appearance.fontSize};
            color: ${config.appearance.textColor};
        }
        .floating-status:hover {
            background: ${config.appearance.backgroundHover};
            ${config.shadow.enabled ? `box-shadow: ${config.shadow.hoverSize} ${config.shadow.hoverColor};` : ''}
        }
        .floating-status:active {
            transform: scale(0.98);
        }
        .status-indicator {
            width: ${config.indicator.size};
            height: ${config.indicator.size};
            border-radius: 50%;
            transition: background-color 0.3s ease;
        }
        .status-connected {
            background-color: ${config.indicator.connectedColor};
        }
        .status-disconnected {
            background-color: ${config.indicator.disconnectedColor};
        }
        .status-text {
            font-size: ${config.appearance.fontSize};
            font-weight: 500;
            transition: color 0.3s ease;
        }
        .log-button {
            position: fixed;
            bottom: ${config.position.logs.bottom};
            left: ${config.position.logs.left};
            background: ${config.appearance.background};
            padding: ${config.appearance.padding};
            border-radius: ${config.appearance.borderRadius};
            ${config.shadow.enabled ? `box-shadow: ${config.shadow.size} ${config.shadow.color};` : ''}
            cursor: pointer;
            user-select: none;
            transition: all 0.3s ease;
            z-index: 1000;
            font-size: ${config.appearance.fontSize};
            color: ${config.appearance.textColor};
        }
        .log-button:hover {
            background: ${config.appearance.backgroundHover};
            ${config.shadow.enabled ? `box-shadow: ${config.shadow.hoverSize} ${config.shadow.hoverColor};` : ''}
        }
        .log-popup {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
            z-index: 1001;
            width: 80%;
            max-width: 600px;
            max-height: 80vh;
            display: none;
        }
        .log-popup.visible {
            display: block;
        }
        .log-popup-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 1px solid #eee;
        }
        .log-popup-title {
            font-size: 16px;
            font-weight: 500;
        }
        .log-popup-close {
            cursor: pointer;
            padding: 5px;
            font-size: 18px;
            color: #666;
        }
        .log-popup-content {
            max-height: calc(80vh - 100px);
            overflow-y: auto;
            padding-right: 10px;
        }
        .log-entry {
            margin: 5px 0;
            padding: 8px;
            border-radius: 4px;
            font-family: monospace;
            font-size: 12px;
            display: flex;
            gap: 8px;
        }
        .log-time {
            color: #666;
            white-space: nowrap;
        }
        .log-message {
            flex: 1;
        }
        .log-entry.processing {
            background: #e3f2fd;
        }
        .log-entry.skipped {
            background: #ffebee;
        }
        .log-entry.trigger {
            background: #e8f5e9;
        }
        .overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            z-index: 1000;
            display: none;
        }
        .overlay.visible {
            display: block;
        }
    `;
    document.head.appendChild(style);

    // Create status indicator
    const statusDiv = document.createElement('div');
    statusDiv.className = 'floating-status';
    statusDiv.innerHTML = `
        <span class="status-indicator" id="serial-status-indicator"></span>
        <span class="status-text" id="serial-status-text">Click to Connect</span>
    `;
    
    // Create log button
    const logButton = document.createElement('div');
    logButton.className = 'log-button';
    logButton.textContent = 'Logs';
    
    // Create log popup
    const overlay = document.createElement('div');
    overlay.className = 'overlay';
    
    const logPopup = document.createElement('div');
    logPopup.className = 'log-popup';
    logPopup.innerHTML = `
        <div class="log-popup-header">
            <div class="log-popup-title">Serial Logs <span id="trigger-counter">(0 triggers)</span></div>
            <div class="log-popup-close">×</div>
        </div>
        <div class="log-popup-content" id="log-popup-content"></div>
    `;
    
    // Add click handlers
    statusDiv.addEventListener('click', async () => {
        if (!isConnected) {
            await connectSerial();
        } else {
            await resetPermission();
        }
    });

    logButton.addEventListener('click', () => {
        overlay.classList.add('visible');
        logPopup.classList.add('visible');
        updateLogPopup();
    });

    logPopup.querySelector('.log-popup-close').addEventListener('click', () => {
        overlay.classList.remove('visible');
        logPopup.classList.remove('visible');
    });

    overlay.addEventListener('click', () => {
        overlay.classList.remove('visible');
        logPopup.classList.remove('visible');
    });
    
    document.body.appendChild(statusDiv);
    document.body.appendChild(logButton);
    document.body.appendChild(overlay);
    document.body.appendChild(logPopup);
}

// Update the floating status UI
function updateFloatingStatus() {
    const indicator = document.getElementById('serial-status-indicator');
    const text = document.getElementById('serial-status-text');
    const logButton = document.querySelector('.log-button');
    
    if (isConnected) {
        indicator.className = 'status-indicator status-connected';
        text.textContent = 'Connected';
        // Adjust logs button position when connected
        if (logButton) {
            logButton.style.left = '120px';
        }
    } else {
        indicator.className = 'status-indicator status-disconnected';
        text.textContent = 'Click to Connect';
        // Set indicator color to red when disconnected
        indicator.style.backgroundColor = '#f44336';
        // Adjust logs button position when disconnected
        if (logButton) {
            logButton.style.left = '150px';
        }
    }
}

// Function to reset permission
async function resetPermission() {
    try {
        // First disconnect if connected
        if (isConnected) {
            await disconnectSerial();
        }

        // Get all ports and close them
        const ports = await navigator.serial.getPorts();
        for (const port of ports) {
            try {
                await port.close();
            } catch (error) {
                console.error("Error closing port:", error);
            }
        }

        // Request a new port to trigger permission dialog
        port = await navigator.serial.requestPort();
        await port.open({ baudRate });
        
        // Wait for Arduino reset
        logContainer.addEntry(`Waiting ${TIMING.resetDelayMs}ms for Arduino reset...`, "processing");
        await new Promise(resolve => setTimeout(resolve, TIMING.resetDelayMs));
        
        isConnected = true;
        updateFloatingStatus();
        logContainer.addEntry("Permission reset and reconnected", "processing");
        
        textEncoder = new TextEncoderStream();
        writableStreamClosed = textEncoder.readable.pipeTo(port.writable);
        writer = textEncoder.writable.getWriter();

        await listenToPort();
    } catch (error) {
        console.error("Error resetting permission:", error);
        logContainer.addEntry(`Error resetting permission: ${error}`, "skipped");
        isConnected = false;
        updateFloatingStatus();
    }
}

// Timing configuration
const TIMING = {
    intervalMs: 50,    // Time between processing data (100ms)
    cooldownMs: 50,     // Cooldown after processing (50ms)
    resetDelayMs: 1000  // Arduino reset delay (1s)
};

// Timing state
let lastProcessTime = 0;
let isProcessing = false;

async function connectSerial() {
    // If already connected, return early
    if (isConnected) {
        logContainer.addEntry("Already connected to serial port", "processing");
        return;
    }

    try {
        // First try to get previously granted ports
        const ports = await navigator.serial.getPorts();
        
        if (ports.length > 0) {
            // Use the first previously granted port
            port = ports[0];
            logContainer.addEntry("Using previously paired port", "processing");
        } else {
            // If no previously granted ports, request a new one
            port = await navigator.serial.requestPort();
        }

        await port.open({ baudRate });
        
        // Wait for Arduino reset
        logContainer.addEntry(`Waiting ${TIMING.resetDelayMs}ms for Arduino reset...`, "processing");
        await new Promise(resolve => setTimeout(resolve, TIMING.resetDelayMs));
        
        isConnected = true;  // Set connection status
        updateFloatingStatus();  // Update the floating status
        logContainer.addEntry("Connected to serial port", "processing");
        logContainer.addEntry("Listening for data from Arduino...", "processing");
        logContainer.addEntry(`Timing config: Interval=${TIMING.intervalMs}ms, Cooldown=${TIMING.cooldownMs}ms`, "processing");
        
        textEncoder = new TextEncoderStream();
        writableStreamClosed = textEncoder.readable.pipeTo(port.writable);
        writer = textEncoder.writable.getWriter();

        await listenToPort();
    } catch (error) {
        isConnected = false;  // Reset connection status on error
        updateFloatingStatus();  // Update the floating status
        console.error("Serial Connection Failed:", error);
        logContainer.addEntry(`Connection Failed: ${error}`, "skipped");
        
        // Check if it's the port already open error
        if (error.name === 'InvalidStateError' && error.message.includes('port is already open')) {
            logContainer.addEntry("Port is already open. Reloading page...", "skipped");
            setTimeout(() => {
                window.location.reload();
            }, 1000); // Wait 1 second before reloading to show the message
        } else {
            alert("Serial Connection Failed: " + error);
        }
    }
}

async function listenToPort() {
    const textDecoder = new TextDecoderStream();
    readableStreamClosed = port.readable.pipeTo(textDecoder.writable);
    reader = textDecoder.readable.getReader();

    logContainer.addEntry("Read loop started", "processing");
    
    // Buffer for incomplete lines
    let buffer = '';

    try {
        while (true) {
            const { value, done } = await reader.read();
            
            if (done) {
                logContainer.addEntry("Read loop closed", "processing");
                reader.releaseLock();
                break;
            }
            
            if (value) {
                try {
                    // Add new data to buffer
                    buffer += value.toString();
                    
                    // Process complete lines
                    let newlineIndex;
                    while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
                        const data = buffer.slice(0, newlineIndex).trim();
                        buffer = buffer.slice(newlineIndex + 1);
                        
                        if (!data) continue; // Skip empty data
                        
                        // Convert and validate data first
                        if (data.startsWith('A') && data.length === 7) {
                            const status = data.slice(1).split('');  // Remove 'A' and convert to array
                            let triggerIndex = -1;
                            
                            // Find the first '1' in the status
                            for (let i = 0; i < 5; i++) {
                                if (status[i] === '1') {
                                    triggerIndex = i + 1;
                                    break;
                                }
                            }
                            
                            // If we found a valid trigger index, check timing and dispatch event
                            if (triggerIndex !== -1) {
                                const currentTime = Date.now();
                                const timeSinceLastProcess = currentTime - lastProcessTime;

                                if (!isProcessing && (timeSinceLastProcess >= TIMING.intervalMs)) {
                                    isProcessing = true;
                                    lastProcessTime = currentTime;
                                    
                                    logContainer.addEntry(`Processing trigger after ${timeSinceLastProcess}ms`, "processing");
                                    
                                    // Dispatch event with timing information
                                    const event = new CustomEvent('triggerDetected', {
                                        detail: { 
                                            index: triggerIndex,
                                            timing: {
                                                timeSinceLastProcess,
                                                cooldownMs: TIMING.cooldownMs
                                            }
                                        }
                                    });
                                    window.dispatchEvent(event);

                                    // Reset processing flag after cooldown
                                    setTimeout(() => {
                                        isProcessing = false;
                                        logContainer.addEntry("Cooldown period ended", "processing");
                                    }, TIMING.cooldownMs);
                                } else {
                                    logContainer.addEntry(`Skipping trigger - ${timeSinceLastProcess}ms since last process (need ${TIMING.intervalMs}ms)`, "skipped");
                                }
                            }
                        }
                    }
                } catch (decodeError) {
                    console.error("Error decoding data:", decodeError);
                    logContainer.addEntry(`Error decoding data: ${decodeError}`, "skipped");
                    continue;  // Continue to next iteration if error
                }
            }
        }
    } catch (error) {
        console.error("[readLoop] Error:", error);
        logContainer.addEntry(`Read loop error: ${error}`, "skipped");
    } finally {
        if (reader) {
            reader.releaseLock();
        }
    }
}

async function disconnectSerial() {
    try {
        // First release the reader if it exists
        if (reader) {
            await reader.releaseLock();
            reader = null;
        }

        // Then handle the writer if it exists
        if (writer) {
            if (writer.closed === false) {
                await writer.releaseLock();
            }
            writer = null;
        }

        // Close the port
        if (port) {
            await port.close();
            port = null;
        }
        
        isConnected = false;  // Reset connection status
        updateFloatingStatus();  // Update the floating status
        logContainer.addEntry("Disconnected from serial port", "processing");
    } catch (error) {
        console.error("Error disconnecting:", error);
        logContainer.addEntry(`Error disconnecting: ${error}`, "skipped");
    } finally {
        // Reset all connection-related variables
        textEncoder = null;
        writableStreamClosed = null;
        readableStreamClosed = null;
    }
}

// Auto-connect function that will be called when the page loads
async function autoConnect() {
    try {
        // Check for previously granted ports
        const ports = await navigator.serial.getPorts();
        if (ports.length > 0) {
            // If we have a previously granted port, try to connect
            await connectSerial();
        } else {
            // If no previously granted ports, just update the status
            updateFloatingStatus();
        }
    } catch (error) {
        console.error("Auto-connect failed:", error);
        updateFloatingStatus();
    }
}

// Update the log popup content
function updateLogPopup() {
    const popupContent = document.getElementById('log-popup-content');
    if (popupContent) {
        // Get hit counts from the game page
        const hitCounts = Array.from(document.querySelectorAll('.hit-count')).map(el => el.textContent);
        const hitCountText = hitCounts.length > 0 ? `Hit Counts: ${hitCounts.join(' | ')}` : '';
        
        // Add hit counts to the log content
        if (hitCountText) {
            logContainer.addEntry(hitCountText, "trigger");
        }
    }
}

// Create a wrapper for addLogEntry that also updates the popup
function addLogEntryWithPopup(message, type = "processing") {
    logContainer.addEntry(message, type);
}

// Add event listener for trigger detection
let triggerCount = 0;
window.addEventListener('triggerDetected', (event) => {
    const { index, timing } = event.detail;
    triggerCount++;
    const counterElement = document.getElementById('trigger-counter');
    if (counterElement) {
        counterElement.textContent = `(${triggerCount} triggers)`;
    }
    addLogEntryWithPopup(`Trigger detected on sensor ${index} (${timing.timeSinceLastProcess}ms since last)`, "trigger");
});

// Export the functions and default config
export {
    connectSerial,
    disconnectSerial,
    autoConnect,
    isConnected,
    addLogEntryWithPopup as addLogEntry,
    defaultStyleConfig,
    createFloatingStatus,
    logContainer
};