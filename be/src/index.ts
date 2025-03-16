require("dotenv").config();

import express from "express";
import Anthropic from "@anthropic-ai/sdk";
import { BASE_PROMPT, getSystemPrompt } from "./prompts";
import { TextBlock } from "@anthropic-ai/sdk/resources";
import { basePrompt as nodeBasePrompt } from "./defaults/node";
import { basePrompt as reactBasePrompt } from "./defaults/react";

const anthropic = new Anthropic();
const app = express();
app.use(express.json())

app.post("/template", async (req, res) => {
    const prompt = req.body.prompt 

    const response = await anthropic.messages.create({
        messages: [{
            role: 'user' , content: prompt
        }],
        model: 'claude-3-7-sonnet-20250219',
        max_tokens: 200,
        system: "Return either node or react based on what do you think this project should be. Only return a single word either 'node' or 'react'. Do not return anything extra"
    })

    const answer = (response.content[0] as TextBlock).text; // react or node
    if (answer == "react"){
        res.json({
            prompts: [BASE_PROMPT, `Project Files:\n\nThe following is a list of all project files and their complete contents that are currently visible and accessible to you.\n\n${reactBasePrompt}Here is a list of files that exist on the file system but are not being shown to you:\n\n  - .gitignore\n  - package-lock.json\n`],
            uiPrompts: [reactBasePrompt]
        })
        return;
    }

    if (answer === "node"){
        res.json({
            prompts: [`Project Files:\n\nThe following is a list of all project files and their complete contents that are currently visible and accessible to you.\n\n${nodeBasePrompt}Here is a list of files that exist on the file system but are not being shown to you:\n\n  - .gitignore\n  - package-lock.json\n`],
            uiPrompts: [nodeBasePrompt]
        })
        return;
    }

    res.status(403).json({message: "You can't access this"})
    return;
        
})

app.post("/chat", async (req, res) => {
    const messages = req.body.messages;
    const response = await anthropic.messages.create({
        messages: messages,
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 8000,
        system: getSystemPrompt()
    })

    console.log(response);

    res.json({
        response: (response.content[0] as TextBlock)?.text
    });
})

app.listen(3000)


// async function main() {
//     anthropic.messages.stream({
//         messages: [{
//             role: 'user', content: ""
//         }, {
//             role: 'user', content: "{{BASE_PROMPT}}\n\n```\n\n"

//         }, {
//             role: "user",
//             content: "Create a todo app"
//         }],
//         model: 'claude-3-7-sonnet-20250219',
//         max_tokens: 8000,
//         system: getSystemPrompt()
//     }).on('text', (text) => {
//         console.log(text);
//     });
// }

// main();