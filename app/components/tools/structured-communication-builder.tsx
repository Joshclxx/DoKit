"use client";

import { useState, useMemo } from "react";
import { copyToClipboard, downloadFile } from "@/lib/utils/download";

type Tone = "formal" | "professional" | "casual" | "friendly";
type CommType = "follow-up" | "inquiry" | "reminder" | "cover-letter" | "thank-you" | "introduction";

interface Template {
  type: CommType;
  label: string;
  icon: string;
  fields: string[];
  templates: Record<Tone, string>;
}

const templates: Template[] = [
  {
    type: "follow-up",
    label: "Follow-Up",
    icon: "📬",
    fields: ["recipientName", "subject", "previousDate", "keyPoint"],
    templates: {
      formal: "Dear {recipientName},\n\nI am writing to follow up on our discussion regarding {subject} on {previousDate}.\n\nAs discussed, {keyPoint}. I would appreciate the opportunity to continue our conversation and address any outstanding items.\n\nPlease let me know your availability at your earliest convenience.\n\nYours sincerely,\n[Your Name]",
      professional: "Hi {recipientName},\n\nI wanted to follow up on our conversation about {subject} from {previousDate}.\n\nTo recap, {keyPoint}. I'd love to keep the momentum going and discuss next steps.\n\nLooking forward to hearing from you.\n\nBest regards,\n[Your Name]",
      casual: "Hey {recipientName},\n\nJust circling back on {subject} from {previousDate}.\n\nQuick reminder: {keyPoint}. Let me know if you have any updates or if there's anything I can help with.\n\nCheers,\n[Your Name]",
      friendly: "Hi {recipientName}! 👋\n\nHope you're doing well! I wanted to touch base about {subject} — we last chatted on {previousDate}.\n\nJust a heads up: {keyPoint}. No rush at all, just whenever you get a chance!\n\nTalk soon,\n[Your Name]",
    },
  },
  {
    type: "inquiry",
    label: "Inquiry",
    icon: "❓",
    fields: ["recipientName", "company", "topic", "specificQuestion"],
    templates: {
      formal: "Dear {recipientName},\n\nI am writing to inquire about {topic} at {company}.\n\n{specificQuestion}\n\nI would be most grateful for any information you could provide. Please do not hesitate to contact me should you require any further details.\n\nYours faithfully,\n[Your Name]",
      professional: "Hi {recipientName},\n\nI'm reaching out to learn more about {topic} at {company}.\n\n{specificQuestion}\n\nAny information you can share would be greatly appreciated.\n\nBest regards,\n[Your Name]",
      casual: "Hey {recipientName},\n\nI'm curious about {topic} at {company}.\n\n{specificQuestion}\n\nWould love to hear back when you get a chance.\n\nThanks,\n[Your Name]",
      friendly: "Hi {recipientName}! 😊\n\nI've been looking into {topic} at {company} and had a quick question.\n\n{specificQuestion}\n\nTotally understand if it takes a bit to get back — no pressure!\n\nThanks so much,\n[Your Name]",
    },
  },
  {
    type: "reminder",
    label: "Reminder",
    icon: "⏰",
    fields: ["recipientName", "task", "deadline", "context"],
    templates: {
      formal: "Dear {recipientName},\n\nThis is a courteous reminder regarding {task}, which is due by {deadline}.\n\n{context}\n\nKindly ensure this is completed by the specified date. Should you require any assistance, please do not hesitate to reach out.\n\nBest regards,\n[Your Name]",
      professional: "Hi {recipientName},\n\nJust a friendly reminder that {task} is due by {deadline}.\n\n{context}\n\nPlease let me know if you have any questions or need support.\n\nThanks,\n[Your Name]",
      casual: "Hey {recipientName},\n\nQuick reminder — {task} is due {deadline}.\n\n{context}\n\nLet me know if you need anything!\n\nCheers,\n[Your Name]",
      friendly: "Hi {recipientName}! ⏰\n\nJust a gentle nudge about {task} — the deadline is {deadline}.\n\n{context}\n\nNo worries if you need more time, just give me a heads up!\n\nThanks,\n[Your Name]",
    },
  },
  {
    type: "cover-letter",
    label: "Cover Letter",
    icon: "📝",
    fields: ["recipientName", "company", "role", "keySkill", "achievement"],
    templates: {
      formal: "Dear {recipientName},\n\nI am writing to express my keen interest in the {role} position at {company}.\n\nWith my expertise in {keySkill}, I am confident in my ability to contribute meaningfully to your team. {achievement}\n\nI would welcome the opportunity to discuss how my background aligns with your needs.\n\nYours sincerely,\n[Your Name]",
      professional: "Hi {recipientName},\n\nI'm excited to apply for the {role} position at {company}.\n\nMy background in {keySkill} has prepared me well for this role. {achievement}\n\nI'd love the chance to discuss how I can contribute to your team.\n\nBest regards,\n[Your Name]",
      casual: "Hey {recipientName},\n\nI saw the {role} opening at {company} and it looks like a great fit.\n\nI bring strong {keySkill} skills to the table. {achievement}\n\nWould love to chat more about it.\n\nCheers,\n[Your Name]",
      friendly: "Hi {recipientName}! 🙌\n\nI came across the {role} role at {company} and got really excited!\n\nI'm passionate about {keySkill} and think I could bring real value. {achievement}\n\nWould be awesome to connect and learn more!\n\nWarmly,\n[Your Name]",
    },
  },
  {
    type: "thank-you",
    label: "Thank You",
    icon: "🙏",
    fields: ["recipientName", "occasion", "specificThanks"],
    templates: {
      formal: "Dear {recipientName},\n\nI wish to extend my sincere gratitude for {occasion}.\n\n{specificThanks}\n\nYour generosity and support are truly appreciated.\n\nWith warm regards,\n[Your Name]",
      professional: "Hi {recipientName},\n\nThank you so much for {occasion}.\n\n{specificThanks}\n\nI really appreciate your time and support.\n\nBest regards,\n[Your Name]",
      casual: "Hey {recipientName},\n\nThanks for {occasion}!\n\n{specificThanks}\n\nReally appreciate it.\n\nCheers,\n[Your Name]",
      friendly: "Hi {recipientName}! 💛\n\nJust wanted to say a big THANK YOU for {occasion}!\n\n{specificThanks}\n\nYou're the best!\n\nWith gratitude,\n[Your Name]",
    },
  },
  {
    type: "introduction",
    label: "Introduction",
    icon: "👋",
    fields: ["recipientName", "yourRole", "company", "purpose"],
    templates: {
      formal: "Dear {recipientName},\n\nAllow me to introduce myself. I am [Your Name], {yourRole} at {company}.\n\n{purpose}\n\nI look forward to the possibility of working together.\n\nYours sincerely,\n[Your Name]",
      professional: "Hi {recipientName},\n\nI'm [Your Name], {yourRole} at {company}.\n\n{purpose}\n\nI'd love to connect and explore potential collaboration.\n\nBest regards,\n[Your Name]",
      casual: "Hey {recipientName},\n\nI'm [Your Name] — {yourRole} at {company}.\n\n{purpose}\n\nLet's chat sometime!\n\nCheers,\n[Your Name]",
      friendly: "Hi {recipientName}! 👋\n\nI'm [Your Name], and I'm a {yourRole} at {company}.\n\n{purpose}\n\nWould love to get to know you better — let's connect!\n\nWarmly,\n[Your Name]",
    },
  },
];

const tones: { value: Tone; label: string }[] = [
  { value: "formal", label: "🎩 Formal" },
  { value: "professional", label: "💼 Professional" },
  { value: "casual", label: "☕ Casual" },
  { value: "friendly", label: "😊 Friendly" },
];

const fieldLabels: Record<string, string> = {
  recipientName: "Recipient Name",
  subject: "Subject",
  previousDate: "Previous Date",
  keyPoint: "Key Point",
  company: "Company",
  topic: "Topic",
  specificQuestion: "Your Question",
  task: "Task",
  deadline: "Deadline",
  context: "Context",
  role: "Role / Position",
  keySkill: "Key Skill",
  achievement: "Notable Achievement",
  occasion: "Occasion",
  specificThanks: "Specific Thanks",
  yourRole: "Your Role",
  purpose: "Purpose",
};

export default function StructuredCommunicationBuilder() {
  const [selectedType, setSelectedType] = useState<CommType>("follow-up");
  const [tone, setTone] = useState<Tone>("professional");
  const [fields, setFields] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState(false);

  const template = templates.find((t) => t.type === selectedType)!;

  const output = useMemo(() => {
    let text = template.templates[tone];
    for (const field of template.fields) {
      const value = fields[field]?.trim() || `[${fieldLabels[field] || field}]`;
      text = text.replaceAll(`{${field}}`, value);
    }
    return text;
  }, [template, tone, fields]);

  const handleCopy = async () => {
    await copyToClipboard(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Type selector */}
      <div>
        <label className="mb-2 block text-sm font-medium text-muted">Communication Type</label>
        <div className="flex flex-wrap gap-2">
          {templates.map((t) => (
            <button
              key={t.type}
              onClick={() => { setSelectedType(t.type); setFields({}); }}
              className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                selectedType === t.type
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-border bg-surface text-muted hover:text-foreground hover:border-border-hover"
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tone selector */}
      <div>
        <label className="mb-2 block text-sm font-medium text-muted">Tone</label>
        <div className="flex flex-wrap gap-2">
          {tones.map((t) => (
            <button
              key={t.value}
              onClick={() => setTone(t.value)}
              className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                tone === t.value
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-border bg-surface text-muted hover:text-foreground hover:border-border-hover"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Field inputs */}
      <div className="grid gap-4 sm:grid-cols-2">
        {template.fields.map((field) => (
          <div key={field}>
            <label className="mb-1 block text-sm font-medium text-muted">
              {fieldLabels[field] || field}
            </label>
            {field.includes("Question") || field.includes("Thanks") || field === "context" || field === "achievement" || field === "purpose" || field === "keyPoint" ? (
              <textarea
                value={fields[field] || ""}
                onChange={(e) => setFields((f) => ({ ...f, [field]: e.target.value }))}
                placeholder={`Enter ${(fieldLabels[field] || field).toLowerCase()}…`}
                rows={3}
                className="w-full rounded-lg border border-border bg-surface p-3 text-sm transition-colors focus:border-accent focus:outline-none resize-y"
              />
            ) : (
              <input
                type="text"
                value={fields[field] || ""}
                onChange={(e) => setFields((f) => ({ ...f, [field]: e.target.value }))}
                placeholder={`Enter ${(fieldLabels[field] || field).toLowerCase()}…`}
                className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm transition-colors focus:border-accent focus:outline-none"
              />
            )}
          </div>
        ))}
      </div>

      {/* Output preview */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <label className="text-sm font-medium text-muted">Generated Output</label>
          <div className="flex gap-2">
            <button onClick={handleCopy}
              className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm font-medium transition-colors hover:bg-surface-hover">
              {copied ? "✓ Copied" : "Copy"}
            </button>
            <button onClick={() => downloadFile(output, `${selectedType}.txt`)}
              className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm font-medium transition-colors hover:bg-surface-hover">
              Export .txt
            </button>
          </div>
        </div>
        <div className="whitespace-pre-wrap rounded-lg border border-border bg-surface p-4 text-sm leading-relaxed">
          {output}
        </div>
      </div>
    </div>
  );
}
