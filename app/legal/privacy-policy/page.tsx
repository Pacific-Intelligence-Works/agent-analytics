import Link from "next/link";
import { Bot } from "lucide-react";

export const metadata = {
  title: "Privacy Policy — Agent Analytics",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="fixed top-0 z-50 w-full border-b border-gray-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-emerald-600" />
            <span className="font-semibold">Agent Analytics</span>
          </Link>
          <Link
            href="/login"
            className="text-sm text-gray-500 transition-colors hover:text-gray-900"
          >
            Sign in
          </Link>
        </div>
      </nav>

      <article className="prose prose-gray mx-auto max-w-3xl px-6 pb-24 pt-28">
        <h1>Agent Analytics Privacy Policy</h1>
        <p><strong>Last Updated: February 25, 2026</strong></p>

        <p>
          This Privacy Policy explains how Pacific Intelligence Works, Inc. d/b/a{" "}
          <strong>Unusual</strong> (&ldquo;<strong>Unusual</strong>,&rdquo;
          &ldquo;<strong>we</strong>,&rdquo; &ldquo;<strong>us</strong>,&rdquo; or
          &ldquo;<strong>our</strong>&rdquo;) collects, uses, and discloses personal information
          when you use Agent Analytics, a free analytics tool available at analytics.unusual.ai
          (the &ldquo;<strong>Service</strong>&rdquo;). It also explains choices and rights you may
          have. This Policy is incorporated into our{" "}
          <Link href="/legal/terms-of-service" className="text-emerald-600 hover:text-emerald-700">
            Terms of Service
          </Link>{" "}
          for Agent Analytics.
        </p>
        <p>
          This Policy uses defined terms consistent with the Agent Analytics Terms of Service,
          including &ldquo;Analytics Data,&rdquo; &ldquo;Connection Data,&rdquo; &ldquo;Service
          Data,&rdquo; and &ldquo;Aggregated Data.&rdquo;
        </p>

        <h2>1) Information We Collect</h2>

        <h3>1.1 Information you provide</h3>
        <ul>
          <li>
            <strong>Account data:</strong> Name, email address, and authentication information
            (including third-party login credentials if you use OAuth/SSO to sign in).
          </li>
          <li>
            <strong>Connection Data:</strong> API keys, tokens, account identifiers, or other
            credentials you provide to connect the Service to your infrastructure provider(s)
            (e.g., Cloudflare).
          </li>
        </ul>

        <h3>1.2 Information we collect automatically</h3>
        <ul>
          <li>
            <strong>Service Data:</strong> Usage logs, feature interaction data, session analytics,
            performance metrics, timestamps, and technical diagnostics generated through your use
            of the Service.
          </li>
          <li>
            <strong>Device and access data:</strong> IP address, browser type and version,
            operating system, referral URLs, and pages viewed within the Service.
          </li>
        </ul>

        <h3>1.3 Information derived from your infrastructure provider</h3>
        <ul>
          <li>
            <strong>Analytics Data:</strong> The Service retrieves data from your connected
            infrastructure provider(s) about AI agent and crawler traffic to your website(s),
            including request counts, agent identifiers (e.g., GPTBot, ClaudeBot), crawled page
            paths, data transfer volumes, and timestamps. This data originates from your
            infrastructure provider and is processed by the Service to generate your dashboard and
            reports.
          </li>
        </ul>

        <h3>1.4 Information we do NOT collect</h3>
        <ul>
          <li>We do <strong>not</strong> collect the content of your web pages.</li>
          <li>
            We do <strong>not</strong> collect personal information about visitors to your
            website(s) — the Service tracks AI agent/crawler activity only.
          </li>
          <li>
            We do <strong>not</strong> collect or store payment information (the Service is free).
          </li>
        </ul>

        <h2>2) How We Use Information</h2>
        <p>We use the information we collect to:</p>
        <ul>
          <li>
            <strong>Provide and operate the Service</strong>, including retrieving data from your
            infrastructure provider(s), generating your analytics dashboard, and displaying
            Analytics Data.
          </li>
          <li>
            <strong>Maintain and secure the Service</strong>, including authentication, access
            control, fraud prevention, abuse detection, and technical troubleshooting.
          </li>
          <li>
            <strong>Improve and develop the Service and our other products and services</strong>,
            including using Service Data and Aggregated Data for feature development, performance
            optimization, benchmarking, and research.
          </li>
          <li>
            <strong>Create Aggregated Data</strong> by aggregating, anonymizing, or de-identifying
            Analytics Data and Service Data so that it does not identify you, your website(s), or
            any individual. We own Aggregated Data and may use it for any lawful purpose, including
            product development, benchmarking, research, marketing, and commercial purposes.
          </li>
          <li>
            <strong>Communicate with you</strong> about the Service and about Unusual&apos;s other
            products and services, including service announcements, security alerts, marketing
            communications, and responses to your inquiries.
          </li>
          <li>
            <strong>Market and promote Unusual&apos;s other products and services</strong>,
            including using your account data and Analytics Data to send you relevant information
            about Unusual&apos;s paid offerings. You may opt out of marketing communications at any
            time via the unsubscribe link or by contacting us.
          </li>
          <li>
            <strong>Comply with law</strong> and enforce our Terms of Service.
          </li>
        </ul>
        <p>
          We do <strong>not</strong> use personal information for <strong>ad personalization</strong>{" "}
          or <strong>cross-context behavioral advertising</strong>.
        </p>

        <h2>3) How We Disclose Information</h2>
        <p>We disclose personal information to:</p>
        <ul>
          <li>
            <strong>Service providers</strong> that host, support, or help us operate the Service
            (under contracts restricting their use of the data), including cloud infrastructure
            providers and authentication services.
          </li>
          <li>
            <strong>Your connected infrastructure provider(s)</strong> (e.g., Cloudflare) as
            necessary to retrieve your Analytics Data via their APIs.
          </li>
          <li>
            <strong>Professional advisers</strong> (lawyers, accountants, insurers) bound by
            confidentiality obligations.
          </li>
          <li>
            <strong>Authorities</strong> when required by law, legal process, or to protect rights,
            safety, or the Service.
          </li>
          <li>
            <strong>Transaction parties</strong> in a merger, acquisition, or similar corporate
            event (subject to appropriate safeguards).
          </li>
        </ul>
        <p>
          We do <strong>not</strong> sell personal information and do <strong>not</strong> share
          personal information for cross-context behavioral advertising.
        </p>

        <h2>4) Connection Data Security</h2>
        <p>
          Connection Data (such as API keys and tokens) is stored using encryption and access
          controls. We use Connection Data solely to retrieve Analytics Data on your behalf. You
          may revoke access at any time by disconnecting your infrastructure provider account or
          deleting your Agent Analytics account. Upon disconnection or account deletion, we will
          delete stored Connection Data from active systems within a commercially reasonable
          period.
        </p>

        <h2>5) Cookies and Similar Technologies</h2>
        <p>
          We use only the cookies and similar technologies necessary to operate the Service,
          including session cookies for authentication and basic analytics. We do <strong>not</strong>{" "}
          use cookies for ad personalization or cross-site tracking. See your browser&apos;s
          settings to manage cookies.
        </p>

        <h2>6) Data Retention</h2>
        <p>
          We retain personal information for as long as necessary to provide the Service, comply
          with legal obligations, resolve disputes, and enforce our Terms. Specifically:
        </p>
        <ul>
          <li>
            <strong>Account data</strong> is retained while your account is active and for a
            reasonable period after deletion to comply with legal obligations.
          </li>
          <li>
            <strong>Connection Data</strong> is deleted when you disconnect your infrastructure
            provider or delete your account.
          </li>
          <li>
            <strong>Analytics Data</strong> is retained while your account is active. Upon account
            deletion, Analytics Data is deleted from active systems within a commercially
            reasonable period.
          </li>
          <li>
            <strong>Service Data</strong> is retained for as long as necessary for the purposes
            described in this Policy.
          </li>
          <li>
            <strong>Aggregated Data</strong> may be retained indefinitely.
          </li>
        </ul>

        <h2>7) International Data Transfers</h2>
        <p>
          We may transfer personal information to the United States and other countries where we
          and our providers operate. Where required, we rely on Standard Contractual Clauses or
          comparable transfer mechanisms and implement appropriate safeguards.
        </p>

        <h2>8) Security</h2>
        <p>
          We implement reasonable and appropriate technical and organizational measures, including
          access controls, encryption in transit (and at rest where applicable), logging and
          monitoring, and workforce confidentiality obligations. No method of transmission or
          storage is 100% secure.
        </p>

        <h2>9) Your Rights</h2>

        <h3>9.1 All users</h3>
        <p>You may:</p>
        <ul>
          <li>
            <strong>Access and export</strong> your Analytics Data through the Service.
          </li>
          <li>
            <strong>Delete your account</strong> at any time, which will trigger deletion of your
            Analytics Data and Connection Data from active systems.
          </li>
          <li>
            <strong>Disconnect</strong> your infrastructure provider at any time.
          </li>
        </ul>

        <h3>9.2 California (CPRA) and certain U.S. states</h3>
        <p>
          Subject to exceptions, you may have the right to <strong>know/access</strong>,{" "}
          <strong>delete</strong>, <strong>correct</strong>, <strong>port</strong>, and{" "}
          <strong>opt out of sale/share</strong> (not applicable — we do not sell or share). You
          also have the right to limit the use/disclosure of sensitive personal information (we do
          not use sensitive PI for purposes requiring this right). If we deny a request, you may
          submit an appeal by replying to our decision email.
        </p>

        <h3>9.3 EEA/UK/Switzerland (GDPR)</h3>
        <p>
          Our legal bases include <strong>contract</strong> (to provide the Service),{" "}
          <strong>legitimate interests</strong> (security, product improvement, benchmarking), and{" "}
          <strong>legal obligations</strong>. You may have rights to <strong>access</strong>,{" "}
          <strong>rectify</strong>, <strong>erase</strong>, <strong>restrict</strong>,{" "}
          <strong>object</strong>, and <strong>portability</strong>. You may lodge a complaint with
          your local supervisory authority.
        </p>

        <h3>9.4 Exercising your rights</h3>
        <p>
          Contact us at <strong>founders@unusual.ai</strong> to exercise any privacy rights.
        </p>

        <h2>10) Children</h2>
        <p>
          The Service is <strong>not directed to children under 16</strong>, and we do not
          knowingly collect personal information from children.
        </p>

        <h2>11) Changes to this Policy</h2>
        <p>
          We may update this Policy from time to time. The &ldquo;Last Updated&rdquo; date reflects
          the latest changes. Material changes will be posted on this page, and your continued use
          of the Service after the effective date constitutes acceptance.
        </p>

        <h2>12) Contact Us</h2>
        <p>
          Pacific Intelligence Works, Inc. d/b/a <strong>Unusual</strong><br />
          San Francisco, California, USA<br />
          <strong>founders@unusual.ai</strong>
        </p>
      </article>
    </div>
  );
}
