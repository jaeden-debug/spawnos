import { NextRequest, NextResponse } from 'next/server'
import type { BlueprintFormInput, BlueprintOutput } from '@/types/blueprint'

// ─── Mock output for local dev without OPENAI_API_KEY ────────────────────────
function getMockBlueprint(input: BlueprintFormInput): BlueprintOutput {
  return {
    title: `${input.tankSize}-Gallon ${input.primaryGoal.charAt(0).toUpperCase() + input.primaryGoal.slice(1)} Aquarium Blueprint`,
    summary: `This is a mock blueprint for a ${input.tankSize}-gallon ${input.primaryGoal} tank. Set OPENAI_API_KEY in your .env.local to generate real AI blueprints.`,
    stockingList: [
      { commonName: 'Neon Tetra', scientificName: 'Paracheirodon innesi', count: '12–15', role: 'Mid-water schooling fish', notes: 'Add in a single group for best schooling behaviour.' },
      { commonName: 'Peppered Corydoras', scientificName: 'Corydoras paleatus', count: '6', role: 'Bottom cleaners', notes: 'Require sand substrate and groups of 6+.' },
      { commonName: 'Pearl Gourami', scientificName: 'Trichogaster leerii', count: '1 male, 2 female', role: 'Centrepiece fish', notes: 'Add last once tank is established.' },
    ],
    parameters: { temp: '76–78°F (24–26°C)', ph: '6.5–7.0', gh: '4–8 dGH', kh: '3–6 dKH', nitrate: 'Under 20 ppm' },
    substrate: 'Pool filter sand (1–2 inch layer) — safe for corydoras barbels.',
    filtration: 'Canister filter rated for 2× tank volume. Reduce flow with spray bar to avoid stressing mid-water species.',
    lighting: 'Full-spectrum LED, 6–8 hours per day on a timer. Moderate intensity.',
    plants: ['Java Fern', 'Anubias Nana', 'Amazon Sword', 'Hornwort (floating)'],
    hardscape: 'Smooth river stones, one or two pieces of driftwood. Avoid sharp edges that damage corydoras barbels.',
    sections: [
      { title: 'Setup Order', content: 'Cycle the tank for 4–6 weeks before adding fish. Add corydoras first as a bioload test, then tetras, then the gourami last.' },
      { title: 'Maintenance Schedule', content: '25–30% water change weekly. Gravel vacuum during water changes. Trim plants monthly. Test parameters weekly for first 2 months.' },
      { title: 'Feeding Guide', content: 'Feed tetras and gourami at the surface twice daily. Drop sinking wafers for corydoras at lights-out.' },
    ],
    warnings: ['This is a mock blueprint — set OPENAI_API_KEY for real AI-generated designs.'],
    generatedAt: new Date().toISOString(),
    mockMode: true,
  }
}

// ─── OpenAI prompt builder ────────────────────────────────────────────────────
function buildPrompt(input: BlueprintFormInput): string {
  return `You are a professional aquarium consultant and ichthyologist creating a detailed aquarium setup blueprint.

Tank specifications:
- Volume: ${input.tankSize} gallons
- Water type: ${input.waterType}
- Keeper experience: ${input.experience}
- Primary goal: ${input.primaryGoal}
- Budget: ${input.budget}
- Maintenance preference: ${input.maintenance} maintenance
- Breeding interest: ${input.includeBreeding ? 'Yes' : 'No'}
${input.notes ? `- Additional notes: ${input.notes}` : ''}

Generate a complete, scientifically accurate aquarium blueprint. Respond in valid JSON matching this exact structure:
{
  "title": "descriptive title for this specific setup",
  "summary": "2-3 sentence overview of the design approach and why it suits the keeper's goals",
  "stockingList": [
    {
      "commonName": "species common name",
      "scientificName": "Genus species",
      "count": "e.g. 10–12 or 1 male 2 female",
      "role": "ecological role in tank",
      "notes": "specific husbandry note for this species in this setup"
    }
  ],
  "parameters": {
    "temp": "range in °F and °C",
    "ph": "target range",
    "gh": "target range in dGH",
    "kh": "target range in dKH",
    "nitrate": "max safe level"
  },
  "substrate": "substrate recommendation with depth and reason",
  "filtration": "filter type, turnover rate, flow modification if needed",
  "lighting": "spectrum, intensity, duration",
  "plants": ["plant 1", "plant 2", "plant 3"],
  "hardscape": "hardscape description",
  "sections": [
    { "title": "Setup Order", "content": "detailed setup sequence" },
    { "title": "Cycling & Introduction", "content": "how and when to add fish" },
    { "title": "Maintenance Schedule", "content": "specific weekly/monthly tasks" },
    { "title": "Feeding Guide", "content": "what, how much, how often for each species group" },
    { "title": "Compatibility Notes", "content": "any behavioural considerations for this specific combination" }
  ],
  "warnings": ["any important cautions specific to this setup"]
}

Be specific, practical, and accurate. All species must be compatible with each other and with the stated water parameters. All parameter ranges must be achievable with the specified water type. Prioritize fish welfare over aesthetics.`
}

// ─── Route handler ────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as BlueprintFormInput

    // Validate required fields
    if (!body.tankSize || !body.waterType || !body.experience || !body.primaryGoal) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 })
    }

    if (body.tankSize < 2 || body.tankSize > 500) {
      return NextResponse.json({ error: 'Tank size must be between 2 and 500 gallons.' }, { status: 400 })
    }

    // If no API key, return mock
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      return NextResponse.json(getMockBlueprint(body))
    }

    // Real OpenAI call
    const { default: OpenAI } = await import('openai')
    const openai = new OpenAI({ apiKey })

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a professional aquarium consultant. Always respond with valid JSON only — no markdown, no code blocks, just the raw JSON object.',
        },
        {
          role: 'user',
          content: buildPrompt(body),
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
      response_format: { type: 'json_object' },
    })

    const raw = completion.choices[0]?.message?.content
    if (!raw) {
      return NextResponse.json({ error: 'No response from AI. Please try again.' }, { status: 500 })
    }

    let parsed: Omit<BlueprintOutput, 'generatedAt'>
    try {
      parsed = JSON.parse(raw)
    } catch {
      return NextResponse.json({ error: 'Failed to parse AI response. Please try again.' }, { status: 500 })
    }

    const output: BlueprintOutput = {
      ...parsed,
      generatedAt: new Date().toISOString(),
      mockMode: false,
    }

    return NextResponse.json(output)
  } catch (err) {
    console.error('[blueprint API error]', err)
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    )
  }
}
