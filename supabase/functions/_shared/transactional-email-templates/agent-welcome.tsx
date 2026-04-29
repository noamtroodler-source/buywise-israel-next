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

interface AgentWelcomeProps {
  agentName?: string
  agencyName?: string
  setupUrl?: string
}

const AgentWelcomeEmail = ({
  agentName,
  agencyName,
  setupUrl,
}: AgentWelcomeProps) => {
  const greeting = agentName ? `Hi ${agentName},` : 'Hi there,'
  const safeSetupUrl = setupUrl || 'https://buywiseisrael.com'
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>
        Your {SITE_NAME} agent account is ready
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Your agent account is ready 🎉</Heading>
          <Text style={text}>{greeting}</Text>
          <Text style={text}>
            <strong>{agencyName || 'Your agency'}</strong> has set you up
            on {SITE_NAME}, the trusted platform connecting international
            buyers with Israeli real estate professionals.
          </Text>
          <Text style={text}>
            Click below to set your password and start managing your listings,
            leads, and profile.
          </Text>

          <Section style={ctaSection}>
            <Button style={button} href={safeSetupUrl}>
              Set your password
            </Button>
          </Section>

          <Hr style={hr} />
          <Text style={subhead}>What's waiting for you:</Text>
          <Text style={item}>• Your agent profile, ready to publish</Text>
          <Text style={item}>• Listings already assigned to you</Text>
          <Text style={item}>• Lead inbox for buyer inquiries</Text>

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
  component: AgentWelcomeEmail,
  subject: `Your ${SITE_NAME} agent account is ready`,
  displayName: 'Agent welcome',
  previewData: {
    agentName: 'Sarah',
    agencyName: 'Jerusalem Real Estate',
    setupUrl: 'https://buywiseisrael.com/auth/setup-password?token=preview',
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
const ctaSection: React.CSSProperties = { textAlign: 'center', margin: '28px 0' }
const button: React.CSSProperties = {
  backgroundColor: '#0a66dc',
  color: '#ffffff',
  padding: '14px 28px',
  borderRadius: '8px',
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
const item: React.CSSProperties = {
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
