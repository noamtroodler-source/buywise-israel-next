import { Layout } from '@/components/layout/Layout';
import { SEOHead } from '@/components/seo/SEOHead';
import { Card, CardContent } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { Shield, Mail } from 'lucide-react';

const sections = [
  { id: 'introduction', title: '1. Introduction' },
  { id: 'data-collection', title: '2. Information We Collect' },
  { id: 'data-use', title: '3. How We Use Your Information' },
  { id: 'cookies', title: '4. Cookies & Tracking' },
  { id: 'third-party', title: '5. Third-Party Services' },
  { id: 'data-sharing', title: '6. Data Sharing' },
  { id: 'data-security', title: '7. Data Security' },
  { id: 'user-rights', title: '8. Your Rights' },
  { id: 'retention', title: '9. Data Retention' },
  { id: 'children', title: '10. Children\'s Privacy' },
  { id: 'changes', title: '11. Changes to This Policy' },
  { id: 'contact', title: '12. Contact Us' },
];

export default function PrivacyPolicy() {
  const lastUpdated = 'January 30, 2026';

  return (
    <Layout>
      <SEOHead
        title="Privacy Policy | BuyWise Israel"
        description="Learn how BuyWise Israel collects, uses, and protects your personal information when you use our real estate platform."
        canonicalUrl="https://buywiseisrael.com/privacy"
      />

      <div className="bg-gradient-to-b from-muted/60 to-background border-b border-border/50">
        <div className="container py-8 md:py-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold">Privacy Policy</h1>
              <p className="text-sm text-muted-foreground">Last updated: {lastUpdated}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container py-8 md:py-12">
        <div className="grid lg:grid-cols-[250px_1fr] gap-8">
          {/* Table of Contents - Desktop */}
          <aside className="hidden lg:block">
            <div className="sticky top-20">
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-sm mb-3 text-muted-foreground uppercase tracking-wide">
                    Contents
                  </h3>
                  <nav className="space-y-1">
                    {sections.map((section) => (
                      <a
                        key={section.id}
                        href={`#${section.id}`}
                        className="block text-sm text-muted-foreground hover:text-foreground transition-colors py-1"
                      >
                        {section.title}
                      </a>
                    ))}
                  </nav>
                </CardContent>
              </Card>
            </div>
          </aside>

          {/* Content */}
          <div className="prose prose-gray dark:prose-invert max-w-none">
            <section id="introduction" className="scroll-mt-24">
              <h2>1. Introduction</h2>
              <p>
                Welcome to BuyWise Israel ("we," "our," or "us"). We are committed to protecting your 
                privacy and ensuring the security of your personal information. This Privacy Policy 
                explains how we collect, use, disclose, and safeguard your information when you visit 
                our website at buywiseisrael.com and use our services.
              </p>
              <p>
                By using our platform, you agree to the collection and use of information in accordance 
                with this policy. If you do not agree with our policies and practices, please do not use 
                our services.
              </p>
            </section>

            <section id="data-collection" className="scroll-mt-24">
              <h2>2. Information We Collect</h2>
              
              <h3>Personal Information You Provide</h3>
              <p>We collect information you voluntarily provide when you:</p>
              <ul>
                <li>Create an account (name, email address, password)</li>
                <li>Complete your buyer profile (residency status, purchase preferences, budget range)</li>
                <li>Save properties or create search alerts</li>
                <li>Contact us or submit inquiries</li>
                <li>Register as an agent, agency, or developer</li>
                <li>Subscribe to newsletters or notifications</li>
              </ul>

              <h3>Automatically Collected Information</h3>
              <p>When you access our platform, we automatically collect:</p>
              <ul>
                <li>Device information (browser type, operating system, device type)</li>
                <li>Usage data (pages visited, time spent, features used)</li>
                <li>IP address and approximate location</li>
                <li>Referring website or source</li>
                <li>Search queries and filter preferences</li>
              </ul>
            </section>

            <section id="data-use" className="scroll-mt-24">
              <h2>3. How We Use Your Information</h2>
              <p>We use the information we collect to:</p>
              <ul>
                <li><strong>Provide our services:</strong> Display property listings, save favorites, calculate costs, and match you with relevant properties</li>
                <li><strong>Personalize your experience:</strong> Customize cost estimates based on your buyer profile and show relevant recommendations</li>
                <li><strong>Send communications:</strong> Search alerts, price drop notifications, weekly digests, and important account updates</li>
                <li><strong>Improve our platform:</strong> Analyze usage patterns, identify issues, and develop new features</li>
                <li><strong>Ensure security:</strong> Detect and prevent fraud, abuse, or unauthorized access</li>
                <li><strong>Comply with legal obligations:</strong> Meet regulatory requirements and respond to legal requests</li>
              </ul>
            </section>

            <section id="cookies" className="scroll-mt-24">
              <h2>4. Cookies & Tracking</h2>
              <p>We use cookies and similar tracking technologies to:</p>
              <ul>
                <li><strong>Essential cookies:</strong> Maintain your session, remember login status, and ensure security</li>
                <li><strong>Preference cookies:</strong> Remember your settings, saved searches, and display preferences</li>
                <li><strong>Analytics cookies:</strong> Understand how visitors use our site to improve the user experience</li>
              </ul>
              <p>
                You can manage cookie preferences through your browser settings. Note that disabling 
                certain cookies may limit functionality on our platform.
              </p>
            </section>

            <section id="third-party" className="scroll-mt-24">
              <h2>5. Third-Party Services</h2>
              <p>We work with trusted third-party services to operate our platform:</p>
              <ul>
                <li><strong>Supabase:</strong> Database hosting and authentication (data stored securely)</li>
                <li><strong>Resend:</strong> Email delivery for notifications and alerts</li>
                <li><strong>Google Maps:</strong> Location services and map display</li>
                <li><strong>Google OAuth:</strong> Optional sign-in with Google account</li>
              </ul>
              <p>
                These services have their own privacy policies and we encourage you to review them. 
                We only share the minimum information necessary for these services to function.
              </p>
            </section>

            <section id="data-sharing" className="scroll-mt-24">
              <h2>6. Data Sharing</h2>
              <p>We do not sell your personal information. We may share your information in these limited circumstances:</p>
              <ul>
                <li><strong>With agents/developers:</strong> When you submit an inquiry, your contact details are shared with the relevant professional</li>
                <li><strong>Service providers:</strong> Third-party vendors who assist in operating our platform (subject to confidentiality agreements)</li>
                <li><strong>Legal requirements:</strong> When required by law, court order, or government regulation</li>
                <li><strong>Business transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
              </ul>
            </section>

            <section id="data-security" className="scroll-mt-24">
              <h2>7. Data Security</h2>
              <p>
                We implement industry-standard security measures to protect your information:
              </p>
              <ul>
                <li>Encryption of data in transit (HTTPS/TLS)</li>
                <li>Secure password hashing</li>
                <li>Row-level security policies for database access</li>
                <li>Regular security audits and monitoring</li>
                <li>Access controls and authentication requirements</li>
              </ul>
              <p>
                While we strive to protect your personal information, no method of transmission over 
                the Internet is 100% secure. We cannot guarantee absolute security.
              </p>
            </section>

            <section id="user-rights" className="scroll-mt-24">
              <h2>8. Your Rights</h2>
              <p>Depending on your location, you may have the following rights:</p>
              <ul>
                <li><strong>Access:</strong> Request a copy of the personal data we hold about you</li>
                <li><strong>Correction:</strong> Update or correct inaccurate information</li>
                <li><strong>Deletion:</strong> Request deletion of your personal data</li>
                <li><strong>Portability:</strong> Receive your data in a structured, machine-readable format</li>
                <li><strong>Opt-out:</strong> Unsubscribe from marketing communications at any time</li>
                <li><strong>Withdraw consent:</strong> Where processing is based on consent, you may withdraw it</li>
              </ul>
              <p>
                To exercise these rights, please contact us at{' '}
                <a href="mailto:privacy@buywiseisrael.com">privacy@buywiseisrael.com</a>.
              </p>
            </section>

            <section id="retention" className="scroll-mt-24">
              <h2>9. Data Retention</h2>
              <p>
                We retain your personal information for as long as necessary to provide our services 
                and fulfill the purposes outlined in this policy. Specifically:
              </p>
              <ul>
                <li><strong>Account data:</strong> Retained while your account is active</li>
                <li><strong>Transaction records:</strong> Retained for 7 years for legal/tax purposes</li>
                <li><strong>Marketing preferences:</strong> Retained until you unsubscribe</li>
                <li><strong>Analytics data:</strong> Aggregated and anonymized after 24 months</li>
              </ul>
              <p>
                When you delete your account, we will delete or anonymize your personal data within 
                30 days, unless retention is required by law.
              </p>
            </section>

            <section id="children" className="scroll-mt-24">
              <h2>10. Children's Privacy</h2>
              <p>
                Our services are not directed to individuals under 18 years of age. We do not knowingly 
                collect personal information from children. If you believe we have collected information 
                from a child, please contact us immediately and we will delete it.
              </p>
            </section>

            <section id="changes" className="scroll-mt-24">
              <h2>11. Changes to This Policy</h2>
              <p>
                We may update this Privacy Policy from time to time. We will notify you of any material 
                changes by posting the new policy on this page and updating the "Last updated" date. 
                We encourage you to review this policy periodically.
              </p>
              <p>
                For significant changes affecting your rights, we will provide additional notice via 
                email or a prominent notice on our website.
              </p>
            </section>

            <section id="contact" className="scroll-mt-24">
              <h2>12. Contact Us</h2>
              <p>
                If you have questions, concerns, or requests regarding this Privacy Policy or our 
                data practices, please contact us:
              </p>
              <div className="not-prose mt-4">
                <Card className="bg-muted/50">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <Mail className="h-5 w-5 text-primary" />
                      <a href="mailto:privacy@buywiseisrael.com" className="text-primary hover:underline">
                        privacy@buywiseisrael.com
                      </a>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      BuyWise Israel<br />
                      Tel Aviv, Israel
                    </p>
                    <p className="text-sm text-muted-foreground mt-4">
                      We aim to respond to all privacy-related inquiries within 30 days.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </section>

            {/* Related Links */}
            <div className="not-prose mt-12 pt-8 border-t border-border">
              <p className="text-sm text-muted-foreground mb-4">Related policies:</p>
              <div className="flex gap-4">
                <Link to="/terms" className="text-sm text-primary hover:underline">
                  Terms of Service
                </Link>
                <Link to="/contact" className="text-sm text-primary hover:underline">
                  Contact Us
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
