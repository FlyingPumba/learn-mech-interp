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
- A case study: "How GPT-2 Handles IOI" (instead: extract the techniques used — activation patching, circuit analysis — those are the articles)
- A specific experimental finding: "World Models in Othello-GPT" (instead: if a reusable technique is involved, cover the technique; cite the finding as evidence)

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
3. **Assess generality.** Is this specific to one model/task, or does it represent a broader technique or concept? Specific experimental findings (e.g., "model X learns a world model," "circuit Y exists in model Z") are evidence to cite in technique articles, not standalone topics. The article should be about the technique that uncovered the finding, not the finding itself.
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

### Every sentence must carry content

Two failure modes account for most prose that reads as machine-written. Both are transitions that occupy a sentence without saying anything, and both are easiest to catch by asking: *if I delete this sentence, what information is lost?* If the answer is "none," delete it.

**Don't announce that something is important.** Telling the reader to pay attention is not the same as giving them a reason to. State the claim and let its significance be evident.

| Bad | Good |
|-----|------|
| Mechanistic faithfulness is the one worth slowing down on, because it is doing more work than it looks like. | Mechanistic faithfulness is the odd one out. The other three constrain the components one at a time; this one constrains every *combination* of them at once. |
| The bracket-counting circuit is worth following, because it produced the kind of result that distinguishes understanding from description. | A circuit read off the weights can be complete, validated, and still tell us nothing we could not have got from a behavioral description. The bracket-counting circuit went further: it predicted a way to break the model that nobody had tried. |
| Now the part that matters. There is a weak version of this requirement and a strong one. | The requirement comes in a weak version and a strong one. |

Banned openers: "X is worth slowing down on," "Now the part that matters," "Two things about this deserve notice," "The interesting part is," "X is the one that matters," "here is where it gets interesting." Also avoid "worth noting," "notably," and "it is important to note that" (already listed under Register).

**Don't withhold what you are referring to.** The opposite failure: a sentence that gestures at something significant while keeping its identity in reserve, so the reader carries an unresolved reference into the next paragraph. Name the thing in the same sentence.

| Bad | Good |
|-----|------|
| Sampling forces a choice that is easy to make carelessly. | The requirement comes in a weak version and a strong one, and only the strong one rules out decompositions that reconstruct the model perfectly while describing nothing inside it. |
| This is not a free upgrade, and VPD is honest about the bill. | VPD does not fully satisfy its own criterion, and reports how far short it falls. |
| How that pruning is done turns out to have consequences for circuit discovery generally. | The pruning method changes the answer, and not by a little: one of the two options below systematically returns circuits smaller than the mechanism they claim to describe. |
| But the shape of the claim is what matters: an interpretable handle on a dense model's activations. | What they demonstrate is an interpretable handle on a dense model's activations. |

Watch for these two in particular:

- A metaphor standing in for a substantive admission. "Honest about the bill" makes the reader decode an image to learn that a method fails its own criterion. Say what fails.
- A demonstrative or pronoun whose antecedent is the clause it sits in. "The lower end of that interval is the prediction itself, which makes the mask range a direct consequence of it" is close to circular; "since the predicted importance is itself the lower bound of that interval, it fixes how far the subcomponent may be scaled down" is not.

Both rules are directional. Forward references are fine when concrete ("[Circuit tracing](/topics/circuit-tracing/) covers attribution graphs in detail"), and a topic sentence that immediately delivers is fine ("The scale is small. A four-layer 67M-parameter model..."). The target is the sentence that *only* points.

### Never open a paragraph by labelling it (CRITICAL)

This is the most persistent way these articles go wrong, and it survives every other check. A paragraph opens with a sentence that *classifies* what is coming -- more evidence, a consequence, a caveat, a contrast, a list of two -- and only then says it. The label is a header in disguise. It is also redundant, because the reader is about to read the paragraph anyway and will find out.

**The test: delete the opening sentence. If the paragraph still stands, that sentence was a label.** It nearly always still stands.

| Bad opener | Fix |
|-----|------|
| The same effect shows up on a second prompt. Predicting the closing `>` in `<u,v` depends on... | Predicting the closing `>` in `<u,v` depends on... |
| The consequence reaches well past their own method. It is likely to apply in any setting where masking without adversarial sampling is used... | Masking without adversarial sampling is how a large fraction of the literature finds subnetworks, and the problem should apply wherever it is used. |
| None of which makes the adversarially pruned graphs complete. The `·her` graph raises the probability to 1.000 under... | The `·her` graph raises the probability to 1.000 under... Even the adversarially pruned graph is leaving relevant computation out. |
| What the adversarially pruned graphs do give is a readable account of one prediction. The `<u,v` graph keeps 158 subcomponents... | The `<u,v` graph keeps 158 subcomponents... |
| The limitations are severe and the authors state them without hedging. Unstructured weight-sparse networks need 100 to 1000 times the compute... | Unstructured weight-sparse networks need 100 to 1000 times the compute... |
| Two demonstrations. Steering the sparse model's quote type classifier... | Steering the sparse model's quote type classifier... |
| The two subcomponents play asymmetric roles. Query 316 fires on almost every token, so... | Query 316 fires on almost every token, so its side is always asking; key 119 fires rarely, so it decides which positions can answer. The two sides are doing different jobs. |

The last row shows the general repair. Where the classification is genuinely worth stating, it goes *after* the evidence, as a conclusion the reader can already see is earned. Never before it.

Learn the shapes, because they are easier to catch by form than by meaning:

- Abstract subject plus classifying verb. "The consequence/result/problem/effect/limitation is...", "X shows the same thing from another angle."
- Concessive pivots. "None of which...", "What X does give is...", "That said..."
- Bare counts. "Two demonstrations.", "Three consequences.", "A few caveats."
- Trailing announcements. "..., with one refinement.", "..., with one caveat.", "..., and the difference matters."
- Evaluative summaries. "The limitations are severe.", "The results split cleanly by training regime.", "The validation is unusually strict."
- Suspense by negation. "The small graph is wrong. Not approximate: wrong in a specific and predictable direction." Negating alternatives to build anticipation reads as advertising copy. State the thing.
- **Label plus colon.** "The task:", "The mechanism:", "Enforcement is blunt:", "What this buys:". A noun phrase naming a category, a colon, then the actual content. Delete the label and the colon; the content was always the sentence. This is the same defect as a bold header, and it hides from a check that only looks at whole sentences.
- **Withholding colon.** "Parameter space has a property that activation space lacks: ...", "the one used here is: ...". The clause before the colon names that something exists without naming it, and the colon then supplies it. Put the content first and the classification after, or drop the classification.

A colon is fine when the clause before it makes a claim and the clause after it supports or specifies that claim: "An attention score is not that shape: it is bilinear in the activations at two different positions." The claim stands on its own, and the colon adds detail rather than deferring the point.

Calibration, so this does not become a ban on topic sentences. A topic sentence that makes a *claim* is fine, because the claim is content: "The scale is small," followed by the numbers, is good. "Two things are unsettled: the scale at which any of this has been shown to work, and whether the simplicity criterion measures the right thing" is good, because it names both. What is banned is a sentence that describes the *kind* of thing the paragraph contains while containing none of it.

### Acronyms and method names
- Expand every acronym at first use in each article, even if an earlier article expanded it. Readers arrive from search, not only from the previous article.
- When several related methods share a lineage, introduce them together before using any of them, rather than defining each where it happens to come up. One paragraph naming APD, SPD, and VPD with a clause each on what they contributed prevents 18 downstream uses from being opaque.
- Give the expansion and move on. Do not gloss how the acronym was formed; the expansion is the explanation.

### Attitude toward the field
- MI is a young, rapidly evolving field. Present findings as the current best understanding, not eternal truth.
- Original papers are cited as evidence, not as authority. The goal is understanding, not reverence.

---

## Structure

### The description field

The `description` in frontmatter renders as the subtitle directly under the article title, centred over the article column. Past about 180 characters it wraps to three lines and stops reading as a subtitle.

- Aim for 140--180 characters. Across the current articles the median is 174 and the interquartile range is 159--200.
- Name the technique and the one or two things that distinguish it. Do not try to enumerate every section.
- Cut the framing clause first. "What a parameter decomposition is good for: attention computations that span multiple heads, ..." loses nothing by starting at "Attention computations that span multiple heads."
- Drop the least load-bearing property rather than compressing all of them. Going from 196 to 147 characters here meant dropping faithfulness, keeping the weights-not-activations contrast and the ablation criterion:

```
Bad  (196): Decomposing a network's weights instead of its activations, by training rank-one
            parameter subcomponents that sum to the original weights and can be ablated
            whenever the network does not use them.
Good (147): Decomposing a network's weights instead of its activations, into rank-one
            subcomponents that can be ablated wherever the network does not use them.
```

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

### Define before you evaluate

Say what something *is* before saying whether it is any good. A verdict that arrives ahead of its definition gives the reader a claim they have no means to assess, and they have to hold it unresolved until the definition catches up.

This shows up most often as a paragraph that previews a conclusion, immediately followed by the paragraph that does the real work:

```markdown
Bad:
  The requirement has a weak version and a strong version. The weak one admits
  decompositions that match the model's outputs exactly while describing nothing
  about how it computes them.

  The weak version asks that the output survive ablating *all* the unimportant
  components at once. The strong version asks that it survive ablating *any
  subset* of them, in any combination. Consider two components...

Good:
  Ablating "the unimportant components" has two possible readings.

  The weak version: the output survives ablating *all* of them at once. The
  strong version: the output survives ablating *any subset* of them, in any
  combination.

  Take two components that cancel. Remove both and nothing changes; remove
  either one alone and the output breaks...
```

The fix is nearly always to delete the preview rather than rewrite it. An argument that works does not need announcing first, and the preview usually restates the payoff of a "Pause and Think" or a later section, so cutting it removes a duplicate as well.

The same ordering applies to:
- Naming a method's shortcomings before describing what the method does.
- Calling a result strict, surprising, or weak before the reader has seen it.
- Comparing two things before both are defined.
- Stating which of two options is correct before both options are on the page.

### Math
- Present equations with context. Explain what each term means.
- Build up to complex equations through simpler intermediate steps.
- Use inline math for variables (`$\mathbf{x}$`) and display math for key equations.
- After an equation, often explain it again in words: "This says that..."

### Notation

One linear-algebra convention holds across the whole curriculum: **activations are row vectors and weight matrices act on the right.** Mixing conventions produces equations that are dimensionally impossible, and readers do notice and write in about it.

- **Weights multiply from the right.** Write $\mathbf{q}_i = \mathbf{x}_i W_Q$, $\sigma(\mathbf{x} W_{\text{in}}) W_{\text{out}}$, $\text{ReLU}(\mathbf{x} W_e + b_e)$. Never $W \mathbf{x}$.
- **Shapes follow from that**, and they are the shapes the reader will see in code: TransformerLens stores `W_in` as `(d_model, d_mlp)` and `W_out` as `(d_mlp, d_model)`. So write $W_{\text{in}} \in \mathbb{R}^{d \times d_m}$, $W_{\text{enc}} \in \mathbb{R}^{d_{\text{model}} \times d_{\text{SAE}}}$.
- **A scalar product of two activations is $\mathbf{q}_i \mathbf{k}_j^T$**, not $\mathbf{q}_i^T \mathbf{k}_j$. With row vectors the second form is a $d \times d$ outer product. Where no shape is at stake, `\cdot` reads better and is correct under either convention: $\sigma(\mathbf{w} \cdot \mathbf{h} + b)$.
- **Prose about rows and columns flips with the equation.** If $W_{\text{out}}$ is $d_m \times d$, neuron $i$'s value vector is a *row* of $W_{\text{out}}$; an SAE feature direction is a *row* of $W_d$. Check the sentences around the math, the blockquote definitions, and the figure captions, not just the display equations.
- Most papers use column vectors, so an equation lifted from one usually needs transposing rather than pasting as printed. Where the transpose is load-bearing, say so once: the Jacobian lens article defines $J_\ell = (\partial \mathbf{h}_L / \partial \mathbf{h}_\ell)^T$ and notes that this is the textbook Jacobian transposed to act from the right.
- Interactive SVG and canvas figures carry shape labels (`1 × d_model`) and row/column callouts of their own. They need the same pass as the math.

The convention is stated for the reader once, in the attention article, which is the first place in the learning path where a matrix product appears. Later articles do not restate it.

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

## Sourcing Figures from Papers

Good figures communicate ideas faster than text. When processing a paper for article creation, always consider whether any of its figures would help the reader and should be included.

### When to include figures

- Include a figure when it clarifies a concept, architecture, or result that would be hard to convey in words alone.
- Aim for 1-5 figures per article. Not every article needs figures, but most benefit from at least one.
- Prefer figures that show structure (architecture diagrams, circuit schematics, attention patterns) or key results (the one plot that tells the story). Skip figures that only make sense in the full context of the original paper.

### Attribution

Every figure taken from an existing work must credit the source in its caption:

```markdown
<figure>
  <img src="..." alt="Descriptive alt text.">
  <figcaption>Description of the figure. From Author et al., <em>Paper Title</em>. {% cite "bibtex-key" %}</figcaption>
</figure>
```

This is non-negotiable. The reader should always know where a figure came from.

### Retrieving figures from arXiv HTML

ArXiv renders HTML versions of most recent papers. Images are served as PNGs at the HTML URL:

```bash
# Images are at https://arxiv.org/html/<paper-id>/<filename>.png
# Filenames are generic (x1.png, x2.png, ...), so check the HTML page
# to identify which figure is which.

curl -O "https://arxiv.org/html/2502.06852v1/x3.png"
```

Open the HTML version of the paper (e.g., `https://arxiv.org/html/2502.06852v1`) and visually match each `xN.png` to the figure you want.

### Retrieving figures from PDFs

When the paper is only available as a PDF (or the arXiv HTML version is missing or has low-quality rasterizations), extract figures from the PDF directly:

```bash
# Convert relevant pages to PNG at 300 DPI
pdftoppm -png -r 300 -f <first_page> -l <last_page> paper.pdf pages/page

# Crop the figure region from the page
# Letter paper at 300 DPI is 2550x3300 pixels; adjust coordinates to isolate the figure
magick pages/page-05.png -crop <width>x<height>+<x_offset>+<y_offset> +repage figure.png

# Always trim whitespace and add a small border
magick figure.png -trim +repage -bordercolor white -border 10 figure.png
```

After cropping and trimming, visually verify the result (open the image or use `Read` to inspect it) to make sure nothing important was cut off.

### Retrieving figures from arXiv source

For the highest-quality originals (often vector PDFs or high-res PNGs), download the LaTeX source:

```bash
curl -o source.tar.gz "https://arxiv.org/e-print/<paper-id>"
tar xzf source.tar.gz
# Figure files are usually in the root or in a figures/ subdirectory
```

### Where to store figures

Place figures in an `images/` subdirectory under the article:

```
src/topics/<block>/<article>/images/descriptive_name.png
```

Use descriptive filenames (`sae_architecture.png`, `ioi_circuit_diagram.png`), not the generic names from arXiv (`x3.png`).

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

- [ ] Were figures from the source paper(s) considered? Include any that help the reader.
- [ ] Does every borrowed figure have a caption crediting the original work?
- [ ] Does the opening motivate *why* this matters?
- [ ] Are key terms defined with blockquote definitions?
- [ ] Is there at least one concrete example before generalizing?
- [ ] Are equations explained in words, not just displayed?
- [ ] Do equations follow the row-vector convention, including matrix shapes, row/column prose, and any interactive diagrams?
- [ ] Are limitations and caveats acknowledged?
- [ ] Is there at least one "Pause and Think" section?
- [ ] Are relevant other articles cross-linked?
- [ ] Does the closing connect to what comes next?
- [ ] Are all citations in place?
- [ ] Is the tone direct and free of hype/LLM-isms?
- [ ] Is the `description` between roughly 140 and 180 characters?
- [ ] Is every acronym expanded at its first use *in this article*?
- [ ] Does every verdict come after the definition it depends on? Cut preview paragraphs that state a conclusion the reader cannot yet assess.
- [ ] Does every sentence survive the deletion test? Cut the ones that only announce importance ("worth slowing down on") or withhold their referent ("forces a choice that is easy to make carelessly").
- [ ] **Read only the first sentence of every paragraph, in order.** Any that describes its paragraph rather than saying something ("The same effect shows up on a second prompt", "Two demonstrations.", "The limitations are severe") is a label: delete it.
