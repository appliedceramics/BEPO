import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY,
});

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

// Mock data for when API key is missing
const mockFoodData: FoodSuggestion = {
  name: "Example Apple",
  description: "Sweet and crunchy fruit, perfect for snacks",
  portions: {
    small: { description: "1 small apple (about 100g)", carbValue: 15 },
    medium: { description: "1 medium apple (about 150g)", carbValue: 22 },
    large: { description: "1 large apple (about 200g)", carbValue: 30 }
  }
};

const mockMealSuggestions: FoodSuggestion[] = [
  {
    name: "Peanut Butter Sandwich",
    description: "Delicious peanut butter sandwich on whole wheat bread",
    portions: {
      small: { description: "Half sandwich (1 slice of bread)", carbValue: 15 },
      medium: { description: "Full sandwich (2 slices of bread)", carbValue: 30 },
      large: { description: "Large sandwich (3 slices of bread)", carbValue: 45 }
    }
  },
  {
    name: "Pasta with Tomato Sauce",
    description: "Pasta with simple tomato sauce",
    portions: {
      small: { description: "1/2 cup cooked pasta", carbValue: 20 },
      medium: { description: "1 cup cooked pasta", carbValue: 40 },
      large: { description: "1.5 cups cooked pasta", carbValue: 60 }
    }
  }
];

/**
 * Gets carbohydrate information for a food item
 */
export async function getFoodCarbs(query: string): Promise<FoodSuggestion> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      console.warn('Using mock data - OPENAI_API_KEY not found');
      return mockFoodData;
    }
    
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

    const content = response.choices[0].message.content || '{}';
    const result = JSON.parse(content);
    return result;
  } catch (error) {
    console.error("Error getting food carbs:", error);
    // Fall back to mock data on error
    return mockFoodData;
  }
}

/**
 * Suggests meals based on a query or profile
 */
export async function suggestMeals(query: string): Promise<FoodSuggestion[]> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      console.warn('Using mock data - OPENAI_API_KEY not found');
      return mockMealSuggestions;
    }
    
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

    const content = response.choices[0].message.content || '[]';
    const result = JSON.parse(content);
    return result;
  } catch (error) {
    console.error("Error suggesting meals:", error);
    // Fall back to mock data on error
    return mockMealSuggestions;
  }
}
