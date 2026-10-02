/**
 * Database seed — HAKI ERP demo dataset.
 *
 * Builds a 20-person export trading company: staff accounts for every role,
 * customer / supplier / product master data, three warehouses with stock
 * allocations, and nine months of business history (orders, invoices, approvals,
 * sales performance) so every page has realistic data to show.
 *
 * Usage: npm run db:seed  (or npx tsx prisma/seed.ts)
 *
 * The dataset is deterministic — re-running produces the same numbers.
 */

import { PrismaClient, type Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import { DEMO_PASSWORD, DEMO_SEED_USERS } from "@/lib/auth/demo-seed-users";

const prisma = new PrismaClient();
const BCRYPT_ROUNDS = 10;

// ---------------------------------------------------------------------------
// Team roster — the seven demo accounts above plus thirteen more colleagues
// ---------------------------------------------------------------------------

type StaffSpec = {
  email: string;
  name: string;
  username: string;
  role: "sales" | "finance" | "warehouse" | "purchase" | "supplier" | "client";
};

const EXTRA_STAFF: readonly StaffSpec[] = [
  { email: "sales2@haki.com", name: "Wang Qiang", username: "wangqiang", role: "sales" },
  { email: "sales3@haki.com", name: "Liu Yang", username: "liuyang", role: "sales" },
  { email: "sales4@haki.com", name: "Chen Jing", username: "chenjing", role: "sales" },
  { email: "sales5@haki.com", name: "Zhao Min", username: "zhaomin", role: "sales" },
  { email: "sales6@haki.com", name: "Sun Lei", username: "sunlei", role: "sales" },
  { email: "sales7@haki.com", name: "Zhou Fang", username: "zhoufang", role: "sales" },
  { email: "sales8@haki.com", name: "Wu Tao", username: "wutao", role: "sales" },
  { email: "finance2@haki.com", name: "Feng Jun", username: "fengjun", role: "finance" },
  { email: "warehouse2@haki.com", name: "Han Xue", username: "hanxue", role: "warehouse" },
  { email: "warehouse3@haki.com", name: "Cao Yang", username: "caoyang", role: "warehouse" },
  { email: "purchase2@haki.com", name: "Xie Ting", username: "xieting", role: "purchase" },
  { email: "supplier2@haki.com", name: "Tang Lei", username: "tanglei", role: "supplier" },
  { email: "client2@haki.com", name: "Deng Chao", username: "dengchao", role: "client" },
];

// ---------------------------------------------------------------------------
// Master data
// ---------------------------------------------------------------------------

type CustomerSpec = {
  name: string;
  country: string;
  contact: string;
  email: string;
  phone: string;
  address: string;
  port: string;
};

const CUSTOMERS: readonly CustomerSpec[] = [
  { name: "Pacific Trade Inc.", country: "United States", contact: "James Miller", email: "james@pacifictrade.com", phone: "+1 213 555 0142", address: "1200 Harbor Blvd, Los Angeles, CA", port: "Los Angeles" },
  { name: "EuroTech GmbH", country: "Germany", contact: "Anna Schmidt", email: "a.schmidt@eurotech.de", phone: "+49 89 555 0134", address: "Industriestraße 24, Munich", port: "Hamburg" },
  { name: "Nordic Supplies AB", country: "Sweden", contact: "Erik Lindqvist", email: "erik@nordicsupplies.se", phone: "+46 8 555 0177", address: "Sveavägen 45, Stockholm", port: "Gothenburg" },
  { name: "UK Retail Group Ltd.", country: "United Kingdom", contact: "Emily Carter", email: "e.carter@ukretail.co.uk", phone: "+44 20 5550 0198", address: "18 Fenchurch Street, London", port: "Felixstowe" },
  { name: "Aussie Imports Pty", country: "Australia", contact: "Jack Thompson", email: "jack@aussieimports.au", phone: "+61 2 5550 0121", address: "55 Pitt Street, Sydney", port: "Sydney" },
  { name: "Nippon Trading Co.", country: "Japan", contact: "Kenji Sato", email: "sato@nippontrading.jp", phone: "+81 6 5550 0163", address: "2-4-9 Umeda, Osaka", port: "Osaka" },
  { name: "Seoul Global Corp.", country: "South Korea", contact: "Min-jun Kim", email: "mjkim@seoulglobal.kr", phone: "+82 2 555 0119", address: "152 Teheran-ro, Seoul", port: "Busan" },
  { name: "Canada West Ltd.", country: "Canada", contact: "Sophie Tremblay", email: "sophie@canadawest.ca", phone: "+1 604 555 0186", address: "900 West Hastings St, Vancouver", port: "Vancouver" },
  { name: "Dubai General LLC", country: "United Arab Emirates", contact: "Omar Al-Farsi", email: "omar@dubaigeneral.ae", phone: "+971 4 555 0107", address: "Sheikh Zayed Road, Dubai", port: "Jebel Ali" },
  { name: "Siam Commerce Co.", country: "Thailand", contact: "Somchai Wong", email: "somchai@siamcommerce.th", phone: "+66 2 555 0154", address: "Silom Road, Bangkok", port: "Bangkok" },
];

const SUPPLIERS: readonly { name: string; description: string }[] = [
  { name: "Shenzhen Rui Electronics Co., Ltd.", description: "Consumer electronics OEM, 12 production lines" },
  { name: "Ningbo Haotian Houseware Co., Ltd.", description: "Kitchen and home products manufacturer" },
  { name: "Hangzhou Outdoormate Gear Co., Ltd.", description: "Outdoor and sports gear supplier" },
  { name: "Dongguan Yongtai Plastics Co., Ltd.", description: "Injection molding and plastic parts" },
  { name: "Foshan Lianhe Metal Works Co., Ltd.", description: "Metal components and hardware" },
  { name: "Qingdao Sunfield Textile Co., Ltd.", description: "Textiles and fabric accessories" },
];

const WAREHOUSES: readonly { name: string; address: string; type: string }[] = [
  { name: "Main Warehouse", address: "No. 88 Logistics Park Road, Ningbo, Zhejiang", type: "main" },
  { name: "Bonded Warehouse", address: "Ningbo Free Trade Zone, Zhejiang", type: "secondary" },
  { name: "Transit Hub", address: "Port Distribution Center, Shanghai", type: "storage" },
];

const CATEGORIES: readonly { name: string; description: string }[] = [
  { name: "Consumer Electronics", description: "Audio, wearables, and charging products" },
  { name: "Smart Home", description: "Connected home devices and accessories" },
  { name: "Kitchenware", description: "Cookware and kitchen tools for export" },
  { name: "Outdoor & Sports", description: "Camping, fitness, and outdoor gear" },
];

type ProductSpec = {
  sku: string;
  name: string;
  category: string;
  price: number;
  supplier: number;
};

const PRODUCTS: readonly ProductSpec[] = [
  { sku: "HAKI-CE-001", name: "Wireless Earbuds Pro", category: "Consumer Electronics", price: 24.5, supplier: 0 },
  { sku: "HAKI-CE-002", name: "Bluetooth Speaker Mini", category: "Consumer Electronics", price: 18.9, supplier: 0 },
  { sku: "HAKI-CE-003", name: "Power Bank 20000mAh", category: "Consumer Electronics", price: 14.2, supplier: 0 },
  { sku: "HAKI-CE-004", name: "USB-C Fast Charger 65W", category: "Consumer Electronics", price: 11.8, supplier: 0 },
  { sku: "HAKI-CE-005", name: "Wireless Mouse Silent", category: "Consumer Electronics", price: 8.6, supplier: 0 },
  { sku: "HAKI-CE-006", name: "Mechanical Keyboard TKL", category: "Consumer Electronics", price: 32.4, supplier: 0 },
  { sku: "HAKI-SH-001", name: "Smart Plug WiFi", category: "Smart Home", price: 9.9, supplier: 0 },
  { sku: "HAKI-SH-002", name: "Smart LED Bulb RGB", category: "Smart Home", price: 7.4, supplier: 0 },
  { sku: "HAKI-SH-003", name: "Robot Vacuum Cleaner", category: "Smart Home", price: 118.0, supplier: 0 },
  { sku: "HAKI-SH-004", name: "Smart Door Sensor", category: "Smart Home", price: 6.8, supplier: 3 },
  { sku: "HAKI-SH-005", name: "Air Quality Monitor", category: "Smart Home", price: 27.5, supplier: 0 },
  { sku: "HAKI-SH-006", name: "Smart Water Bottle", category: "Smart Home", price: 15.3, supplier: 3 },
  { sku: "HAKI-KW-001", name: "Stainless Steel Cookware Set", category: "Kitchenware", price: 45.0, supplier: 1 },
  { sku: "HAKI-KW-002", name: "Non-stick Frying Pan 28cm", category: "Kitchenware", price: 12.7, supplier: 1 },
  { sku: "HAKI-KW-003", name: "Electric Kettle 1.7L", category: "Kitchenware", price: 16.9, supplier: 1 },
  { sku: "HAKI-KW-004", name: "Bamboo Cutting Board Set", category: "Kitchenware", price: 8.2, supplier: 1 },
  { sku: "HAKI-KW-005", name: "Knife Block Set 6pc", category: "Kitchenware", price: 22.6, supplier: 4 },
  { sku: "HAKI-KW-006", name: "Silicone Utensil Set", category: "Kitchenware", price: 6.5, supplier: 1 },
  { sku: "HAKI-OD-001", name: "Camping Tent 4-Person", category: "Outdoor & Sports", price: 58.0, supplier: 2 },
  { sku: "HAKI-OD-002", name: "Folding Camping Chair", category: "Outdoor & Sports", price: 14.8, supplier: 2 },
  { sku: "HAKI-OD-003", name: "Insulated Water Bottle 1L", category: "Outdoor & Sports", price: 9.4, supplier: 4 },
  { sku: "HAKI-OD-004", name: "LED Camping Lantern", category: "Outdoor & Sports", price: 11.2, supplier: 2 },
  { sku: "HAKI-OD-005", name: "Yoga Mat Non-slip 6mm", category: "Outdoor & Sports", price: 10.6, supplier: 5 },
  { sku: "HAKI-OD-006", name: "Hiking Backpack 40L", category: "Outdoor & Sports", price: 26.9, supplier: 5 },
];

// ---------------------------------------------------------------------------
// Order history — deterministic generator for nine months of activity
// ---------------------------------------------------------------------------

type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

const TOTAL_ORDERS = 40;
const TRADE_TERMS = ["FOB", "CIF", "EXW"] as const;
const LOADING_PORTS = ["Ningbo", "Shanghai"] as const;
const CARRIERS = ["dhl", "fedex", "ups", "other"] as const;

/** Stable pseudo-index helper — same result on every run. */
function mix(i: number, salt: number, mod: number): number {
  return (i * 7 + salt * 13 + 3) % mod;
}

/** Index into a seed table; throws instead of returning undefined. */
function at<T>(list: readonly T[], index: number): T {
  const item = list[index];
  if (item === undefined) {
    throw new Error(`Seed: index ${index} is out of range`);
  }
  return item;
}

/** Orders placed earlier are further along in the pipeline. */
function statusForIndex(i: number, total: number): OrderStatus {
  if (i === 7 || i === 23) return "cancelled";
  const progress = i / (total - 1);
  if (progress < 0.55) return "delivered";
  if (progress < 0.72) return "shipped";
  if (progress < 0.85) return "processing";
  if (progress < 0.94) return "confirmed";
  return "pending";
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

// ---------------------------------------------------------------------------
// Wipe — remove previous seed data, children before parents
// ---------------------------------------------------------------------------

async function wipeAll() {
  await prisma.approval.deleteMany();
  await prisma.performance.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.order.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.supportTicketReply.deleteMany();
  await prisma.supportTicket.deleteMany();
  await prisma.productReview.deleteMany();
  await prisma.stockAllocation.deleteMany();
  await prisma.stockTransfer.deleteMany();
  await prisma.product.deleteMany();
  await prisma.importHistory.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.systemConfig.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.category.deleteMany();
  await prisma.warehouse.deleteMany();
  await prisma.session.deleteMany();
  await prisma.verificationToken.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.userAction.deleteMany();
  await prisma.department.deleteMany();
  await prisma.stockAlert.deleteMany();
  await prisma.user.deleteMany();
}

// ---------------------------------------------------------------------------
// Builders
// ---------------------------------------------------------------------------

async function seedUsers(passwordHash: string, now: Date) {
  const byRole = new Map<string, string[]>();
  const byEmail = new Map<string, string>();

  const all: Array<StaffSpec & { googleId?: string; image?: string }> = [
    ...DEMO_SEED_USERS.map((u) => ({
      email: u.email,
      name: u.name,
      username: u.username,
      role: u.role as StaffSpec["role"],
      googleId: u.googleId,
      image: u.image,
    })),
    ...EXTRA_STAFF,
  ];

  for (const spec of all) {
    const user = await prisma.user.create({
      data: {
        email: spec.email,
        name: spec.name,
        username: spec.username,
        password: passwordHash,
        role: spec.role,
        googleId: spec.googleId ?? `staff-${spec.username}`,
        image: spec.image,
        createdAt: now,
        updatedAt: now,
      },
      select: { id: true },
    });
    byEmail.set(spec.email, user.id);
    const list = byRole.get(spec.role) ?? [];
    list.push(user.id);
    byRole.set(spec.role, list);
  }

  return { byRole, byEmail };
}

async function seedMasterData(adminId: string, now: Date) {
  const categoryByName = new Map<string, string>();
  for (const spec of CATEGORIES) {
    const row = await prisma.category.create({
      data: {
        name: spec.name,
        description: spec.description,
        status: true,
        userId: adminId,
        createdBy: adminId,
        updatedBy: adminId,
        createdAt: now,
        updatedAt: now,
      },
      select: { id: true, name: true },
    });
    categoryByName.set(row.name, row.id);
  }

  const supplierIds: string[] = [];
  for (const spec of SUPPLIERS) {
    const row = await prisma.supplier.create({
      data: {
        name: spec.name,
        description: spec.description,
        status: true,
        userId: adminId,
        createdBy: adminId,
        updatedBy: adminId,
        createdAt: now,
        updatedAt: now,
      },
      select: { id: true },
    });
    supplierIds.push(row.id);
  }

  const warehouseIds: string[] = [];
  for (const spec of WAREHOUSES) {
    const row = await prisma.warehouse.create({
      data: {
        name: spec.name,
        address: spec.address,
        type: spec.type,
        status: true,
        userId: adminId,
        createdBy: adminId,
        updatedBy: adminId,
        createdAt: now,
        updatedAt: now,
      },
      select: { id: true },
    });
    warehouseIds.push(row.id);
  }

  const customerIds: string[] = [];
  for (const spec of CUSTOMERS) {
    const row = await prisma.customer.create({
      data: {
        name: spec.name,
        country: spec.country,
        contact: spec.contact,
        email: spec.email,
        phone: spec.phone,
        address: spec.address,
        status: true,
        createdBy: adminId,
        updatedBy: adminId,
        createdAt: now,
        updatedAt: now,
      },
      select: { id: true },
    });
    customerIds.push(row.id);
  }

  const productIds: string[] = [];
  for (let i = 0; i < PRODUCTS.length; i++) {
    const spec = at(PRODUCTS, i);
    const categoryId = categoryByName.get(spec.category);
    if (!categoryId) throw new Error(`Seed: unknown category ${spec.category}`);
    const stock = 800 + mix(i, 5, 12) * 150;
    const row = await prisma.product.create({
      data: {
        name: spec.name,
        sku: spec.sku,
        price: spec.price,
        quantity: BigInt(stock),
        reservedQuantity: BigInt(0),
        status: "active",
        categoryId,
        supplierId: at(supplierIds, spec.supplier),
        userId: adminId,
        createdBy: adminId,
        updatedBy: adminId,
        createdAt: now,
        updatedAt: now,
      },
      select: { id: true },
    });
    productIds.push(row.id);
  }

  return { categoryByName, supplierIds, warehouseIds, customerIds, productIds };
}

async function seedAllocations(
  productIds: string[],
  warehouseIds: string[],
  adminId: string,
  now: Date,
) {
  for (let i = 0; i < productIds.length; i++) {
    // Main warehouse holds the bulk; every third product also stocks the bonded warehouse.
    await prisma.stockAllocation.create({
      data: {
        productId: at(productIds, i),
        warehouseId: at(warehouseIds, 0),
        quantity: BigInt(600 + mix(i, 2, 10) * 120),
        reservedQuantity: BigInt(0),
        userId: adminId,
        createdAt: now,
        updatedAt: now,
      },
    });
    if (i % 3 === 0) {
      await prisma.stockAllocation.create({
        data: {
          productId: at(productIds, i),
          warehouseId: at(warehouseIds, 1),
          quantity: BigInt(200 + mix(i, 4, 6) * 100),
          reservedQuantity: BigInt(0),
          userId: adminId,
          createdAt: now,
          updatedAt: now,
        },
      });
    }
  }

  await prisma.stockTransfer.create({
    data: {
      productId: at(productIds, 0),
      fromWarehouseId: at(warehouseIds, 0),
      toWarehouseId: at(warehouseIds, 2),
      quantity: BigInt(200),
      status: "completed",
      notes: "Pre-positioned stock for an upcoming shipment",
      userId: adminId,
      createdAt: addDays(now, -120),
      completedAt: addDays(now, -118),
    },
  });
}

async function seedOrders(args: {
  adminId: string;
  salesIds: string[];
  customerIds: string[];
  productIds: string[];
  warehouseIds: string[];
  now: Date;
}) {
  const { adminId, salesIds, customerIds, productIds, warehouseIds, now } = args;
  const orderIds: string[] = [];
  const performanceRows: Array<{ orderId: string; salesId: string; amount: number; shippedAt: Date; orderDate: Date }> = [];
  const approvalRows: Array<{ orderId: string; action: string; comment: string; at: Date }> = [];

  for (let i = 0; i < TOTAL_ORDERS; i++) {
    const status = statusForIndex(i, TOTAL_ORDERS);
    const month = 2 + Math.floor(i / 5); // 2026-02 .. 2026-09
    const day = 3 + ((i * 5) % 25);
    const orderDate = new Date(2026, month - 1, day, 9 + (i % 8), 30);
    const salesId = at(salesIds, i % salesIds.length);
    const customerIdx = (i * 3) % customerIds.length;
    const customerId = at(customerIds, customerIdx);
    const customer = at(CUSTOMERS, customerIdx);

    const itemCount = 1 + ((i * 2) % 3);
    const items = Array.from({ length: itemCount }, (_, k) => {
      const productIdx = (i * 5 + k * 7) % productIds.length;
      const qty = 50 + mix(i + k, 6, 8) * 25;
      const spec = at(PRODUCTS, productIdx);
      return {
        productIdx,
        productId: at(productIds, productIdx),
        quantity: qty,
        price: spec.price,
        subtotal: Math.round(qty * spec.price * 100) / 100,
      };
    });

    const subtotal = Math.round(items.reduce((sum, it) => sum + it.subtotal, 0) * 100) / 100;
    const shipping = 180 + itemCount * 120;
    const discount = i % 7 === 0 ? Math.round(subtotal * 0.03 * 100) / 100 : 0;
    const total = Math.round((subtotal + shipping - discount) * 100) / 100;

    const shipped = status === "shipped" || status === "delivered";
    const shippedAt = shipped ? addDays(orderDate, 5 + mix(i, 8, 8)) : null;
    const deliveredAt =
      status === "delivered" && shippedAt ? addDays(shippedAt, 18 + mix(i, 9, 17)) : null;
    const approved = ["confirmed", "processing", "shipped", "delivered"].includes(status);

    const order = await prisma.order.create({
      data: {
        orderNumber: `ORD-2026-${String(i + 1).padStart(3, "0")}`,
        userId: salesId,
        createdBy: salesId,
        customerId,
        status,
        paymentStatus:
          status === "delivered" ? (i % 9 === 0 ? "partial" : "paid") : status === "cancelled" ? "refunded" : "unpaid",
        subtotal,
        shipping,
        discount,
        total,
        currency: "USD",
        exchangeRate: Math.round((7.05 + (i % 5) * 0.06) * 1000) / 1000,
        tradeTerms: at(TRADE_TERMS, i % TRADE_TERMS.length),
        customsNo: shipped ? `HG-2026${String(month).padStart(2, "0")}-${String(1200 + i)}` : null,
        portOfLoading: at(LOADING_PORTS, i % LOADING_PORTS.length),
        portOfDischarge: customer.port,
        approvedById: approved ? adminId : null,
        approvedAt: approved ? addDays(orderDate, 1 + (i % 3)) : null,
        trackingNumber: shipped ? `TRK${String(880000 + i * 37)}` : null,
        trackingCarrier: shipped ? at(CARRIERS, i % CARRIERS.length) : null,
        estimatedDelivery: shippedAt ? addDays(shippedAt, 25) : null,
        shippedAt,
        deliveredAt,
        cancelledAt: status === "cancelled" ? addDays(orderDate, 4) : null,
        shippingAddress: {
          name: customer.name,
          contact: customer.contact,
          street: customer.address,
          country: customer.country,
        } as unknown as Prisma.InputJsonValue,
        notes: i % 11 === 0 ? "Buyer requested neutral packing for this shipment." : null,
        createdAt: orderDate,
        updatedAt: orderDate,
        items: {
          create: items.map((it) => {
            const spec = at(PRODUCTS, it.productIdx);
            return {
              productId: it.productId,
              productName: spec.name,
              sku: spec.sku,
              quantity: it.quantity,
              price: it.price,
              subtotal: it.subtotal,
              warehouseId: at(warehouseIds, 0),
              warehouseName: at(WAREHOUSES, 0).name,
              createdAt: orderDate,
            };
          }),
        },
      },
      select: { id: true },
    });

    orderIds.push(order.id);

    if (shippedAt) {
      performanceRows.push({ orderId: order.id, salesId, amount: total, shippedAt, orderDate });
    }
    if (approved) {
      approvalRows.push({
        orderId: order.id,
        action: "approve",
        comment: "Credit and stock checked, approved for production.",
        at: addDays(orderDate, 1 + (i % 3)),
      });
    }
    if (status === "cancelled") {
      approvalRows.push({
        orderId: order.id,
        action: "reject",
        comment: "Buyer cancelled before deposit; stock reservation released.",
        at: addDays(orderDate, 4),
      });
    }
  }

  return { orderIds, performanceRows, approvalRows };
}

async function seedDerived(args: {
  orderIds: string[];
  performanceRows: Array<{ orderId: string; salesId: string; amount: number; shippedAt: Date; orderDate: Date }>;
  approvalRows: Array<{ orderId: string; action: string; comment: string; at: Date }>;
  adminId: string;
  salesIds: string[];
  customerIds: string[];
  productIds: string[];
  now: Date;
}) {
  const { orderIds, performanceRows, approvalRows, adminId, now } = args;

  // --- Performance: attributed to the month the goods shipped ---
  const perfIds: string[] = [];
  for (let i = 0; i < performanceRows.length; i++) {
    const row = at(performanceRows, i);
    const adjusted = i === 6; // one entry carries a manual attribution note
    const perf = await prisma.performance.create({
      data: {
        orderId: row.orderId,
        salesId: row.salesId,
        month: row.shippedAt.getMonth() + 1,
        year: row.shippedAt.getFullYear(),
        amount: row.amount,
        notes: adjusted
          ? "Attribution moved to the shipment month after finance review."
          : null,
        updatedBy: adjusted ? adminId : null,
        createdAt: row.shippedAt,
        updatedAt: adjusted ? addDays(row.shippedAt, 20) : null,
      },
      select: { id: true },
    });
    perfIds.push(perf.id);
  }

  // --- Approvals ---
  const approvalIds: string[] = [];
  for (const row of approvalRows) {
    const ap = await prisma.approval.create({
      data: {
        orderId: row.orderId,
        approverId: adminId,
        action: row.action,
        comment: row.comment,
        createdAt: row.at,
      },
      select: { id: true },
    });
    approvalIds.push(ap.id);
  }

  // --- Invoices for orders that reached the shipping stage ---
  const invoiceIds: string[] = [];
  const orders = await prisma.order.findMany({
    where: { id: { in: orderIds } },
    select: { id: true, orderNumber: true, status: true, subtotal: true, shipping: true, discount: true, total: true, shippedAt: true, createdAt: true, customerId: true },
    orderBy: { createdAt: "asc" },
  });

  let invoiceSeq = 0;
  for (const order of orders) {
    if (order.status === "pending" || order.status === "confirmed" || order.status === "cancelled") continue;
    invoiceSeq += 1;
    const issuedAt = order.shippedAt ?? addDays(order.createdAt, 3);
    const status = order.status === "delivered" ? (invoiceSeq % 8 === 0 ? "sent" : "paid") : order.status === "shipped" ? "sent" : "draft";
    const paid = status === "paid";
    const inv = await prisma.invoice.create({
      data: {
        invoiceNumber: `INV-2026-${String(invoiceSeq).padStart(3, "0")}`,
        orderId: order.id,
        userId: adminId,
        createdBy: adminId,
        status,
        subtotal: order.subtotal,
        shipping: order.shipping,
        discount: order.discount,
        total: order.total,
        amountPaid: paid ? order.total : 0,
        amountDue: paid ? 0 : order.total,
        dueDate: addDays(issuedAt, 30),
        issuedAt,
        sentAt: status === "draft" ? null : addDays(issuedAt, 1),
        paidAt: paid ? addDays(issuedAt, 12 + (invoiceSeq % 10)) : null,
        createdAt: issuedAt,
        updatedAt: issuedAt,
      },
      select: { id: true },
    });
    invoiceIds.push(inv.id);
  }

  return { perfIds, approvalIds, invoiceIds };
}

async function seedSupportAndOps(args: {
  adminId: string;
  salesIds: string[];
  warehouseIds: string[];
  productIds: string[];
  customerIds: string[];
  clientIds: string[];
  supplierId: string;
  now: Date;
}) {
  const { adminId, salesIds, warehouseIds, productIds, customerIds, clientIds, supplierId, now } = args;

  // --- Support tickets ---
  const ticketSpecs = [
    { subject: "Sample request for HAKI-CE-001", body: "Please send two sample units of the Wireless Earbuds Pro before we confirm the Q3 order.", status: "in_progress", priority: "medium", userId: at(clientIds, 0) },
    { subject: "Invoice INV-2026-004 payment confirmation", body: "The bank slip has been uploaded, please confirm receipt and mark the invoice as paid.", status: "resolved", priority: "high", userId: at(clientIds, 1) },
    { subject: "Carton labeling for EU shipment", body: "German customs requires the importer EORI number on every carton label. Can you confirm this is applied?", status: "open", priority: "high", userId: at(clientIds, 0) },
    { subject: "Restock schedule for kitchenware line", body: "We expect demand to rise before the holiday season, please share your production schedule.", status: "open", priority: "low", userId: supplierId },
  ];
  for (const [i, spec] of ticketSpecs.entries()) {
    const createdAt = addDays(now, -(20 - i * 4));
    const ticket = await prisma.supportTicket.create({
      data: {
        subject: spec.subject,
        description: spec.body,
        status: spec.status,
        priority: spec.priority,
        userId: spec.userId,
        assignedToId: adminId,
        productId: i === 0 ? at(productIds, 0) : null,
        createdAt,
        updatedAt: createdAt,
      },
      select: { id: true },
    });
    await prisma.supportTicketReply.create({
      data: {
        ticketId: ticket.id,
        userId: adminId,
        body:
          i === 1
            ? "Payment received and matched against INV-2026-004. The invoice is now marked as paid."
            : "Thanks for the note — we have forwarded this to the responsible team and will follow up within one working day.",
        createdAt: addDays(createdAt, 1),
      },
    });
  }

  // --- Product reviews ---
  const reviewSpecs = [
    { rating: 5, comment: "Consistent quality across three shipments, packaging held up well.", status: "approved" },
    { rating: 4, comment: "Good value for the price point, delivery was two days later than planned.", status: "approved" },
    { rating: 5, comment: "Our retail partners reordered within a month. Strong product.", status: "pending" },
  ];
  for (const [i, spec] of reviewSpecs.entries()) {
    const createdAt = addDays(now, -(30 - i * 6));
    const productIdx = i * 4;
    await prisma.productReview.create({
      data: {
        productId: at(productIds, productIdx),
        userId: at(clientIds, i % clientIds.length),
        productName: at(PRODUCTS, productIdx).name,
        productSku: at(PRODUCTS, productIdx).sku,
        rating: spec.rating,
        comment: spec.comment,
        status: spec.status,
        createdAt,
        updatedAt: createdAt,
      },
    });
  }

  // --- Notifications for the admin ---
  const notes = [
    { type: "low_stock", title: "Low stock: Robot Vacuum Cleaner", message: "Available stock for HAKI-SH-003 is below the reorder point.", link: "/products" },
    { type: "order_status_update", title: "Order ORD-2026-028 shipped", message: "The order left Ningbo port and the tracking number is registered.", link: "/orders" },
    { type: "order_confirmation", title: "New order awaiting approval", message: "ORD-2026-039 was submitted by sales and needs review.", link: "/orders" },
    { type: "shipping_notifications", title: "Shipment ORD-2026-031 arrived", message: "Buyer confirmed arrival at Los Angeles.", link: "/orders" },
  ];
  for (const [i, note] of notes.entries()) {
    await prisma.notification.create({
      data: {
        userId: adminId,
        type: note.type,
        title: note.title,
        message: note.message,
        link: note.link,
        read: i < 2,
        readAt: i < 2 ? addDays(now, -(3 - i)) : null,
        createdAt: addDays(now, -(5 - i)),
      },
    });
  }

  // --- Audit trail sample ---
  const auditSpecs = [
    { action: "create", entityType: "order", note: "Order created from sales workspace" },
    { action: "update", entityType: "order", note: "Status advanced after credit check" },
    { action: "ship", entityType: "order", note: "Tracking number registered" },
    { action: "payment", entityType: "invoice", note: "Payment matched to invoice" },
    { action: "export", entityType: "product", note: "Catalog export for the trade fair" },
    { action: "create", entityType: "customer", note: "New customer onboarded" },
  ];
  for (const [i, spec] of auditSpecs.entries()) {
    await prisma.auditLog.create({
      data: {
        userId: i % 3 === 0 ? adminId : at(salesIds, i % salesIds.length),
        action: spec.action,
        entityType: spec.entityType,
        entityId: i % 2 === 0 ? at(productIds, i % productIds.length) : null,
        details: { note: spec.note } as unknown as Prisma.InputJsonValue,
        ipAddress: "192.168.1." + (20 + i),
        createdAt: addDays(now, -(40 - i * 5)),
      },
    });
  }

  // --- Import history ---
  await prisma.importHistory.create({
    data: {
      userId: adminId,
      importType: "products",
      fileName: "2026-spring-catalog.xlsx",
      fileSize: 184320,
      totalRows: 24,
      successRows: 24,
      failedRows: 0,
      status: "completed",
      createdAt: addDays(now, -90),
      completedAt: addDays(now, -90),
    },
  });

  // --- System configuration ---
  const configs = [
    { key: "company_name", value: "HAKI Trading Co., Ltd.", type: "string", label: "Company name", category: "general" },
    { key: "company_address", value: "No. 88 Logistics Park Road, Ningbo, Zhejiang, China", type: "string", label: "Company address", category: "general" },
    { key: "default_currency", value: "USD", type: "string", label: "Default settlement currency", category: "general" },
    { key: "low_stock_threshold", value: "300", type: "number", label: "Low stock threshold", category: "notifications" },
    { key: "invoice_due_days", value: "30", type: "number", label: "Invoice due days", category: "payment" },
  ];
  for (const spec of configs) {
    await prisma.systemConfig.create({
      data: {
        key: spec.key,
        value: spec.value,
        type: spec.type,
        label: spec.label,
        category: spec.category,
        isPublic: spec.category === "general",
        createdAt: now,
        updatedAt: now,
      },
    });
  }
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

async function main() {
  console.log("\nHAKI ERP — seeding demo database\n");

  const now = new Date("2026-10-01T09:00:00");
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, BCRYPT_ROUNDS);

  console.log("   Cleaning previous seed data...");
  await wipeAll();

  console.log("   Creating users (20 people)...");
  const { byRole, byEmail } = await seedUsers(passwordHash, now);
  const adminId = byEmail.get("admin@haki.com")!;
  const salesIds = byRole.get("sales") ?? [];

  console.log("   Creating master data (customers, suppliers, products, warehouses)...");
  const master = await seedMasterData(adminId, now);
  await seedAllocations(master.productIds, master.warehouseIds, adminId, now);

  console.log("   Creating orders, invoices, approvals, performance...");
  const orders = await seedOrders({
    adminId,
    salesIds,
    customerIds: master.customerIds,
    productIds: master.productIds,
    warehouseIds: master.warehouseIds,
    now,
  });
  const derived = await seedDerived({
    orderIds: orders.orderIds,
    performanceRows: orders.performanceRows,
    approvalRows: orders.approvalRows,
    adminId,
    salesIds,
    customerIds: master.customerIds,
    productIds: master.productIds,
    now,
  });

  console.log("   Creating tickets, reviews, notifications, config...");
  const supplierUser = byEmail.get("supplier@haki.com")!;
  await seedSupportAndOps({
    adminId,
    salesIds,
    warehouseIds: master.warehouseIds,
    productIds: master.productIds,
    customerIds: master.customerIds,
    clientIds: [byEmail.get("client@haki.com")!, byEmail.get("client2@haki.com")!],
    supplierId: supplierUser,
    now,
  });

  console.log("\n   Users:        20");
  console.log(`   Customers:    ${CUSTOMERS.length}`);
  console.log(`   Suppliers:    ${SUPPLIERS.length}`);
  console.log(`   Products:     ${PRODUCTS.length}`);
  console.log(`   Orders:       ${orders.orderIds.length}`);
  console.log(`   Invoices:     ${derived.invoiceIds.length}`);
  console.log(`   Approvals:    ${derived.approvalIds.length}`);
  console.log(`   Performance:  ${derived.perfIds.length}`);
  console.log(`\n   Demo login password: ${DEMO_PASSWORD}`);
  console.log("   Accounts: admin@ / sales@ / finance@ / warehouse@ / purchase@ / supplier@ / client@haki.com\n");
}

main()
  .catch((error: unknown) => {
    console.error("Seed failed:", error instanceof Error ? error.message : error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());