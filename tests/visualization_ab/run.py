import os
import yaml
import requests
import json
import base64
import time
import subprocess
from pathlib import Path

# Configuration
BASE_URL = "http://localhost:8080"
TESTS_DIR = Path("tests/visualization_ab")
OUTPUTS_DIR = TESTS_DIR / "outputs" / "run_002"
FIXTURES_DIR = TESTS_DIR / "fixtures"
PROMPTS_DIR = TESTS_DIR / "prompts"
VARIANTS_DIR = TESTS_DIR / "variants"

def start_backend():
    print("Starting backend service...")
    # Navigate to the service directory and start it
    service_cwd = Path("reform-ai-vis-sandbox/reform-ai-image-visualization-service")
    # Using 'npm run dev' which uses tsx watch
    process = subprocess.Popen(["npm", "run", "dev"], cwd=service_cwd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, shell=True)
    
    # Wait for the service to be ready
    max_retries = 30
    for i in range(max_retries):
        try:
            response = requests.get(f"{BASE_URL}/health")
            if response.status_code == 200:
                print("Backend service is ready.")
                return process
        except requests.exceptions.ConnectionError:
            pass
        time.sleep(2)
        print(f"Waiting for backend... ({i+1}/{max_retries})")
    
    process.terminate()
    raise Exception("Backend service failed to start.")

def run_test(scenario, style, variant, config):
    print(f"Running Test: Scenario={scenario}, Style={style}, Variant={variant}")
    
    # Map fixture names from config
    fixtures_config = config.get('fixtures', {})
    base_room_path = FIXTURES_DIR / fixtures_config.get('base_room', 'Bedroom_test.jpeg')
    furniture_ref_path = FIXTURES_DIR / fixtures_config.get('furniture_ref', 'Bed_test.png')
    
    # Read prompt template
    prompt_file = PROMPTS_DIR / f"{scenario}.txt"
    if not prompt_file.exists():
        print(f"Warning: Prompt file {prompt_file} not found.")
        return
    
    with open(prompt_file, 'r') as f:
        prompt_template = f.read()
    
    # Fill prompt template
    prompt = prompt_template.format(
        style=style,
        image_id="base_room",
        furniture_ref="furniture_reference"
    )
    
    # Prepare form data
    files = {
        'roomImage': ('roomImage.jpeg', open(base_room_path, 'rb'), 'image/jpeg'),
    }
    
    if scenario == 'style_furniture':
        files['furnitureImage'] = ('furnitureImage.png', open(furniture_ref_path, 'rb'), 'image/png')
    
    data = {
        'roomType': 'bedroom',
        'stylePreset': json.dumps({'name': style, 'imageUrl': 'https://example.com/placeholder.png'}),
        'textPrompt': prompt,
        'styleInfluence': '50',
        'isRefinement': 'false'
    }
    
    # Add variant flags
    data['geometryPreservation'] = 'true' if variant in ['geometry_fix', 'combined'] else 'false'
    data['phaseAnchoring'] = 'true' if variant == 'phase_anchoring' else 'false'
    data['phaseAnchoringV2'] = 'true' if variant == 'phase_anchoring_v2' else 'false'
    
    # Send request
    response = requests.post(f"{BASE_URL}/generate-visualization", files=files, data=data)
    
    # Close files
    for file_info in files.values():
        if isinstance(file_info, tuple):
            file_info[1].close()
        else:
            file_info.close()
    
    if response.status_code == 200:
        result = response.json()
        image_data = result['data']['image']
        
        # Save output
        output_folder = OUTPUTS_DIR / variant
        output_folder.mkdir(parents=True, exist_ok=True)
        
        filename = f"{style.lower().replace(' ', '_')}.png"
        output_path = output_folder / filename
        
        with open(output_path, 'wb') as f:
            f.write(base64.b64decode(image_data))
        
        print(f"Successfully saved output to {output_path}")
        return filename
    else:
        print(f"Error running test: {response.status_code} - {response.text}")
        return None

def main():
    # Load experiment config
    with open(TESTS_DIR / "experiment.yaml", 'r') as f:
        config = yaml.safe_load(f)
    
    # Updated styles list from user request
    styles = [
        "Modern", "Minimalist", "Industrial", "Japandi", "Coastal", 
        "Vintage", "Midcentury Modern", "Farmhouse", "French Country"
    ]
    
    backend_process = None
    try:
        backend_process = start_backend()
        
        # Run baseline
        print("\n--- RUNNING BASELINE ---")
        for style in styles:
            run_test('style_only', style, 'baseline', config)
            
        # Run phase_anchoring_v2
        print("\n--- RUNNING PHASE_ANCHORING_V2 ---")
        for style in styles:
            run_test('style_only', style, 'phase_anchoring_v2', config)
            
    finally:
        if backend_process:
            print("Stopping backend service...")
            backend_process.terminate()

if __name__ == "__main__":
    main()
