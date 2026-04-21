// Adobe Sign (Acrobat Sign) integration

export interface AdobeSignParticipant {
  email: string;
  name: string;
  role: 'SIGNER' | 'APPROVER' | 'CC';
  order: number;
}

export interface AdobeSignAgreementRequest {
  fileInfos: Array<{ transientDocumentId: string }>;
  name: string;
  participantSetsInfo: Array<{
    memberInfos: AdobeSignParticipant[];
    order: number;
    role: 'SIGNER' | 'APPROVER' | 'CC';
  }>;
  signatureType: 'ESIGN';
  state: 'IN_PROCESS';
  message?: string;
}

export interface AdobeSignAgreementResponse {
  id: string;
  status: string;
  name: string;
}

const ADOBE_SIGN_BASE = 'https://api.na4.adobesign.com/api/rest/v6';

/**
 * Upload a PDF document as a transient document and return its ID.
 */
export async function uploadTransientDocument(
  pdfBytes: Uint8Array,
  fileName: string,
  accessToken: string
): Promise<string> {
  const formData = new FormData();
  formData.append(
    'File',
    new Blob([pdfBytes], { type: 'application/pdf' }),
    fileName
  );
  formData.append('File-Name', fileName);
  formData.append('Mime-Type', 'application/pdf');

  const response = await fetch(`${ADOBE_SIGN_BASE}/transientDocuments`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: formData,
  });

  if (!response.ok) {
    throw new Error(
      `Adobe Sign transient upload failed: ${response.status} ${await response.text()}`
    );
  }

  const data = (await response.json()) as { transientDocumentId: string };
  return data.transientDocumentId;
}

/**
 * Create an agreement (signature request) and return the agreement ID.
 */
export async function createAgreement(
  transientDocumentId: string,
  agreementName: string,
  signers: Array<{ email: string; name: string }>,
  accessToken: string
): Promise<AdobeSignAgreementResponse> {
  const body: AdobeSignAgreementRequest = {
    fileInfos: [{ transientDocumentId }],
    name: agreementName,
    participantSetsInfo: signers.map((signer, idx) => ({
      memberInfos: [{ ...signer, role: 'SIGNER', order: idx + 1 }],
      order: idx + 1,
      role: 'SIGNER',
    })),
    signatureType: 'ESIGN',
    state: 'IN_PROCESS',
    message:
      'Please review and sign the enclosed agreement prepared by MyCounsel.',
  };

  const response = await fetch(`${ADOBE_SIGN_BASE}/agreements`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(
      `Adobe Sign agreement creation failed: ${response.status} ${await response.text()}`
    );
  }

  return response.json() as Promise<AdobeSignAgreementResponse>;
}

/**
 * Minimal PDF wrapper — wraps plain text into a single-page PDF byte stream.
 * In production, replace with a proper PDF library (pdfkit, pdf-lib, etc.).
 */
export function textToPdf(text: string, _title: string): Uint8Array {
  const escaped = text
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');

  // Split text into lines of ≤80 chars for readability
  const lines = escaped.match(/.{1,80}/g) ?? [escaped];
  const lineHeight = 14;
  const startY = 750;
  const pageHeight = 842;
  const linesPerPage = Math.floor((pageHeight - 100) / lineHeight);

  let streamContent = `BT\n/F1 11 Tf\n`;
  lines.slice(0, linesPerPage).forEach((line, i) => {
    const y = startY - i * lineHeight;
    streamContent += `50 ${y} Td (${line}) Tj\n`;
  });
  streamContent += `ET`;

  const pdfContent = `%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj
3 0 obj<</Type/Page/MediaBox[0 0 595 842]/Parent 2 0 R/Resources<</Font<</F1<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>>>>>>>
/Contents 4 0 R>>endobj
4 0 obj<</Length ${streamContent.length}>>
stream
${streamContent}
endstream
endobj
xref
0 5
0000000000 65535 f
trailer<</Size 5/Root 1 0 R>>
startxref
0
%%EOF`;

  return new TextEncoder().encode(pdfContent);
}
