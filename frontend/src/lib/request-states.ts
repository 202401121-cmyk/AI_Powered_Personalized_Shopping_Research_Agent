import type { Intent } from "@/types/contracts/Intent";
import { EXAMPLE_REQUESTS } from "@/lib/mock-intake";

export type ScreenLetter = "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H" | "I" | "J";

export const SCREEN_STATES: { id: ScreenLetter; label: string }[] = [
  { id: "A", label: "Idle" },
  { id: "B", label: "Typing" },
  { id: "C", label: "Submitting" },
  { id: "D", label: "Product type follow-up" },
  { id: "E", label: "Watch follow-up" },
  { id: "F", label: "Still unclear" },
  { id: "G", label: "Understood" },
  { id: "H", label: "Edit budget" },
  { id: "I", label: "Inline error" },
  { id: "J", label: "Over limit" },
];

export const TYPING_SAMPLE =
  "gaming laptop under 80k, at least 16 GB RAM, not too heavy";

export const MOM_SAMPLE = "something for my mom";
export const WATCH_SAMPLE = "a watch under 10k";
export const OVER_LIMIT_SAMPLE = `${"best laptop for coding under 70k, ".repeat(40)}extra`;

export const UNDERSTOOD_LAPTOP_INTENT: Intent = {
  raw_query: TYPING_SAMPLE,
  category: "laptop",
  category_label: "Laptop",
  use_case: "gaming",
  budget: { min: null, max: { amount: 80000, currency: "INR" } },
  region: "IN",
  hard_rules: [
    {
      attribute: "ram_gb",
      operator: ">=",
      value: 16.0,
      unit: "GB",
      source_text: "at least 16 GB RAM",
    },
  ],
  exclusions: [],
  needs_clarification: false,
  clarification_question: null,
  clarification_options: [],
  show_example_requests: false,
  detected_by: "rules",
};

export const PRODUCT_TYPE_INTENT: Intent = {
  raw_query: MOM_SAMPLE,
  category: null,
  category_label: null,
  use_case: null,
  budget: null,
  region: "IN",
  hard_rules: [],
  exclusions: [],
  needs_clarification: true,
  clarification_question: "What kind of product are you looking for?",
  clarification_options: ["Kitchen appliance", "Phone", "Smartwatch", "Something else"],
  show_example_requests: false,
  detected_by: "llm",
};

export const WATCH_INTENT: Intent = {
  raw_query: WATCH_SAMPLE,
  category: null,
  category_label: null,
  use_case: null,
  budget: { min: null, max: { amount: 10000, currency: "INR" } },
  region: "IN",
  hard_rules: [],
  exclusions: [],
  needs_clarification: true,
  clarification_question: "Did you mean a wristwatch, a smartwatch, or a fitness tracker?",
  clarification_options: ["Wristwatch", "Smartwatch", "Fitness tracker", "Something else"],
  show_example_requests: false,
  detected_by: "rules",
};

export const UNCLEAR_INTENT: Intent = {
  raw_query: MOM_SAMPLE,
  category: null,
  category_label: null,
  use_case: null,
  budget: null,
  region: "IN",
  hard_rules: [],
  exclusions: [],
  needs_clarification: true,
  clarification_question: "Here are a few example requests to help you get started:",
  clarification_options: [],
  show_example_requests: true,
  detected_by: "rules",
};

export const EXAMPLE_REQUEST_LIST = EXAMPLE_REQUESTS;

export const MAX_REQUEST_CHARS = 1000;
export const SUBMIT_DELAY_MS = 450;
