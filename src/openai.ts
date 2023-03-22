import {
  Configuration,
  CreateImageRequestResponseFormatEnum,
  CreateImageRequestSizeEnum,
  OpenAIApi
} from "openai";
import DBUtils from "./data.js";
import fs from "fs";
import {config} from "./config.js";



const configuration = new Configuration({
  apiKey: config.OPENAI_API_KEY,

});
const openai = new OpenAIApi(configuration);
const model = config.MODEL;
const temperature = config.TEMPERATURE;

/**
 * Get completion from OpenAI
 * @param username
 * @param message
 */
async function chatgpt(username:string,message: string): Promise<string> {
  // 先将用户输入的消息添加到数据库中
  DBUtils.addUserMessage(username, message);
  const messages = DBUtils.getChatMessage(username);

  const response = await openai.createChatCompletion({
    model: model,
    messages: messages,
    temperature: temperature
  }).then((res) => res.data).catch((err) => console.log(err));
  if (response) {
    return (response.choices[0].message as any).content.replace(/^\n+|\n+$/g, "");
  } else {
    return "请再问我一遍吧"
  }
}
  
/**
 * Get image from Dall·E
 * @param username
 * @param prompt
 */
async function dalle(username:string,prompt: string) {
  const response = await openai.createImage({
    prompt: prompt,
    n:1,
    size: CreateImageRequestSizeEnum._256x256,
    response_format: CreateImageRequestResponseFormatEnum.Url,
    user: username
  }).then((res) => res.data).catch((err) => console.log(err));
  if (response) {
    return response.data[0].url;
  }else{
    return "Generate image failed"
  }
}

/**
 * Speech to text
 * @param username
 * @param videoPath
 */
async function whisper(username:string,videoPath: string): Promise<string> {
  const file:any= fs.createReadStream(videoPath);
  const response = await openai.createTranscription(file,"whisper-1")
    .then((res) => res.data).catch((err) => console.log(err));
  if (response) {
    return response.text;
  }else{
    return "Speech to text failed"
  }
}

export {chatgpt,dalle,whisper};