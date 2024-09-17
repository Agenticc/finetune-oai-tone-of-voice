# Training Data Constructor
This project generates training data for a language model by creating synthetic prompts and examples based on real content. It uses OpenAI's GPT-4o model to generate prompts and examples, and then combines them into a format suitable for fine-tuning.

## Features
- Generates synthetic prompts from real examples
- Creates "bad" examples using a custom system prompt
- Combines real and synthetic examples into a structured training dataset
- Outputs the training data in JSONL format

## Prerequisites
- Node.js
- OpenAI API key

## Installation
1. Clone the repository
2. Run `npm install` to install dependencies
3. Create a `.env` file in the root directory and add your OpenAI API key:
   ```
   OPENAI_KEY=your_api_key_here
   ```

## Usage
1. Update `config/constants.js`
2. Add `realExamples` in `data.js`
3. Run the script using: `node prep.js`
