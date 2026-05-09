const { Log } = require('../logging_middleware/logging_middleware');

const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiYXVkIjoiaHR0cDovLzIwLjI0NC41Ni4xNDQvZXZhbHVhdGlvbi1zZXJ2aWNlIiwiZW1haWwiOiJhZGRhZ2FsbGFzYW5qYXlAZ21haWwuY29tIiwiZXhwIjoxNzc4MzA4NzQxLCJpYXQiOjE3NzgzMDc4NDEsImlzcyI6IkFmZm9yZCBNZWRpY2FsIFRlY2hub2xvZ2llcyBQcml2YXRlIExpbWl0ZWQiLCJqdGkiOiIxNzhjM2ZjZS0xM2FlLTQ5M2EtOTJlMi1kMDdjYTVlNmNiMjEiLCJsb2NhbGUiOiJlbi1JTiIsIm5hbWUiOiJhZGRhZ2FsbGEgY2hhcmFuIHZpdmVrIHNpdmEgc2FuamF5Iiwic3ViIjoiYWQzMDI1ZGYtNDI4MC00ODdiLWIzY2UtMTEzZWI2YjAwYmI0In0sImVtYWlsIjoiYWRkYWdhbGxhc2FuamF5QGdtYWlsLmNvbSIsIm5hbWUiOiJhZGRhZ2FsbGEgY2hhcmFuIHZpdmVrIHNpdmEgc2FuamF5Iiwicm9sbE5vIjoiMjM0ODFhNDIwMSIsImFjY2Vzc0NvZGUiOiJlSmRDdUMiLCJjbGllbnRJRCI6ImFkMzAyNWRmLTQyODAtNDg3Yi1iM2NlLTExM2ViNmIwMGJiNCIsImNsaWVudFNlY3JldCI6Im1DWUdRVnByanV2a1NKUmcifQ.Fec2VSLKQDgKO596JtjZaY3QnkNqk0dyLS7kgvsU_fY';

const HEADERS = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${TOKEN}`
};
async function fetchData() {
  Log('backend', 'info', 'service', 'Fetching depots and vehicles from API');

  const [depotsRes, vehiclesRes] = await Promise.all([
    fetch('http://4.224.186.213/evaluation-service/depots', { headers: HEADERS }),
    fetch('http://4.224.186.213/evaluation-service/vehicles', { headers: HEADERS })
  ]);

  if (!depotsRes.ok || !vehiclesRes.ok) {
    throw new Error(`API request failed: depots ${depotsRes.status}, vehicles ${vehiclesRes.status}`);
  }

  const { depots } = await depotsRes.json();
  const { vehicles } = await vehiclesRes.json();

  Log('backend', 'info', 'service', 
    `Fetched ${depots.length} depots and ${vehicles.length} vehicles`);

  return { depots, vehicles };
}

// 0/1 Knapsack — maximise Impact within MechanicHours budget
function knapsack(vehicles, budget) {
  const n = vehicles.length;
  const dp = Array.from({ length: n + 1 }, 
    () => new Array(budget + 1).fill(0));

  for (let i = 1; i <= n; i++) {
    const { Duration, Impact } = vehicles[i - 1];
    for (let w = 0; w <= budget; w++) {
      dp[i][w] = dp[i - 1][w];
      if (Duration <= w) {
        dp[i][w] = Math.max(dp[i][w], dp[i - 1][w - Duration] + Impact);
      }
    }
  }
  const selected = [];
  let w = budget;
  for (let i = n; i > 0; i--) {
    if (dp[i][w] !== dp[i - 1][w]) {
      selected.push(vehicles[i - 1]);
      w -= vehicles[i - 1].Duration;
    }
  }

  return {
    maxImpact: dp[n][budget],
    selectedVehicles: selected,
    totalDuration: selected.reduce((sum, v) => sum + v.Duration, 0)
  };
}

async function main() {
  try {
    Log('backend', 'info', 'handler', 'Scheduler started');

    const { depots, vehicles } = await fetchData();
    for (const depot of depots) {
      Log('backend', 'debug', 'service', 
        `Depot ${depot.ID}, budget ${depot.MechanicHours}h`);

      const result = knapsack(vehicles, depot.MechanicHours);

      console.log(`\n========== DEPOT ${depot.ID} ==========`);
      console.log(`Budget:        ${depot.MechanicHours} hours`);
      console.log(`Max Impact:    ${result.maxImpact}`);
      console.log(`Total Duration:${result.totalDuration} hours`);
      console.log(`Tasks Selected:${result.selectedVehicles.length}`);
      console.log('Selected Tasks:');
      result.selectedVehicles.forEach(v => {
        console.log(`  - ${v.TaskID} | Duration: ${v.Duration}h | Impact: ${v.Impact}`);
      });

      Log('backend', 'info', 'controller', 
        `Depot ${depot.ID}: Impact ${result.maxImpact}, Tasks ${result.selectedVehicles.length}`);
    }

    Log('backend', 'info', 'handler', 'Scheduler completed');

  } catch (err) {
    Log('backend', 'fatal', 'handler', 'Scheduler failed');
    console.error(err);
  }
}

main();