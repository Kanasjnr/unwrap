/** @jsxImportSource react */
import React from "react";

interface SendGiftCardEmailParams {
  to: string;
  redemptionCode: string;
  amount: string;
  sender: string;
  message?: string;
  template?: string;
}

export async function sendGiftCardEmail(params: SendGiftCardEmailParams) {
  try {
    const response = await fetch('/api/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to send email');
    }

    return await response.json();
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}
