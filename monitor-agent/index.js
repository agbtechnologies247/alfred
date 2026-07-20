const axios = require('axios');
const os = require('os');

const API_URL = process.env.TELEMETRY_URL || 'http://127.0.0.1:3000/telemetry';

console.log('Starting A.L.F.R.E.D. Monitor Agent (Live Metrics Mode)...');

// Helper to calculate CPU usage ticks
function getCpuAverage() {
  const cpus = os.cpus();
  let idleMs = 0;
  let totalMs = 0;
  
  cpus.forEach((core) => {
    for (const type in core.times) {
      totalMs += core.times[type];
    }
    idleMs += core.times.idle;
  });
  
  return {
    idle: idleMs / cpus.length,
    total: totalMs / cpus.length
  };
}

let startMeasure = getCpuAverage();

setInterval(async () => {
  const endMeasure = getCpuAverage();
  const idleDifference = endMeasure.idle - startMeasure.idle;
  const totalDifference = endMeasure.total - startMeasure.total;
  
  let cpuUsage = 0;
  if (totalDifference > 0) {
    cpuUsage = 100 - (100 * idleDifference) / totalDifference;
  }
  startMeasure = endMeasure;

  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  // Express memory usage in megabytes
  const memoryUsageMB = usedMem / 1024 / 1024;

  const payload = {
    timestamp: new Date().toISOString(),
    host: os.hostname() || 'node-app-prod-1',
    layer: 'Layer 7',
    metrics: {
      cpu_usage: Number(cpuUsage.toFixed(2)),
      memory_usage: Number(memoryUsageMB.toFixed(2)),
      packet_loss: Math.random() > 0.95 ? Math.random() * 5 : 0, // Mock network drop trace
      latency: Math.random() * 10 + 5, // Typical host latency trace
    }
  };

  try {
    await axios.post(API_URL, payload);
    console.log(`[${payload.timestamp}] Sent telemetry data: CPU ${payload.metrics.cpu_usage.toFixed(1)}% | MEM ${payload.metrics.memory_usage.toFixed(0)} MB`);
  } catch (error) {
    console.error('Failed to send telemetry. Is the backend running?');
  }
}, 5000);

