-- CreateEnum
CREATE TYPE "public"."AgentStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "public"."InvoiceStatus" AS ENUM ('DRAFT', 'UNPAID', 'PARTIAL', 'PAID', 'OVERDUE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."InvoiceSource" AS ENUM ('BATCH_UPLOAD', 'MANUAL', 'SYSTEM');

-- CreateEnum
CREATE TYPE "public"."WalletTransactionType" AS ENUM ('DEPOSIT', 'WITHDRAWAL', 'SETTLEMENT', 'REVERSAL');

-- CreateEnum
CREATE TYPE "public"."PaymentMethod" AS ENUM ('EXTERNAL', 'INTERNAL_SETTLEMENT', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "public"."NotificationType" AS ENUM ('OVERDUE_REMINDER', 'INVOICE_ISSUED', 'PAYMENT_RECEIVED');

-- CreateEnum
CREATE TYPE "public"."NotificationStatus" AS ENUM ('SUCCESS', 'FAILED');

-- CreateTable
CREATE TABLE "public"."Partner" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Partner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Agent" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "commissionRate" DECIMAL(5,4) NOT NULL,
    "status" "public"."AgentStatus" NOT NULL DEFAULT 'ACTIVE',
    "email" TEXT,
    "phone" TEXT,
    "telegramChatId" TEXT,
    "avatarUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Agent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Invoice" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'IRR',
    "issueDate" TIMESTAMP(3) NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "status" "public"."InvoiceStatus" NOT NULL DEFAULT 'UNPAID',
    "source" "public"."InvoiceSource" NOT NULL DEFAULT 'SYSTEM',
    "batchId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."InvoiceItem" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitAmount" DECIMAL(18,2) NOT NULL,
    "totalAmount" DECIMAL(18,2) NOT NULL,

    CONSTRAINT "InvoiceItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."InvoiceStatusHistory" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "fromStatus" "public"."InvoiceStatus" NOT NULL,
    "toStatus" "public"."InvoiceStatus" NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "notes" TEXT,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InvoiceStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."InvoiceBatch" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,

    CONSTRAINT "InvoiceBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Payment" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "invoiceId" TEXT,
    "amount" DECIMAL(18,2) NOT NULL,
    "method" "public"."PaymentMethod" NOT NULL DEFAULT 'EXTERNAL',
    "reference" TEXT,
    "note" TEXT,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Wallet" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "balance" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'IRR',
    "lastTransactionAt" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Wallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."WalletTransaction" (
    "id" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "type" "public"."WalletTransactionType" NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "referenceId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "invoiceId" TEXT,
    "paymentId" TEXT,

    CONSTRAINT "WalletTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AuditLog" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "correlationId" TEXT,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."NotificationLog" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "type" "public"."NotificationType" NOT NULL,
    "status" "public"."NotificationStatus" NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "errorMessage" TEXT,

    CONSTRAINT "NotificationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SystemSetting" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "isSensitive" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "updatedBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "SystemSetting_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "public"."SettingsAuditLog" (
    "id" TEXT NOT NULL,
    "settingKey" TEXT NOT NULL,
    "oldValue" TEXT,
    "newValue" TEXT NOT NULL,
    "changedBy" TEXT NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SettingsAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProcessedUsageHash" (
    "hash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProcessedUsageHash_pkey" PRIMARY KEY ("hash")
);

-- CreateTable
CREATE TABLE "public"."CommissionReport" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "totalCommission" DECIMAL(18,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "calculationDetail" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finalizedAt" TIMESTAMP(3),

    CONSTRAINT "CommissionReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CommissionAdjustment" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "appliedReportId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'UNAPPLIED',

    CONSTRAINT "CommissionAdjustment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AgentFinancialSummary" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "totalBilled" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "totalPaid" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "outstandingAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "draftCount" INTEGER NOT NULL DEFAULT 0,
    "unpaidCount" INTEGER NOT NULL DEFAULT 0,
    "overdueCount" INTEGER NOT NULL DEFAULT 0,
    "paidCount" INTEGER NOT NULL DEFAULT 0,
    "lastCalculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AgentFinancialSummary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PortalAppearance" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "theme" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PortalAppearance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Agent_code_key" ON "public"."Agent"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_invoiceNumber_key" ON "public"."Invoice"("invoiceNumber");

-- CreateIndex
CREATE INDEX "InvoiceStatusHistory_invoiceId_idx" ON "public"."InvoiceStatusHistory"("invoiceId");

-- CreateIndex
CREATE UNIQUE INDEX "InvoiceBatch_jobId_key" ON "public"."InvoiceBatch"("jobId");

-- CreateIndex
CREATE UNIQUE INDEX "InvoiceBatch_idempotencyKey_key" ON "public"."InvoiceBatch"("idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "Wallet_agentId_key" ON "public"."Wallet"("agentId");

-- CreateIndex
CREATE UNIQUE INDEX "WalletTransaction_paymentId_key" ON "public"."WalletTransaction"("paymentId");

-- CreateIndex
CREATE INDEX "WalletTransaction_walletId_idx" ON "public"."WalletTransaction"("walletId");

-- CreateIndex
CREATE INDEX "WalletTransaction_invoiceId_idx" ON "public"."WalletTransaction"("invoiceId");

-- CreateIndex
CREATE INDEX "WalletTransaction_paymentId_idx" ON "public"."WalletTransaction"("paymentId");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "public"."AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "public"."AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "NotificationLog_invoiceId_type_idx" ON "public"."NotificationLog"("invoiceId", "type");

-- CreateIndex
CREATE INDEX "SettingsAuditLog_settingKey_idx" ON "public"."SettingsAuditLog"("settingKey");

-- CreateIndex
CREATE UNIQUE INDEX "AgentFinancialSummary_agentId_key" ON "public"."AgentFinancialSummary"("agentId");

-- CreateIndex
CREATE UNIQUE INDEX "PortalAppearance_agentId_key" ON "public"."PortalAppearance"("agentId");

-- AddForeignKey
ALTER TABLE "public"."Agent" ADD CONSTRAINT "Agent_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "public"."Partner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Invoice" ADD CONSTRAINT "Invoice_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "public"."Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Invoice" ADD CONSTRAINT "Invoice_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "public"."InvoiceBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."InvoiceItem" ADD CONSTRAINT "InvoiceItem_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "public"."Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."InvoiceStatusHistory" ADD CONSTRAINT "InvoiceStatusHistory_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "public"."Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Payment" ADD CONSTRAINT "Payment_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "public"."Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Payment" ADD CONSTRAINT "Payment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "public"."Invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Wallet" ADD CONSTRAINT "Wallet_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "public"."Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WalletTransaction" ADD CONSTRAINT "WalletTransaction_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "public"."Wallet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WalletTransaction" ADD CONSTRAINT "WalletTransaction_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "public"."Invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WalletTransaction" ADD CONSTRAINT "WalletTransaction_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "public"."Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."NotificationLog" ADD CONSTRAINT "NotificationLog_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "public"."Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SettingsAuditLog" ADD CONSTRAINT "SettingsAuditLog_settingKey_fkey" FOREIGN KEY ("settingKey") REFERENCES "public"."SystemSetting"("key") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CommissionReport" ADD CONSTRAINT "CommissionReport_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "public"."Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CommissionReport" ADD CONSTRAINT "CommissionReport_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "public"."Partner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CommissionAdjustment" ADD CONSTRAINT "CommissionAdjustment_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "public"."Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CommissionAdjustment" ADD CONSTRAINT "CommissionAdjustment_appliedReportId_fkey" FOREIGN KEY ("appliedReportId") REFERENCES "public"."CommissionReport"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AgentFinancialSummary" ADD CONSTRAINT "AgentFinancialSummary_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "public"."Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PortalAppearance" ADD CONSTRAINT "PortalAppearance_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "public"."Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
