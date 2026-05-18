import * as React from 'npm:react@18.3.1'
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'BuyWise Israel'
const SITE_URL = 'https://buywiseisrael.com'

interface OwnerWelcomeProps {
  ownerName?: string
  agencyName?: string
  setupUrl?: string
  agentCount?: number
  listingCount?: number
  pendingItems?: string[]
  isAlsoAgent?: boolean
  agentProfileName?: string
}

const OwnerWelcomeEmail = ({
  ownerName,
  agencyName,
  setupUrl,
  agentCount,
  listingCount,
  pendingItems = [],
  isAlsoAgent,
  agentProfileName,
}: OwnerWelcomeProps) => {
  const firstName = ownerName ? ownerName.split(' ')[0] : null
  const greeting = firstName ? `Hi ${firstName},` : 'Hi there,'
  const agency = agencyName || 'your agency'
  const safeSetupUrl = setupUrl || SITE_URL
  const agentsAdded = agentCount ?? 0
  const listingsImported = listingCount ?? 0

  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>
        {agency} is live on {SITE_NAME} — set your password to take the keys
      </Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Brand bar */}
          <Section style={brandBar}>
            <Text style={brandMark}>BuyWise Israel</Text>
            <Text style={brandTagline}>Real estate intelligence for international buyers</Text>
          </Section>

          <Heading style={h1}>Welcome aboard, {firstName || 'friend'} 👋</Heading>

          <Text style={lede}>
            <strong>{agency}</strong> is officially live on {SITE_NAME}. We've
            done the heavy lifting — your agency profile, team roster, and
            listings are already set up and waiting for you inside.
          </Text>

          <Text style={text}>{greeting}</Text>
          <Text style={text}>
            All you need to do is set your password and log in. From there, the
            keys to your agency are yours.
          </Text>

          {isAlsoAgent ? (
            <Text style={text}>
              We also linked your personal agent profile
              {agentProfileName ? ` (${agentProfileName})` : ''} to{' '}
              {agency} — so any listings or buyer leads you handle directly are
              already tied to you. No second account needed.
            </Text>
          ) : null}

          {/* What's already set up */}
          <Section style={summaryBox}>
            <Text style={summaryTitle}>What's already set up for you</Text>
            <Text style={summaryItem}>
              <span style={bullet}>✓</span> Agency admin access — full control
              over your team and listings
            </Text>
            {isAlsoAgent ? (
              <Text style={summaryItem}>
                <span style={bullet}>✓</span> Your agent profile linked for
                listings and buyer leads
              </Text>
            ) : null}
            <Text style={summaryItem}>
              <span style={bullet}>✓</span> {agentsAdded} agent
              {agentsAdded === 1 ? '' : 's'} added to your roster
            </Text>
            <Text style={summaryItem}>
              <span style={bullet}>✓</span> {listingsImported} listing
              {listingsImported === 1 ? '' : 's'} imported and reviewed
            </Text>
          </Section>

          {/* CTA */}
          <Section style={ctaSection}>
            <Button style={button} href={safeSetupUrl}>
              Set your password & log in
            </Button>
            <Text style={ctaHint}>Takes about 30 seconds.</Text>
          </Section>

          <Hr style={hr} />

          {/* Next steps */}
          <Text style={subhead}>Once you're inside — three quick wins</Text>
          <Section style={stepsBox}>
            <Section style={stepRow}>
              <Text style={stepNumber}>1</Text>
              <Section style={stepBody}>
                <Text style={stepTitle}>Review your agency profile</Text>
                <Text style={stepText}>
                  Add your photo, bio, and the neighborhoods you serve so
                  international buyers can find and trust you.
                </Text>
              </Section>
            </Section>

            <Section style={stepRow}>
              <Text style={stepNumber}>2</Text>
              <Section style={stepBody}>
                <Text style={stepTitle}>Invite the rest of your team</Text>
                <Text style={stepText}>
                  Share your agency invite link from the Team page — your
                  agents can join in one click and start managing their own
                  listings.
                </Text>
              </Section>
            </Section>

            <Section style={stepRow}>
              <Text style={stepNumber}>3</Text>
              <Section style={stepBody}>
                <Text style={stepTitle}>Polish your listings</Text>
                <Text style={stepText}>
                  Check the imported listings, add any missing photos or
                  details, and feature up to 3 each month on the homepage
                  (included free for founding agencies).
                </Text>
              </Section>
            </Section>
          </Section>

          {pendingItems.length > 0 ? (
            <>
              <Hr style={hr} />
              <Text style={subhead}>A few small things we flagged for you</Text>
              <Section style={pendingBox}>
                {pendingItems.slice(0, 5).map((item, i) => (
                  <Text key={i} style={pendingItem}>
                    • {item}
                  </Text>
                ))}
              </Section>
            </>
          ) : null}

          <Hr style={hr} />

          {/* Founding badge */}
          <Section style={foundingBox}>
            <Text style={foundingTitle}>🌟 You're a founding agency</Text>
            <Text style={foundingText}>
              That means unlimited agents, unlimited listings, and 3 featured
              homepage spots every month — all included, no payment setup
              required. We'll let you know well in advance before anything
              changes.
            </Text>
          </Section>

          <Hr style={hr} />

          <Text style={footer}>
            Got a question, an idea, or just want to say hi? Reply to this
            email — it goes straight to the founder, and we read every word.
          </Text>
          <Text style={signoff}>— The {SITE_NAME} team</Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: OwnerWelcomeEmail,
  subject: (data: Record<string, any>) =>
    `${data?.agencyName || 'Your agency'} is live on ${SITE_NAME} — let's get you in`,
  displayName: 'Owner welcome',
  previewData: {
    ownerName: 'Avi Cohen',
    agencyName: 'Jerusalem Real Estate',
    setupUrl: 'https://buywiseisrael.com/auth/setup-password?token=preview',
    agentCount: 5,
    listingCount: 42,
    isAlsoAgent: true,
    agentProfileName: 'Avi Cohen',
    pendingItems: [
      '3 agents need a license number added',
      '8 listings need additional photos',
      '2 listings need an agent assigned',
    ],
  },
} satisfies TemplateEntry

/* ---------- Styles ---------- */

const main: React.CSSProperties = {
  backgroundColor: '#ffffff',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
  color: '#0b1729',
}
const container: React.CSSProperties = {
  maxWidth: '580px',
  margin: '0 auto',
  padding: '32px 24px 48px',
}
const brandBar: React.CSSProperties = {
  borderBottom: '1px solid #e5e7eb',
  paddingBottom: '16px',
  marginBottom: '28px',
}
const brandMark: React.CSSProperties = {
  fontSize: '16px',
  fontWeight: 700,
  color: 'hsl(213, 94%, 45%)',
  letterSpacing: '-0.01em',
  margin: 0,
}
const brandTagline: React.CSSProperties = {
  fontSize: '12px',
  color: '#64748b',
  margin: '2px 0 0',
}
const h1: React.CSSProperties = {
  fontSize: '26px',
  fontWeight: 700,
  color: '#0b1729',
  lineHeight: 1.25,
  margin: '0 0 16px',
  letterSpacing: '-0.01em',
}
const lede: React.CSSProperties = {
  fontSize: '16px',
  color: '#0b1729',
  lineHeight: 1.6,
  margin: '0 0 22px',
}
const text: React.CSSProperties = {
  fontSize: '15px',
  color: '#334155',
  lineHeight: 1.65,
  margin: '0 0 14px',
}
const summaryBox: React.CSSProperties = {
  backgroundColor: '#f5f9ff',
  border: '1px solid #dbeafe',
  borderRadius: '12px',
  padding: '18px 20px',
  margin: '24px 0',
}
const summaryTitle: React.CSSProperties = {
  fontSize: '13px',
  fontWeight: 700,
  color: 'hsl(213, 94%, 30%)',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  margin: '0 0 12px',
}
const summaryItem: React.CSSProperties = {
  fontSize: '14px',
  color: '#0b1729',
  margin: '6px 0',
  lineHeight: 1.5,
}
const bullet: React.CSSProperties = {
  color: 'hsl(213, 94%, 45%)',
  fontWeight: 700,
  marginRight: '8px',
}
const ctaSection: React.CSSProperties = {
  textAlign: 'center',
  margin: '32px 0 8px',
}
const button: React.CSSProperties = {
  backgroundColor: 'hsl(213, 94%, 45%)',
  color: '#ffffff',
  padding: '14px 30px',
  borderRadius: '8px',
  textDecoration: 'none',
  fontWeight: 600,
  fontSize: '15px',
  display: 'inline-block',
}
const ctaHint: React.CSSProperties = {
  fontSize: '12px',
  color: '#94a3b8',
  margin: '10px 0 0',
}
const hr: React.CSSProperties = {
  borderColor: '#e5e7eb',
  margin: '28px 0',
}
const subhead: React.CSSProperties = {
  fontSize: '13px',
  fontWeight: 700,
  color: 'hsl(213, 94%, 30%)',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  margin: '0 0 14px',
}
const stepsBox: React.CSSProperties = {
  margin: '0 0 8px',
}
const stepRow: React.CSSProperties = {
  marginBottom: '14px',
}
const stepNumber: React.CSSProperties = {
  display: 'inline-block',
  width: '26px',
  height: '26px',
  lineHeight: '26px',
  textAlign: 'center',
  borderRadius: '50%',
  backgroundColor: 'hsl(213, 94%, 45%)',
  color: '#ffffff',
  fontSize: '13px',
  fontWeight: 700,
  margin: '0 12px 0 0',
  verticalAlign: 'top',
}
const stepBody: React.CSSProperties = {
  display: 'inline-block',
  verticalAlign: 'top',
  width: '90%',
}
const stepTitle: React.CSSProperties = {
  fontSize: '15px',
  fontWeight: 600,
  color: '#0b1729',
  margin: '0 0 4px',
}
const stepText: React.CSSProperties = {
  fontSize: '14px',
  color: '#475569',
  lineHeight: 1.55,
  margin: 0,
}
const pendingBox: React.CSSProperties = {
  backgroundColor: '#fffbeb',
  border: '1px solid #fde68a',
  borderRadius: '10px',
  padding: '14px 18px',
}
const pendingItem: React.CSSProperties = {
  fontSize: '14px',
  color: '#78350f',
  margin: '4px 0',
  lineHeight: 1.5,
}
const foundingBox: React.CSSProperties = {
  backgroundColor: '#fefce8',
  border: '1px solid #fde68a',
  borderRadius: '12px',
  padding: '16px 20px',
}
const foundingTitle: React.CSSProperties = {
  fontSize: '14px',
  fontWeight: 700,
  color: '#854d0e',
  margin: '0 0 6px',
}
const foundingText: React.CSSProperties = {
  fontSize: '13px',
  color: '#713f12',
  lineHeight: 1.55,
  margin: 0,
}
const footer: React.CSSProperties = {
  fontSize: '13px',
  color: '#64748b',
  lineHeight: 1.55,
  margin: '0 0 8px',
}
const signoff: React.CSSProperties = {
  fontSize: '13px',
  color: '#64748b',
  fontStyle: 'italic',
  margin: 0,
}
