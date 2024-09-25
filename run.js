import fs from "fs";
import path from "path";
import OpenAI from "openai";
import { fileURLToPath } from "url";
import { desiredOutputs } from "./trainingdata.js";
import { strings } from "./config/prompts.js";


import dotenv from 'dotenv';
dotenv.config()

let prompts = [];
let baseExamples = [];
let trainingData = [];

const openai = new OpenAI({
  apiKey: `${process.env.OPENAI_KEY}`,
});

const systemPrompt = "System prompt here";

// Creating a prompt for each desired output
async function getPrompt(text) {
  await openai.chat.completions
    .create({
      messages: [
        {
          role: "system",
          content:
            strings.generatePrompt,
        },
        { role: "user", content: `${text}` },
      ],
      model: "gpt-4o-2024-08-06",
    })
    .then((completion) => {
      if (completion.choices[0].message.content !== undefined) {
        const cleanRes = completion.choices[0].message.content
          .replace("Prompt:", "")
          .trim();
        prompts.push(cleanRes);
      }
    });
}

// Get completions for each prompt
async function generateBaseCompletions(prompt) {
  await openai.chat.completions
    .create({
      messages: [
        {
          role: "system",
          content:
            strings.systemPrompt,
        },
        { role: "user", content: `${prompt}` },
      ],
      model: "gpt-4o-2024-08-06",
    })
    .then((completion) => {
      if (completion.choices[0].message.content !== undefined) {
        const baseEx = completion.choices[0].message.content;
        baseExamples.push(baseEx);
      }
    });
}

async function generateData(desiredOutputs) {
  // step 1: generate synthetic prompts for each desired output
  console.log("Generating prompts");
  for (let i = 0; i < Object.keys(desiredOutputs).length; i++) {
    await getPrompt(desiredOutputs[i]);
  }

  // step 2: generate base completion for each prompt
  console.log("Generating base completions");
  for (let i = 0; i < prompts.length; i++) {
    await generateBaseCompletions(prompts[i]);
  }

  // step 3: combine training examples into object
  console.log("Combining");
  for (let i = 0; i < prompts.length; i++) {
    trainingData.push({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompts[i] },
        { role: "assistant", content: baseExamples[i], weight: 0 }, 
        { role: "user", content: strings.feedbackString},
        { role: "assistant", content: desiredOutputs[i], weight: 1 },
      ],
    });
  }

  // save
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const jsonlData = trainingData.map((item) => JSON.stringify(item)).join("\n");
  const outputPath = path.join(__dirname, "trainingdata.jsonl");

  fs.writeFile(outputPath, jsonlData, (err) => {
    if (err) {
      console.error("Something fucked up happened 🥵 :", err);
    } else {
      console.log("Great job! Your training data has been saved to output.jsonl in the same folder as this script 🎉");
    }
  });
}

generateData(desiredOutputs);
