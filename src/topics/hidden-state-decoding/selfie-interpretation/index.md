---
title: "SelfIE: Self-Interpretation of Embeddings"
description: "A method enabling language models to interpret their own hidden embeddings by converting them into natural language descriptions, with applications to understanding ethical reasoning, detecting prompt injection, and controlling model behavior."
order: 3
prerequisites:
  - title: "Patchscopes"
    url: "/topics/patchscopes/"
---

## Self-Interpretation

[Patchscopes](/topics/patchscopes/) showed that we can patch representations into carefully designed prompts to extract information. SelfIE, introduced by Chen et al. {% cite "chen2024selfie" %}, takes a more direct approach: let the model explain its own embeddings in its own words.

The key insight is that language models already know how to respond to questions about text passages. If we can present an embedding *as if* it were a text passage, the model can be asked to describe it. SelfIE makes this possible by injecting hidden representations back into the model at a position where the model expects to encounter meaningful content.

> **SelfIE (Self-Interpretation of Embeddings):** A framework for extracting natural language interpretations of hidden embeddings by injecting them into a model's context and prompting the model to describe what they represent. The model uses its own linguistic capabilities to translate internal representations into human-readable explanations.

## How SelfIE Works

The method operates in two phases:

**Interpretation.** Given a hidden embedding $\mathbf{h}$ from processing some input, we inject this embedding into a new forward pass. The injection replaces the representation at a designated position in a prompt like: "The following embedding represents: [INJECT]. Describe it:"

The model then generates text describing what the embedding encodes. Because the model's text generation is conditioned on $\mathbf{h}$, the description should reflect the information content of that embedding.

**Freeform explanation.** Unlike Patchscopes, which uses targeted prompts to extract specific attributes, SelfIE emphasizes open-ended interpretation. The model is not constrained to output a category or attribute; it can produce multi-sentence explanations of what the embedding represents.

This distinction matters. Targeted prompts extract predetermined properties. Freeform interpretation may reveal unexpected aspects of what models represent, including nuances that a researcher would not have thought to query directly.

## Revealing Internal Reasoning

SelfIE's power lies in exposing aspects of model computation that are otherwise hidden. The original work demonstrates this across several domains:

### Ethical Decision-Making

When models process morally charged scenarios, what do their intermediate representations encode? SelfIE can extract natural language descriptions of these representations, revealing how the model represents ethical considerations.

For example, when processing a trolley problem scenario, intermediate embeddings might encode not just factual content ("a trolley is approaching") but normative content ("there is a moral dilemma about harm"). SelfIE makes these implicit representations explicit.

### Prompt Injection Detection

Prompt injection attacks attempt to hijack model behavior through adversarial inputs. SelfIE can reveal how models internalize such attacks by interpreting the embeddings produced when processing injected prompts.

If an injection is working, the embedding may encode something like "I should ignore previous instructions." If the model is resisting the injection, the embedding may preserve the original task context. This provides a window into the model's susceptibility to manipulation.

### Harmful Knowledge

Models may encode harmful information even when they refuse to express it directly. SelfIE can probe whether representations encode dangerous content by asking the model to describe what an embedding represents.

This is a double-edged sword. The same technique that helps researchers audit models for harmful knowledge could potentially be used to extract that knowledge. The authors are careful about this, using the method to identify where harmful knowledge resides rather than to elicit it directly.

<details class="pause-and-think">
<summary>Pause and think: Is self-interpretation trustworthy?</summary>

When a model interprets its own embedding, how do we know the interpretation is accurate? The model could produce a plausible-sounding description that does not reflect the actual content.

Consider two failure modes:
1. **Underfitting:** The description is vaguer than the actual embedding content
2. **Hallucination:** The description includes details not present in the embedding

What experiments would help distinguish accurate self-interpretation from confabulation? One approach: check if interventions based on the interpretation produce predicted behavioral changes.

</details>

## From Interpretation to Control

SelfIE goes beyond observation to enable model editing through two complementary mechanisms:

### Supervised Control

If we can describe what an embedding represents, we can also describe what we *want* it to represent. Supervised control works by:

1. Computing the embedding for an input
2. Computing a target embedding that represents the desired modification
3. Training a transformation that maps from original to target embeddings

Crucially, this requires gradient computation at only the target layer, not the full model. We can edit concepts in a targeted way: "change the embedding so it represents helpfulness rather than sycophancy."

### Reinforcement Control

Sometimes we do not have explicit supervision targets. We know that certain embeddings encode harmful content, but we do not have labeled examples of "good" vs "bad" embeddings.

Reinforcement control extends RLHF principles to hidden embeddings. We use a reward signal (e.g., human preference or safety classifier) to update how embeddings are processed, without requiring explicit target annotations. The model learns to transform embeddings in ways that improve the reward.

This enables removing harmful knowledge without knowing exactly what that knowledge is or what it should be replaced with. The model discovers the modification through optimization.

## Limitations

**Interpretation reliability.** Models may produce fluent but inaccurate descriptions of their own embeddings. Without ground truth, validating interpretations is difficult.

**Layer selection.** Which layer's embeddings should be interpreted? Earlier layers encode more local information; later layers encode more abstract features. The choice affects what can be extracted.

**Control side effects.** Editing embeddings to remove harmful content may have unintended effects on related capabilities. The intervention is not surgical.

**Scalability.** Generating natural language interpretations for many embeddings is computationally expensive. This limits large-scale analysis.

## Relation to Patchscopes

SelfIE and Patchscopes are complementary approaches to the same goal:

| Aspect | Patchscopes | SelfIE |
|--------|-------------|--------|
| Prompt design | Targeted templates | Open-ended |
| Output format | Structured (fill-in-the-blank) | Freeform explanation |
| Cross-model | Yes (different S and M) | Same model only |
| Primary goal | Extract specific attributes | Reveal reasoning |
| Control | Indirect (via understanding) | Direct editing |

SelfIE emphasizes self-reference: the model as its own interpreter. Patchscopes emphasizes flexibility: any model can interpret any representation. Both demonstrate that language models can decode hidden states into natural language.

## Looking Ahead

A natural question: can we train models to produce better self-explanations? Rather than hoping that off-the-shelf prompting works, we could fine-tune models specifically for the interpretation task. This is the focus of [Training Models to Explain Their Computations](/topics/training-self-explanation/), which investigates whether specialized training improves faithfulness and what we learn when models are explicitly taught to introspect.
