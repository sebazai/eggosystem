"use client";

import { clientApiFetch } from "@/lib/apiClient";
import type { NewsletterConsentType } from "@eggosystem/types";
import useSWR from "swr";

export type { NewsletterConsentType };

interface NewsletterRecipient {
  nickname: string;
  email: string;
}

export interface NewsletterRecipientsResult {
  count: number;
  players: NewsletterRecipient[];
}

export interface SendNewsletterPayload {
  season_id: number;
  subject: string;
  text_content?: string;
  html_content?: string;
  consent_type: NewsletterConsentType;
}

export interface SendNewsletterResult {
  enqueued: number;
  message?: string;
}

export const useNewsletterRecipients = (
  seasonId: string | null,
  consentType: NewsletterConsentType
) => {
  const key = seasonId
    ? `/api/v1/dashboard/newsletter/recipients?season_id=${seasonId}&consent_type=${consentType}`
    : null;

  const { data, error, isLoading } = useSWR<NewsletterRecipientsResult>(
    key,
    clientApiFetch,
    { revalidateOnFocus: false }
  );

  return {
    recipientsResult: data,
    isLoading,
    isError: error
  };
};

export const useSendNewsletter = () => {
  const sendNewsletter = async (
    payload: SendNewsletterPayload
  ): Promise<SendNewsletterResult> => {
    return await clientApiFetch<SendNewsletterResult>(
      "/api/v1/dashboard/newsletter/send",
      {
        method: "POST",
        body: JSON.stringify(payload)
      }
    );
  };

  return { sendNewsletter };
};
