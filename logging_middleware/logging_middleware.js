const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiYXVkIjoiaHR0cDovLzIwLjI0NC41Ni4xNDQvZXZhbHVhdGlvbi1zZXJ2aWNlIiwiZW1haWwiOiJhZGRhZ2FsbGFzYW5qYXlAZ21haWwuY29tIiwiZXhwIjoxNzc4MzEwNDk3LCJpYXQiOjE3NzgzMDk1OTcsImlzcyI6IkFmZm9yZCBNZWRpY2FsIFRlY2hub2xvZ2llcyBQcml2YXRlIExpbWl0ZWQiLCJqdGkiOiIxMDZiMDk0Yy1iYzlmLTQ0NmUtOWU1Yy0yZjEwOWFmOTk3ZWIiLCJsb2NhbGUiOiJlbi1JTiIsIm5hbWUiOiJhZGRhZ2FsbGEgY2hhcmFuIHZpdmVrIHNpdmEgc2FuamF5Iiwic3ViIjoiYWQzMDI1ZGYtNDI4MC00ODdiLWIzY2UtMTEzZWI2YjAwYmI0In0sImVtYWlsIjoiYWRkYWdhbGxhc2FuamF5QGdtYWlsLmNvbSIsIm5hbWUiOiJhZGRhZ2FsbGEgY2hhcmFuIHZpdmVrIHNpdmEgc2FuamF5Iiwicm9sbE5vIjoiMjM0ODFhNDIwMSIsImFjY2Vzc0NvZGUiOiJlSmRDdUMiLCJjbGllbnRJRCI6ImFkMzAyNWRmLTQyODAtNDg3Yi1iM2NlLTExM2ViNmIwMGJiNCIsImNsaWVudFNlY3JldCI6Im1DWUdRVnByanV2a1NKUmcifQ.Wt8WyrYWpVqMZz5ggPWdEVGkUhHeUn4HYI6eT54u-Gk';

const VALID_STACKS = ['backend', 'frontend'];

const VALID_LEVELS = ['debug', 'info', 'warn', 'error', 'fatal'];

const VALID_PACKAGES = [
  'cache', 'controller', 'cron_job', 'db', 'domain',
  'handler', 'repository', 'route', 'service',
  'api', 'component', 'hook', 'page', 'state', 'style',
  'auth', 'config', 'middleware', 'utils'
];

async function Log(stack, level, pkg, message) {
  if (!VALID_STACKS.includes(stack)) {
    console.error(`[Logger] Invalid stack: ${stack}`);
    return;
  }
  if (!VALID_LEVELS.includes(level)) {
    console.error(`[Logger] Invalid level: ${level}`);
    return;
  }
  if (!VALID_PACKAGES.includes(pkg)) {
    console.error(`[Logger] Invalid package: ${pkg}`);
    return;
  }
  console.log(`[${level.toUpperCase()}] [${stack}/${pkg}] ${message}`);
  try {
    const res = await fetch('http://4.224.186.213/evaluation-service/logs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TOKEN}`
      },
      body: JSON.stringify({
        stack,
        level,
        package: pkg, 
        message
      })
    });

    const data = await res.json();

    if (res.ok) {
      console.log(`[Logger] Log sent | logID: ${data.logID}`);
    } else {
      console.error(`[Logger] Server rejected: ${JSON.stringify(data)}`);
    }

  } catch (err) {
    console.error(`[Logger] Network error: ${err.message}`);
  }
}

module.exports = { Log };