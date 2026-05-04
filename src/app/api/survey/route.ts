import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import { promisify } from 'util';

const execPromise = promisify(exec);

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Missing id parameter' }, { status: 400 });
  }

  const scriptsDir = path.join(process.cwd(), 'scripts');
  const dataDir = path.join(process.cwd(), 'data');
  const tempContestantsFile = path.join(dataDir, `contestants_${id}.txt`);
  const tempOutputFile = path.join(dataDir, `assignments_${id}.json`);

  try {
    // Write the single ID to a temporary file
    fs.writeFileSync(tempContestantsFile, id);

    // Run the Python script
    const command = `python3 ${path.join(scriptsDir, 'generate_survey.py')} \
      --structure ${path.join(dataDir, 'structure.json')} \
      --probabilities ${path.join(dataDir, 'probabilities.json')} \
      --contestants ${tempContestantsFile} \
      --output ${tempOutputFile}`;

    await execPromise(command);

    // Read the generated assignment
    const assignments = JSON.parse(fs.readFileSync(tempOutputFile, 'utf-8'));
    const userAssignment = assignments[id];

    // Cleanup temp files
    fs.unlinkSync(tempContestantsFile);
    fs.unlinkSync(tempOutputFile);

    return NextResponse.json({ assignment: userAssignment });
  } catch (error) {
    console.error('Error generating survey:', error);
    return NextResponse.json({ error: 'Failed to generate survey assignment' }, { status: 500 });
  }
}
