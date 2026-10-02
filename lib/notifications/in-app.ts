/**
 * In-App Notification Utilities
 * Helper functions for creating in-app notifications
 * Complements email notifications with real-time in-app alerts
 */

import { createNotification } from "@/prisma/notification";
import { prisma } from "@/prisma/client";
import { logger } from "@/lib/logger";
import { normalizeLocale } from "@/lib/i18n/config";
import {
  createTranslator,
  type TranslateFn,
  type TranslateVars,
} from "@/lib/i18n/translate";
import type {
  CreateNotificationInput,
  NotificationType,
  NotificationMetadata,
} from "@/types/notification";

/**
 * Notification rows store finished text, so the recipient's language is resolved
 * when the row is written (profile preference → default Chinese).
 */
async function translatorFor(userId: string): Promise<TranslateFn> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { locale: true },
  });
  return createTranslator(normalizeLocale(user?.locale));
}

/** Sentence vars that carry a status enum — "approved" reads 已通过 in Chinese. */
const STATUS_VARS = new Set(["from", "to", "status", "result"]);

function localizeVars(
  t: TranslateFn,
  vars?: TranslateVars,
): TranslateVars | undefined {
  if (!vars) return vars;
  const out: TranslateVars = {};
  for (const [key, value] of Object.entries(vars)) {
    out[key] =
      typeof value === "string" && STATUS_VARS.has(key)
        ? t(value.charAt(0).toUpperCase() + value.slice(1))
        : value;
  }
  return out;
}

/** Stored notification body — a sentence template plus its values. */
export type NotificationMessage = {
  key: string;
  vars?: TranslateVars;
  /** Extra fragments (e.g. "notes updated"), translated and joined per language. */
  fragments?: Array<string | { key: string; vars?: TranslateVars }>;
};

/** List separator for joined fragments — reads 顿号 in Chinese, comma in English. */
function fragmentSeparator(t: TranslateFn): string {
  return t(", ");
}

/**
 * Create an in-app notification
 * This function creates a notification in the database
 * Fails silently if there's an error (non-blocking)
 *
 * @param data - Notification creation data
 * @returns Promise<void> - Resolves when notification is created (or fails silently)
 */
export async function createInAppNotification(
  data: CreateNotificationInput
): Promise<void> {
  try {
    await createNotification(data);
    logger.debug("In-app notification created", {
      userId: data.userId,
      type: data.type,
      title: data.title,
    });
  } catch (error) {
    // Log error but don't throw - notification failure shouldn't break main operations
    logger.error("Failed to create in-app notification", {
      error: error instanceof Error ? error.message : "Unknown error",
      userId: data.userId,
      type: data.type,
    });
  }
}

/**
 * Create low stock notification
 *
 * @param productName - Product name
 * @param currentQuantity - Current product quantity
 * @param threshold - Low stock threshold
 * @param sku - Product SKU (optional)
 * @param productId - Product ID for linking (optional)
 * @param userId - User ID to send notification to
 * @returns Promise<void>
 */
export async function createLowStockNotification(
  productName: string,
  currentQuantity: number,
  threshold: number,
  userId: string,
  sku?: string,
  productId?: string
): Promise<void> {
  const metadata: NotificationMetadata = {};
  if (productId) metadata.productId = productId;
  if (sku) metadata.sku = sku;

  const t = await translatorFor(userId);
  await createInAppNotification({
    userId,
    type: "low_stock",
    title: t("Low Stock Alert"),
    message:
      t("{product} is running low. Current quantity: {quantity} (threshold: {threshold})", {
        product: productName,
        quantity: currentQuantity,
        threshold,
      }) + (sku ? t(" (SKU: {sku})", { sku }) : ""),
    link: productId ? `/products?search=${encodeURIComponent(productName)}` : undefined,
    metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
  });
}

/**
 * Create stock out notification
 *
 * @param productName - Product name
 * @param sku - Product SKU (optional)
 * @param productId - Product ID for linking (optional)
 * @param userId - User ID to send notification to
 * @returns Promise<void>
 */
export async function createStockOutNotification(
  productName: string,
  userId: string,
  sku?: string,
  productId?: string
): Promise<void> {
  const metadata: NotificationMetadata = {};
  if (productId) metadata.productId = productId;
  if (sku) metadata.sku = sku;

  const t = await translatorFor(userId);
  await createInAppNotification({
    userId,
    type: "stock_out",
    title: t("Stock Out Alert"),
    message:
      t("{product} is out of stock. Please restock immediately.", {
        product: productName,
      }) + (sku ? t(" (SKU: {sku})", { sku }) : ""),
    link: productId ? `/products?search=${encodeURIComponent(productName)}` : undefined,
    metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
  });
}

/**
 * Create order notification
 *
 * @param type - Notification type (order_confirmation, order_status_update, etc.)
 * @param orderNumber - Order number
 * @param message - Notification message
 * @param orderId - Order ID for linking (optional)
 * @param userId - User ID to send notification to
 * @returns Promise<void>
 */
export async function createOrderNotification(
  type: "order_confirmation" | "order_status_update" | "shipping_notification",
  orderNumber: string,
  message: NotificationMessage,
  userId: string,
  orderId?: string
): Promise<void> {
  const metadata: NotificationMetadata = {};
  if (orderId) metadata.orderId = orderId;

  const t = await translatorFor(userId);

  let title: string;
  switch (type) {
    case "order_confirmation":
      title = "Order Confirmed";
      break;
    case "order_status_update":
      title = "Order Status Updated";
      break;
    case "shipping_notification":
      title = "Order Shipped";
      break;
    default:
      title = "Order Notification";
  }

  const fragments = message.fragments?.length
    ? message.fragments
        .map((fragment) =>
          typeof fragment === "string"
            ? t(fragment)
            : t(fragment.key, localizeVars(t, fragment.vars)),
        )
        .join(fragmentSeparator(t))
    : null;
  const body = t(message.key, localizeVars(t, message.vars));

  await createInAppNotification({
    userId,
    type,
    title: `${t(title)} - ${orderNumber}`,
    message: fragments ? `${body}${fragments}` : body,
    link: orderId ? `/orders/${orderId}` : undefined,
    metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
  });
}

/**
 * Notify a product owner that a client placed an order containing their products.
 * Used after order creation: for each product owner (excluding the order placer), create one notification.
 *
 * @param orderId - Order ID for link
 * @param orderNumber - Order number for display
 * @param buyerDisplay - Buyer name/email (e.g. "Jane Doe (jane@example.com)")
 * @param productOwnerUserId - Product owner to notify
 */
export async function createClientOrderReceivedNotification(
  orderId: string,
  orderNumber: string,
  buyerDisplay: string,
  productOwnerUserId: string,
): Promise<void> {
  const t = await translatorFor(productOwnerUserId);
  await createInAppNotification({
    userId: productOwnerUserId,
    type: "client_order_received",
    title: t("New order from a client"),
    message: t("{buyer} placed order {orderNumber} containing your products.", {
      buyer: buyerDisplay,
      orderNumber,
    }),
    link: `/admin/client-orders/${orderId}`,
    metadata: { orderId },
  });
}

/**
 * Notify product owner when someone submits a review for their product.
 *
 * @param productOwnerUserId - Product owner to notify
 * @param reviewId - Review ID for link
 * @param productName - Product name for message
 * @param reviewerDisplay - Reviewer name/email for message
 */
export async function createProductReviewSubmittedNotification(
  productOwnerUserId: string,
  reviewId: string,
  productName: string,
  reviewerDisplay: string,
): Promise<void> {
  const t = await translatorFor(productOwnerUserId);
  await createInAppNotification({
    userId: productOwnerUserId,
    type: "product_review_submitted",
    title: t("New product review"),
    message: t('{reviewer} left a review for "{product}".', {
      reviewer: reviewerDisplay,
      product: productName,
    }),
    link: `/admin/product-reviews/${reviewId}`,
    metadata: { reviewId, productName },
  });
}

/**
 * Notify order owner when an invoice is sent to them.
 *
 * @param orderOwnerUserId - Order owner (recipient) to notify
 * @param invoiceId - Invoice ID for link
 * @param invoiceNumber - Invoice number for message
 */
export async function createInvoiceSentNotification(
  orderOwnerUserId: string,
  invoiceId: string,
  invoiceNumber: string,
): Promise<void> {
  const t = await translatorFor(orderOwnerUserId);
  await createInAppNotification({
    userId: orderOwnerUserId,
    type: "invoice_sent",
    title: t("Invoice sent"),
    message: t("Invoice {invoiceNumber} has been sent to you.", {
      invoiceNumber,
    }),
    link: `/invoices/${invoiceId}`,
    metadata: { invoiceId, invoiceNumber },
  });
}

/**
 * Notify an admin that a new support ticket was created.
 *
 * @param adminUserId - Admin user to notify
 * @param ticketId - Support ticket ID for link
 * @param subject - Ticket subject for message
 * @param creatorDisplay - Creator name/email for message
 */
export async function createSupportTicketCreatedNotification(
  adminUserId: string,
  ticketId: string,
  subject: string,
  creatorDisplay: string,
): Promise<void> {
  const t = await translatorFor(adminUserId);
  await createInAppNotification({
    userId: adminUserId,
    type: "support_ticket_created",
    title: t("New support ticket"),
    message: `${creatorDisplay}: ${subject}`,
    link: `/admin/support-tickets/${ticketId}`,
    metadata: { ticketId, subject },
  });
}

/**
 * Notify a user that their support ticket was updated/replied (e.g. by admin).
 *
 * @param recipientUserId - User to notify (ticket creator or assignee)
 * @param ticketId - Support ticket ID for link
 * @param subject - Ticket subject for context
 * @param updaterDisplay - Name/email of who updated the ticket
 */
export async function createSupportTicketRepliedNotification(
  recipientUserId: string,
  ticketId: string,
  subject: string,
  updaterDisplay: string,
): Promise<void> {
  const t = await translatorFor(recipientUserId);
  await createInAppNotification({
    userId: recipientUserId,
    type: "support_ticket_replied",
    title: t("Support ticket updated"),
    message: t("{updater} updated ticket: {subject}", {
      updater: updaterDisplay,
      subject,
    }),
    link: `/admin/support-tickets/${ticketId}`,
    metadata: { ticketId, subject },
  });
}

/**
 * Create import notification
 *
 * @param type - Notification type (import_complete, import_failed)
 * @param fileName - Import file name
 * @param message - Notification message
 * @param importHistoryId - Import history ID for linking (optional)
 * @param userId - User ID to send notification to
 * @returns Promise<void>
 */
export async function createImportNotification(
  type: "import_complete" | "import_failed",
  fileName: string,
  message: string,
  userId: string,
  importHistoryId?: string
): Promise<void> {
  const metadata: NotificationMetadata = {};
  if (importHistoryId) metadata.importHistoryId = importHistoryId;

  const t = await translatorFor(userId);
  await createInAppNotification({
    userId,
    type,
    title: type === "import_complete" ? t("Import Complete") : t("Import Failed"),
    message: `${fileName}: ${message}`,
    metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
  });
}
