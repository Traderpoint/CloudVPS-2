/**
 * Startup information display for Systrix Middleware NextJS
 * Shows available endpoints and services when server starts
 */

const chalk = require('chalk');

function displayStartupInfo(port = 3005) {
  const middlewareUrl = `http://localhost:${port}`;
  const cloudVpsUrl = 'http://localhost:3000';
  const partnersPortalUrl = 'http://localhost:3006';

  console.log('\n' + '='.repeat(80));
  console.log(chalk.cyan.bold('🎛️  SYSTRIX MIDDLEWARE NEXTJS - SERVER STARTED'));
  console.log('='.repeat(80));
  
  console.log(chalk.green.bold('\n📊 MAIN SERVICES:'));
  console.log(chalk.white(`  Dashboard:        ${chalk.yellow.bold(middlewareUrl)}/`));
  console.log(chalk.white(`  CloudVPS App:     ${chalk.yellow.bold(cloudVpsUrl)}/`));
  console.log(chalk.white(`  Partners Portal:  ${chalk.yellow.bold(partnersPortalUrl)}/`));

  console.log(chalk.green.bold('\n🔌 API ENDPOINTS:'));
  console.log(chalk.white(`  Status:           ${chalk.yellow.bold(middlewareUrl)}/api/status`));
  console.log(chalk.white(`  Products:         ${chalk.yellow.bold(middlewareUrl)}/api/products`));
  console.log(chalk.white(`  Affiliates:       ${chalk.yellow.bold(middlewareUrl)}/api/affiliates`));
  console.log(chalk.white(`  Payment Methods:  ${chalk.yellow.bold(middlewareUrl)}/api/payments/methods`));
  console.log(chalk.white(`  Test Connection:  ${chalk.yellow.bold(middlewareUrl)}/api/test-connection`));
  console.log(chalk.white(`  Health Check:     ${chalk.yellow.bold(middlewareUrl)}/api/health`));

  console.log(chalk.green.bold('\n📈 MONITORING & STATS:'));
  console.log(chalk.white(`  Statistics:       ${chalk.yellow.bold(middlewareUrl)}/api/stats`));
  console.log(chalk.white(`  Logs:             ${chalk.yellow.bold(middlewareUrl)}/api/logs`));
  console.log(chalk.white(`  Product Mapping:  ${chalk.yellow.bold(middlewareUrl)}/api/product-mapping`));

  console.log(chalk.green.bold('\n🛠️  DEVELOPMENT & TESTING:'));
  console.log(chalk.white(`  Dashboard (alt):  ${chalk.yellow.bold(middlewareUrl)}/dashboard`));
  console.log(chalk.white(`  API Documentation: Available at each endpoint with GET request`));

  console.log(chalk.green.bold('\n⚙️  CONFIGURATION:'));
  console.log(chalk.white(`  Environment:      ${chalk.cyan(process.env.NODE_ENV || 'development')}`));
  console.log(chalk.white(`  Port:             ${chalk.cyan(port)}`));
  console.log(chalk.white(`  HostBill URL:     ${chalk.cyan(process.env.HOSTBILL_BASE_URL || 'Not configured')}`));
  console.log(chalk.white(`  Log Level:        ${chalk.cyan(process.env.LOG_LEVEL || 'info')}`));

  console.log('\n' + '='.repeat(80));
  console.log(chalk.green.bold('✅ Server is ready and listening for requests!'));
  console.log(chalk.gray('💡 Tip: Open the Dashboard URL in your browser to get started'));
  console.log('='.repeat(80) + '\n');
}

function displayQuickLinks() {
  const middlewareUrl = `http://localhost:${process.env.PORT || 3005}`;
  
  console.log(chalk.blue.bold('\n🔗 QUICK LINKS:'));
  console.log(chalk.white(`  Main Dashboard:   ${chalk.yellow.underline(middlewareUrl)}/`));
  console.log(chalk.white(`  API Status:       ${chalk.yellow.underline(middlewareUrl)}/api/status`));
  console.log(chalk.white(`  View Products:    ${chalk.yellow.underline(middlewareUrl)}/api/products`));
  console.log('');
}

module.exports = {
  displayStartupInfo,
  displayQuickLinks
};
