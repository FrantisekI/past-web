import json
import argparse
import sys
import base64
from io import BytesIO

# Try to import qrcode, fallback to a placeholder if not available
try:
    import qrcode
    HAS_QRCODE = True
except ImportError:
    HAS_QRCODE = False

def generate_qr_base64(data):
    """Generates a QR code as a base64 encoded PNG string."""
    if not HAS_QRCODE:
        # Return a placeholder if library is missing
        return ""
    
    qr = qrcode.QRCode(version=1, box_size=10, border=4)
    qr.add_data(data)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    
    buffered = BytesIO()
    img.save(buffered, format="PNG")
    return base64.b64encode(buffered.getvalue()).decode()

def render_html(assignments, questions_text, output_path):
    """Renders the assignments into a printable HTML file."""
    
    html_template = """
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            body {{ font-family: 'Arial', Times, serif; line-height: 1.2; margin: 0; padding: 0; }}
            .page {{ 
                width: 210mm; 
                min-height: 297mm; 
                padding: 12mm 15mm; 
                margin: 5mm auto; 
                background: white; 
                box-shadow: 0 0 5px rgba(0,0,0,0.1);
                page-break-after: always;
                box-sizing: border-box;
            }}
            @media print {{
                body {{ background: none; }}
                .page {{ margin: 0; box-shadow: none; padding: 10mm 15mm; }}
            }}
            header {{ display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #333; padding-bottom: 5px; margin-bottom: 12px; }}
            .contestant-info {{ font-size: 10pt; }}
            .qr-code {{ width: 60px; height: 60px; }}
            .question {{ margin-bottom: 14px; }}
            .question-title {{ font-weight: bold; font-size: 11pt; border-left: 3px solid #333; padding-left: 8px; margin-bottom: 4px; }}
            .question-context {{ font-style: italic; margin-bottom: 3px; color: #444; font-size: 10.5pt; }}
            .question-part {{ margin-bottom: 2px; }}
            
            .tick-row {{ margin: 4px 0 8px 15px; }}
            .tick-box {{ display: inline-block; margin-right: 25px; font-size: 10.5pt; }}
            .tick-box span {{ display: inline-block; width: 14px; height: 14px; border: 1px solid #000; vertical-align: middle; margin-right: 6px; }}
            
            .answer-line-wrapper {{ display: flex; align-items: flex-end; margin: 4px 0 0 15px; }}
            .answer-line {{ border-bottom: 1px solid #000; flex-grow: 1; min-width: 120px; height: 16px; max-width: 250px; }}
            .units {{ margin-left: 8px; font-weight: bold; font-size: 10pt; }}
            
            .answer-space {{ border-bottom: 1px solid #ccc; height: 35px; margin-top: 5px; }}
            
            h1 {{ margin: 0; font-size: 1.4em; }}
            p {{ margin: 2px 0; }}
        </style>
    </head>
    <body>
        {content}
    </body>
    </html>
    """

    page_content = []
    for c_id, q_ids in assignments.items():
        qr_b64 = generate_qr_base64(c_id)
        qr_html = f'<img src="data:image/png;base64,{qr_b64}" class="qr-code">' if qr_b64 else f'<div class="qr-code" style="border:1px solid #000; display:flex; align-items:center; text-align:center; font-size:10px;">QR: {c_id}</div>'
        
        questions_html = []
        q_counter = 1
        for q_id in q_ids:
            q_data = questions_text.get(q_id, {"title": q_id, "text": f"Missing text for {q_id}"})
            
            q_label = f"{q_counter}. " if q_counter <= 5 else ""
            q_bits = [f'<div class="question-title">{q_label}{q_data.get("title", "Question")}</div>']
            
            # 1. Context text (if any)
            if "context" in q_data:
                q_bits.append(f'<div class="question-context">{q_data["context"]}</div>')
            
            # 2. Comparison Part (Tick boxes)
            if "comparison" in q_data:
                labels = q_data.get("comparison_labels", ["More", "Less"])
                ticks = "".join([f'<div class="tick-box"><span></span> {label}</div>' for label in labels])
                q_bits.append(f'<div class="question-part">{q_data["comparison"]}</div>')
                q_bits.append(f'<div class="tick-row">{ticks}</div>')
            
            # 3. Estimate/Ask Part (Answer line)
            if "estimate" in q_data:
                units = q_data.get("units", "")
                q_bits.append(f'<div class="question-part">{q_data["estimate"]}</div>')
                q_bits.append(f'<div class="answer-line-wrapper"><div class="answer-line"></div><span class="units">{units}</span></div>')
            
            # 4. Fallback/Legacy/Feedback text
            if "text" in q_data and "comparison" not in q_data and "estimate" not in q_data:
                q_bits.append(f'<div class="question-part">{q_data["text"]}</div>')
                q_bits.append('<div class="answer-space"></div>')

            questions_html.append(f'<div class="question">{"".join(q_bits)}</div>')
            q_counter += 1

        page_content.append(f"""
            <div class="page">
                <header>
                    <div class="contestant-info">
                        <h1>Survey Questionnaire</h1>
                        <p>ID: <strong>{c_id}</strong></p>
                    </div>
                    {qr_html}
                </header>
                <div class="questions-list">
                    {''.join(questions_html)}
                </div>
            </div>
        """)

    full_html = html_template.format(content=''.join(page_content))
    
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(full_html)

def main():
    parser = argparse.ArgumentParser(description="Render survey assignments into HTML.")
    parser.add_argument("--assignments", required=True, help="Path to assignments.json")
    parser.add_argument("--questions", required=True, help="Path to questions_XX.json")
    parser.add_argument("--output", default="surveys.html", help="Path to output HTML file")

    args = parser.parse_args()

    try:
        with open(args.assignments, 'r', encoding='utf-8') as f:
            assignments = json.load(f)
        with open(args.questions, 'r', encoding='utf-8') as f:
            questions_text = json.load(f)
    except Exception as e:
        print(f"Error loading files: {e}")
        sys.exit(1)

    render_html(assignments, questions_text, args.output)
    print(f"Successfully rendered {len(assignments)} questionnaires to {args.output}")
    if not HAS_QRCODE:
        print("Warning: 'qrcode' library not found. Using text placeholders for QR codes.")

if __name__ == "__main__":
    main()
