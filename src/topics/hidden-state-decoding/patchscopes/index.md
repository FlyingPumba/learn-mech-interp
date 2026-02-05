---
title: "Patchscopes"
description: "A unifying framework for inspecting hidden representations by patching activations into target prompts designed to elicit natural language descriptions of their content."
order: 2
prerequisites:
  - title: "Hidden State Decoding: From Vectors to Language"
    url: "/topics/hidden-state-decoding-intro/"
  - title: "Activation Patching"
    url: "/topics/activation-patching/"
---

## The Framework

When we want to understand what information a hidden representation contains, we face a translation problem. The representation is a high-dimensional vector; we need a human-readable description. Patchscopes, introduced by Ghandeharioun et al. {% cite "ghandeharioun2024patchscopes" %}, provides a general framework for this translation by leveraging the generative capabilities of language models themselves.

The core insight is simple: if we patch a hidden representation into the right context, the model's subsequent generation will reveal what that representation encodes. By carefully designing the context, we can elicit specific kinds of information.

> **Patchscopes:** A framework for inspecting hidden representations that works by patching activations from a source computation into a target prompt. The target prompt is designed so that the model's generation following the patched position reveals properties of the original representation.

## How Patchscopes Works

The framework involves two forward passes:

**Source computation.** We run a model $S$ on a source prompt and extract the hidden representation $\mathbf{h}^{(S)}_{i,\ell}$ at position $i$, layer $\ell$. This is the representation we want to inspect.

**Target computation.** We run a model $M$ on a target prompt that contains a placeholder position. At the placeholder, we patch in the source representation $\mathbf{h}^{(S)}_{i,\ell}$ (possibly mapped to a different layer $\ell'$). The model's generation after the patched position is the inspection result.

Crucially, $S$ and $M$ can be the same model or different models. When they differ, we can use a more capable model to inspect representations from a smaller one.

The target prompt is the key design element. Different prompts elicit different kinds of information:

| Target Prompt Template | What It Elicits |
|------------------------|-----------------|
| `"x x x x x [PATCH]"` + generate | Next-token prediction (like logit lens) |
| `"[PATCH] is also known as"` | Entity identity/aliases |
| `"[PATCH]: the capital city of"` | Geographic attributes |
| `"The sentiment of [PATCH] is"` | Sentiment classification |
| `"[PATCH] is a type of"` | Category/hypernym |

The `[PATCH]` position receives the source representation, and we examine what the model generates next.

## Unifying Prior Methods

Patchscopes reveals that several existing interpretability techniques are special cases of the same operation:

**Vocabulary projection (logit lens).** If the target prompt is simply the source prompt itself, and we project the patched representation through the unembedding matrix, we recover the logit lens. Patchscopes generalizes this by allowing arbitrary target prompts.

**Computational interventions.** Activation patching replaces representations and measures effects on behavior. Patchscopes uses the same patching mechanism but focuses on eliciting natural language descriptions rather than measuring task accuracy.

**Probing with prompts.** Rather than training a separate classifier to probe for properties, we can design prompts that cause the model itself to output the property.

This unification is valuable because insights from one technique can inform others. The failure of the logit lens on certain models (due to basis misalignment across layers) motivates using richer target prompts that are less sensitive to representational format.

## Token Identity Patching

A foundational application is determining what token a representation encodes. Given a hidden representation, can we recover the original input token?

The target prompt is: `"Please repeat: [PATCH]"`

By patching the hidden representation into the `[PATCH]` position and examining what the model generates, we can see whether the representation preserves token identity.

Experiments show that early layers often fail to preserve token identity under the logit lens, but the Patchscope variant succeeds. The richer context of "Please repeat:" provides enough scaffolding for the model to decode the representation correctly.

This illustrates a key advantage: expressive target prompts can compensate for basis changes that defeat simple vocabulary projection.

## Cross-Model Inspection

Perhaps the most striking capability is using one model to inspect another. If we have a small model $S$ whose representations are difficult to interpret, we can patch those representations into a more capable model $M$.

The procedure:
1. Run $S$ on the source prompt; extract $\mathbf{h}^{(S)}_{i,\ell}$
2. Map $\mathbf{h}^{(S)}$ to $M$'s representation space (if architectures differ, this requires a learned mapping)
3. Patch into $M$'s forward pass with an appropriate target prompt
4. Use $M$'s generation as the interpretation

This works surprisingly well when models share similar representation spaces (e.g., models from the same family). A larger model can articulate distinctions that a smaller model computes but cannot express linguistically.

<details class="pause-and-think">
<summary>Pause and think: When would cross-model inspection fail?</summary>

Under what conditions would using model $M$ to interpret model $S$ produce unreliable results?

Consider:
- If $S$ and $M$ were trained on very different data distributions
- If $S$ uses representations that have no analog in $M$'s learned concepts
- If the mapping between representation spaces is lossy

Cross-model inspection relies on shared representational structure. When models diverge significantly in what they learn or how they encode it, the interpretation may reflect $M$'s prior beliefs more than $S$'s actual representations.

</details>

## Multi-Hop Reasoning Correction

Beyond inspection, Patchscopes enables intervention. Consider a question requiring multi-hop reasoning: "What is the capital of the country where the Eiffel Tower is located?"

A model might correctly compute "France" as an intermediate result but fail to retrieve "Paris" as the capital. By extracting the intermediate representation of "France" and patching it into a fresh prompt like "The capital of [PATCH] is:", we can bypass the point of failure.

This is not interpretation per se, but it demonstrates that the representations are often more capable than the model's end-to-end behavior suggests. The bottleneck is in composing multiple reasoning steps, not in the individual computations.

## Limitations

Patchscopes inherits limitations from its components:

**Prompt sensitivity.** The target prompt strongly influences what information is extracted. A poorly designed prompt may fail to elicit relevant information or may impose the model's prior rather than reflecting the source representation.

**Faithfulness uncertainty.** The model's generation is not guaranteed to be a faithful description of the patched representation. The model might hallucinate plausible-sounding descriptions that do not reflect the actual content.

**Cross-model mapping.** When $S$ and $M$ have different architectures, the representation mapping may introduce distortions. Even when architectures match, layer-to-layer alignment is not guaranteed.

**Computational cost.** Each inspection requires a forward pass through the target model. For large-scale analysis of many representations, this can be expensive.

## Why Patchscopes Matters

Patchscopes provides a unifying lens (pun intended) for understanding activation inspection. Prior methods like vocabulary projection and probing are revealed as special cases. The framework's flexibility, particularly cross-model inspection and expressive target prompts, opens new possibilities for understanding what representations encode.

More fundamentally, Patchscopes demonstrates that language models can serve as their own interpreters. The same capabilities that enable coherent text generation can be repurposed to explain internal representations. This self-referential quality is central to the methods that follow in this block.

## Looking Ahead

While Patchscopes uses carefully crafted prompts to elicit specific information, [SelfIE](/topics/selfie-interpretation/) explores a related approach: injecting representations back into the model to enable free-form self-interpretation. The methods are complementary. Patchscopes provides structured inspection; SelfIE explores more open-ended self-explanation.
