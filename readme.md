# Finetune a OpenAI model for Tone of Voice
This script helps you create a valid training dataset for fine-tuning an OpenAI model. It generates synthetic training conversations based on your provided examples in the desired tone of voice. Using OpenAI's GPT-4o model, it crafts prompts and examples, then formats them for fine-tuning.

## Usage
1. Clone this repository
2. Run `npm install` to install dependencies
3. Get an OpenAI API key if you don't have one
4. Rename the `.env.example` file to `.env` and add your OpenAI API key:
   ```
   OPENAI_KEY=your_api_key_here
   ```
5. Update `trainingdata.js` with your examples
6. Modify `prompts.js` inside the `/config` folder (just add your system prompt)
7. Generate your dataset with `node run`

