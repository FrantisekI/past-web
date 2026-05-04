# Survey Generator & Renderer

This tool allows you to generate randomized survey assignments based on contestant IDs and render them into printable HTML questionnaires with QR codes.

## Prerequisites
- Python 3.x
- (Optional) `qrcode` library for actual QR codes: `pip install qrcode pillow`
  - *If not installed, the tool will use text placeholders.*

## Quick Start Pipeline

### 1. Generate Assignments
Run the generator to assign specific question variants to each contestant using their ID as a random seed.

```bash
python3 generate_survey.py \
  --structure ../structure.json \
  --probabilities ../probabilities.json \
  --contestants ../tests/valid_contestants.txt \
  --output ../assignments.json
```

### 2. Render Printable Questionnaire
Take the assignments and a language file (English or Czech) to create a printable HTML file.

**For English:**
```bash
python3 render_questionnaire.py \
  --assignments ../assignments.json \
  --questions ../questions_en.json \
  --output ../surveys_en.html
```

**For Czech:**
```bash
python3 render_questionnaire.py \
  --assignments ../assignments.json \
  --questions ../questions_cz.json \
  --output ../surveys_cz.html
```

## Input Files Explained

- **`structure.json`**: Defines which questions are measuring (always shown) and which are anchoring (randomly selected).
- **`probabilities.json`**: Defines the weights for each anchoring variant.
- **`questions_XX.json`**: Contains the actual text and titles for each question/variant.
- **`contestants.txt`**: A simple text file with one ID per line (e.g., student IDs or names).

## Converting to PDF
1. Open the generated `.html` file in any modern web browser (Chrome, Firefox, Edge).
2. Press `Ctrl + P` (or `Cmd + P` on Mac).
3. Select **"Save as PDF"** or **"Microsoft Print to PDF"**.
4. Ensure "Background Graphics" is enabled if you want to see all styling elements.

## Directory Structure
The scripts are designed to be run from this directory, referencing files in the project root or `tests/` folder as shown in the examples above.
