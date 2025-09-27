export const COMMON_SELECTORS = {
  sidebar: ['aside', 'nav[role="navigation"]', 'nav'],
  header: ['header', '[data-testid="page-header"]'],
  main: ['main', '[role="main"]'],
  dialog: ['dialog[open]', '[role="dialog"], [aria-modal="true"]'],
  tables: ['table', '[role="table"]'],
};

export const TEXT_SNIPPETS = {
  addPayment: ['افزودن پرداخت', 'پرداخت جدید', 'ثبت پرداخت', 'New Payment', 'Add Payment'],
  create: ['ایجاد', 'ساخت', 'Create', 'New'],
  cancel: ['لغو', 'Cancel'],
  save: ['ذخیره', 'ثبت', 'Save'],
  menu: ['منو', 'Menu'],
};

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const buildTextMatchers = (values: string[]) =>
  values.map((value) => new RegExp(escapeRegex(value), 'i'));

export const buildRoleOptions = (texts: string[]) =>
  buildTextMatchers(texts).map((name) => ({ name }));
