import { lazy, Suspense, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, BarChart3, Moon, ShieldCheck, Sun, Target } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useInView } from "@/hooks/useInView";
import { MountWhenVisible, Reveal } from "@/components/landing/InView";
import HeroVisual from "@/components/landing/HeroVisual";
import "@/components/landing/landing.css";

// Recharts is the heaviest dependency here, so it is split out and only fetched
// once the analytics section is close to the viewport.
const LandingCharts = lazy(() => import("@/components/landing/LandingCharts"));

const FONTS_HREF =
  "https://fonts.googleapis.com/css2?family=Inter:wght@400;500&family=Space+Grotesk:wght@400&display=swap";

/**
 * Loads the landing typefaces (Space Grotesk 400, Inter 400/500) only on this page,
 * so authenticated-app users never pay for them. `display=swap` + system fallbacks
 * in the CSS keep text visible while they load.
 */
function useLandingFonts() {
  useEffect(() => {
    if (document.head.querySelector("link[data-lp-fonts]")) return;
    const add = (rel: string, href: string, crossOrigin?: string) => {
      const link = document.createElement("link");
      link.rel = rel;
      link.href = href;
      if (crossOrigin !== undefined) link.crossOrigin = crossOrigin;
      link.dataset.lpFonts = "";
      document.head.appendChild(link);
    };
    add("preconnect", "https://fonts.googleapis.com");
    add("preconnect", "https://fonts.gstatic.com", "");
    add("stylesheet", FONTS_HREF);
  }, []);
}

// Deliberately the real stack rather than invented "trusted by" logos.
const BUILT_WITH = ["MongoDB", "Express", "React", "Node.js", "TypeScript", "Tailwind CSS"];

const FEATURES = [
  {
    icon: BarChart3,
    title: "Real-time Analytics",
    body: "Category breakdowns and income-versus-expense trends update the moment you add a transaction.",
  },
  {
    icon: Target,
    title: "Comprehensive Goal Tracking",
    body: "Set savings goals and monthly budgets, then follow your progress and get alerts before you overspend.",
  },
  {
    icon: ShieldCheck,
    title: "Secure by Design",
    body: "Sessions live in httpOnly cookies, the API is rate-limited, and hardened security headers are on by default.",
  },
];

function Nav() {
  const { user } = useAuth();
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <header className="lp-nav-wrap">
      <nav className="lp-nav" aria-label="Primary">
        <Link to="/" className="lp-brand">
          <img src="/logo.png" alt="" width={28} height={28} decoding="async" />
          <span>Expense Tracker</span>
        </Link>

        <div className="lp-nav-right">
          <div className="lp-nav-links">
            <a href="#features">Features</a>
            <a href="#analytics">Analytics</a>
          </div>

          <div className="lp-nav-actions">
            <button
              type="button"
              className="lp-icon-btn"
              onClick={() => setTheme(isDark ? "light" : "dark")}
              aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            >
              {isDark ? <Sun key="sun" size={17} /> : <Moon key="moon" size={17} />}
            </button>
            {user ? (
              <Link to="/dashboard" className="lp-btn lp-btn-sm">
                Dashboard
              </Link>
            ) : (
              <>
                <Link to="/login" className="lp-login">
                  Log in
                </Link>
                <Link to="/register" className="lp-btn lp-btn-sm">
                  Get started
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}

function Hero() {
  const { user } = useAuth();
  // Live (not once) so the looping float animation pauses when the hero scrolls away.
  const [ref, inView] = useInView<HTMLElement>({ once: false, rootMargin: "0px" });
  const delay = (ms: number) => ({ animationDelay: `${ms}ms` });

  return (
    <section ref={ref} data-live={inView} className="lp-hero lp-container">
      <div className="lp-hero-copy">
        <p className="lp-eyebrow lp-enter" style={delay(80)}>
          Personal finance, precisely
        </p>
        <h1 className="lp-h1 lp-enter" style={delay(160)}>
          Take Control.
          <br />
          Track with Precision.
        </h1>
        <p className="lp-lead lp-enter" style={delay(260)}>
          Log expenses, import statements, set budgets and follow your goals in one calm, secure workspace, with
          analytics that keep up with you.
        </p>
        <div className="lp-cta-row lp-enter" style={delay(360)}>
          <Link to={user ? "/dashboard" : "/register"} className="lp-btn">
            Start Tracking <ArrowRight size={16} />
          </Link>
          <a href="#analytics" className="lp-textlink">
            See the analytics
          </a>
        </div>
      </div>
      <HeroVisual />
    </section>
  );
}

export default function Landing() {
  const { user } = useAuth();
  useLandingFonts();

  return (
    <div className="lp">
      <Nav />

      <main>
        <Hero />

        <section className="lp-section lp-container" aria-label="Built with">
          <Reveal>
            <div className="lp-strip">
              <span className="lp-strip-label">Built with</span>
              {BUILT_WITH.map((name) => (
                <span key={name} className="lp-strip-item">
                  {name}
                </span>
              ))}
            </div>
          </Reveal>
        </section>

        <section id="features" className="lp-section lp-container">
          <Reveal>
            <div className="lp-section-head">
              <p className="lp-eyebrow">Features</p>
              <h2 className="lp-h2">Everything you need, nothing you don't.</h2>
            </div>
          </Reveal>
          <div className="lp-features">
            {FEATURES.map(({ icon: Icon, title, body }, i) => (
              <Reveal key={title} delay={i * 90}>
                <article className="lp-card">
                  <div className="lp-card-top">
                    <span className="lp-card-icon">
                      <Icon size={22} />
                    </span>
                    <span className="lp-card-index">0{i + 1}</span>
                  </div>
                  <h3 className="lp-h3">{title}</h3>
                  <p className="lp-body-copy">{body}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </section>

        <section id="analytics" className="lp-band">
          <div className="lp-container">
            <Reveal>
              <div className="lp-section-head">
                <p className="lp-eyebrow">Analytics</p>
                <h2 className="lp-h2">See where every rupee goes.</h2>
                <p className="lp-lead">
                  The same interactive charts you get inside the app. Switch views and time ranges to try them.
                </p>
                <span className="lp-tag">Demo data</span>
              </div>
            </Reveal>
            <MountWhenVisible minHeight={560}>
              <Suspense fallback={<div className="lp-skel" style={{ minHeight: 560 }} aria-hidden="true" />}>
                <LandingCharts />
              </Suspense>
            </MountWhenVisible>
          </div>
        </section>

        <section className="lp-section lp-container" aria-label="Get started">
          <Reveal>
            <div className="lp-cta">
              <div>
                <h2 className="lp-h2">Start tracking in minutes.</h2>
                <p className="lp-body-copy">Create an account, add your first transaction, and the charts fill in.</p>
              </div>
              <div className="lp-cta-row" style={{ marginTop: 0 }}>
                <Link to={user ? "/dashboard" : "/register"} className="lp-btn">
                  {user ? "Open dashboard" : "Create your account"} <ArrowRight size={16} />
                </Link>
                {!user && (
                  <Link to="/login" className="lp-textlink">
                    Log in
                  </Link>
                )}
              </div>
            </div>
          </Reveal>
        </section>
      </main>

      <footer className="lp-footer">
        <div className="lp-container lp-footer-inner">
          <span>© {new Date().getFullYear()} Expense Tracker</span>
          <nav className="lp-footer-links" aria-label="Footer">
            <Link to="/login">Log in</Link>
            <Link to="/register">Create account</Link>
            <a href="https://github.com/spacedragonx/Expense-tracker" target="_blank" rel="noreferrer noopener">
              GitHub
            </a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
