import { realExamples } from "./data.js";
import OpenAI from "openai";
import { fileURLToPath } from "url";
import fs from "fs";
import path from "path";
import dotenv from 'dotenv';

import { constants } from "./config/constants.js";

dotenv.config()

let prompts = [];
let badExamples = [];
let trainingData = [];

const TOKEN = process.env.OPENAI_KEY;
const openai = new OpenAI({
  apiKey: `${process.env.OPENAI_KEY}`,
});

const systemPrompt = "System prompt here";

// Creating a prompt for each real example
async function getPrompt(text) {
  await openai.chat.completions
    .create({
      messages: [
        {
          role: "system",
          content:
            constants.generatePrompt,
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
async function getBadExamples(prompt) {
  await openai.chat.completions
    .create({
      messages: [
        {
          role: "system",
          content:
            constants.systemPrompt,
        },
        { role: "user", content: `${prompt}` },
      ],
      model: "gpt-4o-2024-08-06",
    })
    .then((completion) => {
      if (completion.choices[0].message.content !== undefined) {
        const cleanRes = completion.choices[0].message.content;
        badExamples.push(cleanRes);
      }
    });
}

async function generateData(realExamples) {
  // step 1: generate synthetic prompts for each real example
  console.log("Generating prompts");
  for (let i = 0; i < Object.keys(realExamples).length; i++) {
    await getPrompt(realExamples[i]);
  }

  // step 2: generate bad examples for each prompt
  console.log("Generating bad examples");
  for (let i = 0; i < prompts.length; i++) {
    await getBadExamples(prompts[i]);
  }

  // step 3: combine training examples into object
  console.log("Combining");
  for (let i = 0; i < prompts.length; i++) {
    trainingData.push({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompts[i] },
        { role: "assistant", content: badExamples[i], weight: 0 }, 
        { role: "user", content: constants.feedbackString},
        { role: "assistant", content: realExamples[i], weight: 1 },
      ],
    });
  }

  // Save trainingData to a JSONL file
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const jsonlData = trainingData.map((item) => JSON.stringify(item)).join("\n");
  const outputPath = path.join(__dirname, "output.jsonl");

  fs.writeFile(outputPath, jsonlData, (err) => {
    if (err) {
      console.error("Something fucked up happened 🥵 :", err);
    } else {
      console.log("Training data saved to output.jsonl 🎉");
    }
  });
}

generateData(realExamples);
