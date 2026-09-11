/**
 * Seeds realistic demo data so the UI can actually be exercised.
 *
 *   pnpm seed            # create demo vendors, services, products, bookings, reviews
 *   pnpm seed --clean    # remove everything this script created
 *   pnpm seed --prune-orphans
 *
 * Why this exists: every listing, filter, radius search, vendor page, booking
 * and checkout screen renders an empty state against an empty database, so
 * none of them can be verified by clicking through.
 *
 * Everything is owned by demo accounts under DEMO_DOMAIN, and every foreign key
 * into them cascades, so --clean is a matter of deleting those users. Re-running
 * is safe: existing demo accounts are reused rather than duplicated.
 *
 * Needs the service-role key, which bypasses RLS — this is a local development
 * tool and must never run in the app.
 */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

/** Supabase's signup validator rejects reserved TLDs like .invalid, so use a
 *  plus-addressed example.com, which is safe to send to and easy to spot. */
const DEMO_DOMAIN = "example.com";
const DEMO_PREFIX = "trimapp-demo";
const DEMO_PASSWORD = "DemoPassword123!";

const args = new Set(process.argv.slice(2));
const CLEAN = args.has("--clean");
const PRUNE_ORPHANS = args.has("--prune-orphans");
const ADMIN = args.has("--admin");

/* ---------------------------------------------------------------- config -- */

function env() {
  const raw = readFileSync(".env.local", "utf8");
  const out = {};
  for (const line of raw.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i > 0) out[t.slice(0, i).trim()] = t.slice(i + 1).trim();
  }
  return out;
}

const cfg = env();
const URL_ = cfg.NEXT_PUBLIC_SUPABASE_URL || cfg.SUPABASE_URL;
if (!URL_) throw new Error("NEXT_PUBLIC_SUPABASE_URL missing from .env.local");

function serviceKey() {
  const fromEnv = process.env.SUPABASE_SERVICE_ROLE_KEY || cfg.SUPABASE_SERVICE_ROLE_KEY;
  if (fromEnv) return fromEnv;
  const ref = URL_.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
  const out = execFileSync(
    "pnpm",
    ["exec", "supabase", "projects", "api-keys", "--project-ref", ref],
    { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] },
  );
  const key = JSON.parse(out).keys.find((k) => k.id === "service_role")?.api_key;
  if (!key) throw new Error("No service-role key: set SUPABASE_SERVICE_ROLE_KEY or run `supabase login`.");
  return key;
}

const KEY = serviceKey();
const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" };

const rest = async (path, init = {}) => {
  const res = await fetch(`${URL_}/rest/v1/${path}`, {
    ...init,
    headers: { ...H, ...(init.prefer ? { Prefer: init.prefer } : {}) },
    ...(init.body ? { body: JSON.stringify(init.body) } : {}),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${init.method ?? "GET"} ${path} -> ${res.status} ${text.slice(0, 200)}`);
  return text ? JSON.parse(text) : null;
};

/* ------------------------------------------------------------------ data -- */

/** Real Lagos coordinates, spread wide enough that a radius filter changes the
 *  result set — Ikeja to Victoria Island is roughly 20km. */
const VENDORS = [
  { slug: "sharp-cuts-ikeja", business_name: "Sharp Cuts Ikeja", category: "barber",
    city: "Ikeja", latitude: 6.6018, longitude: 3.3515, service_mode: "in_shop",
    status: "approved", is_verified: true, commission_pct: 10,
    bio: "Precision fades and beard sculpting in the heart of Ikeja.",
    services: [["Skin fade", 5000, 45], ["Beard trim", 2500, 20], ["Kids cut", 3000, 30]],
    products: [["Premium Clipper Set", "clippers", 42000, 8]] },

  { slug: "lekki-fade-factory", business_name: "Lekki Fade Factory", category: "barber",
    city: "Lekki", latitude: 6.4450, longitude: 3.4750, service_mode: "both",
    status: "approved", is_verified: true, commission_pct: 12,
    bio: "Home service across Lekki and Ajah, or drop into the Phase 1 studio.",
    services: [["Signature fade", 8000, 60], ["Home service cut", 12000, 75]],
    products: [["Fade Brush Kit", "combs", 9500, 25], ["Barber Cape", "capes", 6500, 40]] },

  { slug: "yaba-braids", business_name: "Yaba Braids & Beauty", category: "hairdresser",
    city: "Yaba", latitude: 6.5095, longitude: 3.3711, service_mode: "home",
    status: "approved", is_verified: false, commission_pct: 15,
    bio: "Knotless braids and protective styles, at your place.",
    services: [["Knotless braids", 25000, 240], ["Cornrows", 12000, 120], ["Wash and style", 7000, 60]],
    products: [["Human Hair Bundle 18\"", "wigs", 85000, 6]] },

  { slug: "surulere-signature", business_name: "Surulere Signature Styles", category: "hairdresser",
    city: "Surulere", latitude: 6.5000, longitude: 3.3500, service_mode: "in_shop",
    status: "approved", is_verified: false, commission_pct: 12,
    bio: "Silk press, colour and treatments since 2016.",
    services: [["Silk press", 18000, 120], ["Colour and tone", 35000, 180]],
    products: [["Lace Front Wig", "wigs", 120000, 3]] },

  { slug: "vi-grooming", business_name: "VI Grooming Lounge", category: "barber",
    city: "Victoria Island", latitude: 6.4281, longitude: 3.4219, service_mode: "both",
    status: "approved", is_verified: true, commission_pct: 15,
    bio: "Executive grooming with hot-towel shaves.",
    services: [["Executive cut", 15000, 60], ["Hot towel shave", 9000, 45]],
    products: [["Grooming Travel Kit", "kits", 38000, 12]] },

  // Deliberately left pending so the admin moderation screen has something to
  // act on, and so /discover can be checked to exclude it.
  { slug: "ikoyi-hair-studio", business_name: "Ikoyi Hair Studio", category: "hairdresser",
    city: "Ikoyi", latitude: 6.4550, longitude: 3.4350, service_mode: "in_shop",
    status: "pending", is_verified: false, commission_pct: 10,
    bio: "Newly opened studio awaiting approval.",
    services: [["Wash and set", 10000, 60]],
    products: [] },
];

/* ----------------------------------------------------------------- helpers -- */

const demoEmail = (slug) => `${DEMO_PREFIX}+${slug}@${DEMO_DOMAIN}`;

async function listDemoUsers() {
  const res = await fetch(`${URL_}/auth/v1/admin/users?page=1&per_page=200`, { headers: H });
  const { users = [] } = await res.json();
  return users.filter((u) => (u.email ?? "").startsWith(`${DEMO_PREFIX}+`));
}

async function ensureUser(slug, fullName) {
  const email = demoEmail(slug);
  const existing = (await listDemoUsers()).find((u) => u.email === email);
  if (existing) return existing;

  const res = await fetch(`${URL_}/auth/v1/admin/users`, {
    method: "POST",
    headers: H,
    body: JSON.stringify({
      email, password: DEMO_PASSWORD, email_confirm: true,
      user_metadata: { full_name: fullName },
    }),
  });
  const user = await res.json();
  if (!res.ok) throw new Error(`create user ${email}: ${JSON.stringify(user).slice(0, 200)}`);
  return user;
}

const slugify = (s) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);

/* -------------------------------------------------------------------- run -- */

async function clean() {
  const users = await listDemoUsers();
  if (!users.length) {
    console.log("  nothing to clean — no demo accounts found");
    return;
  }
  for (const u of users) {
    // vendors/bookings/orders/reviews/profiles all cascade from auth.users,
    // and services/products cascade from vendors.
    await fetch(`${URL_}/rest/v1/user_roles?user_id=eq.${u.id}`, { method: "DELETE", headers: H });
    await fetch(`${URL_}/auth/v1/admin/users/${u.id}`, { method: "DELETE", headers: H });
    console.log(`  removed ${u.email}`);
  }
  console.log(`\n  cleaned ${users.length} demo account(s) and everything they owned`);
}

async function pruneOrphans() {
  // The 36 seeded services belong to the unused salons table: every one has a
  // salon_id and no vendor_id, so no vendor page can ever show them.
  const orphans = await rest("services?select=id&vendor_id=is.null&salon_id=not.is.null");
  if (!orphans.length) {
    console.log("  no orphaned services found");
    return;
  }
  await fetch(`${URL_}/rest/v1/services?vendor_id=is.null&salon_id=not.is.null`, {
    method: "DELETE", headers: H,
  });
  console.log(`  removed ${orphans.length} orphaned salon service(s)`);
}

/**
 * Creates the platform admin from ADMIN_EMAIL / ADMIN_PASSWORD.
 *
 * This is the answer to the bootstrap problem: the RLS policy that writes
 * user_roles requires you to already be an admin, so the first one cannot be
 * made through the app. Deliberately a script, run with the service-role key,
 * rather than a route anyone could reach.
 *
 * The credentials are read from server-only variables. A NEXT_PUBLIC_ prefix
 * would inline them into the browser bundle.
 */
async function seedAdmin() {
  const email = (process.env.ADMIN_EMAIL || cfg.ADMIN_EMAIL || "").trim();
  const password = (process.env.ADMIN_PASSWORD || cfg.ADMIN_PASSWORD || "").trim();

  if (!email || !password) {
    console.error("  ✗ set ADMIN_EMAIL and ADMIN_PASSWORD in .env.local");
    process.exit(1);
  }

  const existing = (await (await fetch(`${URL_}/auth/v1/admin/users?page=1&per_page=200`, { headers: H })).json())
    .users?.find((u) => (u.email ?? "").toLowerCase() === email.toLowerCase());

  let user = existing;
  if (user) {
    // Re-running should make the stated password true, not silently diverge.
    const res = await fetch(`${URL_}/auth/v1/admin/users/${user.id}`, {
      method: "PUT", headers: H,
      body: JSON.stringify({ password, email_confirm: true }),
    });
    if (!res.ok) throw new Error(`update admin: ${(await res.text()).slice(0, 200)}`);
    console.log(`  reused existing account ${email} (password reset)`);
  } else {
    const res = await fetch(`${URL_}/auth/v1/admin/users`, {
      method: "POST", headers: H,
      body: JSON.stringify({
        email, password, email_confirm: true,
        user_metadata: { full_name: "Platform Admin" },
      }),
    });
    user = await res.json();
    if (!res.ok) throw new Error(`create admin: ${JSON.stringify(user).slice(0, 200)}`);
    console.log(`  created ${email}`);
  }

  await fetch(`${URL_}/rest/v1/user_roles?on_conflict=user_id,role`, {
    method: "POST", headers: { ...H, Prefer: "resolution=ignore-duplicates" },
    body: JSON.stringify({ user_id: user.id, role: "admin" }),
  });

  const roles = (await rest(`user_roles?select=role&user_id=eq.${user.id}`)).map((r) => r.role);
  if (!roles.includes("admin")) throw new Error(`admin role not present: ${roles.join(", ") || "none"}`);

  console.log(`  user id : ${user.id}`);
  console.log(`  roles   : ${roles.join(", ")}`);
  console.log("\n  Sign in, then use /admin/users to grant roles to anyone else.");
}

async function seed() {
  const created = { vendors: 0, services: 0, products: 0, bookings: 0, reviews: 0 };

  for (const v of VENDORS) {
    const owner = await ensureUser(v.slug, v.business_name);

    // vendors.user_id is UNIQUE, so upserting on it makes re-runs idempotent.
    // on_conflict names the unique constraint to merge against; without it
    // PostgREST resolves on the primary key and a re-run 409s.
    const [vendor] = await rest("vendors?on_conflict=user_id", {
      method: "POST",
      prefer: "resolution=merge-duplicates,return=representation",
      body: {
        user_id: owner.id, business_name: v.business_name, bio: v.bio, category: v.category,
        city: v.city, state: "LA", address: `${v.city}, Lagos`,
        latitude: v.latitude, longitude: v.longitude, service_mode: v.service_mode,
        home_radius_km: v.service_mode === "in_shop" ? 0 : 10,
        status: v.status, is_verified: v.is_verified, commission_pct: v.commission_pct,
      },
    });
    created.vendors++;

    await fetch(`${URL_}/rest/v1/user_roles?on_conflict=user_id,role`, {
      method: "POST",
      headers: { ...H, Prefer: "resolution=ignore-duplicates" },
      body: JSON.stringify({ user_id: owner.id, role: "vendor" }),
    });

    // Replace children wholesale so re-running cannot accumulate duplicates.
    await fetch(`${URL_}/rest/v1/services?vendor_id=eq.${vendor.id}`, { method: "DELETE", headers: H });
    await fetch(`${URL_}/rest/v1/vendor_products?vendor_id=eq.${vendor.id}`, { method: "DELETE", headers: H });

    if (v.services.length) {
      await rest("services", {
        method: "POST",
        body: v.services.map(([name, price, mins]) => ({
          vendor_id: vendor.id, name, price, duration_minutes: mins,
          category: v.category === "barber" ? "grooming" : "hair", is_active: true,
        })),
      });
      created.services += v.services.length;
    }

    if (v.products.length) {
      await rest("vendor_products", {
        method: "POST",
        body: v.products.map(([title, category, price, stock]) => ({
          vendor_id: vendor.id, title, slug: `${slugify(title)}-${v.slug.slice(0, 6)}`,
          category, price_naira: price, stock, images: [], is_active: true,
          description: `${title} from ${v.business_name}.`,
        })),
      });
      created.products += v.products.length;
    }

    v._vendorId = vendor.id;
  }

  /* A demo customer with completed bookings, so the review gate is satisfied
   * and vendor ratings are non-zero rather than a wall of 0.0. */
  const customer = await ensureUser("customer", "Demo Customer");
  await fetch(`${URL_}/rest/v1/user_roles?on_conflict=user_id,role`, {
    method: "POST", headers: { ...H, Prefer: "resolution=ignore-duplicates" },
    body: JSON.stringify({ user_id: customer.id, role: "customer" }),
  });

  await fetch(`${URL_}/rest/v1/bookings?user_id=eq.${customer.id}`, { method: "DELETE", headers: H });
  await fetch(`${URL_}/rest/v1/reviews?user_id=eq.${customer.id}`, { method: "DELETE", headers: H });

  const reviewable = VENDORS.filter((v) => v.status === "approved").slice(0, 4);
  for (const [i, v] of reviewable.entries()) {
    const [service] = await rest(`services?select=id,price&vendor_id=eq.${v._vendorId}&limit=1`);
    if (!service) continue;

    await rest("bookings", {
      method: "POST",
      body: {
        user_id: customer.id, vendor_id: v._vendorId, service_id: service.id,
        scheduled_at: new Date(Date.now() - (i + 1) * 86400000).toISOString(),
        mode: "in_shop", total_amount: service.price,
        commission_amount: Math.round((service.price * v.commission_pct) / 100),
        payment_status: "paid", status: "completed",
      },
    });
    created.bookings++;

    await rest("reviews", {
      method: "POST",
      body: {
        user_id: customer.id, target_type: "vendor", target_id: v._vendorId,
        rating: [5, 4, 5, 3][i] ?? 4,
        comment: ["Sharp work, in and out in 40 minutes.",
                  "Good cut, ran a little late.",
                  "Best braids I've had in Lagos.",
                  "Decent, but the shop was busy."][i] ?? "Solid.",
      },
    });
    created.reviews++;
  }

  const ratings = await rest("vendors?select=business_name,rating,reviews_count&order=rating.desc");
  console.log("\n  seeded:", JSON.stringify(created));
  console.log("\n  vendor ratings (proves the trigger fired):");
  for (const r of ratings) {
    console.log(`    ${r.business_name.padEnd(28)} ${r.rating}  (${r.reviews_count} reviews)`);
  }
  console.log(`\n  demo sign-in: ${demoEmail("customer")} / ${DEMO_PASSWORD}`);
}

console.log(`\n  project: ${URL_}\n`);
if (CLEAN) await clean();
else if (PRUNE_ORPHANS) await pruneOrphans();
else if (ADMIN) await seedAdmin();
else await seed();
console.log();
