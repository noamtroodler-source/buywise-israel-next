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

interface OwnerWelcomeProps {
  ownerName?: string
  agencyName?: string
  setupUrl?: string
  agentCount?: number
  listingCount?: number
  pendingItems?: string[]
}

const OwnerWelcomeEmail = ({
  ownerName,
  agencyName,
  setupUrl,
  agentCount,
  listingCount,
  pendingItems = [],
}: OwnerWelcomeProps) => {
  const greeting = ownerName ? `Hi ${ownerName},` : 'Hi there,'
  const safeSetupUrl = setupUrl || 'https://buywiseisrael.com'
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>
        Your {agencyName || 'agency'} account on {SITE_NAME} is ready
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Welcome to {SITE_NAME} 👋</Heading>
          <Text style={text}>{greeting}</Text>
          <Text style={text}>
            Your account for{' '}
            <strong>{agencyName || 'your agency'}</strong> is set up and
            ready. We've done the heavy lifting so you can hit the ground
            running.
          </Text>

          <Section style={summaryBox}>
            <Text style={summaryTitle}>We've prepared for you:</Text>
            <Text style={summaryItem}>
              👥 {agentCount ?? 0} agent{agentCount === 1 ? '' : 's'} added
              to your roster
            </Text>
            <Text style={summaryItem}>
              🏠 {listingCount ?? 0} listing{listingCount === 1 ? '' : 's'}{' '}
              imported and reviewed
            </Text>
          </Section>

          <Section style={ctaSection}>
            <Button style={button} href={safeSetupUrl}>
              Set your password & log in
            </Button>
          </Section>

          {pendingItems.length > 0 ? (
            <>
              <Hr style={hr} />
              <Text style={subhead}>A few things to confirm once you're in:</Text>
              {pendingItems.slice(0, 5).map((item, i) => (
                <Text key={i} style={pendingItem}>
                  • {item}
                </Text>
              ))}
            </>
          ) : null}

          <Hr style={hr} />
          <Text style={footer}>
            Questions? Just reply to this email — we read every message.
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
    `Your ${data?.agencyName || 'agency'} account on ${SITE_NAME} is ready`,
  displayName: 'Owner welcome',
  previewData: {
    ownerName: 'Avi',
    agencyName: 'Jerusalem Real Estate',
    setupUrl: 'https://buywiseisrael.com/auth/setup-password?token=preview',
    agentCount: 5,
    listingCount: 42,
    pendingItems: [
      '3 agents need a license number added',
      '8 listings need additional photos',
      '2 listings need an agent assigned',
    ],
  },
} satisfies TemplateEntry

const main: React.CSSProperties = {
  backgroundColor: '#ffffff',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
}
const container: React.CSSProperties = {
  maxWidth: '560px',
  margin: '0 auto',
  padding: '40px 24px',
}
const h1: React.CSSProperties = {
  fontSize: '24px',
  fontWeight: 700,
  color: '#0b1729',
  margin: '0 0 24px',
}
const text: React.CSSProperties = {
  fontSize: '15px',
  color: '#334155',
  lineHeight: 1.6,
  margin: '0 0 16px',
}
const summaryBox: React.CSSProperties = {
  backgroundColor: '#eff6ff',
  borderRadius: '10px',
  padding: '18px 20px',
  margin: '20px 0',
}
const summaryTitle: React.CSSProperties = {
  fontSize: '14px',
  fontWeight: 600,
  color: '#0b1729',
  margin: '0 0 10px',
}
const summaryItem: React.CSSProperties = {
  fontSize: '14px',
  color: '#0b1729',
  margin: '6px 0',
  lineHeight: 1.5,
}
const ctaSection: React.CSSProperties = { textAlign: 'center', margin: '28px 0' }
const button: React.CSSProperties = {
  backgroundColor: '#0a66dc',
  color: '#ffffff',
  padding: '14px 28px',
  borderRadius: '10px',
  textDecoration: 'none',
  fontWeight: 600,
  fontSize: '15px',
  display: 'inline-block',
}
const hr: React.CSSProperties = {
  borderColor: '#e5e7eb',
  margin: '24px 0',
}
const subhead: React.CSSProperties = {
  fontSize: '14px',
  fontWeight: 600,
  color: '#0b1729',
  margin: '0 0 10px',
}
const pendingItem: React.CSSProperties = {
  fontSize: '14px',
  color: '#475569',
  margin: '4px 0',
  lineHeight: 1.5,
}
const footer: React.CSSProperties = {
  fontSize: '13px',
  color: '#64748b',
  margin: '0 0 6px',
}
const signoff: React.CSSProperties = {
  fontSize: '13px',
  color: '#64748b',
  fontStyle: 'italic',
  margin: 0,
}
