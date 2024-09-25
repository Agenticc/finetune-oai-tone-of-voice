import fs from "fs";
import path from "path";
import OpenAI from "openai";
import { fileURLToPath } from "url";
import { realExamples } from "./trainingdata.js";
import { programprompts } from "./config/constants.js";

import dotenv from 'dotenv';
dotenv.config()

let prompts = [];
let badOutputs = [];
let trainingData = [];

const openai = new OpenAI({
  apiKey: `${process.env.OPENAI_KEY}`,
});

// Generate training dataset
async function generateData(realExamples) {
  // Call getPrompt to generate synthetic prompts for each real example
  console.log("Generating prompts");
  for (let i = 0; i < Object.keys(realExamples).length; i++) {
    await getPrompt(realExamples[i]);
  }

  // Call getBadOutputs to generate bad examples for each prompt
  console.log("Generating bad examples");
  for (let i = 0; i < prompts.length; i++) {
    await getBadOutputs(prompts[i]);
  }

  // Combine training examples into object
  console.log("Combining");
  for (let i = 0; i < prompts.length; i++) {
    trainingData.push({
      messages: [
        { role: "system", content: programprompts.systemPrompt },
        { role: "user", content: prompts[i] },
        { role: "assistant", content: badOutputs[i], weight: 0 }, 
        { role: "user", content: programprompts.feedbackString},
        { role: "assistant", content: realExamples[i], weight: 1 },
      ],
    });
  }

  // Save your training data
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const jsonlData = trainingData.map((item) => JSON.stringify(item)).join("\n");
  const outputPath = path.join(__dirname, "dataset.jsonl");

  fs.writeFile(outputPath, jsonlData, (err) => {
    if (err) {
      console.error("Something fucked up happened 🥵 :", err);
    } else {
      console.log("Training data saved to output.jsonl 🎉");
    }
  });
}

// Generate a synthetic prompt
async function getPrompt(text) {
  await openai.chat.completions
    .create({
      messages: [
        {
          role: "system",
          content:
          programprompts.generatePrompt,
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

// Generate generic (bad) output 
async function getBadOutputs(prompt) {
  await openai.chat.completions
    .create({
      messages: [
        {
          role: "system",
          content:
          programprompts.systemPrompt,
        },
        { role: "user", content: `${prompt}` },
      ],
      model: "gpt-4o-2024-08-06",
    })
    .then((completion) => {
      if (completion.choices[0].message.content !== undefined) {
        const cleanRes = completion.choices[0].message.content;
        badOutputs.push(cleanRes);
      }
    });
}

generateData(realExamples);
