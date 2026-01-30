import { Layout } from '@/components/layout/Layout';
import { SEOHead } from '@/components/seo/SEOHead';
import { Card, CardContent } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { FileText, Mail } from 'lucide-react';

const sections = [
  { id: 'acceptance', title: '1. Acceptance of Terms' },
  { id: 'services', title: '2. Description of Services' },
  { id: 'accounts', title: '3. User Accounts' },
  { id: 'conduct', title: '4. User Conduct' },
  { id: 'content', title: '5. User Content' },
  { id: 'intellectual-property', title: '6. Intellectual Property' },
  { id: 'listings', title: '7. Property Listings' },
  { id: 'professional-users', title: '8. Professional Users' },
  { id: 'disclaimers', title: '9. Disclaimers' },
  { id: 'limitation', title: '10. Limitation of Liability' },
  { id: 'indemnification', title: '11. Indemnification' },
  { id: 'termination', title: '12. Termination' },
  { id: 'governing-law', title: '13. Governing Law' },
  { id: 'changes', title: '14. Changes to Terms' },
  { id: 'contact', title: '15. Contact Information' },
];

export default function TermsOfService() {
  const lastUpdated = 'January 30, 2026';
  const effectiveDate = 'January 30, 2026';

  return (
    <Layout>
      <SEOHead
        title="Terms of Service | BuyWise Israel"
        description="Terms and conditions for using BuyWise Israel's real estate platform, including user responsibilities and service limitations."
        canonicalUrl="https://buywiseisrael.com/terms"
      />

      <div className="bg-gradient-to-b from-muted/60 to-background border-b border-border/50">
        <div className="container py-8 md:py-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold">Terms of Service</h1>
              <p className="text-sm text-muted-foreground">
                Effective: {effectiveDate} • Last updated: {lastUpdated}
              </p>
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
            <div className="not-prose mb-8 p-4 bg-muted/50 rounded-lg border border-border">
              <p className="text-sm text-muted-foreground">
                <strong>Important:</strong> Please read these Terms of Service carefully before using 
                BuyWise Israel. By accessing or using our platform, you agree to be bound by these terms.
              </p>
            </div>

            <section id="acceptance" className="scroll-mt-24">
              <h2>1. Acceptance of Terms</h2>
              <p>
                These Terms of Service ("Terms") constitute a legally binding agreement between you 
                and BuyWise Israel ("Company," "we," "us," or "our") governing your access to and 
                use of the buywiseisrael.com website and all related services (collectively, the "Services").
              </p>
              <p>
                By creating an account, accessing our website, or using our Services, you acknowledge 
                that you have read, understood, and agree to be bound by these Terms. If you do not 
                agree to these Terms, you must not use our Services.
              </p>
              <p>
                You must be at least 18 years old to use our Services. By using our Services, you 
                represent and warrant that you meet this age requirement.
              </p>
            </section>

            <section id="services" className="scroll-mt-24">
              <h2>2. Description of Services</h2>
              <p>BuyWise Israel provides an online platform designed to help international buyers navigate Israeli real estate. Our Services include:</p>
              <ul>
                <li>Property listing search and display</li>
                <li>New development project information</li>
                <li>Financial calculators and tools</li>
                <li>Educational guides and resources</li>
                <li>Search alerts and notifications</li>
                <li>Connection with real estate professionals</li>
                <li>City and neighborhood information</li>
              </ul>
              <p>
                <strong>We are not a real estate agency.</strong> We do not buy, sell, or rent properties. 
                We do not provide legal, financial, or tax advice. All information is for educational 
                purposes only.
              </p>
            </section>

            <section id="accounts" className="scroll-mt-24">
              <h2>3. User Accounts</h2>
              <h3>Account Creation</h3>
              <p>
                Some features require you to create an account. You agree to provide accurate, current, 
                and complete information during registration and to update such information as necessary.
              </p>
              
              <h3>Account Security</h3>
              <p>
                You are responsible for maintaining the confidentiality of your account credentials and 
                for all activities that occur under your account. You must immediately notify us of any 
                unauthorized use of your account.
              </p>
              
              <h3>One Account Per Person</h3>
              <p>
                Each person may maintain only one account. Creating multiple accounts may result in 
                termination of all associated accounts.
              </p>
            </section>

            <section id="conduct" className="scroll-mt-24">
              <h2>4. User Conduct</h2>
              <p>You agree not to:</p>
              <ul>
                <li>Use our Services for any unlawful purpose or in violation of any applicable laws</li>
                <li>Impersonate any person or entity or misrepresent your affiliation</li>
                <li>Interfere with or disrupt the integrity or performance of our Services</li>
                <li>Attempt to gain unauthorized access to any portion of our Services</li>
                <li>Use automated scripts or bots to access our Services without permission</li>
                <li>Scrape, harvest, or collect user information without consent</li>
                <li>Post spam, advertisements, or unsolicited commercial content</li>
                <li>Transmit viruses, malware, or any destructive code</li>
                <li>Harass, threaten, or abuse other users</li>
                <li>Post false, misleading, or fraudulent property listings</li>
              </ul>
            </section>

            <section id="content" className="scroll-mt-24">
              <h2>5. User Content</h2>
              <p>
                You may submit content to our platform, including property inquiries, reviews, and 
                profile information ("User Content"). By submitting User Content, you:
              </p>
              <ul>
                <li>Retain ownership of your User Content</li>
                <li>Grant us a non-exclusive, worldwide, royalty-free license to use, display, and 
                    distribute your User Content in connection with our Services</li>
                <li>Represent that your User Content does not violate any third-party rights</li>
                <li>Acknowledge that we may remove User Content that violates these Terms</li>
              </ul>
            </section>

            <section id="intellectual-property" className="scroll-mt-24">
              <h2>6. Intellectual Property</h2>
              <p>
                All content on our platform, including text, graphics, logos, icons, images, software, 
                and the compilation thereof, is the property of BuyWise Israel or its content suppliers 
                and is protected by Israeli and international copyright laws.
              </p>
              <p>
                The BuyWise Israel name, logo, and all related names, logos, product and service names, 
                designs, and slogans are trademarks of BuyWise Israel. You may not use such marks 
                without our prior written permission.
              </p>
            </section>

            <section id="listings" className="scroll-mt-24">
              <h2>7. Property Listings</h2>
              <h3>Accuracy</h3>
              <p>
                While we strive to ensure the accuracy of property listings displayed on our platform, 
                we do not guarantee the completeness, accuracy, or reliability of any listing information. 
                Listings are provided by third-party agents, agencies, and developers.
              </p>
              
              <h3>Availability</h3>
              <p>
                Property availability may change without notice. We are not responsible for properties 
                that have been sold, rented, or withdrawn from the market.
              </p>
              
              <h3>Pricing</h3>
              <p>
                Prices displayed are indicative and may not reflect final transaction prices. Additional 
                costs such as taxes, fees, and commissions may apply.
              </p>
            </section>

            <section id="professional-users" className="scroll-mt-24">
              <h2>8. Professional Users</h2>
              <p>
                Agents, agencies, and developers using our platform agree to additional terms:
              </p>
              <ul>
                <li>All listings must be accurate, current, and not misleading</li>
                <li>You must hold valid licenses required by Israeli law</li>
                <li>You must respond to inquiries in a professional and timely manner</li>
                <li>You must not post duplicate or spam listings</li>
                <li>You must comply with all applicable real estate regulations</li>
              </ul>
              <p>
                We reserve the right to remove listings or suspend accounts that violate these requirements.
              </p>
            </section>

            <section id="disclaimers" className="scroll-mt-24">
              <h2>9. Disclaimers</h2>
              <p>
                <strong>OUR SERVICES ARE PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF 
                ANY KIND, EITHER EXPRESS OR IMPLIED.</strong>
              </p>
              <p>We specifically disclaim:</p>
              <ul>
                <li>Any warranty that our Services will be uninterrupted, timely, secure, or error-free</li>
                <li>Any warranty regarding the accuracy, reliability, or completeness of any content</li>
                <li>Any warranty that defects will be corrected</li>
                <li>Any warranty regarding the results obtained from using our Services</li>
              </ul>
              <p>
                <strong>Our calculators and tools provide estimates only.</strong> They should not be 
                relied upon for financial decisions. Always consult with qualified professionals before 
                making any real estate or financial decisions.
              </p>
            </section>

            <section id="limitation" className="scroll-mt-24">
              <h2>10. Limitation of Liability</h2>
              <p>
                TO THE FULLEST EXTENT PERMITTED BY LAW, BUYWISE ISRAEL SHALL NOT BE LIABLE FOR ANY 
                INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT 
                LIMITED TO LOSS OF PROFITS, DATA, USE, OR OTHER INTANGIBLE LOSSES, RESULTING FROM:
              </p>
              <ul>
                <li>Your use or inability to use our Services</li>
                <li>Any unauthorized access to or alteration of your data</li>
                <li>Any content or conduct of third parties on our Services</li>
                <li>Any property transactions you enter into based on information from our platform</li>
              </ul>
              <p>
                IN NO EVENT SHALL OUR TOTAL LIABILITY EXCEED THE AMOUNT YOU PAID US, IF ANY, FOR 
                ACCESSING OUR SERVICES DURING THE TWELVE (12) MONTHS PRECEDING THE CLAIM.
              </p>
            </section>

            <section id="indemnification" className="scroll-mt-24">
              <h2>11. Indemnification</h2>
              <p>
                You agree to indemnify, defend, and hold harmless BuyWise Israel and its officers, 
                directors, employees, and agents from any claims, damages, losses, liabilities, and 
                expenses (including legal fees) arising from:
              </p>
              <ul>
                <li>Your use of our Services</li>
                <li>Your violation of these Terms</li>
                <li>Your violation of any rights of another party</li>
                <li>Any User Content you submit</li>
              </ul>
            </section>

            <section id="termination" className="scroll-mt-24">
              <h2>12. Termination</h2>
              <p>
                We may terminate or suspend your account and access to our Services immediately, 
                without prior notice or liability, for any reason, including:
              </p>
              <ul>
                <li>Breach of these Terms</li>
                <li>Fraudulent, abusive, or illegal activity</li>
                <li>Extended period of inactivity</li>
                <li>Request by law enforcement</li>
              </ul>
              <p>
                You may terminate your account at any time by contacting us. Upon termination, your 
                right to use our Services will immediately cease.
              </p>
            </section>

            <section id="governing-law" className="scroll-mt-24">
              <h2>13. Governing Law</h2>
              <p>
                These Terms shall be governed by and construed in accordance with the laws of the 
                State of Israel, without regard to its conflict of law provisions.
              </p>
              <p>
                Any disputes arising from these Terms or your use of our Services shall be subject 
                to the exclusive jurisdiction of the courts located in Tel Aviv, Israel.
              </p>
            </section>

            <section id="changes" className="scroll-mt-24">
              <h2>14. Changes to Terms</h2>
              <p>
                We reserve the right to modify these Terms at any time. We will notify you of any 
                material changes by posting the new Terms on this page and updating the "Last updated" 
                date.
              </p>
              <p>
                Your continued use of our Services after any changes indicates your acceptance of 
                the new Terms. We encourage you to review these Terms periodically.
              </p>
            </section>

            <section id="contact" className="scroll-mt-24">
              <h2>15. Contact Information</h2>
              <p>
                For questions about these Terms of Service, please contact us:
              </p>
              <div className="not-prose mt-4">
                <Card className="bg-muted/50">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <Mail className="h-5 w-5 text-primary" />
                      <a href="mailto:legal@buywiseisrael.com" className="text-primary hover:underline">
                        legal@buywiseisrael.com
                      </a>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      BuyWise Israel<br />
                      Tel Aviv, Israel
                    </p>
                  </CardContent>
                </Card>
              </div>
            </section>

            {/* Related Links */}
            <div className="not-prose mt-12 pt-8 border-t border-border">
              <p className="text-sm text-muted-foreground mb-4">Related policies:</p>
              <div className="flex gap-4">
                <Link to="/privacy" className="text-sm text-primary hover:underline">
                  Privacy Policy
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
