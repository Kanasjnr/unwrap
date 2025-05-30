/** @jsxImportSource react */
import { NextResponse } from "next/server";
import { Resend } from "resend";
import * as React from "react";
import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Hr,
  Link,
} from "@react-email/components";

if (!process.env.RESEND_API_KEY) {
  throw new Error(
    "Please define the RESEND_API_KEY environment variable inside .env"
  );
}

const resend = new Resend(process.env.RESEND_API_KEY);

interface EmailTemplateProps {
  redemptionCode: string;
  amount: string;
  sender: string;
  message?: string;
}

const GiftCardEmail: React.FC<EmailTemplateProps> = ({
  redemptionCode,
  amount,
  sender,
  message,
}) => {
  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: "Arial, sans-serif", lineHeight: "1.6" }}>
        <Container
          style={{ maxWidth: "600px", margin: "0 auto", padding: "20px" }}
        >
          <Section>
            <Text
              style={{
                fontSize: "24px",
                fontWeight: "bold",
                color: "#142.1 76.2% 36.3%",
              }}
            >
              You received a cUSD Gift Card! 🎁
            </Text>
            <Text style={{ fontSize: "16px" }}>
              Someone sent you {amount} cUSD as a gift card.
            </Text>
            {message && (
              <Text
                style={{
                  fontSize: "16px",
                  fontStyle: "italic",
                  margin: "20px 0",
                }}
              >
                &ldquo;{message}&rdquo;
              </Text>
            )}
            <Text
              style={{
                fontSize: "16px",
                fontWeight: "bold",
                marginTop: "20px",
              }}
            >
              To redeem your gift card:
            </Text>
            <ol style={{ fontSize: "16px", paddingLeft: "20px" }}>
              <li>
                Visit{" "}
                <Link href={`${process.env.NEXT_PUBLIC_APP_URL}/redeem`}>
                  {process.env.NEXT_PUBLIC_APP_URL}/redeem
                </Link>
              </li>
              <li>Connect your wallet</li>
              <li>
                Enter your redemption code: <strong>{redemptionCode}</strong>
              </li>
            </ol>
            <Text
              style={{ fontSize: "14px", color: "#666", marginTop: "20px" }}
            >
              This gift card will expire in 30 days.
            </Text>
            <Hr style={{ margin: "20px 0" }} />
            <Text style={{ fontSize: "14px", color: "#666" }}>
              Sent by: {sender}
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

const BirthdayEmail: React.FC<EmailTemplateProps> = ({
  redemptionCode,
  amount,
  sender,
  message,
}) => {
  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: "Arial, sans-serif", lineHeight: "1.6" }}>
        <Container
          style={{ maxWidth: "600px", margin: "0 auto", padding: "20px" }}
        >
          <Section>
            <Text
              style={{
                fontSize: "24px",
                fontWeight: "bold",
                color: "#142.1 76.2% 36.3%",
              }}
            >
              Happy Birthday! 🎂
            </Text>
            <Text style={{ fontSize: "16px" }}>
              You&rsquo;ve received a special birthday gift of {amount} cUSD!
            </Text>
            {message && (
              <Text
                style={{
                  fontSize: "16px",
                  fontStyle: "italic",
                  margin: "20px 0",
                }}
              >
                &ldquo;{message}&rdquo;
              </Text>
            )}
            <Text
              style={{
                fontSize: "16px",
                fontWeight: "bold",
                marginTop: "20px",
              }}
            >
              To redeem your gift card:
            </Text>
            <ol style={{ fontSize: "16px", paddingLeft: "20px" }}>
              <li>
                Visit{" "}
                <Link href={`${process.env.NEXT_PUBLIC_APP_URL}/redeem`}>
                  {process.env.NEXT_PUBLIC_APP_URL}/redeem
                </Link>
              </li>
              <li>Connect your wallet</li>
              <li>
                Enter your redemption code: <strong>{redemptionCode}</strong>
              </li>
            </ol>
            <Text
              style={{ fontSize: "14px", color: "#666", marginTop: "20px" }}
            >
              This gift card will expire in 30 days.
            </Text>
            <Hr style={{ margin: "20px 0" }} />
            <Text style={{ fontSize: "14px", color: "#666" }}>
              Sent by: {sender}
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

const HolidayEmail: React.FC<EmailTemplateProps> = ({
  redemptionCode,
  amount,
  sender,
  message,
}) => {
  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: "Arial, sans-serif", lineHeight: "1.6" }}>
        <Container
          style={{ maxWidth: "600px", margin: "0 auto", padding: "20px" }}
        >
          <Section>
            <Text
              style={{
                fontSize: "24px",
                fontWeight: "bold",
                color: "#142.1 76.2% 36.3%",
              }}
            >
              Season&rsquo;s Greetings! 🎄
            </Text>
            <Text style={{ fontSize: "16px" }}>
              You&rsquo;ve received a holiday gift of {amount} cUSD!
            </Text>
            {message && (
              <Text
                style={{
                  fontSize: "16px",
                  fontStyle: "italic",
                  margin: "20px 0",
                }}
              >
                &ldquo;{message}&rdquo;
              </Text>
            )}
            <Text
              style={{
                fontSize: "16px",
                fontWeight: "bold",
                marginTop: "20px",
              }}
            >
              To redeem your gift card:
            </Text>
            <ol style={{ fontSize: "16px", paddingLeft: "20px" }}>
              <li>
                Visit{" "}
                <Link href={`${process.env.NEXT_PUBLIC_APP_URL}/redeem`}>
                  {process.env.NEXT_PUBLIC_APP_URL}/redeem
                </Link>
              </li>
              <li>Connect your wallet</li>
              <li>
                Enter your redemption code: <strong>{redemptionCode}</strong>
              </li>
            </ol>
            <Text
              style={{ fontSize: "14px", color: "#666", marginTop: "20px" }}
            >
              This gift card will expire in 30 days.
            </Text>
            <Hr style={{ margin: "20px 0" }} />
            <Text style={{ fontSize: "14px", color: "#666" }}>
              Sent by: {sender}
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

const templates = {
  default: GiftCardEmail,
  birthday: BirthdayEmail,
  holiday: HolidayEmail,
};

interface SendEmailRequest {
  to: string;
  redemptionCode: string;
  amount: string;
  sender: string;
  message?: string;
  template?: keyof typeof templates;
}

export async function POST(req: Request) {
  try {
    const {
      to,
      redemptionCode,
      amount,
      sender,
      message,
      template = "default",
    } = (await req.json()) as SendEmailRequest;

    if (!to || !redemptionCode || !amount || !sender) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const EmailTemplate = templates[template] || templates.default;

    const { data, error } = await resend.emails.send({
      from: "Unwrap <onboarding@resend.dev>",
      to,
      subject:
        template === "birthday"
          ? "Happy Birthday! 🎂 Your cUSD Gift Card is here!"
          : template === "holiday"
          ? "Season's Greetings! 🎄 Your cUSD Gift Card is here!"
          : "You received a cUSD Gift Card! 🎁",
      react: EmailTemplate({
        redemptionCode,
        amount,
        sender,
        message,
      }),
    });

    if (error) {
      console.error("Error sending email:", error);
      return NextResponse.json(
        { error: "Failed to send email" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error sending email:", error);
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 }
    );
  }
}
