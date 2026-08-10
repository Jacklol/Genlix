import type { Metadata } from "next";

import { TextArticleLayout } from "@/components/TextArticleLayout";
import { privacyPolicy } from "@/lib/privacy";

export const metadata: Metadata = {
  title: "Политика конфиденциальности — Genlix",
  description: privacyPolicy.description,
};

export default function PrivacyPage() {
  return (
    <TextArticleLayout
      breadcrumbs={[
        { label: "Главная", href: "/" },
        { label: privacyPolicy.title },
      ]}
      content={privacyPolicy.content}
      date={privacyPolicy.date}
      dateTime={privacyPolicy.dateTime}
      description={privacyPolicy.description}
      showSubscribe={false}
      tag={privacyPolicy.tag}
      title={privacyPolicy.title}
    />
  );
}
