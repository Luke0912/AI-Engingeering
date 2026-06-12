import { z } from 'zod';

// Sub-schema: Ticket Classification
export const TicketCategory = z.enum([
  'SALES_LEAD',
  'SUPPORT_ISSUE',
  'BILLING_INQUIRY',
  'JOB_APPLICATION',
  'SPAM_OR_AUTO_REPLY'
]);

// Sub-schema: Urgency Level
export const UrgencyLevel = z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);

// Main schema we will pass to OpenAI
export const EmailExtractionSchema = z.object({
  category: TicketCategory,
  urgency: UrgencyLevel,
  summary: z.string().describe('A concise one-sentence summary of the email context.'),
  senderName: z.string().nullable().describe('The identified name of the sender, or null if unknown.'),
  companyName: z.string().nullable().describe('The organization or company the sender represents.'),
  keyDetails: z.array(z.string()).describe('An array of bullet points containing critical parameters (dates, invoice numbers, dollar values).'),
  sentimentScore: z.number().min(0).max(100).describe('An index from 0 (extremely angry/complaining) to 100 (extremely happy/enthusiastic).'),
  suggestedActionItems: z.array(z.object({
    assignee: z.string().describe('Role or department responsible (e.g. Finance, Dev Team, Sales Agent).'),
    task: z.string().describe('The specific action to perform.')
  })).describe('Actionable tasks derived from the content.')
}).required();

// Compile typescript type from Zod
export type EmailExtraction = z.infer<typeof EmailExtractionSchema>;
