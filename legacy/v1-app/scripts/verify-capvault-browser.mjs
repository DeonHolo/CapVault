import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const baseUrl = process.argv[2] || 'http://127.0.0.1:5174';
const chromePath = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const port = Number(process.env.CAPVAULT_CDP_PORT || 9335);
const outputDir = path.join(root, 'verification-screenshots');
const profileDir = path.join(root, '.chrome-capvault-verification');

fs.rmSync(outputDir, { recursive: true, force: true });
fs.rmSync(profileDir, { recursive: true, force: true });
fs.mkdirSync(outputDir, { recursive: true });
fs.mkdirSync(profileDir, { recursive: true });

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForJson(url, timeoutMs = 15000) {
  const started = Date.now();
  let lastError;
  while (Date.now() - started < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) return response.json();
      lastError = new Error(`HTTP ${response.status}`);
    } catch (error) {
      lastError = error;
    }
    await sleep(250);
  }
  throw lastError || new Error(`Timed out waiting for ${url}`);
}

class CdpSession {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.nextId = 1;
    this.callbacks = new Map();
    this.waiters = new Map();
  }

  async open() {
    this.ws = new WebSocket(this.wsUrl);
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error(`Timed out opening ${this.wsUrl}`)), 8000);
      this.ws.addEventListener('open', () => {
        clearTimeout(timeout);
        resolve();
      }, { once: true });
      this.ws.addEventListener('error', (error) => {
        clearTimeout(timeout);
        reject(error);
      }, { once: true });
    });
    this.ws.addEventListener('message', (event) => {
      const message = JSON.parse(event.data);
      if (message.id && this.callbacks.has(message.id)) {
        const { resolve, reject } = this.callbacks.get(message.id);
        this.callbacks.delete(message.id);
        if (message.error) reject(new Error(message.error.message));
        else resolve(message.result || {});
        return;
      }
      if (message.method && this.waiters.has(message.method)) {
        const waiters = this.waiters.get(message.method);
        this.waiters.delete(message.method);
        waiters.forEach((resolve) => resolve(message.params || {}));
      }
    });
  }

  send(method, params = {}) {
    const id = this.nextId++;
    this.ws.send(JSON.stringify({ id, method, params }));
    return new Promise((resolve, reject) => {
      this.callbacks.set(id, { resolve, reject });
    });
  }

  waitForEvent(method, timeoutMs = 8000) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error(`Timed out waiting for ${method}`)), timeoutMs);
      const wrappedResolve = (params) => {
        clearTimeout(timeout);
        resolve(params);
      };
      const waiters = this.waiters.get(method) || [];
      waiters.push(wrappedResolve);
      this.waiters.set(method, waiters);
    });
  }

  async close() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) this.ws.close();
  }
}

async function createPage() {
  const target = await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' }).then((response) => response.json());
  const page = new CdpSession(target.webSocketDebuggerUrl);
  await page.open();
  await page.send('Page.enable');
  await page.send('Runtime.enable');
  await page.send('Network.enable');
  await page.send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 1000,
    deviceScaleFactor: 1,
    mobile: false
  });
  return page;
}

async function navigate(page, url) {
  const loaded = page.waitForEvent('Page.loadEventFired', 10000).catch(() => null);
  await page.send('Page.navigate', { url });
  await loaded;
  await sleep(1800);
}

async function evaluate(page, expression) {
  const result = await page.send('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true
  });
  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.text || 'Browser evaluation failed');
  }
  return result.result?.value;
}

async function waitForText(page, text, timeoutMs = 10000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const found = await evaluate(page, `document.body && document.body.innerText.includes(${JSON.stringify(text)})`);
    if (found) return;
    await sleep(300);
  }
  const body = await evaluate(page, 'document.body ? document.body.innerText.slice(0, 1200) : ""');
  throw new Error(`Did not find "${text}" on page. Body started with: ${body}`);
}

async function setCurrentUser(page, email) {
  await evaluate(page, `localStorage.setItem('capvault.currentUserEmail', ${JSON.stringify(email)})`);
  const reloaded = page.waitForEvent('Page.loadEventFired', 10000).catch(() => null);
  await page.send('Page.reload', { ignoreCache: true });
  await reloaded;
  await sleep(1200);
}

async function clickButton(page, label) {
  const clicked = await evaluate(page, `
    (() => {
      const button = [...document.querySelectorAll('button')].find((item) => item.innerText.includes(${JSON.stringify(label)}));
      if (!button) return false;
      button.click();
      return true;
    })()
  `);
  if (!clicked) throw new Error(`Could not find button "${label}"`);
  await sleep(1200);
}

async function screenshot(page, name) {
  const result = await page.send('Page.captureScreenshot', {
    format: 'png',
    fromSurface: true
  });
  const filePath = path.join(outputDir, `${name}.png`);
  fs.writeFileSync(filePath, Buffer.from(result.data, 'base64'));
  return filePath;
}

const chrome = spawn(chromePath, [
  '--headless=new',
  '--disable-gpu',
  '--disable-extensions',
  '--no-first-run',
  '--no-default-browser-check',
  `--remote-debugging-port=${port}`,
  `--user-data-dir=${profileDir}`,
  '--window-size=1440,1000',
  'about:blank'
], {
  stdio: 'ignore'
});

try {
  await waitForJson(`http://127.0.0.1:${port}/json/version`);
  const page = await createPage();
  const shots = [];

  await navigate(page, `${baseUrl}/`);
  await waitForText(page, 'CapVault');
  await waitForText(page, 'Team Progress');
  shots.push(await screenshot(page, '01-admin-dashboard'));

  await navigate(page, `${baseUrl}/class-records`);
  await waitForText(page, 'Class Record Import');
  await clickButton(page, 'Preview');
  await waitForText(page, 'Column Mapping');
  shots.push(await screenshot(page, '02-class-record-import'));

  await navigate(page, `${baseUrl}/tracker`);
  await waitForText(page, 'Project Tracker');
  await waitForText(page, 'Class-wide tracker table');
  await waitForText(page, 'SRS');
  shots.push(await screenshot(page, '03-admin-tracker'));

  await setCurrentUser(page, 'david.ryan.sia@cit.edu');
  await navigate(page, `${baseUrl}/tracker`);
  await waitForText(page, 'MY PROGRESS');
  await waitForText(page, 'SIA, DAVID RYAN D.');
  shots.push(await screenshot(page, '04-student-my-progress'));

  await navigate(page, `${baseUrl}/submissions`);
  await waitForText(page, 'Submit deliverable');
  await waitForText(page, 'Version history');
  shots.push(await screenshot(page, '05-student-submissions'));

  await setCurrentUser(page, 'mae.reyes@cit.edu');
  await navigate(page, `${baseUrl}/review`);
  await waitForText(page, 'Adviser Review');
  await waitForText(page, 'Assigned submissions');
  await waitForText(page, 'SHA-256');
  shots.push(await screenshot(page, '06-adviser-review'));

  await setCurrentUser(page, 'admin@cit.edu');
  await navigate(page, `${baseUrl}/archive`);
  await waitForText(page, 'Archive Search and Retrieval');
  await waitForText(page, 'SHA-256');
  shots.push(await screenshot(page, '07-archive'));

  await navigate(page, `${baseUrl}/reports`);
  await waitForText(page, 'Advanced Reports');
  await waitForText(page, 'Submission and archive drill-down');
  shots.push(await screenshot(page, '08-reports'));

  await page.send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true
  });
  await navigate(page, `${baseUrl}/tracker`);
  await waitForText(page, 'Project Tracker');
  shots.push(await screenshot(page, '09-mobile-tracker'));

  await page.close();
  console.log(JSON.stringify({ baseUrl, screenshots: shots }, null, 2));
} finally {
  chrome.kill();
}
