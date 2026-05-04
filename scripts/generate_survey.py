import json
import argparse
import sys
import os
import random

def load_json(file_path):
    """Loads a JSON file and returns the data."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        print(f"Error: File '{file_path}' not found.")
        sys.exit(1)
    except json.JSONDecodeError as e:
        print(f"Error: Failed to decode JSON from '{file_path}': {e}")
        sys.exit(1)

def load_contestants(file_path):
    """Loads contestant IDs from a text file, one per line."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return [line.strip() for line in f if line.strip()]
    except FileNotFoundError:
        print(f"Error: Contestant file '{file_path}' not found.")
        sys.exit(1)

def validate_inputs(structure, probabilities):
    """Validates that structure and probabilities are consistent."""
    # Check measuring questions
    if "measuring" not in structure or not isinstance(structure["measuring"], list):
        print("Error: 'structure.json' must contain a 'measuring' list.")
        sys.exit(1)
    
    # Check anchoring questions
    if "anchoring" not in structure or not isinstance(structure["anchoring"], dict):
        print("Error: 'structure.json' must contain an 'anchoring' dictionary.")
        sys.exit(1)

    # Cross-reference with probabilities
    for q_id, variants in structure["anchoring"].items():
        if q_id not in probabilities:
            print(f"Error: Anchoring question '{q_id}' missing from probabilities.json.")
            sys.exit(1)
        
        prob_variants = probabilities[q_id]
        total_prob = 0
        for v_id in variants:
            if v_id not in prob_variants:
                print(f"Error: Variant '{v_id}' for question '{q_id}' missing from probabilities.json.")
                sys.exit(1)
            total_prob += prob_variants[v_id]
        
        # Check sum of probabilities (with epsilon for float precision)
        if abs(total_prob - 1.0) > 1e-6:
            print(f"Error: Probabilities for question '{q_id}' sum to {total_prob}, expected 1.0.")
            sys.exit(1)

def main():
    parser = argparse.ArgumentParser(description="Generate survey assignments based on contestant IDs.")
    parser.add_argument("--structure", default="structure.json", help="Path to structure.json")
    parser.add_argument("--probabilities", default="probabilities.json", help="Path to probabilities.json")
    parser.add_argument("--contestants", required=True, help="Path to text file with contestant IDs")
    parser.add_argument("--output", default="assignments.json", help="Path to save output assignments.json")

    args = parser.parse_args()

    # Load files
    structure = load_json(args.structure)
    probabilities = load_json(args.probabilities)
    contestants = load_contestants(args.contestants)

    # Validate
    validate_inputs(structure, probabilities)
    
    print(f"Successfully loaded and validated inputs.")
    
    assignments = {}
    for contestant_id in contestants:
        rng = random.Random(contestant_id)
        selected_questions = []
        
        # 1. Select anchoring variants
        for q_id, variants in structure["anchoring"].items():
            weights = [probabilities[q_id][v] for v in variants]
            
            # random.choices returns a list, we pick the first (and only) element
            selected_variant = rng.choices(variants, weights=weights, k=1)[0]
            
            # Format: questionID_variantID (e.g., a1_high)
            selected_questions.append(f"{q_id}_{selected_variant}")
        
        # 2. Add measuring questions at the end (e.g., feedback)
        selected_questions.extend(structure["measuring"])
            
        assignments[contestant_id] = selected_questions

    # Save output
    try:
        with open(args.output, 'w', encoding='utf-8') as f:
            json.dump(assignments, f, indent=2)
        print(f"Successfully generated assignments for {len(contestants)} contestants.")
        print(f"Output saved to: {args.output}")
    except Exception as e:
        print(f"Error saving output to '{args.output}': {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
