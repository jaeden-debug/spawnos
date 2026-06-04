import type { Metadata } from 'next'
import Link from 'next/link'
import SiteHeader from '@/components/layout/SiteHeader'
import SiteFooter from '@/components/layout/SiteFooter'

export const metadata: Metadata = {
  title: 'Privacy Policy — SpawnOS',
  description: 'SpawnOS privacy policy. How we collect, use, and protect your data.',
  alternates: { canonical: '/privacy' },
}

const LAST_UPDATED = 'June 2, 2026'

export default function PrivacyPage() {
  return (
    <>
      <SiteHeader />
      <main className="pt-20">
        <section className="py-14 px-4 border-b border-spawn-border/40">
          <div className="max-w-3xl mx-auto">
            <nav className="text-xs text-spawn-muted-text mb-6 flex items-center gap-2">
              <Link href="/" className="hover:text-spawn-cyan transition-colors">Home</Link>
              <span>/</span>
              <span>Privacy Policy</span>
            </nav>
            <h1 className="text-4xl font-black text-spawn-text mb-3">Privacy Policy</h1>
            <p className="text-spawn-muted-text text-sm">Last updated: {LAST_UPDATED}</p>
          </div>
        </section>

        <section className="py-12 px-4">
          <div className="max-w-3xl mx-auto prose-legal space-y-10">
            <div className="p-5 rounded-xl bg-spawn-surface/50 border border-spawn-border/40 text-sm text-spawn-muted-text leading-relaxed">
              SpawnOS is operated by <strong className="text-spawn-text">Blackwater Aquatics Canada</strong>, a Canadian business. This policy applies to spawnos.app and all SpawnOS services. We comply with Canada&apos;s <em>Personal Information Protection and Electronic Documents Act</em> (PIPEDA) and applicable provincial privacy legislation.
            </div>

            {[
              {
                title: '1. What We Collect',
                content: [
                  '<strong>Account data:</strong> Email address, display name, and password hash (via Supabase Auth) when you create an account.',
                  '<strong>Profile data:</strong> Username, bio, location, and social links if you choose to add them.',
                  '<strong>Usage data:</strong> Fish registry entries, pair records, spawn logs, and water parameter readings you enter into the dashboard.',
                  '<strong>Billing data:</strong> Payment method and subscription details are processed and stored by <strong>Stripe</strong> — we never receive or store full card numbers. We store your Stripe customer ID for subscription management.',
                  '<strong>AI chat history:</strong> Messages sent to the SpawnOS AI assistant are sent to OpenAI for processing. We do not persistently store conversation history. See OpenAI&apos;s privacy policy for their data practices.',
                  '<strong>Log data:</strong> Standard server logs including IP addresses, browser type, and pages visited. Retained for up to 90 days.',
                  '<strong>Newsletter:</strong> If you subscribe via /signup, your email is sent to our configured newsletter provider. You can unsubscribe at any time via the link in any email.',
                ],
              },
              {
                title: '2. How We Use Your Data',
                content: [
                  'To provide and maintain the SpawnOS platform and dashboard features.',
                  'To process subscription payments and manage your billing through Stripe.',
                  'To send transactional emails (account confirmation, password reset, subscription receipts).',
                  'To send newsletter emails if you have subscribed — only to addresses that have explicitly opted in.',
                  'To improve the platform based on aggregate, anonymised usage patterns.',
                  'We do not sell your personal data to third parties.',
                  'We do not use your data to train AI models.',
                ],
              },
              {
                title: '3. Data Storage and Security',
                content: [
                  'Account data and dashboard content are stored in Supabase (PostgreSQL), hosted on servers in the United States. Supabase is SOC 2 Type II certified.',
                  'All data in transit is encrypted via TLS 1.3 or higher.',
                  'All database connections use encrypted connections. Row Level Security (RLS) is enforced on all user-owned tables — your data is isolated from other users at the database level.',
                  'Billing data is stored by Stripe and governed by Stripe&apos;s security and compliance programme (PCI DSS Level 1).',
                ],
              },
              {
                title: '4. Third-Party Services',
                content: [
                  '<strong>Supabase</strong> — Authentication and database. <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" class="text-spawn-cyan hover:underline">Privacy Policy</a>',
                  '<strong>OpenAI</strong> — AI assistant processing. Messages are sent to OpenAI for response generation. <a href="https://openai.com/policies/privacy-policy" target="_blank" rel="noopener noreferrer" class="text-spawn-cyan hover:underline">Privacy Policy</a>',
                  '<strong>Stripe</strong> — Payment processing. <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" class="text-spawn-cyan hover:underline">Privacy Policy</a>',
                  '<strong>Vercel</strong> — Hosting and CDN. <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" class="text-spawn-cyan hover:underline">Privacy Policy</a>',
                ],
              },
              {
                title: '5. Your Rights',
                content: [
                  '<strong>Access:</strong> You can request a copy of your personal data by contacting us at privacy@spawnos.app.',
                  '<strong>Correction:</strong> Update your profile and account details at any time via the dashboard settings.',
                  '<strong>Deletion:</strong> Request account deletion via dashboard settings or by emailing privacy@spawnos.app. We will delete your personal data within 30 days.',
                  '<strong>Data portability:</strong> Pro and Breeder subscribers can export their fish, spawn, and parameter data as CSV from dashboard settings.',
                  '<strong>Opt-out:</strong> Unsubscribe from marketing emails at any time via the unsubscribe link in any email.',
                  'Canadian residents have additional rights under PIPEDA, including the right to file a complaint with the Office of the Privacy Commissioner of Canada.',
                ],
              },
              {
                title: '6. Cookies',
                content: [
                  'SpawnOS uses session cookies for authentication (managed by Supabase Auth). These are strictly necessary for the platform to function and cannot be disabled.',
                  'We do not use advertising cookies or third-party tracking pixels.',
                  'No consent banner is required as we do not use optional tracking cookies.',
                ],
              },
              {
                title: '7. Children',
                content: [
                  'SpawnOS is not directed at children under 13 years of age. We do not knowingly collect personal information from children under 13. If you believe we have inadvertently collected data from a child, please contact us immediately at privacy@spawnos.app.',
                ],
              },
              {
                title: '8. Changes to This Policy',
                content: [
                  'We may update this policy as our practices change. We will notify users of material changes via email (for registered users) and by updating the "Last updated" date above. Continued use of SpawnOS after changes are posted constitutes acceptance.',
                ],
              },
              {
                title: '9. Contact',
                content: [
                  'For privacy inquiries: <a href="mailto:privacy@spawnos.app" class="text-spawn-cyan hover:underline">privacy@spawnos.app</a>',
                  'Blackwater Aquatics Canada',
                  'General support: <a href="mailto:support@spawnos.app" class="text-spawn-cyan hover:underline">support@spawnos.app</a>',
                ],
              },
            ].map((section) => (
              <div key={section.title}>
                <h2 className="text-lg font-bold text-spawn-text mb-4">{section.title}</h2>
                <ul className="space-y-2">
                  {section.content.map((item, i) => (
                    <li
                      key={i}
                      className="text-sm text-spawn-muted-text leading-relaxed pl-4 border-l border-spawn-border/40"
                      dangerouslySetInnerHTML={{ __html: item }}
                    />
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  )
}
