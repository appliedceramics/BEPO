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

/**
 * Interface for meal plan recommendations
 */
export interface MealPlanDay {
  day: string;
  breakfast: MealOption;
  lunch: MealOption;
  dinner: MealOption;
  snacks: MealOption[];
  totalCarbs: number;
  tips: string;
}

export interface MealOption {
  name: string;
  description: string;
  carbValue: number;
  ingredients?: string[];
}

export interface MealPlan {
  overview: {
    title: string;
    description: string;
    averageDailyCarbs: number;
    dietaryFocus: string;
    targetBloodGlucose: string;
  };
  days: MealPlanDay[];
  generalTips: string[];
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
    
    // Determine if it's a restaurant/brand query or a general food category
    let systemPrompt = `You're a nutritionist specializing in diabetes management. `;
    let userPrompt = '';
    
    if (query.toLowerCase().includes('mcdonald') || 
        query.toLowerCase().includes('burger king') ||
        query.toLowerCase().includes('kfc') ||
        query.toLowerCase().includes('taco bell') ||
        query.toLowerCase().includes('wendy') ||
        query.toLowerCase().includes('subway') ||
        query.toLowerCase().includes('starbucks')) {
      // Restaurant-specific prompt
      systemPrompt += `Provide accurate menu items from ${query} with carbohydrate counts.`;
      userPrompt = `Suggest 5 popular menu items from ${query}.
      Format response as JSON with an array of items:
      [
        {
          "name": "menu item name",
          "description": "brief description of the item",
          "portions": {
            "small": { "description": "small size description", "carbValue": number },
            "medium": { "description": "medium/regular size description", "carbValue": number },
            "large": { "description": "large size description", "carbValue": number }
          }
        },
        ...
      ]`;
    } else {
      // General food query
      systemPrompt += `Suggest kid-friendly meals or food items with accurate carbohydrate counts.`;
      userPrompt = `Suggest 5 meals or food items related to: ${query}.
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
      ]`;
    }
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: userPrompt
        }
      ],
      temperature: 0.7,
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content || '[]';
    let result;
    try {
      result = JSON.parse(content);
      
      // Ensure we have an array (sometimes the API returns {items: [...]}
      if (result && !Array.isArray(result)) {
        if (Array.isArray(result.items)) {
          result = result.items;
        } else if (Array.isArray(result.results)) {
          result = result.results;
        } else if (Array.isArray(result.suggestions)) {
          result = result.suggestions;
        } else {
          result = []; // Empty array if no valid format found
        }
      }
      
      // Limit to 8 results max
      if (Array.isArray(result) && result.length > 8) {
        result = result.slice(0, 8);
      }
      
      return result || [];
    } catch (parseError) {
      console.error("Error parsing meal suggestions:", parseError);
      return mockMealSuggestions;
    }
  } catch (error) {
    console.error("Error suggesting meals:", error);
    // Fall back to mock data on error
    return mockMealSuggestions;
  }
}

/**
 * Generate a meal plan based on dietary preferences and health requirements
 */
export async function generateMealPlan(parameters: {
  dietType?: string; // E.g., low-carb, Mediterranean, balanced
  dietaryRestrictions?: string[]; // E.g., gluten-free, vegetarian, dairy-free
  carbTarget?: { min: number; max: number }; // Target carbohydrate range per day in grams
  targetBgRange?: { min: number; max: number }; // Target blood glucose range in mmol/L
  gender?: string;
  age?: number;
  weight?: number; // In kg
  duration?: number; // Number of days for the meal plan (1-7)
}): Promise<MealPlan> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      console.warn('Cannot generate meal plan - OPENAI_API_KEY not found');
      throw new Error("API key is required for meal planning");
    }

    // Set default values for missing parameters
    const {
      dietType = "balanced",
      dietaryRestrictions = [],
      carbTarget = { min: 100, max: 150 },
      targetBgRange = { min: 4.0, max: 7.0 },
      gender = "unspecified",
      age = 30,
      weight = 70,
      duration = 3
    } = parameters;

    // Limit duration to a maximum of 7 days
    const limitedDuration = Math.min(duration, 7);
    
    // Build the parameters object for the API call
    const restrictionsText = dietaryRestrictions.length > 0 
      ? `Dietary restrictions: ${dietaryRestrictions.join(", ")}.` 
      : "No specific dietary restrictions.";

    // Use the newest OpenAI model
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: (
            "You are a diabetes nutrition specialist who creates personalized meal plans. " +
            "You understand how different foods affect blood glucose levels and insulin requirements. " +
            "Focus on providing accurate carbohydrate information and balanced meals that help maintain stable blood glucose. " +
            "Always include specific carbohydrate counts for each meal and ensure your recommendations consider the user's preferences and restrictions."
          )
        },
        {
          role: "user",
          content: (
            `Please create a ${limitedDuration}-day meal plan with the following parameters:\n\n` +
            `Diet type: ${dietType}\n` +
            `${restrictionsText}\n` +
            `Daily carbohydrate target: ${carbTarget.min}-${carbTarget.max}g\n` +
            `Target blood glucose range: ${targetBgRange.min}-${targetBgRange.max} mmol/L\n` +
            `Profile: ${age} year old ${gender}, ${weight}kg\n\n` +
            "The meal plan should include breakfast, lunch, dinner, and snacks for each day, with accurate carbohydrate counts for each meal.\n" +
            "Please provide practical tips specific to diabetes management with each day's plan."
          )
        },
      ],
      temperature: 0.7,
      response_format: { type: "json_object" },
      max_tokens: 4000,
    });

    // Parse the response and return formatted data
    const responseText = completion.choices[0].message.content;
    if (!responseText) {
      console.warn("Empty response from OpenAI for meal plan");
      throw new Error("Failed to generate meal plan");
    }

    try {
      // Parse and validate the response
      const mealPlan = JSON.parse(responseText);
      
      // Ensure the response has the expected structure
      if (!mealPlan.overview || !Array.isArray(mealPlan.days) || mealPlan.days.length === 0) {
        throw new Error("Invalid meal plan format");
      }
      
      return mealPlan as MealPlan;
    } catch (parseError) {
      console.error("Failed to parse OpenAI meal plan response:", parseError);
      throw new Error("Failed to generate a valid meal plan");
    }
  } catch (error) {
    console.error("Error generating meal plan from OpenAI:", error);
    throw new Error("Failed to create meal plan. Please try again later.");
  }
}
