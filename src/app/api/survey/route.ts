import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import seedrandom from 'seedrandom';
import { db } from '@/db';
import { surveyResults } from '@/db/schema';

type Structure = {
  measuring: string[];
  anchoring: Record<string, string[]>;
};

type Probabilities = Record<string, Record<string, number>>;

function getWeightedRandom(variants: string[], weights: number[], rng: () => number): string {
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  let r = rng() * totalWeight;
  for (let i = 0; i < variants.length; i++) {
    if (r < weights[i]) return variants[i];
    r -= weights[i];
  }
  return variants[variants.length - 1];
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Missing id parameter' }, { status: 400 });
  }

  try {
    const dataDir = path.join(process.cwd(), 'data');
    const structure: Structure = JSON.parse(fs.readFileSync(path.join(dataDir, 'structure.json'), 'utf-8'));
    const probabilities: Probabilities = JSON.parse(fs.readFileSync(path.join(dataDir, 'probabilities.json'), 'utf-8'));

    const rng = seedrandom(id);
    const selectedQuestions: string[] = [];

    // 1. Select anchoring variants
    for (const [qId, variants] of Object.entries(structure.anchoring)) {
      const weights = variants.map(v => probabilities[qId][v] || 0);
      const selectedVariant = getWeightedRandom(variants, weights, rng);
      selectedQuestions.push(`${qId}_${selectedVariant}`);
    }

    // 2. Add measuring questions
    selectedQuestions.push(...structure.measuring);

    return NextResponse.json({ assignment: selectedQuestions });
  } catch (error) {
    console.error('Error generating survey:', error);
    return NextResponse.json({ error: 'Failed to generate survey assignment' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { contestantId, email, language, answers, startedAt } = body;

    if (!contestantId || !language || !answers) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const result = await db.insert(surveyResults).values({
      contestantId,
      email: email || null,
      language,
      answers: answers, // PostgreSQL JSONB takes the object directly
      startedAt: startedAt ? new Date(startedAt) : null,
    }).returning();

    return NextResponse.json({ success: true, id: result[0].id });
  } catch (error) {
    console.error('Error saving survey result:', error);
    return NextResponse.json({ error: 'Failed to save survey result' }, { status: 500 });
  }
}
