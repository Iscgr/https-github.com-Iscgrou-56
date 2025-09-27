#!/usr/bin/env tsx

import chalk from 'chalk';
import { config } from 'dotenv';
import fetch from 'node-fetch';
import * as puppeteer from 'puppeteer';

import { createConsoleCollector } from './testing/console-classifier';
import { DEFAULT_ENVIRONMENT_CONFIG } from './testing/config';
import { TestEnvironmentManager } from './testing/orchestrator';
import { TestReporter } from './testing/reporter';
import { TEXT_SNIPPETS } from './testing/selectors';
import type { ConsoleLogEntry, TestResultRecord } from './testing/types';

config();

const SUITE_NAME = 'enhanced-puppeteer-suite';

const SUITE_SETTINGS = {
  timeout: Number(process.env.TEST_TIMEOUT_MS ?? 20_000),
  retryCount: Number(process.env.TEST_RETRY_COUNT ?? 2),
  logLevel: process.env.TEST_LOG_LEVEL ?? 'INFO',
  puppeteerArgs: ['--no-sandbox', '--disable-setuid-sandbox'],
};

type TestHandlerResult = {
  details?: unknown;
  screenshots?: string[];
};

type TestHandler = (
  page: puppeteer.Page,
  collector: ReturnType<typeof createConsoleCollector>,
) => Promise<TestHandlerResult | void>;

class EnhancedTestSuite {
  private results: TestResultRecord[] = [];

  private allConsoleLogs: ConsoleLogEntry[] = [];

  private readonly environmentManager = new TestEnvironmentManager();

  private readonly startTime = Date.now();

  private readonly reporter = new TestReporter({
    suiteName: SUITE_NAME,
    artifactsRoot: DEFAULT_ENVIRONMENT_CONFIG.artifactsRoot,
    startTime: this.startTime,
  });

  private baseUrl = DEFAULT_ENVIRONMENT_CONFIG.baseUrl;

  private browser: puppeteer.Browser | null = null;

  private screenshotCounter = 0;

  private cachedAgentId: string | null = null;

  constructor() {
    console.log(chalk.blue('\n🔍 MARFANET ENHANCED TEST SUITE'));
    console.log(chalk.blue('='.repeat(60)));
    console.log(chalk.blue(`Start Time: ${new Date(this.startTime).toISOString()}`));
    console.log(chalk.blue(`Base URL: ${this.baseUrl}`));
    console.log(chalk.blue(`Log Level: ${SUITE_SETTINGS.logLevel}`));
    console.log(chalk.blue('='.repeat(60)));
  }

  private async setupBrowser(): Promise<void> {
    try {
      this.browser = await puppeteer.launch({
        headless: true,
        args: SUITE_SETTINGS.puppeteerArgs,
      });
      console.log(chalk.green('✅ مرورگر headless راه‌اندازی شد'));
    } catch (error) {
      console.error(chalk.red(`❌ خطا در راه‌اندازی مرورگر: ${error}`));
      throw error;
    }
  }

  private async closeBrowser(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      console.log(chalk.green('✅ مرورگر headless بسته شد'));
    }
  }

  private async createPage(pageName: string): Promise<[
    puppeteer.Page,
    ReturnType<typeof createConsoleCollector>,
  ]> {
    if (!this.browser) {
      throw new Error('مرورگر راه‌اندازی نشده است');
    }

    const page = await this.browser.newPage();
    await page.setDefaultNavigationTimeout(SUITE_SETTINGS.timeout);
    const collector = createConsoleCollector(page, pageName);
    return [page, collector];
  }

  private async executeTest(module: string, testName: string, handler: TestHandler) {
    const testStart = Date.now();
    console.log(chalk.blue(`\n📋 [${module}] در حال تست: ${testName}`));

    const [page, collector] = await this.createPage(`${module}-${testName}`);

    let status: TestResultRecord['status'] = 'PASS';
    let errorMessage: string | undefined;
    let details: unknown;
    let screenshots: string[] = [];

    try {
      const result = await handler(page, collector);
      if (result) {
        details = result.details;
        screenshots = result.screenshots ?? [];
      }

      const logs = collector.getEntries();
      this.allConsoleLogs.push(...logs);

      if (collector.hasCritical()) {
        status = 'FAIL';
        errorMessage = 'Critical console errors detected';
      }

      const duration = Date.now() - testStart;
      const resultRecord: TestResultRecord = {
        module,
        test: testName,
        status,
        duration,
        error: errorMessage,
        details,
        screenshots,
        console: logs,
      };

      const testIndex = this.results.length;
      this.results.push(resultRecord);
      this.reporter.record(resultRecord);
      this.reporter.recordConsoleLogs(testIndex, logs);

      if (status === 'PASS') {
        console.log(chalk.green(`✅ [${module}] تست با موفقیت انجام شد: ${testName} (${duration}ms)`));
      } else {
        const firstCritical = logs.find((entry) => entry.severity === 'CRITICAL');
        console.log(
          chalk.red(
            `❌ [${module}] خطا در تست: ${testName} (${duration}ms) - ${
              firstCritical?.text ?? errorMessage
            }`,
          ),
        );
      }
    } catch (error: any) {
      const duration = Date.now() - testStart;
      status = 'FAIL';
      errorMessage = error?.message ?? String(error);
      const logs = collector.getEntries();
      this.allConsoleLogs.push(...logs);

      const resultRecord: TestResultRecord = {
        module,
        test: testName,
        status,
        duration,
        error: errorMessage,
        details: { stack: error?.stack },
        screenshots,
        console: logs,
      };

      const testIndex = this.results.length;
      this.results.push(resultRecord);
      this.reporter.record(resultRecord);
      this.reporter.recordConsoleLogs(testIndex, logs);

      console.log(chalk.red(`❌ [${module}] خطا در تست: ${testName} (${duration}ms)`));
      console.log(chalk.red(`   ${errorMessage}`));
    } finally {
      collector.detach();
      await page.close();
    }
  }

  private nextScreenshotPath(label: string): `${string}.png` {
    this.screenshotCounter += 1;
    const normalized = label.replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `${String(this.screenshotCounter).padStart(3, '0')}-${normalized}.png`;
    return this.reporter.resolveScreenshotPath(filename) as `${string}.png`;
  }

  private buildUrl(pathname = '/') {
    return new URL(pathname, this.baseUrl).toString();
  }

  private logSection(title: string) {
    console.log(chalk.blue(`\n--- ${title} ---`));
  }

  private async getDefaultAgentId(): Promise<string | null> {
    if (this.cachedAgentId) {
      return this.cachedAgentId;
    }

    try {
      const response = await fetch(this.buildUrl('/api/agents'));
      if (!response.ok) return null;
      const data = (await response.json()) as Array<{ id?: string }>;
      this.cachedAgentId = data?.[0]?.id ?? null;
      return this.cachedAgentId;
    } catch (error) {
      console.warn('Failed to fetch default agent id', error);
      return null;
    }
  }

  async testUIComponents(): Promise<void> {
    await this.executeTest('UI', 'داشبورد - ناوبری', async (page) => {
      await page.goto(this.buildUrl('/'), { waitUntil: 'networkidle0' });

      const sidebarExists = await page.evaluate(() => {
        return document.querySelector('nav, aside') !== null;
      });

      if (!sidebarExists) {
        throw new Error('سایدبار یا ناوبری اصلی یافت نشد');
      }

      const screenshotPath = this.nextScreenshotPath('ui-dashboard-navigation');
      await page.screenshot({ path: screenshotPath, fullPage: true });

      const menuItems = await page.evaluate(() => {
        const items = Array.from(document.querySelectorAll('nav a'));
        return items.map((item) => ({
          text: item.textContent?.trim(),
          href: item.getAttribute('href'),
        }));
      });

      return {
        details: { sidebarExists, menuItemsCount: menuItems.length, menuItems },
        screenshots: [screenshotPath],
      };
    });

    await this.executeTest('UI', 'پروفایل نماینده', async (page) => {
      const agentId = await this.getDefaultAgentId();
      if (!agentId) {
        throw new Error('هیچ نماینده‌ای برای تست یافت نشد');
      }

      await page.goto(this.buildUrl(`/agents/${agentId}`), { waitUntil: 'networkidle0' });

      const profileElements = await page.evaluate(() => {
        const nameElement = document.querySelector('h1, h2, h3, h4, h5, h6')?.textContent?.trim();
        const avatar = document.querySelector('img')?.getAttribute('src');
        const tabs = Array.from(document.querySelectorAll('[role="tab"]')).map((tab) =>
          tab.textContent?.trim(),
        );
        const buttons = Array.from(document.querySelectorAll('button')).map((btn) =>
          btn.textContent?.trim(),
        );

        return { nameElement, avatar, tabs, buttons };
      });

      if (!profileElements.nameElement) {
        throw new Error('نام نماینده در صفحه پروفایل یافت نشد');
      }

      if (profileElements.tabs.length === 0) {
        throw new Error('هیچ تب فعالی در صفحه پروفایل نماینده وجود ندارد');
      }

      const screenshotPath = this.nextScreenshotPath('ui-agent-profile');
      await page.screenshot({ path: screenshotPath, fullPage: true });

      return {
        details: profileElements,
        screenshots: [screenshotPath],
      };
    });

    await this.executeTest('UI', 'فرم پرداخت', async (page) => {
      await page.goto(this.buildUrl('/payments'), { waitUntil: 'networkidle0' });

      await page.evaluate((buttonTexts) => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const target = buttons.find((btn) =>
          buttonTexts.some((text: string) => btn.textContent?.includes(text)),
        );
        target?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      }, TEXT_SNIPPETS.addPayment);

      await page.waitForSelector('dialog, [role="dialog"]', { timeout: 5_000 });

      const formElements = await page.evaluate(() => {
        const dialog = document.querySelector('dialog, [role="dialog"]');
        const inputs = Array.from(dialog?.querySelectorAll('input') ?? []).map((input) => ({
          type: input.type,
          name: input.name,
          placeholder: input.placeholder,
        }));
        const selects = Array.from(dialog?.querySelectorAll('select') ?? []).length;
        const buttons = Array.from(dialog?.querySelectorAll('button') ?? []).map((btn) =>
          btn.textContent?.trim(),
        );

        return { dialogExists: !!dialog, inputs, selects, buttons };
      });

      if (!formElements.dialogExists) {
        throw new Error('دیالوگ فرم پرداخت قابل مشاهده نیست');
      }

      const screenshotPath = this.nextScreenshotPath('ui-payment-form');
      await page.screenshot({ path: screenshotPath });

      return {
        details: formElements,
        screenshots: [screenshotPath],
      };
    });
  }

  async testUserScenarios(): Promise<void> {
    await this.executeTest('UserScenario', 'افزودن پرداخت جدید', async (page) => {
      await page.goto(this.buildUrl('/payments'), { waitUntil: 'networkidle0' });

      const initialPaymentsCount = await page.evaluate(() =>
        document.querySelectorAll('table tbody tr').length,
      );

      await page.evaluate((buttonTexts) => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const target = buttons.find((btn) =>
          buttonTexts.some((text: string) => btn.textContent?.includes(text)),
        );
        target?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      }, TEXT_SNIPPETS.addPayment);

      await page.waitForSelector('dialog, [role="dialog"]', { timeout: 5_000 });

      await page.evaluate((saveTexts) => {
        const dialog = document.querySelector('dialog, [role="dialog"]');
        const inputs = dialog?.querySelectorAll('input') ?? [];
        inputs.forEach((input) => {
          if (input.type === 'text') input.value = 'تست خودکار';
          if (input.type === 'number') input.value = '1000000';
          if (input.type === 'date') input.value = '2024-01-01';
        });

        const selects = dialog?.querySelectorAll('select') ?? [];
        selects.forEach((select) => {
          if (select.options.length > 1) {
            select.selectedIndex = 1;
          }
        });

        const buttons = Array.from(dialog?.querySelectorAll('button') ?? []);
        const submit = buttons.find((btn) =>
          saveTexts.some((text: string) => btn.textContent?.includes(text)) || btn.type === 'submit',
        );
        submit?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      }, TEXT_SNIPPETS.save);

      await page.waitForFunction(
        () => !document.querySelector('dialog[open], [role="dialog"][aria-modal="true"]'),
        { timeout: 5_000 },
      );

      const finalPaymentsCount = await page.evaluate(() =>
        document.querySelectorAll('table tbody tr').length,
      );

      const screenshotPath = this.nextScreenshotPath('scenario-add-payment');
      await page.screenshot({ path: screenshotPath, fullPage: true });

      return {
        details: {
          initialCount: initialPaymentsCount,
          finalCount: finalPaymentsCount,
          success: finalPaymentsCount >= initialPaymentsCount,
        },
        screenshots: [screenshotPath],
      };
    });

    await this.executeTest('UserScenario', 'مشاهده گزارش‌ها', async (page) => {
      await page.goto(this.buildUrl('/reports'), { waitUntil: 'networkidle0' });

      const reportElements = await page.evaluate(() => {
        const charts = document.querySelectorAll('canvas, svg, [role="img"]').length;
        const tables = document.querySelectorAll('table').length;
        const filters = document.querySelectorAll('select, input[type="date"]').length;

        return { charts, tables, filters };
      });

      if (reportElements.charts === 0 && reportElements.tables === 0) {
        throw new Error('هیچ نمودار یا جدولی در صفحه گزارش‌ها یافت نشد');
      }

      const screenshotPath = this.nextScreenshotPath('scenario-reports');
      await page.screenshot({ path: screenshotPath, fullPage: true });

      return {
        details: reportElements,
        screenshots: [screenshotPath],
      };
    });
  }

  async testHydrationIssues(): Promise<void> {
    const pages = [
      { name: 'dashboard', url: '/' },
      { name: 'agents', url: '/agents' },
      { name: 'partners', url: '/partners' },
      { name: 'payments', url: '/payments' },
      { name: 'settings', url: '/settings' },
    ];

    for (const pageInfo of pages) {
      await this.executeTest('Hydration', `Hydration ${pageInfo.name}`, async (page, collector) => {
        await page.goto(this.buildUrl(pageInfo.url), { waitUntil: 'networkidle0' });
        await this.delay(2_000);

        const screenshotPath = this.nextScreenshotPath(`hydration-${pageInfo.name}`);
        await page.screenshot({ path: screenshotPath, fullPage: true });

        const logs = collector
          .getEntries()
          .filter((entry) => /hydration/i.test(entry.text))
          .map((entry) => entry.text);

        return {
          details: {
            url: pageInfo.url,
            hydrationErrors: logs,
            hasHydrationErrors: logs.length > 0,
          },
          screenshots: [screenshotPath],
        };
      });
    }
  }

  async testConsoleErrors(): Promise<void> {
    const pages = [
      { name: 'dashboard', url: '/' },
      { name: 'agents', url: '/agents' },
      { name: 'partners', url: '/partners' },
      { name: 'payments', url: '/payments' },
      { name: 'invoices', url: '/invoices' },
      { name: 'settings', url: '/settings' },
    ];

    for (const pageInfo of pages) {
      await this.executeTest('Console', `Console ${pageInfo.name}`, async (page, collector) => {
        await page.goto(this.buildUrl(pageInfo.url), { waitUntil: 'networkidle0' });
        await this.delay(3_000);

        const entries = collector.getEntries();
        const errors = entries.filter((entry) => entry.severity === 'CRITICAL');
        const warnings = entries.filter((entry) => entry.severity === 'WARNING');

        return {
          details: {
            url: pageInfo.url,
            errorCount: errors.length,
            warningCount: warnings.length,
            errors: errors.map((entry) => entry.text),
            warnings: warnings.map((entry) => entry.text),
          },
        };
      });
    }
  }

  async testApiEndpoints(): Promise<void> {
    const endpoints = [
      '/api/agents',
      '/api/invoices',
      '/api/payments',
      '/api/sales-partners',
      '/api/agent-summaries',
      '/api/internal/metrics',
    ];

    for (const endpoint of endpoints) {
      await this.executeTest('API', `Endpoint ${endpoint}`, async () => {
        const url = this.buildUrl(endpoint);
        const response = await fetch(url, {
          headers: { Accept: 'application/json' },
        });

        const contentType = response.headers.get('content-type') ?? 'unknown';
        let data: unknown;

        if (contentType.includes('application/json')) {
          data = await response.json();
        } else {
          data = await response.text();
        }

        return {
          details: {
            status: response.status,
            ok: response.ok,
            contentType,
            dataType: typeof data,
            isArray: Array.isArray(data),
            responseSample: typeof data === 'string' ? data.slice(0, 200) : undefined,
          },
        };
      });
    }
  }

  private async delay(ms: number) {
    return new Promise<void>((resolve) => {
      setTimeout(resolve, ms);
    });
  }

  private finalizeReport() {
    const totalDuration = Date.now() - this.startTime;
    const totalTests = this.results.length;
    const passedTests = this.results.filter((r) => r.status === 'PASS').length;
    const failedTests = this.results.filter((r) => r.status === 'FAIL').length;
    const skippedTests = this.results.filter((r) => r.status === 'SKIP').length;

    const consoleCritical = this.allConsoleLogs.filter((log) => log.severity === 'CRITICAL').length;
    const consoleWarnings = this.allConsoleLogs.filter((log) => log.severity === 'WARNING').length;
    const consoleInfo = this.allConsoleLogs.filter((log) => log.severity === 'INFO').length;

    const moduleStats = this.results.reduce<Record<string, { total: number; passed: number; failed: number }>>(
      (acc, result) => {
        if (!acc[result.module]) {
          acc[result.module] = { total: 0, passed: 0, failed: 0 };
        }
        acc[result.module].total += 1;
        if (result.status === 'PASS') acc[result.module].passed += 1;
        if (result.status === 'FAIL') acc[result.module].failed += 1;
        return acc;
      },
      {},
    );

    console.log(chalk.blue('\n📊 گزارش تست‌های جامع'));
    console.log(chalk.blue('='.repeat(60)));
    console.log(chalk.blue(`📝 تعداد کل تست‌ها: ${totalTests}`));
    console.log(chalk.green(`✅ تست‌های موفق: ${passedTests}`));
    console.log(chalk.red(`❌ تست‌های ناموفق: ${failedTests}`));
    console.log(chalk.yellow(`⚠️ تست‌های رد شده: ${skippedTests}`));
    console.log(chalk.blue(`⏱️ زمان کل اجرا: ${(totalDuration / 1_000).toFixed(2)} ثانیه`));
    console.log(
      chalk.blue(
        `🖨️ وضعیت کنسول → بحرانی: ${consoleCritical}, هشدار: ${consoleWarnings}, اطلاع‌رسانی: ${consoleInfo}`,
      ),
    );

    console.log(chalk.blue('\n📌 نتایج به تفکیک ماژول:'));
    Object.entries(moduleStats).forEach(([module, stats]) => {
      const passRate = stats.total === 0 ? 0 : Math.round((stats.passed / stats.total) * 100);
      const color = passRate > 90 ? chalk.green : passRate > 70 ? chalk.yellow : chalk.red;
      console.log(color(`   ${module}: ${stats.passed}/${stats.total} (${passRate}%)`));
    });

    const metadata = {
      totalConsoleLogs: this.allConsoleLogs.length,
      consoleBreakdown: {
        critical: consoleCritical,
        warning: consoleWarnings,
        info: consoleInfo,
      },
      moduleStats,
      suiteSettings: SUITE_SETTINGS,
    };

    this.reporter.flush(metadata);
    console.log(chalk.blue('\n🏁 پایان تست‌های جامع'));
  }

  async runAllTests(): Promise<void> {
    try {
      await this.environmentManager.withEnvironment(async (context) => {
        this.baseUrl = context.config.baseUrl;
        this.reporter.setEnvironment(context.environment);

        console.log(chalk.blue('🚀 شروع اجرای تست‌های جامع...'));
        await this.setupBrowser();

        try {
          this.logSection('تست رندر و اجزای UI');
          await this.testUIComponents();

          this.logSection('تست سناریوهای واقعی کاربر');
          await this.testUserScenarios();

          this.logSection('تست خطاهای هایدریشن');
          await this.testHydrationIssues();

          this.logSection('تست خطاهای کنسول');
          await this.testConsoleErrors();

          this.logSection('تست API Endpoints');
          await this.testApiEndpoints();
        } finally {
          await this.closeBrowser();
        }
      });
    } catch (error) {
      console.error(chalk.red(`❌ خطا در اجرای تست‌ها: ${error}`));
    } finally {
      this.finalizeReport();
    }
  }
}

if (require.main === module) {
  const testSuite = new EnhancedTestSuite();
  testSuite
    .runAllTests()
    .then(() => {
      console.log(chalk.green('\n✅ اجرای تست‌های جامع به پایان رسید.'));
    })
    .catch((error) => {
      console.error(chalk.red(`\n❌ خطا در اجرای تست‌های جامع: ${error}`));
      process.exit(1);
    });
}

export { EnhancedTestSuite };