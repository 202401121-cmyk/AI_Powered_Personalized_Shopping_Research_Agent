import type { Intent } from "@/types/contracts/Intent";

export interface IntakeSubmission {
  rawQuery: string;
  sessionId: string;
  selectedCategoryOption?: string;
  unclearTurnCount: number;
}

export interface IntakeResult {
  intent: Intent;
  sessionId: string;
  turnCount: number;
  isReadyForResearch: boolean;
}

export const EXAMPLE_REQUESTS = [
  "best laptop for coding under 70k, at least 16 GB RAM, not too heavy",
  "lightweight pram for a newborn suitable for city pavements",
  "wireless noise cancelling headphones for daily office commute under 15k",
];

export const DEFAULT_CLARIFICATION_OPTIONS = [
  "Kitchen appliance",
  "Phone",
  "Smartwatch",
  "Something else",
];

/**
 * Simulates the backend Stage 1 intake (US-01 / US-02) using shared contract shapes.
 * Follows US-01 acceptance criteria strictly.
 */
export async function processIntakeRequest({
  rawQuery,
  sessionId,
  selectedCategoryOption,
  unclearTurnCount,
}: IntakeSubmission): Promise<IntakeResult> {
  const trimmed = rawQuery.trim();
  const lower = trimmed.toLowerCase();

  // If a clarification button was clicked
  if (selectedCategoryOption) {
    if (selectedCategoryOption === "Something else") {
      // Still unclear -> show examples, never guess
      return {
        intent: {
          raw_query: trimmed,
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
        },
        sessionId,
        turnCount: unclearTurnCount + 1,
        isReadyForResearch: false,
      };
    }

    // User picked one of the suggested categories
    const categoryKey = selectedCategoryOption.toLowerCase().replace(/\s+/g, "_");
    return {
      intent: {
        raw_query: `${trimmed} (${selectedCategoryOption})`,
        category: categoryKey,
        category_label: selectedCategoryOption,
        use_case: null,
        budget: null,
        region: "IN",
        hard_rules: [],
        exclusions: [],
        needs_clarification: false,
        clarification_question: null,
        clarification_options: [],
        show_example_requests: false,
        detected_by: "rules",
      },
      sessionId,
      turnCount: 0,
      isReadyForResearch: true,
    };
  }

  // 1. Empty or whitespace-only input -> one clear follow-up question, not an error
  if (!trimmed) {
    return {
      intent: {
        raw_query: "",
        category: null,
        category_label: null,
        use_case: null,
        budget: null,
        region: "IN",
        hard_rules: [],
        exclusions: [],
        needs_clarification: true,
        clarification_question: "What kind of product are you looking for?",
        clarification_options: DEFAULT_CLARIFICATION_OPTIONS,
        show_example_requests: false,
        detected_by: "rules",
      },
      sessionId,
      turnCount: 1,
      isReadyForResearch: false,
    };
  }

  // 2. Already had an unclear turn and still unclear or off-topic -> show examples, never guess
  if (unclearTurnCount >= 1 && (lower === "something else" || lower.includes("anything") || lower.includes("idk") || lower.length < 4)) {
    return {
      intent: {
        raw_query: trimmed,
        category: null,
        category_label: null,
        use_case: null,
        budget: null,
        region: "IN",
        hard_rules: [],
        exclusions: [],
        needs_clarification: true,
        clarification_question: "We could not determine a product category. Take inspiration from these example requests:",
        clarification_options: [],
        show_example_requests: true,
        detected_by: "rules",
      },
      sessionId,
      turnCount: unclearTurnCount + 1,
      isReadyForResearch: false,
    };
  }

  // 3. Known product types detection
  if (lower.includes("laptop") || lower.includes("notebook") || lower.includes("macbook")) {
    return {
      intent: {
        raw_query: trimmed,
        category: "laptop",
        category_label: "Laptop",
        use_case: lower.includes("coding") ? "coding" : lower.includes("gaming") ? "gaming" : "general",
        budget: lower.includes("70k") || lower.includes("70000")
          ? { min: null, max: { amount: 70000.0, currency: "INR" } }
          : null,
        region: "IN",
        hard_rules: lower.includes("16 gb") || lower.includes("16gb")
          ? [
              {
                attribute: "ram_gb",
                operator: ">=",
                value: 16.0,
                unit: "GB",
                source_text: "at least 16 GB RAM",
              },
            ]
          : [],
        exclusions: lower.includes("no zenith")
          ? [
              {
                kind: "brand",
                value: "Zenith",
                always: false,
              },
            ]
          : [],
        needs_clarification: false,
        clarification_question: null,
        clarification_options: [],
        show_example_requests: false,
        detected_by: "llm",
      },
      sessionId,
      turnCount: 0,
      isReadyForResearch: true,
    };
  }

  if (lower.includes("pram") || lower.includes("stroller")) {
    return {
      intent: {
        raw_query: trimmed,
        category: "stroller",
        category_label: "Pram & Stroller",
        use_case: lower.includes("newborn") ? "newborn" : "travel",
        budget: null,
        region: "IN",
        hard_rules: [],
        exclusions: [],
        needs_clarification: false,
        clarification_question: null,
        clarification_options: [],
        show_example_requests: false,
        detected_by: "rules",
      },
      sessionId,
      turnCount: 0,
      isReadyForResearch: true,
    };
  }

  if (lower.includes("headphone") || lower.includes("earphone") || lower.includes("earbuds")) {
    return {
      intent: {
        raw_query: trimmed,
        category: "headphones",
        category_label: "Headphones",
        use_case: lower.includes("commute") ? "commute" : "general",
        budget: null,
        region: "IN",
        hard_rules: [],
        exclusions: [],
        needs_clarification: false,
        clarification_question: null,
        clarification_options: [],
        show_example_requests: false,
        detected_by: "rules",
      },
      sessionId,
      turnCount: 0,
      isReadyForResearch: true,
    };
  }

  // 4. Request with no product type (e.g., "something for my mom", "a gift for a friend")
  return {
    intent: {
      raw_query: trimmed,
      category: null,
      category_label: null,
      use_case: null,
      budget: null,
      region: "IN",
      hard_rules: [],
      exclusions: [],
      needs_clarification: true,
      clarification_question: "What kind of product are you looking for?",
      clarification_options: DEFAULT_CLARIFICATION_OPTIONS,
      show_example_requests: false,
      detected_by: "llm",
    },
    sessionId,
    turnCount: 1,
    isReadyForResearch: false,
  };
}
