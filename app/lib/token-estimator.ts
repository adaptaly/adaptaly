export interface ProcessingLevel {
  id: 'quick' | 'standard' | 'deep';
  name: string;
  description: string;
  tokenRange: string;
  estimatedTokens: number;
  estimatedTime: string;
  features: string[];
}

export const PROCESSING_LEVELS: ProcessingLevel[] = [
  {
    id: 'quick',
    name: 'Quick Scan',
    description: 'Main concepts only',
    tokenRange: '50-100',
    estimatedTokens: 75,
    estimatedTime: '15-30 seconds',
    features: ['Key points extraction', 'Basic flashcards', 'Quick summary']
  },
  {
    id: 'standard',
    name: 'Standard',
    description: 'Full summary + flashcards',
    tokenRange: '200-500',
    estimatedTokens: 350,
    estimatedTime: '45-90 seconds',
    features: ['Comprehensive summary', 'Quality flashcards', 'Key concepts identified']
  },
  {
    id: 'deep',
    name: 'Deep Analysis',
    description: 'Detailed breakdown with sections',
    tokenRange: '500+',
    estimatedTokens: 750,
    estimatedTime: '2-4 minutes',
    features: ['Section-by-section analysis', 'Advanced flashcards', 'Detailed insights', 'Connection mapping']
  }
];

export function estimateTokensForFile(
  fileSize: number, 
  mimeType: string, 
  processingLevel: ProcessingLevel['id']
): number {
  const level = PROCESSING_LEVELS.find(l => l.id === processingLevel);
  if (!level) return 0;

  // Base estimation on file size and type
  let baseTokens = level.estimatedTokens;
  
  // Adjust based on file size (rough estimates)
  const sizeInMB = fileSize / (1024 * 1024);
  
  if (mimeType === 'application/pdf') {
    // PDFs tend to have more complex content
    baseTokens += Math.floor(sizeInMB * 50);
  } else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    // DOCX files are structured
    baseTokens += Math.floor(sizeInMB * 40);
  } else if (mimeType === 'text/plain') {
    // Plain text is most efficient
    baseTokens += Math.floor(sizeInMB * 30);
  }

  // Cap the estimates to reasonable ranges
  const minTokens = level.estimatedTokens * 0.7;
  const maxTokens = level.estimatedTokens * 2;
  
  return Math.max(minTokens, Math.min(maxTokens, baseTokens));
}

export function formatTokenCost(tokens: number): string {
  if (tokens < 100) return `~${tokens} tokens`;
  if (tokens < 1000) return `~${Math.round(tokens / 10) * 10} tokens`;
  return `~${(tokens / 1000).toFixed(1)}k tokens`;
}