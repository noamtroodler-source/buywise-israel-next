import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const JRE_AGENCY_ID = "0eb2a33b-a768-4204-ba75-29de29d6da2a";
const MICHAEL_AGENT_ID = "8a39b05f-3b6a-4f13-9e41-57d4224ffa96";
const IMG_BASE = "https://jerusalem-real-estate.co/wp-content/uploads/";

interface AgentData {
  name: string;
  email: string;
  phone: string | null;
  bio: string;
  avatar_url: string;
  linkedin_url: string | null;
  languages: string[];
  specializations: string[];
  neighborhoods_covered: string[];
  years_experience: number;
  agency_role: string;
}

const agents: AgentData[] = [
  {
    name: "Abby Brill Schloss",
    email: "abby@jrealestate.co.il",
    phone: "+972-54-555-0102",
    bio: "Originally from America, Abby made Aliyah in 2017 and fell in love with Jerusalem. With a background in interior design and a natural eye for potential, Abby brings a unique perspective to real estate. She is passionate about helping clients navigate the Jerusalem property market, offering a hand-holding service from initial search through to closing. Abby's warm and personable approach ensures every client feels supported and confident throughout the process.",
    avatar_url: IMG_BASE + "2023/08/Abby-Schloss-hs-sq.jpg",
    linkedin_url: "https://www.linkedin.com/in/abby-brill-schloss-099b432b8",
    languages: ["English", "Hebrew"],
    specializations: ["Residential Sales", "Interior Design Consultation", "Buyer Representation"],
    neighborhoods_covered: ["Old Katamon", "Baka", "German Colony"],
    years_experience: 6,
    agency_role: "agent",
  },
  {
    name: "Simone Gershon",
    email: "simone@jrealestate.co.il",
    phone: "+972-54-555-0103",
    bio: "Born and raised in Sydney, Australia, Simone has called Jerusalem home for over 20 years. Her extensive background in the hotel industry honed her exceptional customer service skills, which she now brings to the world of real estate. Simone's deep knowledge of Jerusalem's neighborhoods, combined with her warm and professional demeanor, makes her an invaluable guide for buyers and sellers alike. She is dedicated to finding the perfect match between clients and properties.",
    avatar_url: IMG_BASE + "2023/08/Simone-Gershon-hs-sq.jpg",
    linkedin_url: "https://www.linkedin.com/in/simone-gershon",
    languages: ["English", "Hebrew"],
    specializations: ["Residential Sales", "Relocation Services", "Customer Relations"],
    neighborhoods_covered: ["Baka", "Rehavia", "Old Katamon"],
    years_experience: 5,
    agency_role: "agent",
  },
  {
    name: "Elad Ginzburg",
    email: "elad@jrealestate.co.il",
    phone: "+972-54-555-0104",
    bio: "Elad brings a sharp analytical mind to Jerusalem real estate, with a BA in Economics and experience in US multi-family investing. He specializes in off-market opportunities and new development projects, leveraging his extensive network to connect clients with exclusive deals before they hit the open market. Elad's data-driven approach and deep market knowledge make him the go-to agent for investors and buyers seeking high-value opportunities in Jerusalem.",
    avatar_url: IMG_BASE + "2024/01/Elad-Ginzburg-headshot-t.png",
    linkedin_url: "https://www.linkedin.com/in/elad-ginzburg-82194516a",
    languages: ["English", "Hebrew"],
    specializations: ["Off-Market Deals", "Investment Properties", "New Developments"],
    neighborhoods_covered: ["City Center", "Rehavia", "Talbiya"],
    years_experience: 4,
    agency_role: "agent",
  },
  {
    name: "Atara Abelman",
    email: "atara@jrealestate.co.il",
    phone: "+972-54-555-0105",
    bio: "Atara grew up between America and South Africa before making Aliyah to Israel. With a background in tech sales, she brings a results-oriented and tech-savvy approach to real estate. Atara excels at understanding client needs and matching them with the right property, using modern tools and market data to streamline the process. Her energy, enthusiasm, and commitment to client satisfaction set her apart in Jerusalem's competitive market.",
    avatar_url: IMG_BASE + "2023/08/Atara-Abelman-hs-sq.jpg",
    linkedin_url: "https://www.linkedin.com/in/atara-abelman-42b0ba204",
    languages: ["English", "Hebrew"],
    specializations: ["Residential Sales", "Tech-Savvy Marketing", "First-Time Buyers"],
    neighborhoods_covered: ["City Center", "Arnona", "Baka"],
    years_experience: 3,
    agency_role: "agent",
  },
  {
    name: "Penina Abramowitz",
    email: "penina@jrealestate.co.il",
    phone: "+972-54-555-0106",
    bio: "Penina's background in interior design gives her an exceptional ability to see the hidden potential in every property. Having personally flipped three homes, she brings firsthand renovation and investment experience to her clients. Penina is passionate about helping buyers envision what a property can become, not just what it is today. Her creative eye and practical knowledge make her an ideal partner for buyers looking for value-add opportunities in Jerusalem.",
    avatar_url: IMG_BASE + "2023/08/Untitled-design.jpg",
    linkedin_url: null,
    languages: ["English", "Hebrew"],
    specializations: ["Renovation Projects", "Interior Design", "Value-Add Investments"],
    neighborhoods_covered: ["Old Katamon", "Rehavia", "Mekor Haim"],
    years_experience: 4,
    agency_role: "agent",
  },
  {
    name: "Igal Elmaleh",
    email: "igal@jrealestate.co.il",
    phone: "+972-54-555-0107",
    bio: "Igal brings a wealth of financial and asset management experience to Jerusalem real estate. With a background in HUD loans and shopping mall asset management, he has a deep understanding of property valuation, investment returns, and market dynamics. Igal specializes in investment properties and commercial real estate, helping clients build and optimize their portfolios. His analytical approach and negotiation skills make him a trusted advisor for serious investors.",
    avatar_url: IMG_BASE + "2023/08/Igal-Elmaleh-hs-sq.jpg",
    linkedin_url: "https://www.linkedin.com/in/igal-elmaleh-10591a197",
    languages: ["English", "Hebrew", "French"],
    specializations: ["Investment Properties", "Commercial Real Estate", "Asset Management"],
    neighborhoods_covered: ["City Center", "Mamilla", "Talbiya"],
    years_experience: 5,
    agency_role: "agent",
  },
  {
    name: "Naftali Berezin",
    email: "naftali@jrealestate.co.il",
    phone: "+972-54-555-0108",
    bio: "Naftali's career in luxury hospitality — including roles at Hyatt Hotels and The Beekman in New York — shaped his commitment to white-glove client service. As VP of Client Relations at Jerusalem Real Estate, he ensures every client receives a seamless and personalized experience. Naftali's strong social media presence and marketing expertise help properties reach the right audience, while his attention to detail and professionalism keep transactions running smoothly.",
    avatar_url: IMG_BASE + "2024/01/Naftali_Berezin-headshot-t.png",
    linkedin_url: "https://www.linkedin.com/in/naftali-berezin-794228287",
    languages: ["English", "Hebrew"],
    specializations: ["Client Relations", "Luxury Properties", "Marketing"],
    neighborhoods_covered: ["Talbiya", "City Center", "German Colony"],
    years_experience: 4,
    agency_role: "manager",
  },
  {
    name: "Tammy Ziv",
    email: "tammy@jrealestate.co.il",
    phone: "+972-54-555-0109",
    bio: "With over 26 years of experience in Jerusalem real estate, Tammy is one of the city's most seasoned agents. Born in Talbiya and having lived in London, she brings a cosmopolitan perspective and deep local roots to every transaction. Tammy's unmatched knowledge of Jerusalem's prime neighborhoods, combined with decades of market expertise, makes her an exceptional resource for clients seeking properties in the city's most sought-after areas.",
    avatar_url: IMG_BASE + "2024/01/Tammy_Ziv-headshot-t.png",
    linkedin_url: null,
    languages: ["English", "Hebrew"],
    specializations: ["Luxury Residential", "Prime Neighborhoods", "Long-Term Investment"],
    neighborhoods_covered: ["Talbiya", "German Colony", "Rehavia", "Old Katamon"],
    years_experience: 26,
    agency_role: "agent",
  },
  {
    name: "Jonas Halfon",
    email: "jonas@jrealestate.co.il",
    phone: "+972-54-555-0110",
    bio: "Jonas brings 9 years of luxury real estate experience and fluency in French, English, and Hebrew, making him the ideal agent for Jerusalem's international clientele. His deep understanding of the luxury market segment and ability to communicate across cultures sets him apart. Jonas specializes in high-end properties in Jerusalem's most prestigious neighborhoods, offering a discreet and professional service tailored to discerning buyers and sellers.",
    avatar_url: IMG_BASE + "2024/01/Jonas_Halfon-headshot-t.png",
    linkedin_url: null,
    languages: ["French", "English", "Hebrew"],
    specializations: ["Luxury Properties", "International Clients", "French-Speaking Market"],
    neighborhoods_covered: ["Talbiya", "Mamilla", "Rehavia", "German Colony"],
    years_experience: 9,
    agency_role: "agent",
  },
  {
    name: "Shimon Mozes",
    email: "shimon@jrealestate.co.il",
    phone: "+972-54-555-0111",
    bio: "Shimon's background in law gives him a meticulous and detail-oriented approach to real estate transactions. His strong interpersonal skills and ability to build trust with clients make the buying and selling process feel smooth and transparent. Shimon is dedicated to protecting his clients' interests while finding creative solutions to complex deals. His legal training and market knowledge combine to offer a uniquely thorough service.",
    avatar_url: IMG_BASE + "2024/01/Shimon_Mozes-headshot-t.png",
    linkedin_url: null,
    languages: ["English", "Hebrew"],
    specializations: ["Legal Expertise", "Contract Negotiation", "Residential Sales"],
    neighborhoods_covered: ["Arnona", "Baka", "Old Katamon"],
    years_experience: 5,
    agency_role: "agent",
  },
];

const michaelUpdate: Partial<AgentData> & { name: string } = {
  name: "Michael Steinmetz",
  bio: "Michael Steinmetz is the founder and owner of Jerusalem Real Estate, one of the city's leading boutique agencies. With over a decade of experience in Jerusalem's property market, Michael has built a reputation for integrity, market expertise, and personalized service. He leads a team of dedicated professionals who share his passion for helping clients find their perfect home or investment in Jerusalem. Michael's deep connections across the city's neighborhoods and his commitment to transparency have made JRE a trusted name in Jerusalem real estate.",
  avatar_url: IMG_BASE + "2023/08/Michael-Steinmetz-hs-sq.jpg",
  linkedin_url: "https://www.linkedin.com/in/steinmetzmichael",
  languages: ["English", "Hebrew"],
  specializations: ["Agency Management", "Luxury Residential", "Investment Advisory"],
  neighborhoods_covered: ["Rehavia", "Talbiya", "German Colony", "Mamilla", "Old Katamon"],
  years_experience: 10,
  agency_role: "owner",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const results: string[] = [];

    // Step 1: Update Michael
    const { error: michaelError } = await supabase
      .from("agents")
      .update({
        name: michaelUpdate.name,
        bio: michaelUpdate.bio,
        avatar_url: michaelUpdate.avatar_url,
        linkedin_url: michaelUpdate.linkedin_url,
        languages: michaelUpdate.languages,
        specializations: michaelUpdate.specializations,
        neighborhoods_covered: michaelUpdate.neighborhoods_covered,
        years_experience: michaelUpdate.years_experience,
        agency_role: michaelUpdate.agency_role,
        is_verified: true,
      })
      .eq("id", MICHAEL_AGENT_ID);

    if (michaelError) {
      results.push(`❌ Michael update failed: ${michaelError.message}`);
    } else {
      results.push(`✅ Updated Michael Steinmetz`);
    }

    // Step 2: Create 10 new agents
    const newAgentIds: string[] = [MICHAEL_AGENT_ID];

    for (const agent of agents) {
      // Check if agent already exists by email
      const { data: existing } = await supabase
        .from("agents")
        .select("id")
        .eq("email", agent.email)
        .maybeSingle();

      if (existing) {
        results.push(`⏭️ ${agent.name} already exists (${existing.id})`);
        newAgentIds.push(existing.id);
        continue;
      }

      const { data: inserted, error: insertError } = await supabase
        .from("agents")
        .insert({
          name: agent.name,
          email: agent.email,
          phone: agent.phone,
          bio: agent.bio,
          avatar_url: agent.avatar_url,
          linkedin_url: agent.linkedin_url,
          languages: agent.languages,
          specializations: agent.specializations,
          neighborhoods_covered: agent.neighborhoods_covered,
          years_experience: agent.years_experience,
          agency_id: JRE_AGENCY_ID,
          agency_name: "Jerusalem Real Estate",
          agency_role: agent.agency_role,
          is_verified: true,
          status: "active",
        })
        .select("id")
        .single();

      if (insertError) {
        results.push(`❌ ${agent.name} insert failed: ${insertError.message}`);
      } else {
        results.push(`✅ Created ${agent.name} (${inserted.id})`);
        newAgentIds.push(inserted.id);
      }
    }

    // Step 3: Distribute 105 listings across all agents (round-robin)
    // Properties don't have agency_id — find via agent_id
    const { data: jreAgentIds } = await supabase
      .from("agents")
      .select("id")
      .eq("agency_id", JRE_AGENCY_ID);
    
    const agentIdSet = (jreAgentIds || []).map((a: any) => a.id);
    // Fetch all properties belonging to any JRE agent
    const { data: listings, error: listingsError } = await supabase
      .from("properties")
      .select("id")
      .in("agent_id", agentIdSet)
      .order("created_at", { ascending: true });

    if (listingsError) {
      results.push(`❌ Failed to fetch listings: ${listingsError.message}`);
    } else {
      let updated = 0;
      let failed = 0;
      for (let i = 0; i < (listings?.length || 0); i++) {
        const agentId = newAgentIds[i % newAgentIds.length];
        const { error } = await supabase
          .from("properties")
          .update({ agent_id: agentId })
          .eq("id", listings![i].id);
        if (error) failed++;
        else updated++;
      }
      results.push(`✅ Distributed ${updated} listings across ${newAgentIds.length} agents (${failed} failures)`);
    }

    return new Response(JSON.stringify({ results }, null, 2), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
