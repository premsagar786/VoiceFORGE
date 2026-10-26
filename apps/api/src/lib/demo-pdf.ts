/**
 * Generates a small, valid, uncompressed PDF (PDF 1.4, Helvetica, plain text)
 * for the demo knowledge base. Avoids committing a binary asset and gives the
 * knowledge ingestion pipeline (Step 7) a real PDF to parse.
 */

const PDF_LINES = [
  "Bright Smile Dental Clinic - Price List (effective January 2026)",
  "Consultation: Rs. 500",
  "Teeth Cleaning (Scaling & Polishing): Rs. 1200",
  "Tooth Filling (Composite): Rs. 1800 to Rs. 2500",
  "Root Canal Treatment: Rs. 4500 to Rs. 6500",
  "Tooth Extraction (Simple): Rs. 1200",
  "Wisdom Tooth Removal (Surgical): Rs. 4500",
  "Teeth Whitening (In-office): Rs. 8000",
  "Braces (Metal): Rs. 35000 onwards",
  "Braces (Ceramic): Rs. 55000 onwards",
  "Dental Implant (per tooth): Rs. 30000",
  "Crown (Zirconia): Rs. 9000",
  "Emergency walk-ins: same-day slots available",
  "Timings: Mon to Sat 10am to 8pm, Sunday closed",
  "Address: Shop 4, Ring Road Market, New Delhi",
  "Phone: +91 98765 43210",
];

function escapePdfText(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

export function buildPriceListPdf(lines: string[] = PDF_LINES): Buffer {
  const [title, ...body] = lines;

  let y = 720;
  const parts: string[] = ["BT", "/F1 16 Tf", `72 ${y} Td`, `(${escapePdfText(title)}) Tj`];
  y -= 30;
  for (const line of body) {
    parts.push("/F1 11 Tf", `72 ${y} Td`, `(${escapePdfText(line)}) Tj`);
    y -= 18;
  }
  parts.push("ET");
  const content = parts.join("\n");

  const objects: string[] = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
    `<< /Length ${Buffer.byteLength(content, "latin1")} >>\nstream\n${content}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];

  const chunks: string[] = ["%PDF-1.4\n"];
  const offsets: number[] = [];
  let pos = Buffer.byteLength(chunks[0], "latin1");

  objects.forEach((bodyText, i) => {
    const obj = `${i + 1} 0 obj\n${bodyText}\nendobj\n`;
    offsets.push(pos);
    chunks.push(obj);
    pos += Buffer.byteLength(obj, "latin1");
  });

  const xrefOffset = pos;
  let xref = `xref\n0 ${objects.length + 1}\n`;
  xref += "0000000000 65535 f \n";
  for (const off of offsets) {
    xref += `${off.toString().padStart(10, "0")} 00000 n \n`;
  }
  const trailer = `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;

  chunks.push(xref, trailer);
  return Buffer.from(chunks.join(""), "latin1");
}

export const DEMO_PRICE_LIST_PDF_LINES = PDF_LINES;
