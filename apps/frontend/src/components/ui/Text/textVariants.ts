import { cva } from "class-variance-authority";

export const textVariants = cva("text-foreground", {
  variants: {
    variant: {
      heading: "text-title-24 font-bold md:text-title-24",
      title: "text-title-16 font-semibold",
      body: "text-body-16 font-normal",
      caption: "text-body-12 font-normal",
      label: "text-body-14 font-medium"
    },
    size: {
      "title-32": "text-title-32",
      "title-24": "text-title-24",
      "title-20": "text-title-20",
      "title-16": "text-title-16",
      "body-20": "text-body-20",
      "body-16": "text-body-16",
      "body-14": "text-body-14",
      "body-12": "text-body-12"
    },
    weight: {
      regular: "font-normal",
      medium: "font-medium",
      semibold: "font-semibold",
      bold: "font-bold",
      extrabold: "font-extrabold"
    },
    tone: {
      default: "text-foreground",
      muted: "text-muted-foreground",
      danger: "text-danger",
      success: "text-success-foreground",
      primary: "text-primary"
    }
  },
  defaultVariants: {
    variant: "body",
    tone: "muted"
  }
});
