import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { AuthForm } from "./Forms";
export function AuthPage({ setup = false, setupToken = "" }: { setup?: boolean; setupToken?: string }) {
  return (
    <div className="a-auth">
      <aside className="a-auth-art">
        <div className="a-auth-wordmark">
          zylo<span>BUSINESS</span>
        </div>
        <div className="a-auth-copy">
          <span>A little ambition. A lot of possibility.</span>
          <h1>
            Your business.
            <br />
            Your rules.
            <br />
            <em>Your next chapter.</em>
          </h1>
          <p>
            From the first listing to the next hundred orders. A home for
            everything you’re building.
          </p>
          <div className="a-auth-mini" aria-hidden>
            <div className="a-auth-mini-top">
              <span>Room to grow</span>
              <span>↗ Built for what’s next</span>
            </div>
            <div className="a-auth-mini-bars">
              {[25, 39, 34, 55, 48, 68, 64, 90].map((h, i) => (
                <i key={i} style={{ height: `${h}%` }} />
              ))}
            </div>
          </div>
        </div>
        <p className="a-auth-bottom">
          ZYLO BUSINESS · BUILT FOR INDEPENDENT BRANDS
        </p>
      </aside>
      <div className="a-auth-content">
        <div className="a-auth-box">
          <span className="a-auth-icon">
            <ShieldCheck size={23} strokeWidth={1.5} />
          </span>
          <h2>{setup ? "Make yourself at home." : "Welcome back."}</h2>
          <p>
            {setup
              ? "Create your private owner account to start managing your store. Your setup link can only be used once."
              : "Your store is ready when you are. Sign in to see what’s happening."}
          </p>
          <AuthForm setup={setup} setupToken={setupToken} />
          <Link href="/" className="a-auth-back">
            <ArrowLeft size={13} />
            Back to the storefront
          </Link>
        </div>
      </div>
    </div>
  );
}
