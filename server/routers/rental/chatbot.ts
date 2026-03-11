import { z } from "zod";
import { publicProcedure, router } from "../../_core/trpc";
import { invokeLLM } from "../../_core/llm";

const OMIA_SYSTEM_PROMPT = `You are Omia, a friendly and professional AI assistant for KCO Properties. 
You help applicants complete their rental application step by step.
Keep responses concise (1-3 sentences), warm, and encouraging.
If asked about the application process, guide them through it.
If asked about KCO Properties, explain it's a property management company.
Never ask for sensitive information like SSN or passwords in chat.
Always be helpful, clear, and supportive.`;

export const chatbotRouter = router({
  // Get a contextual help message from Omia
  chat: publicProcedure
    .input(
      z.object({
        message: z.string().min(1).max(500),
        context: z.string().optional(), // Current step context
        history: z.array(z.object({
          role: z.enum(["user", "assistant"]),
          content: z.string(),
        })).optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
          { role: "system", content: OMIA_SYSTEM_PROMPT + (input.context ? `\n\nCurrent context: ${input.context}` : "") },
        ];

        // Add history
        if (input.history) {
          for (const h of input.history.slice(-6)) { // Keep last 6 messages
            messages.push({ role: h.role, content: h.content });
          }
        }

        messages.push({ role: "user", content: input.message });

        const response = await invokeLLM({ messages });
        const content = response.choices?.[0]?.message?.content || "I'm here to help! Please continue with your application.";

        return { message: content };
      } catch {
        return { message: "I'm here to help you complete your application. Please continue filling in the form fields." };
      }
    }),

  // Get a step-specific guidance message
  getStepGuidance: publicProcedure
    .input(z.object({ step: z.number(), fieldName: z.string().optional() }))
    .query(async ({ input }) => {
      const stepMessages: Record<number, string> = {
        1: "Welcome! I'm Omia. I'll guide you through your KCO Properties rental application. Let's get started!",
        2: "Let's create your account. You'll need a password with at least 10 characters and one number.",
        3: "Great! Now let's collect your personal information. I'll ask you questions one at a time.",
        4: "Now let's get information about your employment and income.",
        5: "Almost there! Let's add your emergency contact information.",
        6: "We're almost done! Please review the rental agreement and sign below.",
        7: "Congratulations! Your application has been submitted successfully.",
      };

      return { message: stepMessages[input.step] || "Please continue with your application." };
    }),
});
