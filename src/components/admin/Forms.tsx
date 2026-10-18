"use client";
import Image from "next/image";
import { useActionState, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useFormStatus } from "react-dom";
import {
  ArrowRight,
  Loader2,
  LockKeyhole,
  Save,
  ShieldCheck,
} from "lucide-react";
import {
  adjustStock,
  changePassword,
  loginAction,
  saveProduct,
  saveSettings,
  setupAction,
  toggleProduct,
  uploadImage,
  updateOrder,
  type ActionState,
} from "@/lib/admin/actions";
import {
  STATUSES,
  TRANSITIONS,
  type OrderStatus,
} from "@/lib/admin/validation";
import type { Product } from "@/db/schema";
import { inr } from "@/lib/format";

type Action = (state: ActionState, form: FormData) => Promise<ActionState>;
export function ActionForm({
  action,
  children,
  className = "",
  confirm,
  onSubmit,
}: {
  action: Action;
  children: React.ReactNode;
  className?: string;
  confirm?: string;
  onSubmit?: () => void;
}) {
  const [state, formAction] = useActionState(action, {});
  return (
    <form
      action={formAction}
      className={className}
      onSubmit={(e) => {
        onSubmit?.();
        if (confirm && !window.confirm(confirm)) e.preventDefault();
      }}
    >
      <PendingFields>{children}</PendingFields>
      {state.error && (
        <p role="alert" className="a-notice a-error">
          {state.error}
        </p>
      )}
      {state.success && (
        <p role="status" className="a-notice a-success">
          {state.success}
        </p>
      )}
    </form>
  );
}
function PendingFields({children}:{children:React.ReactNode}) {
  const {pending}=useFormStatus();
  return <fieldset disabled={pending} style={{display:"contents"}}>{children}</fieldset>;
}
export function Submit({
  children,
  pendingLabel = "Saving…",
  className = "a-button",
  disabled = false,
}: {
  children: React.ReactNode;
  pendingLabel?: string;
  className?: string;
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <button disabled={pending || disabled} className={className} type="submit">
      {pending && <Loader2 size={16} className="animate-spin" />}
      {pending ? pendingLabel : children}
    </button>
  );
}
export function Field({
  label,
  name,
  defaultValue = "",
  type = "text",
  required = false,
  placeholder,
  min,
  max,
  step,
  span = false,
  help,
  autoComplete,
}: {
  label: string;
  name: string;
  defaultValue?: string | number;
  type?: string;
  required?: boolean;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
  span?: boolean;
  help?: string;
  autoComplete?: string;
}) {
  const [value, setValue] = useState(defaultValue);
  return (
    <label className={`a-field ${span ? "a-span" : ""}`}>
      <span id={`${name}-label`}>{label}</span>
      <input
        aria-labelledby={`${name}-label`}
        aria-describedby={help ? `${name}-help` : undefined}
        name={name}
        type={type}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        required={required}
        placeholder={placeholder}
        min={min}
        max={max}
        step={step}
        autoComplete={autoComplete}
      />
      {help && <small id={`${name}-help`}>{help}</small>}
    </label>
  );
}
export function Area({
  label,
  name,
  defaultValue = "",
  placeholder,
  required = false,
  rows = 4,
  help,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  placeholder?: string;
  required?: boolean;
  rows?: number;
  help?: string;
}) {
  const [value, setValue] = useState(defaultValue);
  return (
    <label className="a-field a-span">
      <span id={`${name}-label`}>{label}</span>
      <textarea
        aria-labelledby={`${name}-label`}
        aria-describedby={help ? `${name}-help` : undefined}
        name={name}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        required={required}
        rows={rows}
      />
      {help && <small id={`${name}-help`}>{help}</small>}
    </label>
  );
}
export function AuthForm({ setup = false, setupToken = "" }: { setup?: boolean; setupToken?: string }) {
  const token = useRef<HTMLInputElement>(null);
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (setup && token.current) {
      const credential = new URLSearchParams(window.location.hash.slice(1)).get("token");
      if (!token.current.value && credential) token.current.value = credential;
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, [setup]);
  return (
    <ActionForm
      action={setup ? setupAction : loginAction}
      className="a-auth-form"
    >
      {setup && <input type="hidden" name="token" ref={token} defaultValue={setupToken} />}
      <Field
        label="Owner email"
        name="email"
        type="email"
        required
        autoComplete="username"
        placeholder="you@yourbusiness.com"
      />
      <div>
        <Field
          label={setup ? "Create password" : "Password"}
          name="password"
          type={show ? "text" : "password"}
          required
          autoComplete={setup ? "new-password" : "current-password"}
          help={setup ? "Use at least 12 characters." : undefined}
        />
        <button
          type="button"
          className="a-text-button"
          onClick={() => setShow(!show)}
        >
          {show ? "Hide" : "Show"} password
        </button>
      </div>
      {setup && (
        <Field
          label="Confirm password"
          name="confirmPassword"
          type="password"
          required
          autoComplete="new-password"
        />
      )}
      <Submit
        pendingLabel={setup ? "Creating your account…" : "Signing in…"}
      >
        {setup ? "Create owner account" : "Sign in to dashboard"}
        <ArrowRight size={17} />
      </Submit>
      <p className="a-auth-foot">
        <LockKeyhole size={13} /> Private access for the store owner
      </p>
    </ActionForm>
  );
}
export function ProductForm({
  product,
  categories,
}: {
  product?: Product;
  categories: string[];
}) {
  const p = product;
  const [category, setCategory] = useState(p?.category ?? "");
  const [active, setActive] = useState(p?.active ?? true),
    [house, setHouse] = useState(p?.house ?? false);
  const [preview, setPreview] = useState(p?.thumbnail ?? "");
  const [uploading, setUploading] = useState(false),
    [uploadError, setUploadError] = useState("");
  return (
    <ActionForm action={saveProduct} className="a-editor">
      {p && (
        <>
          <input type="hidden" name="id" value={p.id} />
          <input type="hidden" name="version" value={p.version} />
        </>
      )}
      <div className="a-editor-main">
        <section className="a-card">
          <div className="a-card-head">
            <div>
              <h2>Product information</h2>
              <p>The details customers see in your store.</p>
            </div>
          </div>
          <div className="a-form-grid">
            <Field
              label="Product name"
              name="title"
              defaultValue={p?.title}
              required
              span
              placeholder="e.g. Everyday cotton tee"
            />
            <Area
              label="Description"
              name="description"
              defaultValue={p?.description}
              required
              placeholder="Materials, features, sizing and what makes it special…"
            />
            <label className="a-field">
              <span>Category</span>
              <input
                name="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                list="product-categories"
                required
                placeholder="e.g. clothing"
              />
              <datalist id="product-categories">
                {categories.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </label>
            <Field label="Brand" name="brand" defaultValue={p?.brand ?? ""} />
            <Field
              label="SKU"
              name="sku"
              defaultValue={p?.sku ?? ""}
              placeholder="e.g. ZYL-TEE-001"
              help="A unique code for your own inventory."
            />
            <Field
              label="Tags"
              name="tags"
              defaultValue={p?.tags.join(", ")}
              placeholder="cotton, everyday, unisex"
            />
          </div>
        </section>
        <section className="a-card">
          <div className="a-card-head">
            <div>
              <h2>Product images</h2>
              <p>
                Use a public HTTPS image URL, or a path to an existing store
                image.
              </p>
            </div>
          </div>
          <div className="a-form-grid">
            <label className="a-field a-span">
              <span>Cover image</span>
              <input
                name="thumbnail"
                value={preview}
                required
                placeholder="https://…"
                onChange={(e) => setPreview(e.target.value)}
              />
            </label>
            <label className="a-field a-span">
              <span>Or upload a cover image</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                disabled={uploading}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  if (file.size > 2 * 1024 * 1024) {
                    setUploadError("Choose an image up to 2 MB.");
                    return;
                  }
                  setUploading(true);
                  setUploadError("");
                  try {
                    const data = new FormData();
                    data.set("image", file);
                    const result = await uploadImage(data);
                    if (result.url) setPreview(result.url);
                    else setUploadError(result.error ?? "Upload failed.");
                  } catch {
                    setUploadError("Upload failed. Try again.");
                  } finally {
                    setUploading(false);
                  }
                }}
              />
              <small>
                {uploading
                  ? "Uploading image…"
                  : "JPG, PNG or WebP · up to 2 MB. Uploads are saved with your store."}
              </small>
              {uploadError && (
                <small role="alert" style={{ color: "#b85243" }}>
                  {uploadError}
                </small>
              )}
            </label>
            <Area
              label="Gallery images"
              name="images"
              defaultValue={p?.images.join("\n")}
              placeholder="One image URL per line"
              rows={3}
              help="Up to eight images. Leave empty to use the cover image."
            />
          </div>
        </section>
        <section className="a-card">
          <div className="a-card-head">
            <div>
              <h2>Delivery & returns</h2>
              <p>Set clear expectations before someone orders.</p>
            </div>
          </div>
          <div className="a-form-grid">
            <Field
              label="Dispatch / delivery information"
              name="shippingInformation"
              defaultValue={
                p?.shippingInformation ?? "Dispatch in 1–2 business days"
              }
              span
            />
            <Area
              label="Return policy"
              name="returnPolicy"
              defaultValue={p?.returnPolicy ?? ""}
              rows={2}
            />
            <Field
              label="Warranty information"
              name="warrantyInformation"
              defaultValue={p?.warrantyInformation ?? ""}
              span
            />
          </div>
        </section>
      </div>
      <aside className="a-editor-side">
        <section className="a-card">
          <div className="a-card-head">
            <h2>Preview</h2>
          </div>
          <div className="a-product-preview">
            {preview && /^(https:\/\/|\/[^/])/.test(preview) ? (
              <Image
                unoptimized
                width={480}
                height={400}
                src={preview}
                alt="Product cover preview"
                referrerPolicy="no-referrer"
              />
            ) : (
              <span>Add a cover image</span>
            )}
          </div>
        </section>
        <section className="a-card">
          <div className="a-card-head">
            <h2>Pricing & stock</h2>
          </div>
          <div className="a-form-stack">
            <Field
              label="Selling price (₹)"
              name="priceINR"
              type="number"
              min={1}
              max={1000000}
              step={1}
              required
              defaultValue={p ? inr(p.price) : ""}
              help="The final price the customer pays per unit."
            />
            <Field
              label="Discount shown (%)"
              name="discountPercentage"
              type="number"
              min={0}
              max={95}
              step={0.01}
              defaultValue={p?.discountPercentage ?? 0}
              required
              help="Used to calculate the crossed-out MRP."
            />
            {!p ? (
              <Field
                label="Opening stock"
                name="stock"
                type="number"
                min={0}
                max={1000000}
                defaultValue={0}
                required
              />
            ) : (
              <p className="a-subtle">
                {p.stock} units in stock.{" "}
                <Link
                  href={`/admin/inventory?q=${encodeURIComponent(p.title)}`}
                >
                  Adjust inventory →
                </Link>
              </p>
            )}
          </div>
        </section>
        <section className="a-card">
          <div className="a-card-head">
            <h2>Visibility</h2>
          </div>
          <div className="a-form-stack">
            <label className="a-checkbox">
              <input
                name="active"
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
              />
              <span>
                Published in storefront
                <small>Uncheck to save privately as archived.</small>
              </span>
            </label>
            <label className="a-checkbox">
              <input
                name="house"
                type="checkbox"
                checked={house}
                onChange={(e) => setHouse(e.target.checked)}
              />
              <span>
                Zylo collection
                <small>Feature this in the store’s own collection.</small>
              </span>
            </label>
          </div>
        </section>
        <Submit disabled={uploading}>
          <Save size={16} />
          {p ? "Save product" : "Create product"}
        </Submit>
        <Link className="a-button a-secondary" href="/admin/products">
          Cancel
        </Link>
      </aside>
    </ActionForm>
  );
}
export function VisibilityForm({
  id,
  version,
  active,
}: {
  id: number;
  version: number;
  active: boolean;
}) {
  return (
    <ActionForm
      action={toggleProduct}
      confirm={
        active
          ? "Remove this product from the storefront? Existing orders will be kept."
          : undefined
      }
    >
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="version" value={version} />
      <input type="hidden" name="active" value={String(!active)} />
      <Submit className="a-text-button" pendingLabel="Updating…">
        {active ? "Archive" : "Publish"}
      </Submit>
    </ActionForm>
  );
}
export function StockForm({ id }: { id: number }) {
  return (
    <ActionForm action={adjustStock} className="a-stock-form">
      <input type="hidden" name="id" value={id} />
      <label className="sr-only" htmlFor={`delta-${id}`}>
        Stock change
      </label>
      <input
        id={`delta-${id}`}
        type="number"
        name="delta"
        required
        placeholder="+10 / -2"
        min={-1000000}
        max={1000000}
      />
      <label className="sr-only" htmlFor={`reason-${id}`}>
        Reason
      </label>
      <input
        id={`reason-${id}`}
        name="reason"
        required
        minLength={3}
        maxLength={300}
        placeholder="Reason (received, damaged…)"
      />
      <Submit className="a-button a-secondary a-small">Update</Submit>
    </ActionForm>
  );
}
export function OrderForm({ order }: { order: Record<string, unknown> }) {
  const status = String(order.status) as OrderStatus;
  const [selectedStatus,setSelectedStatus]=useState(status);
  const [selectedPayment,setSelectedPayment]=useState(String(order.payment_status));
  return (
    <ActionForm action={updateOrder} className="a-form-stack">
      <input type="hidden" name="id" value={String(order.id)} />
      <input type="hidden" name="version" value={String(order.version)} />
      <label className="a-field">
        <span id="fulfillment-label">Fulfillment status</span>
        <select name="status" aria-labelledby="fulfillment-label" value={selectedStatus} onChange={e=>setSelectedStatus(e.target.value as OrderStatus)}>
          {STATUSES.filter(
            (s) => s === status || TRANSITIONS[status]?.includes(s),
          ).map((s) => (
            <option key={s} value={s}>
              {s[0].toUpperCase() + s.slice(1)}
            </option>
          ))}
        </select>
      </label>
      <label className="a-field">
        <span id="payment-label">Payment status</span>
        <select
          name="paymentStatus"
          aria-labelledby="payment-label"
          value={selectedPayment} onChange={e=>setSelectedPayment(e.target.value)}
        >
          <option value="pending">Pending · cash on delivery</option>
          <option value="paid">Paid · collected</option>
          <option value="refunded">Refunded</option>
        </select>
      </label>
      <Field
        label="Courier / carrier"
        name="carrier"
        defaultValue={String(order.carrier ?? "")}
        placeholder="e.g. Delhivery"
      />
      <Field
        label="Tracking number"
        name="trackingNumber"
        defaultValue={String(order.tracking_number ?? "")}
      />
      <Field
        label="Tracking URL"
        name="trackingUrl"
        type="url"
        defaultValue={String(order.tracking_url ?? "")}
        placeholder="https://…"
      />
      <Area
        label="Internal note"
        name="internalNote"
        defaultValue={String(order.internal_note ?? "")}
        rows={3}
        help="Only visible to you."
      />
      <p className="a-subtle">
        Cancel or return an order to restore its stock once. Mark a COD payment
        as paid after it has been collected.
      </p>
      <Submit>
        <Save size={16} />
        Save order
      </Submit>
    </ActionForm>
  );
}
export function SettingsForm({
  settings,
}: {
  settings: Record<string, unknown>;
}) {
  return (
    <ActionForm action={saveSettings} className="a-form-grid">
      <Field
        label="Store name"
        name="storeName"
        defaultValue={String(settings.store_name)}
        required
        span
      />
      <Field
        label="Support email"
        name="supportEmail"
        type="email"
        defaultValue={String(settings.support_email)}
        required
      />
      <Field
        label="Support phone"
        name="supportPhone"
        defaultValue={String(settings.support_phone)}
      />
      <Area
        label="Business address"
        name="businessAddress"
        defaultValue={String(settings.business_address)}
        rows={3}
      />
      <Field
        label="Low-stock alert threshold"
        name="lowStockThreshold"
        type="number"
        min={0}
        max={10000}
        defaultValue={Number(settings.low_stock_threshold)}
        required
        span
        help="Products at or below this quantity appear in stock alerts."
      />
      <Field
        label="Delivery charge (₹)"
        name="shippingINR"
        type="number"
        min={0}
        max={100000}
        defaultValue={Number(settings.shipping_paise) / 100}
        required
      />
      <Field
        label="Free delivery above (₹)"
        name="freeShippingINR"
        type="number"
        min={0}
        max={1000000}
        defaultValue={Number(settings.free_shipping_above_paise) / 100}
        required
        help="Set to 0 for free delivery on every order."
      />
      <div className="a-span">
        <Submit>
          <Save size={16} />
          Save store settings
        </Submit>
      </div>
    </ActionForm>
  );
}
export function PasswordForm() {
  return (
    <ActionForm action={changePassword} className="a-form-stack">
      <Field
        label="Current password"
        name="currentPassword"
        type="password"
        required
        autoComplete="current-password"
      />
      <Field
        label="New password"
        name="newPassword"
        type="password"
        required
        autoComplete="new-password"
        help="At least 12 characters."
      />
      <Field
        label="Confirm new password"
        name="confirmPassword"
        type="password"
        required
        autoComplete="new-password"
      />
      <Submit className="a-button a-secondary">
        <ShieldCheck size={16} />
        Change password
      </Submit>
    </ActionForm>
  );
}
