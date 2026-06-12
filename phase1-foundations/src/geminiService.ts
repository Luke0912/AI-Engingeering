import { GoogleGenerativeAI, SchemaType, Schema } from '@google/generative-ai';
import { config } from './config.js';
import { EmailExtractionSchema, EmailExtraction } from './types.js';
import { z } from 'zod';

export class GeminiService {
  private ai: GoogleGenerativeAI;

  constructor() {
    this.ai = new GoogleGenerativeAI(config.GEMINI_API_KEY);
  }

  /**
   * Helper tool to recursively compile Zod validation schemas into 
   * Gemini SDK-compliant OpenAPI Schema definitions.
   */
  private compileSchema(zodSchema: z.ZodTypeAny): Schema {
    // Unwrap Optional and Nullable types
    let currentSchema = zodSchema;
    while (currentSchema instanceof z.ZodOptional || currentSchema instanceof z.ZodNullable) {
      currentSchema = currentSchema._def.innerType;
    }

    const description = zodSchema.description;

    // Handle Objects
    if (currentSchema instanceof z.ZodObject) {
      const properties: Record<string, Schema> = {};
      const required: string[] = [];

      for (const [key, value] of Object.entries(currentSchema.shape)) {
        properties[key] = this.compileSchema(value as z.ZodTypeAny);
        
        // If the inner type is not optional and not nullable, mark it as required
        const isOptional = value instanceof z.ZodOptional;
        const isNullable = value instanceof z.ZodNullable;
        if (!isOptional && !isNullable) {
          required.push(key);
        }
      }

      return {
        type: SchemaType.OBJECT,
        properties,
        required: required.length > 0 ? required : undefined,
        description,
      };
    }

    // Handle Arrays
    if (currentSchema instanceof z.ZodArray) {
      return {
        type: SchemaType.ARRAY,
        items: this.compileSchema(currentSchema.element),
        description,
      };
    }

    // Handle Enums
    if (currentSchema instanceof z.ZodEnum) {
      return {
        type: SchemaType.STRING,
        enum: currentSchema.options,
        description,
      };
    }

    // Handle Strings
    if (currentSchema instanceof z.ZodString) {
      return {
        type: SchemaType.STRING,
        description,
      };
    }

    // Handle Numbers
    if (currentSchema instanceof z.ZodNumber) {
      return {
        type: SchemaType.NUMBER,
        description,
      };
    }

    // Handle Booleans
    if (currentSchema instanceof z.ZodBoolean) {
      return {
        type: SchemaType.BOOLEAN,
        description,
      };
    }

    // Fallback to generic String
    return {
      type: SchemaType.STRING,
      description,
    };
  }

  /**
   * Uses Gemini 1.5 Flash structured generation to parse raw email content.
   * @param rawContent Raw email body.
   * @returns Validated EmailExtraction object.
   */
  async extractEmailMetadata(rawContent: string): Promise<EmailExtraction> {
    try {
      // Gemini 2.5 Flash: Perfect for fast, high-quality, free-quota structures
      const model = this.ai.getGenerativeModel({
        model: 'gemini-2.5-flash',
        systemInstruction: 'You are an elite, highly accurate routing AI classifier. Analyze the provided email and extract data matching the required schema perfectly.',
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: this.compileSchema(EmailExtractionSchema),
          temperature: 0.1,
        },
      });

      const result = await model.generateContent(rawContent);
      const rawText = result.response.text();

      if (!rawText) {
        throw new Error('Gemini API returned an empty text string.');
      }

      // Safe parse runtime validation
      const parsedData = EmailExtractionSchema.safeParse(JSON.parse(rawText));

      if (!parsedData.success) {
        throw new Error(`Gemini output did not conform to the Zod structure: ${parsedData.error.message}`);
      }

      return parsedData.data;
    } catch (error) {
      console.error('❌ Error executing Gemini extraction:', error);
      throw error;
    }
  }
}
