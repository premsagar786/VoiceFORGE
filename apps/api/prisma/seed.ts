import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { AgentConfigSchema } from "@voiceforge/shared";
import { DEMO_PRICE_LIST_PDF_LINES, buildPriceListPdf } from "../src/lib/demo-pdf.js";
import { validateEnv } from "../src/env.js";

const prisma = new PrismaClient();

const DEMO_EMAIL = "demo@voiceforge.app";
const DEMO_PASSWORD = "voiceforge-demo";

const dentalConfig = AgentConfigSchema.parse({
  name: "Bright Smile Receptionist",
  persona: {
    role: "Front-desk receptionist at Bright Smile Dental Clinic in Delhi",
    tone: "friendly, warm and patient",
  },
  goals: [
    "Answer questions about treatments and prices using the knowledge base",
    "Book appointments by collecting the caller's name and preferred time",
    "Share clinic timings and address when asked",
  ],
  conversationFlow: [
    { id: "step-1", step: "Greet the caller and introduce the clinic" },
    { id: "step-2", step: "Ask what treatment they are interested in" },
    { id: "step-3", step: "Answer questions using the knowledge base" },
    { id: "step-4", step: "Offer to book an appointment; collect name and preferred time" },
    { id: "step-5", step: "Confirm the booking and close the call politely" },
  ],
  firstMessage: "Hello! Thank you for calling Bright Smile Dental. How can I help you today?",
  guardrails: {
    do: [
      "Answer price questions only from the knowledge base",
      "Repeat appointment details back before booking",
    ],
    dont: [
      "Never invent prices or availability",
      "Never give medical advice beyond general clinic information",
      "Never share any personal data of staff members",
    ],
  },
  languages: ["en", "hi"],
  // Published ElevenLabs prebuilt voice; verified against the voices API in Step 3/5.
  // https://elevenlabs.io/docs/api-reference/voices
  voice: {
    voiceId: process.env.ELEVENLABS_DEFAULT_VOICE_ID ?? "EXAVITQu4vr4xnSDxMaL",
    name: "Sarah",
  },
  tools: ["knowledge_search", "check_calendar", "book_slot", "transfer_to_human"],
  escalationRule:
    "If the caller is angry, asks for a human, or requests something outside the clinic's services, politely offer to transfer them to the clinic manager.",
  maxCallSeconds: 300,
});

async function main() {
  const env = validateEnv(process.env);

  // ── Workspace + demo user ──────────────────────────────────────────────
  const workspace =
    (await prisma.workspace.findFirst({ where: { name: "Demo Workspace" } })) ??
    (await prisma.workspace.create({ data: { name: "Demo Workspace" } }));

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  await prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    update: { passwordHash },
    create: { email: DEMO_EMAIL, passwordHash, name: "Demo User", workspaceId: workspace.id },
  });

  // ── Sample dental agent (version 1) ────────────────────────────────────
  const agentName = dentalConfig.name;
  let agent = await prisma.agent.findFirst({
    where: { workspaceId: workspace.id, name: agentName },
  });

  if (!agent) {
    const version = await prisma.agentVersion.create({
      data: {
        agent: {
          create: {
            workspaceId: workspace.id,
            name: agentName,
            description: "Demo dental clinic receptionist agent",
            status: "draft",
          },
        },
        version: 1,
        config: dentalConfig,
        changeSummary: "Seed: initial dental receptionist configuration",
      },
      include: { agent: true },
    });
    agent = version.agent;
    await prisma.agent.update({
      where: { id: agent.id },
      data: { currentVersionId: version.id },
    });
  }

  // ── Demo knowledge doc: dental price list PDF ──────────────────────────
  const uploadDir = path.resolve(process.cwd(), env.UPLOAD_DIR);
  fs.mkdirSync(uploadDir, { recursive: true });
  const pdfPath = path.join(uploadDir, "dental-price-list.pdf");
  if (!fs.existsSync(pdfPath)) {
    fs.writeFileSync(pdfPath, buildPriceListPdf(DEMO_PRICE_LIST_PDF_LINES));
  }
  const sizeBytes = fs.statSync(pdfPath).size;

  const existingDoc = await prisma.knowledgeDoc.findFirst({
    where: { agentId: agent.id, filename: "dental-price-list.pdf" },
  });
  if (!existingDoc) {
    // Stays "processing" until the Step 7 ingestion pipeline (extract → chunk →
    // embed) runs over it; the pipeline is responsible for flipping it to ready.
    await prisma.knowledgeDoc.create({
      data: {
        agentId: agent.id,
        filename: "dental-price-list.pdf",
        mimeType: "application/pdf",
        sizeBytes,
        status: "processing",
      },
    });
  }

  console.log("Seed complete:");
  console.log(`  workspace : ${workspace.id}`);
  console.log(`  login     : ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
  console.log(`  agent     : ${agent.name} (${agent.id})`);
  console.log(`  price pdf : ${pdfPath}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
