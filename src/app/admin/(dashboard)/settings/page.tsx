import { requireOwner } from "@/lib/admin/auth";
import { adminSql } from "@/lib/admin/db";
import { storeSettings } from "@/lib/admin/queries";
import { date, Heading, SectionHead } from "@/components/admin/UI";
import { PasswordForm, SettingsForm } from "@/components/admin/Forms";
export default async function Settings() {
  const user = await requireOwner();
  const sql = adminSql();
  const [settings, activity] = await Promise.all([
    storeSettings(),
    sql`SELECT * FROM admin_activity ORDER BY created_at DESC,id DESC LIMIT 20`,
  ]);
  return (
    <>
      <Heading
        eyebrow="MAKE IT YOURS"
        title="Settings"
        description="Your store details, delivery rules and account security."
      />
      <div className="a-settings-grid">
        <section className="a-card">
          <SectionHead
            title="Store details"
            description="Support details are shown in the storefront. Shipping rules apply at checkout."
          />
          <SettingsForm settings={settings} />
        </section>
        <div className="grid gap-5">
          <section className="a-card">
            <SectionHead
              title="Account security"
              description={`Signed in as ${user.email}`}
            />
            <PasswordForm />
          </section>
          <section className="a-card">
            <SectionHead title="Payment method" />
            <div className="a-detail-body">
              <strong>Cash on delivery</strong>
              <p>
                Customers pay their courier. Record collections from the order
                detail page. Online payment collection requires a connected
                payment provider.
              </p>
            </div>
          </section>
        </div>
      </div>
      <section className="a-card mt-6">
        <SectionHead
          title="Recent store activity"
          description="A record of changes made in your dashboard."
        />
        <div className="a-activity">
          {activity.length ? (
            activity.map((a) => (
              <div key={String(a.id)}>
                <strong>{String(a.action)}</strong>
                <p>{String(a.detail)}</p>
                <small>
                  {date(a.created_at, true)} ·{" "}
                  {new Date(String(a.created_at)).toLocaleTimeString("en-IN", {
                    hour: "2-digit",
                    minute: "2-digit",
                    timeZone: "Asia/Kolkata",
                  })}
                </small>
              </div>
            ))
          ) : (
            <p className="a-subtle pb-3">
              Your store changes will be recorded here.
            </p>
          )}
        </div>
      </section>
    </>
  );
}
