import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Structure for food suggestions from OpenAI
 */
export interface FoodSuggestion {
  name: string;
  description: string;
  portions: {
    small: { description: string; carbValue: number };
    medium: { description: string; carbValue: number };
    large: { description: string; carbValue: number };
  };
}

/**
 * Gets carbohydrate information for a food item
 */
export async function getFoodCarbs(query: string): Promise<FoodSuggestion> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You're a nutritionist specializing in diabetes management. For the food item provided, return accurate carbohydrate information in a JSON format.
          Include small, medium, and large portion sizes with accurate carb counts in grams.`
        },
        {
          role: "user",
          content: `Provide detailed carbohydrate information for: ${query}.
          Format response as JSON with:
          {
            "name": "food name",
            "description": "food description (kid-friendly)",
            "portions": {
              "small": { "description": "small portion description", "carbValue": number },
              "medium": { "description": "medium portion description", "carbValue": number },
              "large": { "description": "large portion description", "carbValue": number }
            }
          }`
        }
      ],
      temperature: 0.7,
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(response.choices[0].message.content);
    return result;
  } catch (error) {
    console.error("Error getting food carbs:", error);
    throw new Error("Unable to get carbohydrate information");
  }
}

/**
 * Suggests meals based on a query or profile
 */
export async function suggestMeals(query: string): Promise<FoodSuggestion[]> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You're a nutritionist specializing in diabetes management. Suggest kid-friendly meals or food items with accurate carbohydrate counts.`
        },
        {
          role: "user",
          content: `Suggest 5 meals or food items related to: ${query}.
          Format response as JSON with an array of items:
          [
            {
              "name": "food name",
              "description": "food description (kid-friendly)",
              "portions": {
                "small": { "description": "small portion description", "carbValue": number },
                "medium": { "description": "medium portion description", "carbValue": number },
                "large": { "description": "large portion description", "carbValue": number }
              }
            },
            ...
          ]`
        }
      ],
      temperature: 0.7,
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(response.choices[0].message.content);
    return result;
  } catch (error) {
    console.error("Error suggesting meals:", error);
    throw new Error("Unable to suggest meals");
  }
}
