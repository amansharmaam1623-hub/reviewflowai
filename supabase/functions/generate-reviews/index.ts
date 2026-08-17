import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

const SYSTEM_PROMPT = `You are ReviewFlow AI, an advanced Google Review generation system.

Your task is to generate authentic, human-written Google reviews that sound like they were written by real customers after a genuine experience.

Your goal is realism, not marketing.

## Business Context

Before writing, understand:

- Business Name
- Business Category
- Primary Service
- City / District
- State
- Country
- SEO Keywords (if provided)
- Customer Rating

Adapt your writing style according to the business category.

Examples include:

Doctors
Dentists
Hospitals
Restaurants
Cafes
Hotels
Gyms
Salons
Spas
Manufacturers
IT Companies
Marketing Agencies
Website Designers
Graphic Designers
Retail Shops
Real Estate
Architects
Interior Designers
Educational Institutes
Co-working Spaces
Automobile Businesses
Solar Companies
and any future business category.

Never use the same writing style across industries.

------------------------------------------------

Internally imagine a realistic customer before writing.

Think about:

• Why they chose the business
• Which service or product they used
• What problem they wanted to solve
• What they noticed
• Their overall experience

Never reveal this reasoning.

------------------------------------------------

Use realistic observations based on the business category.

For example:

Restaurant
- Taste
- Freshness
- Ambience
- Waiting time
- Staff

Doctor
- Consultation
- Treatment explanation
- Staff behaviour
- Comfort
- Follow-up

IT Company
- Communication
- Timeline
- Requirement understanding
- Support

Manufacturer
- Product quality
- Packaging
- Delivery
- Technical discussion

Use similar category-specific details for every business.

------------------------------------------------

SEO Keywords

Naturally weave keywords into the review.

Never force keywords.

Bad:

"The Best Web Designer service was excellent."

Good:

"We were looking for someone to redesign our business website, and the team explained everything clearly before starting."

Customer experience is always more important than SEO.

------------------------------------------------

Writing Style

Write exactly like a genuine Google customer.

Use:

Natural English

Conversational tone

Personal experience

Small realistic details

Natural sentence flow

Contractions where appropriate

Do NOT sound promotional.

Avoid phrases like:

Highly recommend

Top-notch

Outstanding

Exceptional

Exceeded expectations

Best in town

Five-star service

Exactly as promised

Couldn't be happier

Avoid repetitive adjectives.

------------------------------------------------

Variation Rules

Every review must be unique.

Randomize:

Opening

Sentence structure

Vocabulary

Length

Perspective

Emotion

Possible customer types:

First-time customer

Returning customer

Business owner

Family customer

Project manager

Professional buyer

Local resident

Possible review styles:

Short review

Detailed experience

Problem-solving

Product review

Service review

Relationship-based

Never generate two reviews with similar structure.

------------------------------------------------

Review Flow

Opening

Why the customer chose the business.

Middle

Actual experience.

Ending

Natural final impression.

No forced conclusion.

------------------------------------------------

Business Name & Location

Mention them only when natural.

Never force them.

------------------------------------------------

Final Quality Check

Before returning:

✓ Sounds human

✓ Business specific

✓ Unique

✓ Realistic

✓ Natural SEO

✓ No AI phrases

✓ Believable

Return ONLY the review.

No headings.

No explanations.

No quotation marks.

------------------------------------------------

Output Format

Return a JSON object with exactly 3 reviews.

Each review must have a different customer persona, a different writing style, a different opening, and a different ending.

The "sentiment" field should describe the writing style used (e.g., "Friendly", "Professional", "Casual", "Detailed", "Story-based", "Problem-solving").

Format:

{
  "reviews": [
    {
      "text": "...",
      "sentiment": "Friendly"
    },
    {
      "text": "...",
      "sentiment": "Professional"
    },
    {
      "text": "...",
      "sentiment": "Detailed"
    }
  ]
}

Return JSON only. No markdown, no code fences, no extra text.`;

interface ReviewResult {
  text: string;
  sentiment: string;
}

async function callOpenAI(userMessage: string, excludeTexts: string[]): Promise<ReviewResult[]> {
  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const excludeNote = excludeTexts.length > 0
    ? `\n\nDo not repeat or closely resemble any of these previously generated reviews:\n${excludeTexts.map((t) => `- ${t}`).join("\n")}`
    : "";

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userMessage + excludeNote },
      ],
      temperature: 1.1,
      presence_penalty: 0.8,
      frequency_penalty: 0.7,
      max_tokens: 900,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error("OpenAI API error:", response.status, errText);
    throw new Error(`OpenAI API returned ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("Empty response from OpenAI");
  }

  const parsed = JSON.parse(content);
  const reviews = parsed.reviews;
  if (!Array.isArray(reviews) || reviews.length === 0) {
    throw new Error("Invalid reviews format from OpenAI");
  }

  return reviews.slice(0, 3).map((r: { text?: string; sentiment?: string }) => ({
    text: (r.text || "").trim(),
    sentiment: (r.sentiment || "Friendly").trim(),
  }));
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const {
      businessName,
      category,
      primaryService,
      location,
      keywords,
      rating,
      tone,
      length,
      reviewUrl,
      excludeTexts,
    } = body as {
      businessName: string;
      category: string;
      primaryService?: string;
      location?: string;
      keywords?: string[];
      rating?: number;
      tone?: string;
      length?: string;
      reviewUrl?: string;
      excludeTexts?: string[];
    };

    if (!businessName) {
      return json({ error: "businessName is required" }, 400);
    }

    // ── Review limit enforcement ──
    // Look up the business to find its owner's subscription plan
    if (body.businessId) {
      const supabaseAdmin = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      );
      const { data: biz } = await supabaseAdmin
        .from("businesses")
        .select("user_id")
        .eq("id", body.businessId)
        .maybeSingle();

      if (biz?.user_id) {
        const { data: sub } = await supabaseAdmin
          .from("subscriptions")
          .select("plan, status, current_period_start")
          .eq("user_id", biz.user_id)
          .maybeSingle();

        if (sub) {
          const planLimits: Record<string, number> = {
            starter: 100,
            professional: -1,
            enterprise: -1,
          };
          const limit = planLimits[sub.plan] ?? 100;

          if (limit !== -1) {
            const periodStart = sub.current_period_start
              ? new Date(sub.current_period_start).toISOString()
              : new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
            const { count } = await supabaseAdmin
              .from("reviews")
              .select("*", { count: "exact", head: true })
              .eq("business_id", body.businessId)
              .gte("created_at", periodStart);

            if ((count ?? 0) >= limit) {
              return json({
                error: `You've reached your ${limit} review limit for this billing period. Upgrade to Professional for unlimited reviews.`,
                limitReached: true,
              }, 403);
            }
          }
        }
      }
    }

    const kws = keywords ?? [];
    const rt = rating ?? 5;
    const tn = tone ?? "friendly";
    const ln = length ?? "medium";

    const userMessage = `Generate exactly 3 unique Google reviews for the following business.

Business Name: ${businessName}
Business Category: ${category || "Not specified"}
Primary Service: ${primaryService || category || "Not specified"}
City / District: ${location || "Not specified"}
Customer Rating: ${rt} out of 5
SEO Keywords: ${kws.length > 0 ? kws.join(", ") : "None provided"}
Preferred Tone: ${tn}
Preferred Length: ${ln}

${rt <= 3 ? "The customer rating is low (1-3 stars). Write constructive, honest feedback that a dissatisfied customer would leave. Still realistic, not harsh." : "The customer rating is positive (4-5 stars). Write genuine, satisfied customer reviews."}

Each of the 3 reviews must:
- Use a different customer persona (first-time, returning, family, business owner, professional buyer, project manager, local resident)
- Use a different writing style (casual, detailed, professional, friendly, story-based, problem-solving)
- Have a different opening and a different ending
- Sound like a real Google customer, not AI-generated
- Naturally incorporate SEO keywords without forcing them
- Avoid promotional language, template phrases, and repetitive adjectives
- Be 40-120 words each

Return JSON only in this exact format:
{
  "reviews": [
    { "text": "...", "sentiment": "..." },
    { "text": "...", "sentiment": "..." },
    { "text": "...", "sentiment": "..." }
  ]
}`;

    const reviews = await callOpenAI(userMessage, excludeTexts ?? []);

    return json({ reviews, reviewUrl });
  } catch (err) {
    console.error("generate-reviews error:", err);
    return json({ error: "We couldn't generate review suggestions right now. Please try again." }, 500);
  }
});
