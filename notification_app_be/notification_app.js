const { Log } = require('../logging_middleware/logging_middleware');

const TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiYXVkIjoiaHR0cDovLzIwLjI0NC41Ni4xNDQvZXZhbHVhdGlvbi1zZXJ2aWNlIiwiZW1haWwiOiJhZGRhZ2FsbGFzYW5qYXlAZ21haWwuY29tIiwiZXhwIjoxNzc4MzEwNDk3LCJpYXQiOjE3NzgzMDk1OTcsImlzcyI6IkFmZm9yZCBNZWRpY2FsIFRlY2hub2xvZ2llcyBQcml2YXRlIExpbWl0ZWQiLCJqdGkiOiIxMDZiMDk0Yy1iYzlmLTQ0NmUtOWU1Yy0yZjEwOWFmOTk3ZWIiLCJsb2NhbGUiOiJlbi1JTiIsIm5hbWUiOiJhZGRhZ2FsbGEgY2hhcmFuIHZpdmVrIHNpdmEgc2FuamF5Iiwic3ViIjoiYWQzMDI1ZGYtNDI4MC00ODdiLWIzY2UtMTEzZWI2YjAwYmI0In0sImVtYWlsIjoiYWRkYWdhbGxhc2FuamF5QGdtYWlsLmNvbSIsIm5hbWUiOiJhZGRhZ2FsbGEgY2hhcmFuIHZpdmVrIHNpdmEgc2FuamF5Iiwicm9sbE5vIjoiMjM0ODFhNDIwMSIsImFjY2Vzc0NvZGUiOiJlSmRDdUMiLCJjbGllbnRJRCI6ImFkMzAyNWRmLTQyODAtNDg3Yi1iM2NlLTExM2ViNmIwMGJiNCIsImNsaWVudFNlY3JldCI6Im1DWUdRVnByanV2a1NKUmcifQ.Wt8WyrYWpVqMZz5ggPWdEVGkUhHeUn4HYI6eT54u-Gk";

const TYPE_WEIGHT = { Placement: 3, Result: 2, Event: 1 };

async function getTopN(n = 10) {
  try {
    Log('backend', 'info', 'handler', `Fetching top ${n} priority notifications`);

    const res = await fetch('http://4.224.186.213/evaluation-service/notifications', {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TOKEN}`
      }
    });

    const { notifications } = await res.json();
    Log('backend', 'info', 'service', `Fetched ${notifications.length} notifications`);

    const times = notifications.map(n => new Date(n.Timestamp).getTime());
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);

    const scored = notifications.map(n => ({
      ...n,
      score: TYPE_WEIGHT[n.Type] +
        (maxTime === minTime ? 1 :
        (new Date(n.Timestamp).getTime() - minTime) / (maxTime - minTime))
    }));

    const topN = scored
      .sort((a, b) => b.score - a.score)
      .slice(0, n);

    console.log(`\n========== TOP ${n} PRIORITY NOTIFICATIONS ==========`);
    topN.forEach((n, i) => {
      console.log(
        `${i + 1}. [${n.Type}] "${n.Message}" | Score: ${n.score.toFixed(3)} | ${n.Timestamp}`
      );
    });

    Log('backend', 'info', 'controller', `Top ${n} notifications displayed successfully`);

  } catch (err) {
    Log('backend', 'fatal', 'handler', `Priority inbox failed: ${err.message}`);
    console.error(err);
  }
}

getTopN(10);