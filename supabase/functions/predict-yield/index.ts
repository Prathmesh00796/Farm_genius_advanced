import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { cropType, soilType, areaAcres, sowingDate, irrigationType, fertilizerUsed } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Predicting yield for:", { cropType, soilType, areaAcres, sowingDate, irrigationType, fertilizerUsed });

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are an agricultural yield prediction expert for Indian farming. Based on the crop details provided, predict the yield and provide recommendations.

Respond ONLY with a valid JSON object in this exact format:
{
  "estimated_yield": 42,
  "yield_unit": "Quintals/Acre",
  "harvest_days": 120,
  "estimated_revenue": 84000,
  "comparison_to_avg": "+8%",
  "recommendations": [
    {
      "title": "Recommendation title",
      "description": "Detailed recommendation description"
    }
  ],
  "risk_factors": ["Risk 1", "Risk 2"],
  "optimal_harvest_date": "2025-05-15"
}

Use realistic yield data for Indian conditions:
- Wheat: 15-20 quintals/acre
- Rice: 20-30 quintals/acre
- Maize: 25-35 quintals/acre
- Potato: 80-120 quintals/acre
- Cotton: 8-12 quintals/acre

Prices (per quintal):
- Wheat: ₹2000-2500
- Rice: ₹3000-4000
- Maize: ₹1600-1900
- Potato: ₹1000-1500
- Cotton: ₹6000-7000`
          },
          {
            role: "user",
            content: `Predict yield for:
- Crop: ${cropType}
- Soil Type: ${soilType}
- Area: ${areaAcres} acres
- Sowing Date: ${sowingDate}
- Irrigation: ${irrigationType}
- Fertilizer: ${fertilizerUsed}`
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    console.log("AI Response:", content);

    let predictionResult;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        predictionResult = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found");
      }
    } catch {
      // Fallback prediction
      predictionResult = {
        estimated_yield: Math.round(areaAcres * 20),
        yield_unit: "Quintals",
        harvest_days: 120,
        estimated_revenue: Math.round(areaAcres * 20 * 2000),
        comparison_to_avg: "+5%",
        recommendations: [
          { title: "Optimize Irrigation", description: "Maintain consistent soil moisture levels during critical growth stages." },
          { title: "Monitor Weather", description: "Check weather forecasts regularly and protect crops from extreme conditions." },
          { title: "Nutrient Management", description: "Apply balanced fertilizers based on soil test recommendations." }
        ],
        risk_factors: ["Weather variability", "Pest pressure"],
        optimal_harvest_date: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      };
    }

    return new Response(JSON.stringify(predictionResult), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in predict-yield function:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
