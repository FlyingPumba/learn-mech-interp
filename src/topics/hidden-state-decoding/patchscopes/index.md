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

Patchscopes treats a prompt as a learned readout. We insert a hidden representation into a context designed to ask for some property, then inspect the continuation. Agreement across prompts, mappings, and known-answer controls tells us whether that continuation is evidence about the source representation rather than the target model's prior.

> **Patchscopes:** A framework that patches a source activation into a target prompt and uses the target model's continuation as a readout. The result depends jointly on the source activation, any mapping between models, the prompt, and the target model.

## How Patchscopes Works

<figure>
  <img src="images/patchscopes-framework-overview.png" alt="The Patchscopes pipeline in four steps. Step 1: a source prompt is fed through the source model, producing hidden states at each layer. Step 2: a hidden state is extracted and optionally transformed. Step 3: a target prompt with a placeholder is fed to the target model. Step 4: the extracted representation is patched into the placeholder position and the target model generates an output that describes the patched representation.">
  <figcaption>The Patchscopes pipeline. A hidden representation from the source model (left) is optionally transformed and then patched into a designated position in the target prompt (right). The target model's continuation reveals what the source representation encodes. From Ghandeharioun et al., <em>Patchscopes: A Unifying Framework for Inspecting Hidden Representations</em>. {%- cite "ghandeharioun2024patchscopes" -%}</figcaption>
</figure>

The framework involves two forward passes:

**Source computation.** We run a model $S$ on a source prompt and extract the hidden representation $\mathbf{h}^{(S)}_{i,\ell}$ at position $i$, layer $\ell$. This is the representation we want to inspect.

**Target computation.** We run a model $M$ on a target prompt that contains a placeholder position. At the placeholder, we patch in the source representation $\mathbf{h}^{(S)}_{i,\ell}$ (possibly mapped to a different layer $\ell'$). The model's generation after the patched position is the inspection result.

$S$ and $M$ can be the same model or different models. When they differ, a more capable model can serve as the decoder for representations taken from a smaller one, although the result then depends on how well the two representational spaces are aligned.

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

The source and target can be different models. A larger target model may provide a more expressive readout of a smaller model's representation, provided the mapping between their activation spaces preserves the relevant information.

The procedure:
1. Run $S$ on the source prompt; extract $\mathbf{h}^{(S)}_{i,\ell}$
2. Map $\mathbf{h}^{(S)}$ to $M$'s representation space (if architectures differ, this requires a learned mapping)
3. Patch into $M$'s forward pass with an appropriate target prompt
4. Use $M$'s generation as the interpretation

The reported experiments work best for models with compatible representation spaces, such as members of the same family. A fluent description still reflects both models: the target may articulate source information, fill gaps from its own priors, or do both.

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

Successful correction shows that the patched representation supports the missing next step in that target context. It suggests a composition failure, but does not rule out alternative explanations such as the new prompt making the task easier or the target model supplying information absent from the source state.

## Limitations

Patchscopes inherits limitations from its components:

**Prompt sensitivity.** The target prompt strongly influences what information is extracted. A poorly designed prompt may fail to elicit relevant information or may impose the model's prior rather than reflecting the source representation.

**Faithfulness uncertainty.** The model's generation is not guaranteed to be a faithful description of the patched representation. The model might hallucinate plausible-sounding descriptions that do not reflect the actual content. [Concept injection](/topics/concept-injection/) supplies a complementary test by reversing the problem: inject known content and ask whether the model reports the change.

**Cross-model mapping.** When $S$ and $M$ have different architectures, the representation mapping may introduce distortions. Even when architectures match, layer-to-layer alignment is not guaranteed.

**Computational cost.** Each inspection requires a forward pass through the target model. For large-scale analysis of many representations, this can be expensive.

## Why Patchscopes Matters

Patchscopes provides a unifying lens (pun intended) for understanding activation inspection. Prior methods like vocabulary projection and probing are revealed as special cases. The framework's flexibility, particularly cross-model inspection and expressive target prompts, opens new possibilities for understanding what representations encode.

Patchscopes shows that language-model generation can act as a flexible activation readout. Its flexibility is also the main confound: the answer can reflect the target prompt and model as much as the patched state. The methods that follow vary how they train and validate this readout.

## Looking Ahead

While Patchscopes uses carefully crafted prompts to elicit specific information, [SelfIE](/topics/selfie-interpretation/) explores a related approach: injecting representations back into the model to enable free-form self-interpretation. The methods are complementary. Patchscopes provides structured inspection; SelfIE explores more open-ended self-explanation.
