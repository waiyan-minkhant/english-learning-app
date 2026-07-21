"use client";

import { Button, Text } from "@/components/ui";

const DEVELOPER_NAME = "Wai Yan Min Khant";
const DEVELOPER_EMAIL = "waiyanminkhant49@gmail.com";
const DESIGNER_NAME = "Aung Moe Thant";
const DESIGNER_EMAIL = "khukhu1440@gmail.com";

type DemoCompleteContentProps = {
  onFinish: () => void;
  disabled?: boolean;
};

export function DemoCompleteContent({
  onFinish,
  disabled
}: DemoCompleteContentProps) {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col items-center gap-8 pt-6 text-center">
      <Text
        variant="heading"
        size="title-20"
        tone="primary"
        weight="bold"
        as="h2"
      >
        Thank you for testing our demo
      </Text>

      <Text variant="body" size="body-16" tone="default" className="text-balance">
        If you&apos;d like to work with our developer, please contact{" "}
        <span className="font-semibold text-foreground">{DEVELOPER_NAME}</span>{" "}
        (
        <a
          href={`mailto:${DEVELOPER_EMAIL}`}
          className="text-primary underline underline-offset-2"
        >
          {DEVELOPER_EMAIL}
        </a>
        ). If you&apos;d like to work with our designer, please contact{" "}
        <span className="font-semibold text-foreground">{DESIGNER_NAME}</span>{" "}
        (
        <a
          href={`mailto:${DESIGNER_EMAIL}`}
          className="text-primary underline underline-offset-2"
        >
          {DESIGNER_EMAIL}
        </a>
        ).
      </Text>

      <Button
        type="button"
        onClick={onFinish}
        disabled={disabled}
        className="min-w-[12rem]"
      >
        Back to lessons
      </Button>
    </div>
  );
}
