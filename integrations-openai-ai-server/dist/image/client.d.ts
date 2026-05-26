import OpenAI from "openai";
import { Buffer } from "node:buffer";
export declare const openai: OpenAI;
export declare function generateImageBuffer(prompt: string, size?: "1024x1024" | "1536x1024" | "1024x1536"): Promise<Buffer>;
export declare function generateImageWithReference(prompt: string, imageBase64: string, size?: "1024x1024" | "1536x1024" | "1024x1536"): Promise<Buffer>;
export declare function editImages(imageFiles: string[], prompt: string, outputPath?: string): Promise<Buffer>;
//# sourceMappingURL=client.d.ts.map