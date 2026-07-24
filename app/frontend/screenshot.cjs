const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Ensure puppeteer-core is installed
try {
  require.resolve('puppeteer-core');
} catch (e) {
  console.log('Installing puppeteer-core (required for capturing screenshots)...');
  execSync('npm install puppeteer-core --no-save', { stdio: 'inherit', cwd: __dirname });
}

const puppeteer = require('puppeteer-core');

async function capture() {
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  if (!fs.existsSync(edgePath)) {
    throw new Error(`Microsoft Edge was not found at ${edgePath}. Please install Edge or update the executablePath.`);
  }

  const url = 'https://present-steeple-34y7.here.now/';
  // Save directly to C:\Users\akash\Stock trading AI Analysis\screenshots
  const screenshotsDir = path.join(__dirname, '..', '..', 'screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  console.log(`Launching headless Edge to capture: ${url}`);
  const browser = await puppeteer.launch({
    executablePath: edgePath,
    headless: true,
    args: [
      '--no-sandbox', 
      '--disable-setuid-sandbox',
      '--disable-web-security',
      '--allow-running-insecure-content'
    ]
  });

  const page = await browser.newPage();
  
  // Set a large viewport so elements render correctly
  await page.setViewport({ width: 1440, height: 950 });

  // Log page console errors to terminal
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

  console.log('Navigating to site...');
  await page.goto(url, { waitUntil: 'networkidle2' });

  console.log('Waiting for workspace dashboard to load...');
  await new Promise(resolve => setTimeout(resolve, 8000));

  // Screenshot 1: Navbar
  console.log('Capturing App Header...');
  const header = await page.$('#app-header');
  if (header) {
    await header.screenshot({ path: path.join(screenshotsDir, 'navbar.png') });
    console.log('Saved navbar.png');
  }

  // Screenshot 2: Sidebar
  console.log('Capturing App Sidebar...');
  const sidebar = await page.$('#app-sidebar');
  if (sidebar) {
    await sidebar.screenshot({ path: path.join(screenshotsDir, 'sidebar.png') });
    console.log('Saved sidebar.png');
  }

  // Screenshot 3: Trading Performance Section
  console.log('Capturing Trading Performance...');
  const perf = await page.$('#trading-performance-section');
  if (perf) {
    await perf.screenshot({ path: path.join(screenshotsDir, 'trading_performance.png') });
    console.log('Saved trading_performance.png');
  }

  // Screenshot 4: Research Assistant (Chatbot Home View)
  console.log('Capturing Research Assistant Home...');
  const chatSection = await page.$('#chatbot-section');
  if (chatSection) {
    await chatSection.screenshot({ path: path.join(screenshotsDir, 'research_assistant_home.png') });
    console.log('Saved research_assistant_home.png');
  }

  // Type concept query and submit to show new Block-based Markdown UI
  console.log('Submitting "rsi" query to chatbot to check new block-structured markdown response...');
  const inputSelector = '#chatbot-section input';
  const inputElement = await page.$(inputSelector);
  if (inputElement) {
    await page.type(inputSelector, 'rsi');
    await page.keyboard.press('Enter');

    console.log('Waiting for block-based response...');
    await new Promise(resolve => setTimeout(resolve, 4000));

    // Screenshot 4.5: Research Assistant Chat showing new blocks
    console.log('Capturing Chat view showing blockquotes layout...');
    if (chatSection) {
      await chatSection.screenshot({ path: path.join(screenshotsDir, 'research_assistant_chat_rsi.png') });
      console.log('Saved research_assistant_chat_rsi.png');
    }
  }

  // Reload the page to reset chatbot view back to home before clicking stock card
  console.log('Reloading page to reset chatbot view...');
  await page.reload({ waitUntil: 'networkidle2' });
  await new Promise(resolve => setTimeout(resolve, 6000));

  // Click on the first opportunity card to open the ScripAnalyzer (spacious margins)
  console.log('Clicking the first opportunity card to open Scrip Details...');
  const cardSelector = '.opportunity-card';
  const cardElement = await page.$(cardSelector);
  if (cardElement) {
    await page.click(cardSelector);
    console.log('Clicked card. Waiting for ScripAnalyzer to load charts...');
    await new Promise(resolve => setTimeout(resolve, 6000)); // Wait for analysis charts to render

    // Screenshot 5: Scrip Analyzer Section showing live RSI chart with improved padding
    console.log('Capturing Scrip Analyzer showing technical indicators and charts...');
    const scripSection = await page.$('#scrip-analyzer-section');
    if (scripSection) {
      await scripSection.screenshot({ path: path.join(screenshotsDir, 'scrip_analysis_rsi_chart.png') });
      console.log('Saved scrip_analysis_rsi_chart.png');
    }
  }

  console.log('All screenshots captured successfully!');
  await browser.close();
}

capture().catch(err => {
  console.error('Screenshot capture failed:', err);
  process.exit(1);
});
