"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Shield } from "lucide-react";
import { DataHandlingPolicy } from "./data-handling-policy";

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQCategory {
  title: string;
  items: FAQItem[];
}

const FAQ_DATA: FAQCategory[] = [
  {
    title: "Companion Issues",
    items: [
      {
        question: "The Companion isn't referencing the frameworks",
        answer:
          "Make sure you've uploaded all the framework files from the Project Kit to your Claude Project. If files are missing, the Companion won't have access to them. Try re-uploading the complete kit and starting a fresh conversation.",
      },
      {
        question: "I need to restart a day",
        answer:
          "You can start a new conversation in your Claude Project at any time. Just paste the appropriate day's conversation starter from the Project Kit. Your previous work won't carry over, so make sure you've saved any artifacts you want to keep.",
      },
      {
        question: "The Companion is inventing details instead of asking me",
        answer:
          'If the Companion is making assumptions, simply correct it. Say something like "That\'s not accurate—let me clarify..." and provide the correct information. The Companion should adapt to your corrections.',
      },
      {
        question: "I'm stuck and the Companion keeps pushing",
        answer:
          'It\'s okay to say "I\'m not sure about this" or "I need to think about this more." The Companion is designed to help you work through uncertainty. If you\'re truly stuck, note it as a question for the next live session.',
      },
    ],
  },
  {
    title: "Setup Issues",
    items: [
      {
        question: "I accidentally pasted the wrong conversation starter",
        answer:
          "Start a new conversation in your Claude Project and paste the correct conversation starter. Each day has its own starter in the Project Kit—make sure you're using the right one for your current day.",
      },
      {
        question: "Do I need a paid Claude account?",
        answer:
          "A paid Claude account (Pro or Team) is strongly recommended. It unlocks Projects, which are essential for conversation compaction and maintaining long-term context during the sprint. We also suggest using Opus 4.6 with extended thinking enabled to maximize your outcomes. You can sign up at claude.ai.",
      },
    ],
  },
  {
    title: "Work Issues",
    items: [
      {
        question: "I closed the chat and lost my work",
        answer:
          "This is why we emphasize saving to a Google Doc immediately! If you haven't saved, check if you can access your Claude conversation history. For future work, copy your artifacts to a document as soon as you complete them.",
      },
      {
        question: "I can't make a live session",
        answer:
          "Contact us as soon as possible using the Need Help button above. We'll work with you to find a solution, which may include watching a recording (if available) or rescheduling to a future cohort.",
      },
      {
        question: "I need more time to complete my work",
        answer:
          "Thursday is built in as a buffer day for exactly this reason. Use it to catch up. If you need more time beyond Thursday, let us know—but remember that Day 4 requires your completed artifacts for review.",
      },
    ],
  },
  {
    title: "Data & Privacy",
    items: [
      {
        question: "Is my Claude Project private?",
        answer:
          "Yes. Your Claude Project lives in your personal Claude account. Framework Friday cannot see, access, or retrieve anything inside it. The only work we see is what you submit through the deliverable form.",
      },
      {
        question: "Who sees my deliverable?",
        answer:
          "Only the Framework Friday sprint team: Fred Butson (Facilitator), Ali Asghar, Jebby, and Lucas Robinson. No one outside this team sees your work.",
      },
      {
        question: "How long do you keep my deliverables?",
        answer:
          "We retain deliverables for 30 days after your sprint ends, then delete them. If we ever want to keep your work longer, we'll ask you directly.",
      },
      {
        question: "What if my workflows contain sensitive info?",
        answer:
          "You're welcome to anonymize anything you're not comfortable sharing. Use role titles, generic descriptions, and placeholder names. It doesn't affect your grade — we evaluate your thinking, not your company details.",
      },
    ],
  },
];

export function TroubleshootingFAQ() {
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());
  const [policyOpen, setPolicyOpen] = useState(false);

  const toggleItem = (key: string) => {
    setOpenItems((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  return (
    <section className="mt-16">
      <h2 className="text-2xl font-bold text-center text-gray-900">
        Troubleshooting / FAQ
      </h2>

      <div className="mt-6 max-w-2xl mx-auto space-y-6">
        {FAQ_DATA.map((category) => (
          <div key={category.title}>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">
              {category.title}
            </h3>
            <div className="border border-gray-200 rounded-xl divide-y divide-gray-100 overflow-hidden">
              {category.items.map((item) => {
                const key = `${category.title}-${item.question}`;
                const isOpen = openItems.has(key);
                return (
                  <div key={key}>
                    <button
                      onClick={() => toggleItem(key)}
                      className="w-full flex items-center justify-between px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <span>{item.question}</span>
                      {isOpen ? (
                        <ChevronUp size={14} className="text-gray-400 flex-shrink-0 ml-2" />
                      ) : (
                        <ChevronDown size={14} className="text-gray-400 flex-shrink-0 ml-2" />
                      )}
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-3">
                        <p className="text-sm text-gray-600 leading-relaxed">
                          {item.answer}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Data handling policy link */}
        <div className="text-center">
          <button
            onClick={() => setPolicyOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition-colors cursor-pointer"
          >
            <Shield size={14} />
            View full data handling policy
          </button>
        </div>
      </div>

      <DataHandlingPolicy open={policyOpen} onClose={() => setPolicyOpen(false)} />
    </section>
  );
}
