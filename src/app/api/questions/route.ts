import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const lang = searchParams.get('lang') || 'en';

  const dataDir = path.join(process.cwd(), 'data', 'questions');
  const questionsFile = path.join(dataDir, `questions_${lang}.json`);

  try {
    if (!fs.existsSync(questionsFile)) {
      return NextResponse.json({ error: `Questions for language ${lang} not found` }, { status: 404 });
    }
    const questions = JSON.parse(fs.readFileSync(questionsFile, 'utf-8'));
    return NextResponse.json(questions);
  } catch (error) {
    console.error('Error loading questions:', error);
    return NextResponse.json({ error: 'Failed to load questions' }, { status: 500 });
  }
}
