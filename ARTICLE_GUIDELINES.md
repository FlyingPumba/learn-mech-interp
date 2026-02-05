# Article Guidelines

Guidelines for writing articles in the mechanistic interpretability curriculum.

---

## What Makes an Article

### Articles are about concepts, not papers

An article should cover a **technique**, **concept**, or **idea** that stands on its own as a unit of understanding. Articles are *not* summaries of individual papers.

When someone suggests "add an article about Paper X," the right response is to read the paper and ask: *What techniques or concepts does this paper introduce or advance?* Sometimes a paper introduces one major concept worth covering. Sometimes it introduces several. Sometimes it contributes incremental improvements that belong in an existing article rather than a new one. Sometimes the contribution is too narrow or too application-specific for this curriculum.

**Good article topics:**
- A technique: "Activation Patching," "Direct Logit Attribution," "Sparse Autoencoders"
- A concept: "Superposition," "The Linear Representation Hypothesis," "Induction Heads"
- A class of methods: "Probing Classifiers," "Steering Methods"

**Not article topics:**
- A paper: "Towards Monosemanticity" (instead: extract "Sparse Autoencoders" as the concept)
- A model: "Interpreting GPT-2" (instead: techniques used are the articles)
- A dataset or benchmark: "The IOI Dataset" (instead: fold into the technique article that uses it)

### When to create a new article vs. extend an existing one

Create a new article when:
- The concept is distinct enough that someone might want to learn it independently
- It requires enough background that adding it to an existing article would make that article too long
- It represents a meaningfully different approach (not just a variant)

Extend an existing article when:
- The new material is a refinement, variant, or direct extension of the existing topic
- It wouldn't make sense to learn the new material without the existing context
- The addition keeps the article under ~25 minutes reading time

### The paper-to-article workflow

When evaluating a paper for potential articles:

1. **Identify the core contributions.** What new technique, concept, or finding does it introduce?
2. **Check for overlap.** Does an existing article already cover this? Would it fit better as an addition there?
3. **Assess generality.** Is this specific to one model/task, or does it represent a broader idea?
4. **Consider prerequisites.** What would a reader need to know first? Does that prerequisite chain make sense in the curriculum?

A single influential paper might spawn zero articles (if its contributions are incremental), one article (the common case), or multiple articles (if it introduces several distinct concepts).

---

## Tone

### Voice
- **Second-person inclusive**: Use "we" to bring the reader along. "We can decompose the output..." rather than "The output can be decomposed..."
- **Direct and confident**: State claims clearly. Avoid excessive hedging ("it seems like," "it might be the case that"). When something is uncertain, be explicit about *why* it's uncertain rather than hedging vaguely.
- **Intellectually honest**: Acknowledge limitations, open questions, and areas of genuine uncertainty. Don't oversell results.

### Register
- Academic but accessible. Imagine the reader is a motivated graduate student or self-learner who has the math background but is new to the specific topic.
- Avoid hype language ("groundbreaking," "revolutionary," "game-changing").
- Avoid LLM-isms ("delve into," "crucial," "it's important to note that").
- Technical vocabulary is fine when necessary, but define terms on first use.

### Attitude toward the field
- MI is a young, rapidly evolving field. Present findings as the current best understanding, not eternal truth.
- Original papers are cited as evidence, not as authority. The goal is understanding, not reverence.

---

## Structure

### Opening
- Start with motivation: *why* does this topic matter? What problem does it solve?
- Ground the topic in something concrete before introducing abstractions.
- Avoid generic "In this article we will..." openings.

### Sections
- Use clear H2 headers (`##`) for major sections.
- Each section should make one main point.
- Sections typically run 150-400 words. Break up longer sections.

### Definitions
- Use blockquotes for key definitions:
  ```markdown
  > **Term:** Definition here. Keep it concise and actionable.
  ```
- Define terms at the point where they become necessary, not in an upfront glossary.

### Math
- Present equations with context. Explain what each term means.
- Build up to complex equations through simpler intermediate steps.
- Use inline math for variables (`$\mathbf{x}$`) and display math for key equations.
- After an equation, often explain it again in words: "This says that..."

### Sidenotes
- Use `{% sidenote "..." %}` for:
  - Tangential but interesting details
  - Caveats and edge cases
  - Historical context
  - Connections to other fields
- Sidenotes should be skippable. The main text should stand alone.

### "Pause and Think" sections
- Use `<details class="pause-and-think">` blocks to prompt active engagement.
- Pose a question that requires applying the concepts just introduced.
- Can include the answer/discussion in the collapsed section.
- Aim for 1-3 per article.

### Cross-references
- Link to other articles in the curriculum where relevant: `[topic name](/topics/topic-slug/)`.
- Forward references ("We will cover this in [later article]") and backward references ("As we saw in [earlier article]") both help readers navigate.

### Closing
- Brief "Looking Ahead" section connecting to the next topic(s).
- No summaries that repeat what was already said.

---

## Content

### What to include
- **Conceptual understanding**: The *why* behind techniques, not just the *how*.
- **Concrete examples**: Work through a specific case before generalizing.
- **Mathematical grounding**: Enough math to be precise, but motivated by intuition.
- **Limitations and caveats**: What doesn't work, what's unknown, where the technique breaks down.
- **Connections to safety**: Where relevant, tie MI techniques to AI safety applications.
- **Original sources**: Cite papers with `{% cite "key" %}`. The bibliography is centralized.

### What to exclude
- **Implementation details**: This is not a coding tutorial. Code snippets are rare and brief.
- **Exhaustive literature reviews**: Cite key papers, not every related paper.
- **Step-by-step tutorials**: Focus on understanding, not reproduction.
- **Speculation beyond evidence**: Present what's known. Flag speculation clearly.

### Depth calibration
- Deep enough to build genuine understanding.
- Shallow enough that a motivated reader can complete an article in 15-25 minutes.
- When more depth is needed, link to the original paper or a dedicated follow-up article.

---

## Pedagogical Approach

### Build mental models
- Aim to leave the reader with a clear mental picture they can reason with.
- Use analogies sparingly, but when they clarify, use them.
- Diagrams and figures support understanding (reference them in the text).

### Concrete before abstract
- Introduce a specific example, *then* generalize.
- "Consider a sequence where a pattern repeats: [A][B]...[A] → predict [B]" comes before the abstract induction head definition.

### Progressive complexity
- Start simple, add complexity incrementally.
- The toy model before the full model. The 2D case before the high-dimensional case.

### Active engagement
- "Pause and Think" sections ask readers to work things out.
- Rhetorical questions can prompt reflection, but don't overuse.

### Connect backward and forward
- Show how new concepts build on earlier ones.
- Preview how this topic enables understanding of later ones.

---

## Formatting Details

### Emphasis
- **Bold** for key terms on first introduction and for emphasis on critical points.
- *Italics* for softer emphasis and for contrasts ("not just *what* but *how*").
- Avoid all-caps and exclamation points.

### Lists
- Use bullets for unordered items, numbers only when sequence matters.
- Keep list items parallel in structure.

### Figures
- Use standard HTML figure/figcaption for images:
  ```markdown
  <figure>
    <img src="..." alt="Descriptive alt text.">
    <figcaption>Caption here. {% cite "source" %}</figcaption>
  </figure>
  ```
- Or markdown image syntax with alt text for simpler cases.
- All figures should be referenced in the text.

### Citations
- Use `{% cite "bibtex-key" %}` inline.
- Cite at the point where the claim is made, not at the end of a paragraph.

---

## Checklist

Before creating an article:

- [ ] Is this about a technique/concept/idea (not a paper summary)?
- [ ] Does it warrant a standalone article, or should it extend an existing one?
- [ ] Are the prerequisites clear and already covered in the curriculum?

Before finalizing an article:

- [ ] Does the opening motivate *why* this matters?
- [ ] Are key terms defined with blockquote definitions?
- [ ] Is there at least one concrete example before generalizing?
- [ ] Are equations explained in words, not just displayed?
- [ ] Are limitations and caveats acknowledged?
- [ ] Is there at least one "Pause and Think" section?
- [ ] Are relevant other articles cross-linked?
- [ ] Does the closing connect to what comes next?
- [ ] Are all citations in place?
- [ ] Is the tone direct and free of hype/LLM-isms?
