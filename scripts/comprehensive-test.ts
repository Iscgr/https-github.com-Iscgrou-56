#!/usr/bin/env tsx

import chalk from 'chalk';
import { config } from 'dotenv';

import { EnhancedPlaywrightSuite } from './enhanced-comprehensive-test';
import { EnhancedTestSuite as EnhancedPuppeteerSuite } from './enhanced-test-suite';

type SuiteTarget = 'puppeteer' | 'playwright';

type SuiteDefinition = {
  name: string;
  description: string;
  factory: () => { runAllTests: () => Promise<void> };
};

config();

const SUITE_DEFINITIONS: Record<SuiteTarget, SuiteDefinition> = {
  puppeteer: {
    name: 'Puppeteer Enhanced Suite',
    description: 'پوشش کامل UI/Scenario/API با استفاده از Puppeteer',
    factory: () => new EnhancedPuppeteerSuite(),
  },
  playwright: {
    name: 'Playwright Enhanced Suite',
    description: 'اجرای تعاملی UI و API با Playwright و گزارش‌گیری پیشرفته',
    factory: () => new EnhancedPlaywrightSuite(),
  },
};

type CliOptions = {
  targets: SuiteTarget[];
};

function parseCliArguments(argv: string[]): CliOptions {
  const [, , ...args] = argv;
  const availableTargets = new Set<SuiteTarget>(['puppeteer', 'playwright']);

  if (args.length === 0) {
    return { targets: ['puppeteer', 'playwright'] };
  }

  const targets = new Set<SuiteTarget>();

  for (const arg of args) {
    const normalized = arg.replace(/^--?/, '').toLowerCase();
    if (normalized === 'all') {
      availableTargets.forEach((target) => targets.add(target));
      continue;
    }

    if (availableTargets.has(normalized as SuiteTarget)) {
      targets.add(normalized as SuiteTarget);
      continue;
    }

    console.warn(
      chalk.yellow(
        `⚠️ هدف ناشناخته «${arg}» نادیده گرفته شد. اهداف مجاز: ${Array.from(availableTargets).join(', ')}, یا all`,
      ),
    );
  }

  if (targets.size === 0) {
    return { targets: ['puppeteer', 'playwright'] };
  }

  return { targets: Array.from(targets) };
}

async function runSuite(target: SuiteTarget): Promise<void> {
  const definition = SUITE_DEFINITIONS[target];
  console.log(chalk.blue('\n' + '='.repeat(72)));
  console.log(chalk.blue(`🚀 شروع اجرای ${definition.name}`));
  console.log(chalk.blue(definition.description));
  console.log(chalk.blue('='.repeat(72)));

  const suite = definition.factory();
  await suite.runAllTests();
}

async function main() {
  const options = parseCliArguments(process.argv);

  console.log(chalk.magenta('\n🧪 MARFANET COMPREHENSIVE TEST ORCHESTRATOR'));
  console.log(chalk.magenta('='.repeat(72)));
  console.log(
    chalk.magenta(
      `اهداف انتخاب شده: ${options.targets
        .map((target) => SUITE_DEFINITIONS[target].name)
        .join(', ')}`,
    ),
  );
  console.log(chalk.magenta('برای تنظیم اهداف، از آرگومان‌های زیر استفاده کنید:'));
  console.log(chalk.magenta('   tsx scripts/comprehensive-test.ts all'));
  console.log(chalk.magenta('   tsx scripts/comprehensive-test.ts puppeteer')); 
  console.log(chalk.magenta('   tsx scripts/comprehensive-test.ts playwright')); 
  console.log(chalk.magenta('='.repeat(72)));

  const failures: Array<{ target: SuiteTarget; error: unknown }> = [];

  for (const target of options.targets) {
    try {
      await runSuite(target);
    } catch (error) {
      failures.push({ target, error });
      console.error(
        chalk.red(
          `❌ اجرای ${SUITE_DEFINITIONS[target].name} با خطا مواجه شد: ${
            (error as Error)?.message ?? String(error)
          }`,
        ),
      );
    }
  }

  if (failures.length > 0) {
    console.log(chalk.red('\n❌ برخی از تست‌ها با شکست مواجه شدند:'));
    failures.forEach(({ target, error }) => {
      console.log(
        chalk.red(
          ` - ${SUITE_DEFINITIONS[target].name}: ${(error as Error)?.message ?? String(error)}`,
        ),
      );
    });
    process.exitCode = 1;
    return;
  }

  console.log(chalk.green('\n✅ تمامی تست‌های انتخاب شده با موفقیت اجرا شدند.'));
}

if (require.main === module) {
  main().catch((error) => {
    console.error(chalk.red(`❌ خطای غیرمنتظره در اجرای تست‌های جامع: ${error}`));
    process.exit(1);
  });
}

export { main as runComprehensiveSuites };