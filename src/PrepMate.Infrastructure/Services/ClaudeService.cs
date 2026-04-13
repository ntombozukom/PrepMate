using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using PrepMate.Domain.Enums;
using PrepMate.Domain.Interfaces.Services;
using PrepMate.Infrastructure.Options;

namespace PrepMate.Infrastructure.Services;

public sealed class ClaudeService(
    HttpClient httpClient,
    IOptions<ClaudeOptions> options,
    ILogger<ClaudeService> logger)
    : IClaudeService
{
    private readonly ClaudeOptions _options = options.Value;
    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNameCaseInsensitive = true };

    public async Task<IReadOnlyList<GeneratedConcept>> GenerateConceptExplanationsAsync(
        ConceptExplanationRequest request,
        CancellationToken ct = default)
    {
        var systemPrompt = BuildSystemPrompt(request.Industry);
        var userPrompt = BuildConceptPrompt(request);

        var responseText = await CallClaudeAsync(systemPrompt, userPrompt, ct);

        return ParseConceptsFromResponse(responseText);
    }

    public async Task<IReadOnlyList<string>> GenerateInterviewQuestionsAsync(
        ConceptExplanationRequest request,
        CancellationToken ct = default)
    {
        var systemPrompt = BuildSystemPrompt(request.Industry);
        var userPrompt = BuildQuestionsPrompt(request);

        var responseText = await CallClaudeAsync(systemPrompt, userPrompt, ct);

        return ParseQuestionsFromResponse(responseText);
    }

    private async Task<string> CallClaudeAsync(string systemPrompt, string userPrompt, CancellationToken ct)
    {
        var requestBody = new
        {
            model = _options.Model,
            max_tokens = _options.MaxTokens,
            system = systemPrompt,
            messages = new[]
            {
                new { role = "user", content = userPrompt }
            }
        };

        var json = JsonSerializer.Serialize(requestBody);
        using var content = new StringContent(json, Encoding.UTF8, "application/json");

        httpClient.DefaultRequestHeaders.Clear();
        httpClient.DefaultRequestHeaders.Add("x-api-key", _options.ApiKey);
        httpClient.DefaultRequestHeaders.Add("anthropic-version", "2023-06-01");
        httpClient.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

        var response = await httpClient.PostAsync("https://api.anthropic.com/v1/messages", content, ct);

        if (!response.IsSuccessStatusCode)
        {
            var error = await response.Content.ReadAsStringAsync(ct);
            logger.LogError("Claude API error {Status}: {Error}", response.StatusCode, error);
            throw new HttpRequestException($"Claude API returned {response.StatusCode}: {error}");
        }

        var responseJson = await response.Content.ReadAsStringAsync(ct);
        using var doc = JsonDocument.Parse(responseJson);

        return doc.RootElement
            .GetProperty("content")[0]
            .GetProperty("text")
            .GetString() ?? string.Empty;
    }

    private static string BuildSystemPrompt(Industry industry)
    {
        var (industryContext, regulations, scenarios) = industry switch
        {
            Industry.Fintech => (
                "financial technology, payments, lending, digital banking, and fraud detection",
                "NCA (National Credit Act), POPIA, FICA/AML, PCI-DSS, PSD2",
                "loan origination systems, real-time payment rails, credit scoring engines, debit order processing, fraud velocity checks"),
            Industry.Banking => (
                "traditional and digital banking, core banking systems, and risk management",
                "Basel III, IFRS 9, SARB regulations, FICA, POPIA",
                "core banking modernisation, interest rate calculations, regulatory capital reporting, credit risk modelling"),
            Industry.Healthcare => (
                "healthcare IT, clinical systems, and medical data management",
                "HIPAA, POPIA, HL7/FHIR, ICD-10 coding standards",
                "electronic health records, patient identity matching, clinical workflow automation, medical device integration"),
            Industry.ECommerce => (
                "e-commerce platforms, digital retail, and online payment processing",
                "PCI-DSS, POPIA, Consumer Protection Act",
                "cart and checkout flows, inventory management, payment gateway integration, recommendation engines, flash sale traffic spikes"),
            Industry.Insurance => (
                "short-term and long-term insurance, underwriting, and claims management",
                "FSCA regulations, POPIA, Short-term Insurance Act, FAIS",
                "policy administration systems, claims adjudication engines, actuarial calculations, reinsurance, fraud detection"),
            Industry.Telecommunications => (
                "telecom infrastructure, billing systems, and network management",
                "ICASA regulations, POPIA, Consumer Protection Act",
                "prepaid/postpaid billing engines, subscriber management, real-time CDR processing, roaming, network slicing"),
            _ => (
                "general software engineering, cloud architecture, and enterprise systems",
                "POPIA, GDPR, ISO 27001",
                "microservices, distributed systems, CI/CD pipelines, cloud-native design")
        };

        return $$"""
            You are a senior technical interview coach — not a textbook author. You have 15+ years of
            hands-on production experience building systems in {{industryContext}}.

            Your ONLY goal: coach this candidate to answer interview questions the way a confident senior
            engineer would. You are sitting across the table from them the night before their interview.

            THE DIFFERENCE BETWEEN BAD AND GOOD PREP CONTENT:

            BAD (definition-style — DO NOT DO THIS):
            "A cache is a temporary storage mechanism that stores frequently accessed data to improve performance..."

            GOOD (coaching-style — THIS IS WHAT YOU PRODUCE):
            "The key insight with caching is that you're trading consistency for speed — say that upfront.
            Then explain: in-process cache (MemoryCache) is fastest but dies on restart; Redis survives
            restarts but adds a network hop. The interviewer will probe: what happens when cache and DB
            diverge? Know your invalidation strategy cold."

            FIELD-BY-FIELD INSTRUCTIONS:

            plainEnglishExplanation (3-4 sentences — THE OPENING HOOK):
            NOT a definition. This is the first 3-4 sentences the candidate says to demonstrate instant
            mastery. Start with: "The key insight is...", "The difference between X and Y is...", or
            "What most developers miss about X is..."
            Must include: what it does + the core mechanism in one sentence.

            analogy (1-2 sentences — THE "THINK OF IT AS" BOX):
            A memorable everyday analogy using zero tech jargon. Starts with "Think of [concept] as..."
            or "It's like...". Uses physical, real-world objects the candidate will instantly remember
            under pressure. Example: "Think of dependency injection like ordering food at a restaurant —
            you don't go into the kitchen yourself, you tell the waiter what you need and it arrives."

            technicalDepth (200-300 words — COACHING NOTES):
            Must contain ALL of:
            a) MECHANISM: how it works step-by-step under the hood
            b) COMPARISON: if the concept involves choosing between options, include a plain-text table
               using | Column | Column | format showing the key differences
            c) CODE: a real C# snippet using industry-appropriate names (use LoanAccount, PaymentService,
               ClaimDto, SubscriberRecord — NEVER Foo, Bar, or MyClass)
            d) PITFALL: "Never do X because...", "The interview gotcha is...", or "Common mistake:"
            e) RULE OF THUMB: "Use X when Y. Prefer Z when you need W."

            industryContext (80-120 words — GROUNDED PROOF POINT):
            How this concept shows up in REAL {{industryContext}} production systems.
            Reference at least one scenario from: {{scenarios}}.
            Name the specific regulation that forces this decision: {{regulations}}.
            Include one of: "The classic production failure here is...", "In [company type] this appears
            when...", or "The [regulation] requirement means you MUST..."

            suggestedAnswer (250-350 words — SPOKEN ANSWER SCRIPT, use line breaks between paragraphs):
            This is what the candidate will SAY out loud in the interview room. Paragraph breaks required.
            Structure:
            P1 — HOOK: 2 sentences showing immediate mastery (not "it is defined as...")
            P2 — MECHANISM: how it works (precise, not vague)
            P3 — TRADEOFFS: when NOT to use it / what breaks / the gotcha
            P4 — INDUSTRY: tie to {{industryContext}}, name a regulation or real system
            P5 — PERSONAL: "In my work with [specific tech from the CV]..." — make it personal

            Sound like a confident senior engineer, not a student. Be opinionated.
            """;
    }

    private static string BuildConceptPrompt(ConceptExplanationRequest request)
    {
        var cvSnippet = request.CvText[..Math.Min(request.CvText.Length, 4000)];
        var jdSnippet = request.JobDescriptionText[..Math.Min(request.JobDescriptionText.Length, 4000)];

        return $$"""
            ## Candidate
            Role applying for: {{request.JobTitle}}
            Industry: {{request.Industry}}

            CV — read this carefully to personalise every suggestedAnswer:
            {{cvSnippet}}

            ## Job Description
            {{jdSnippet}}

            ## Your Task
            Identify the 10 concepts this candidate will be grilled on hardest.
            Priority order:
            1. Concepts explicitly named in the JD (must know cold)
            2. Concepts the CV shows partial experience with — where a senior interviewer will probe deeper
            3. Concepts standard for senior {{request.JobTitle}} roles in {{request.Industry}}

            MANDATORY: At least 2 of the 10 concepts MUST come from this list (pick whichever are most
            relevant to the JD): SOLID principles, design patterns (pick one: Repository, CQRS, Mediator,
            Factory, Strategy, Observer), dependency injection & IoC containers, OOP principles
            (encapsulation/polymorphism/inheritance tradeoffs). A senior interviewer ALWAYS tests these.

            Apply your system prompt field instructions EXACTLY for every concept.
            Every answer must be personalised to THIS candidate's CV background — not generic.

            YOUR RESPONSE MUST START WITH [ AND END WITH ]
            Do not write any text, greeting, or explanation before or after the JSON array.
            Output the JSON array directly. First character of your response = [

            [
              {
                "topic": "3-6 word topic name",
                "question": "Exact question a senior interviewer will ask — specific, not generic",
                "plainEnglishExplanation": "Opening hook: key insight + mechanism. 3-4 sentences. NOT a definition. Starts with insight.",
                "analogy": "1-2 sentence everyday analogy. Starts with 'Think of...' or 'It\\'s like...'. Zero tech jargon.",
                "technicalDepth": "Coaching notes: mechanism, table if comparison needed, C# code with industry names, one pitfall, rule of thumb. 200-300 words.",
                "industryContext": "Grounded {{request.Industry}} proof point. Names a real system or regulation. 80-120 words.",
                "suggestedAnswer": "Full spoken answer script with paragraph breaks. Hook → mechanism → tradeoffs → industry tie-in → CV connection. 250-350 words.",
                "difficulty": "Fundamental|Intermediate|Advanced|Expert"
              }
            ]
            """;
    }

    private static string BuildQuestionsPrompt(ConceptExplanationRequest request)
    {
        var jobTitle = request.JobTitle;
        var industry = request.Industry.ToString();
        var jdSnippet = request.JobDescriptionText[..Math.Min(request.JobDescriptionText.Length, 2000)];

        return $$"""
            Job Title: {{jobTitle}}
            Industry: {{industry}}

            Job Description:
            {{jdSnippet}}

            List the top 15 interview questions a hiring manager would ask for this role.
            Respond with ONLY a JSON array of strings. Example: ["Question 1", "Question 2"]
            """;
    }

    private IReadOnlyList<GeneratedConcept> ParseConceptsFromResponse(string responseText)
    {
        var objects = ExtractJsonObjects(SanitizeJsonString(responseText));

        if (objects.Count == 0)
        {
            logger.LogError("Failed to parse Claude concepts response — no JSON objects found. Full response: {Response}",
                responseText[..Math.Min(responseText.Length, 500)]);
            return [];
        }

        var results = new List<GeneratedConcept>();
        foreach (var obj in objects)
        {
            try
            {
                var c = JsonSerializer.Deserialize<ClaudeConceptDto>(obj, JsonOptions);
                if (c?.Topic is null) continue;
                results.Add(new GeneratedConcept(
                    c.Topic,
                    c.Question ?? "N/A",
                    c.PlainEnglishExplanation ?? "N/A",
                    c.Analogy ?? string.Empty,
                    c.TechnicalDepth ?? string.Empty,
                    c.IndustryContext ?? string.Empty,
                    c.SuggestedAnswer ?? string.Empty,
                    ParseDifficulty(c.Difficulty)));
            }
            catch (JsonException ex)
            {
                logger.LogWarning(ex, "Skipping malformed concept object: {Snippet}",
                    obj[..Math.Min(obj.Length, 200)]);
            }
        }

        return results;
    }

    private static List<string> ExtractJsonObjects(string text)
    {
        var results = new List<string>();
        var i = 0;
        while (i < text.Length)
        {
            while (i < text.Length && text[i] != '{') i++;
            if (i >= text.Length) break;

            var start = i;
            var depth = 0;
            var inString = false;
            var escape = false;

            while (i < text.Length)
            {
                var c = text[i];
                if (escape) { escape = false; i++; continue; }
                if (c == '\\' && inString) { escape = true; i++; continue; }
                if (c == '"') { inString = !inString; i++; continue; }
                if (inString) { i++; continue; }
                if (c == '{') depth++;
                else if (c == '}')
                {
                    depth--;
                    if (depth == 0) { results.Add(text[start..(i + 1)]); i++; break; }
                }
                i++;
            }
        }
        return results;
    }

    public async Task<JdAnalysis> AnalyzeJobDescriptionAsync(string jobDescriptionText, CancellationToken ct = default)
    {
        var snippet = jobDescriptionText[..Math.Min(jobDescriptionText.Length, 3000)];
        const string systemPrompt = "You are a job description parser. Extract key metadata from job descriptions and return clean JSON only.";
        var userPrompt = $"""
            Extract the following from this job description:

            1. jobTitle — the exact job title advertised
            2. companyName — the hiring company name if explicitly mentioned, otherwise null
            3. industry — pick the SINGLE best match from this exact list:
               Fintech, Banking, Healthcare, ECommerce, Insurance, Telecommunications, Retail, Logistics, Education, GeneralSoftware

            Job Description:
            {snippet}

            Respond with ONLY valid JSON (no markdown, no code fences). Required keys: jobTitle (string), companyName (string or null), industry (string from the list above).
            """;

        var responseText = await CallClaudeAsync(systemPrompt, userPrompt, ct);
        return ParseJdAnalysis(responseText);
    }

    private JdAnalysis ParseJdAnalysis(string responseText)
    {
        try
        {
            var cleaned = responseText.Trim();
            using var doc = JsonDocument.Parse(cleaned);
            var root = doc.RootElement;

            var jobTitle = root.TryGetProperty("jobTitle", out var jt) ? jt.GetString() ?? "Software Engineer" : "Software Engineer";
            var companyName = root.TryGetProperty("companyName", out var cn) && cn.ValueKind != JsonValueKind.Null
                ? cn.GetString() : null;
            var industryStr = root.TryGetProperty("industry", out var ind) ? ind.GetString() ?? "" : "";

            var industry = industryStr.ToLowerInvariant() switch
            {
                "fintech"           => Industry.Fintech,
                "banking"           => Industry.Banking,
                "healthcare"        => Industry.Healthcare,
                "ecommerce"         => Industry.ECommerce,
                "insurance"         => Industry.Insurance,
                "telecommunications"=> Industry.Telecommunications,
                "retail"            => Industry.Retail,
                "logistics"         => Industry.Logistics,
                "education"         => Industry.Education,
                _                   => Industry.GeneralSoftware,
            };

            return new JdAnalysis(jobTitle, companyName, industry);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to parse JD analysis response: {Response}", responseText[..Math.Min(responseText.Length, 300)]);
            return new JdAnalysis("Software Engineer", null, Industry.GeneralSoftware);
        }
    }

    private IReadOnlyList<string> ParseQuestionsFromResponse(string responseText)
    {
        try
        {
            return JsonSerializer.Deserialize<List<string>>(ExtractJsonArray(responseText), JsonOptions) ?? [];
        }
        catch (JsonException ex)
        {
            logger.LogError(ex, "Failed to parse Claude questions response");
            return [];
        }
    }

    private static string ExtractJsonArray(string responseText)
    {
        var text = responseText.Trim();
        if (text.StartsWith("```"))
        {
            var fenceEnd = text.IndexOf('\n');
            if (fenceEnd >= 0) text = text[(fenceEnd + 1)..];
            var closeFence = text.LastIndexOf("```");
            if (closeFence >= 0) text = text[..closeFence].Trim();
        }
        var start = text.IndexOf('[');
        if (start < 0) return text;
        var depth = 0;
        var inString = false;
        var escape = false;
        for (var i = start; i < text.Length; i++)
        {
            var c = text[i];
            if (escape) { escape = false; continue; }
            if (c == '\\' && inString) { escape = true; continue; }
            if (c == '"') { inString = !inString; continue; }
            if (inString) continue;
            if (c == '[' || c == '{') depth++;
            else if (c == ']' || c == '}')
            {
                depth--;
                if (depth == 0) return text[start..(i + 1)];
            }
        }
        return text[start..];
    }

    private static string SanitizeJsonString(string raw)
    {
        var sb = new System.Text.StringBuilder(raw.Length);
        var inString = false;
        var escaped = false;
        foreach (var c in raw)
        {
            if (escaped) { sb.Append(c); escaped = false; continue; }
            if (c == '\\' && inString) { sb.Append(c); escaped = true; continue; }
            if (c == '"') { inString = !inString; sb.Append(c); continue; }
            if (inString)
            {
                switch (c)
                {
                    case '\n': sb.Append("\\n"); continue;
                    case '\r': sb.Append("\\r"); continue;
                    case '\t': sb.Append("\\t"); continue;
                }
            }
            sb.Append(c);
        }
        return sb.ToString();
    }

    private static DifficultyLevel ParseDifficulty(string? value) => value?.ToLower() switch
    {
        "intermediate" => DifficultyLevel.Intermediate,
        "advanced" => DifficultyLevel.Advanced,
        "expert" => DifficultyLevel.Expert,
        _ => DifficultyLevel.Fundamental
    };

    // ── CV Match Analysis ────────────────────────────────────────────────────────

    public async Task<CvMatchResult> AnalyzeCvMatchAsync(CvMatchRequest request, CancellationToken ct = default)
    {
        var cvSnippet = request.CvText[..Math.Min(request.CvText.Length, 4000)];
        var jdSnippet = request.JobDescriptionText[..Math.Min(request.JobDescriptionText.Length, 3000)];

        const string systemPrompt =
            "You are a senior technical recruiter and career coach. Analyse CV-to-job-description fit with precision. " +
            "Always return valid JS" +
            "" +
            "ON only — no markdown, no preamble.";

        var userPrompt = $$"""
            Compare this candidate's CV against the job description for the role: {{request.JobTitle}}

            ## CV
            {{cvSnippet}}

            ## Job Description
            {{jdSnippet}}

            Return a JSON object with exactly these fields:
            {
              "overallMatch": "Strong" | "Medium" | "Weak",
              "matchScore": integer 0-100,
              "matchedSkills": [
                { "skill": "skill name", "strength": "Strong|Medium|Weak", "evidence": "brief quote or reference from CV" }
              ],
              "skillGaps": [
                { "skill": "missing skill name", "importance": "High|Medium|Low", "tip": "how to address this gap quickly" }
              ],
              "experienceAlignment": "2-3 sentences on how the candidate's experience aligns with or differs from what the role needs",
              "recommendation": "1-2 sentence coaching recommendation — be direct and actionable"
            }

            matchScore guide: 70-100 = Strong, 40-69 = Medium, 0-39 = Weak.
            Include 4-8 matched skills and 2-6 skill gaps. Be specific — reference actual technologies and experiences.
            """;

        var responseText = await CallClaudeAsync(systemPrompt, userPrompt, ct);
        return ParseCvMatchResult(responseText);
    }

    private CvMatchResult ParseCvMatchResult(string responseText)
    {
        try
        {
            var cleaned = SanitizeJsonString(ExtractJsonArray(responseText.Trim().StartsWith("[")
                ? responseText
                : "{" + responseText.Trim().TrimStart('{').TrimEnd('}')));

            // Find the root object
            var objects = ExtractJsonObjects(SanitizeJsonString(responseText));
            if (objects.Count == 0)
            {
                logger.LogError("CvMatchResult: no JSON object found. Response: {R}", responseText[..Math.Min(500, responseText.Length)]);
                return FallbackMatchResult();
            }

            using var doc = JsonDocument.Parse(objects[0]);
            var root = doc.RootElement;

            var overallMatch = root.TryGetProperty("overallMatch", out var om) ? om.GetString() ?? "Medium" : "Medium";
            var matchScore = root.TryGetProperty("matchScore", out var ms) ? ms.GetInt32() : 50;
            var experienceAlignment = root.TryGetProperty("experienceAlignment", out var ea) ? ea.GetString() ?? "" : "";
            var recommendation = root.TryGetProperty("recommendation", out var rec) ? rec.GetString() ?? "" : "";

            var matchedSkills = new List<MatchedSkill>();
            if (root.TryGetProperty("matchedSkills", out var skillsArr) && skillsArr.ValueKind == JsonValueKind.Array)
            {
                foreach (var s in skillsArr.EnumerateArray())
                {
                    var skill = s.TryGetProperty("skill", out var sk) ? sk.GetString() ?? "" : "";
                    var strength = s.TryGetProperty("strength", out var st) ? st.GetString() ?? "Medium" : "Medium";
                    var evidence = s.TryGetProperty("evidence", out var ev) ? ev.GetString() ?? "" : "";
                    if (!string.IsNullOrWhiteSpace(skill))
                        matchedSkills.Add(new MatchedSkill(skill, strength, evidence));
                }
            }

            var skillGaps = new List<SkillGap>();
            if (root.TryGetProperty("skillGaps", out var gapsArr) && gapsArr.ValueKind == JsonValueKind.Array)
            {
                foreach (var g in gapsArr.EnumerateArray())
                {
                    var skill = g.TryGetProperty("skill", out var sk) ? sk.GetString() ?? "" : "";
                    var importance = g.TryGetProperty("importance", out var imp) ? imp.GetString() ?? "Medium" : "Medium";
                    var tip = g.TryGetProperty("tip", out var tp) ? tp.GetString() ?? "" : "";
                    if (!string.IsNullOrWhiteSpace(skill))
                        skillGaps.Add(new SkillGap(skill, importance, tip));
                }
            }

            return new CvMatchResult(overallMatch, matchScore, matchedSkills, skillGaps, experienceAlignment, recommendation);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to parse CvMatchResult. Response: {R}", responseText[..Math.Min(500, responseText.Length)]);
            return FallbackMatchResult();
        }
    }

    private static CvMatchResult FallbackMatchResult() =>
        new("Medium", 50, [], [], "Could not analyse match at this time.", "Upload a more detailed CV for better match analysis.");

    // ── Cover Letter Generator ────────────────────────────────────────────────

    public async Task<CoverLetterResult> GenerateCoverLetterAsync(CoverLetterRequest request, CancellationToken ct = default)
    {
        var cvSnippet = request.CvText[..Math.Min(request.CvText.Length, 4000)];
        var jdSnippet = request.JobDescriptionText?[..Math.Min(request.JobDescriptionText.Length, 2000)];

        const string systemPrompt =
            "You are an expert career coach who writes compelling, personalised cover letters. " +
            "Write in a confident, professional tone. Return valid JSON only.";

        var jdSection = string.IsNullOrWhiteSpace(jdSnippet)
            ? "No specific job description provided — write a strong general cover letter based on the CV."
            : $"## Job Description\n{jdSnippet}";

        var companySection = string.IsNullOrWhiteSpace(request.CompanyName)
            ? ""
            : $"\nCompany: {request.CompanyName}";

        var roleSection = string.IsNullOrWhiteSpace(request.JobTitle)
            ? ""
            : $"\nRole: {request.JobTitle}";

        var userPrompt = $$"""
            Write a professional cover letter for this candidate.{{roleSection}}{{companySection}}

            ## Candidate CV
            {{cvSnippet}}

            {{jdSection}}

            Guidelines:
            - 3-4 paragraphs: opening hook, relevant experience alignment, specific value proposition, closing CTA
            - Reference specific skills and achievements from the CV
            - If a JD is provided, mirror its key language and requirements
            - Sound like a confident, experienced professional — not a template
            - Do NOT use "I am writing to apply for..." as an opener
            - Keep it under 400 words

            Return JSON: { "coverLetter": "full cover letter text with \n\n paragraph breaks", "tone": "Professional|Enthusiastic|Executive" }
            """;

        var responseText = await CallClaudeAsync(systemPrompt, userPrompt, ct);
        return ParseCoverLetterResult(responseText);
    }

    private CoverLetterResult ParseCoverLetterResult(string responseText)
    {
        try
        {
            var objects = ExtractJsonObjects(SanitizeJsonString(responseText));
            if (objects.Count == 0)
            {
                logger.LogError("CoverLetterResult: no JSON object found.");
                return new CoverLetterResult(responseText.Trim(), "Professional");
            }

            using var doc = JsonDocument.Parse(objects[0]);
            var root = doc.RootElement;
            var letter = root.TryGetProperty("coverLetter", out var cl) ? cl.GetString() ?? responseText : responseText;
            var tone = root.TryGetProperty("tone", out var t) ? t.GetString() ?? "Professional" : "Professional";
            return new CoverLetterResult(letter, tone);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to parse CoverLetterResult.");
            return new CoverLetterResult(responseText.Trim(), "Professional");
        }
    }

    // ── ATS Optimiser ─────────────────────────────────────────────────────────

    public async Task<AtsOptimizationResult> OptimizeCvAtsAsync(string cvText, CancellationToken ct = default)
    {
        var cvSnippet = cvText[..Math.Min(cvText.Length, 5000)];

        const string systemPrompt =
            "You are an ATS (Applicant Tracking System) optimisation expert. " +
            "Analyse CVs for ATS compatibility and provide actionable improvements. Return valid JSON only.";

        var userPrompt = $$"""
            Analyse this CV for ATS compatibility and provide optimisation advice.

            ## CV
            {{cvSnippet}}

            ATS systems scan for: keyword density, formatting (no tables/headers/columns), standard section headings,
            measurable achievements, and relevant skills sections.

            Return JSON with exactly these fields:
            {
              "score": integer 0-100 (ATS compatibility score before your rewrite),
              "strengths": ["list of 3-5 things the CV does well for ATS"],
              "improvements": ["list of 4-7 specific changes made in the rewritten CV"],
              "rewrittenSummary": "The rewritten professional summary section only (2-3 sentences, keyword-rich, quantified)",
              "keywordsToAdd": ["list of 8-12 keywords/phrases added or emphasised in the rewrite"],
              "rewrittenCv": "The COMPLETE rewritten CV as plain text. Preserve all sections (Experience, Education, Skills, etc). Fix: remove tables/columns, use standard headings, add missing keywords, quantify achievements, use action verbs. Keep all real information — do NOT invent experience. Use \\n for line breaks between sections."
            }

            Be specific and actionable. The rewrittenCv must be a complete, job-ready document the candidate can copy and use.
            """;

        var responseText = await CallClaudeAsync(systemPrompt, userPrompt, ct);
        return ParseAtsResult(responseText);
    }

    private AtsOptimizationResult ParseAtsResult(string responseText)
    {
        try
        {
            var objects = ExtractJsonObjects(SanitizeJsonString(responseText));
            if (objects.Count == 0)
            {
                logger.LogError("AtsOptimizationResult: no JSON object found.");
                return new AtsOptimizationResult(50, [], ["Could not analyse CV at this time."], "", [], "");
            }

            using var doc = JsonDocument.Parse(objects[0]);
            var root = doc.RootElement;

            var score = root.TryGetProperty("score", out var sc) ? sc.GetInt32() : 50;
            var summary = root.TryGetProperty("rewrittenSummary", out var rs) ? rs.GetString() ?? "" : "";
            var rewrittenCv = root.TryGetProperty("rewrittenCv", out var rcv) ? rcv.GetString() ?? "" : "";
            var strengths = ParseStringArray(root, "strengths");
            var improvements = ParseStringArray(root, "improvements");
            var keywords = ParseStringArray(root, "keywordsToAdd");

            return new AtsOptimizationResult(score, strengths, improvements, summary, keywords, rewrittenCv);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to parse AtsOptimizationResult.");
            return new AtsOptimizationResult(50, [], ["Could not analyse CV at this time."], "", []);
        }
    }

    private static List<string> ParseStringArray(JsonElement root, string propertyName)
    {
        var result = new List<string>();
        if (root.TryGetProperty(propertyName, out var arr) && arr.ValueKind == JsonValueKind.Array)
        {
            foreach (var item in arr.EnumerateArray())
            {
                var s = item.GetString();
                if (!string.IsNullOrWhiteSpace(s)) result.Add(s);
            }
        }
        return result;
    }

    // Internal DTO matching Claude's JSON output
    private sealed class ClaudeConceptDto
    {
        public string? Topic { get; set; }
        public string? Question { get; set; }
        public string? PlainEnglishExplanation { get; set; }
        public string? Analogy { get; set; }
        public string? TechnicalDepth { get; set; }
        public string? IndustryContext { get; set; }
        public string? SuggestedAnswer { get; set; }
        public string? Difficulty { get; set; }
    }
}
