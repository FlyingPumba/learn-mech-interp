---
title: "The Logit Lens, Tuned Lens, and Probing Classifiers"
description: "Observational tools for reading model internals -- from the logit lens to probing classifiers -- and the fundamental limitation that observation alone cannot establish causation."
prerequisites:
  - title: "Direct Logit Attribution"
    url: "/topics/direct-logit-attribution/"
difficulty: "intermediate"
block: "foundations-of-mi"
category: "methods"
---

## Looking Inside the Model

We have tools for decomposing what a model does at its final layer. [Direct logit attribution](/topics/direct-logit-attribution/) tells us which components contribute to the output logits, and attention patterns show where each head directs its focus. But these tools operate on the model's final computations. What about intermediate layers? Can we peek at what the model is "thinking" as information flows from input to output?

This article covers three families of observational techniques for reading model internals: vocabulary projection methods (the logit lens and tuned lens), probing classifiers (structural probes, MDL probing, and amnesic probing), and attention pattern visualization. All three are powerful. All three share a fundamental limitation that will motivate the transition to causal methods.

## The Logit Lens

The unembedding matrix $W_U$ maps the final residual stream to vocabulary logits. The logit lens, introduced by nostalgebraist in 2020, asks a simple question: what if we applied $W_U$ to intermediate layers? {% cite "nostalgebraist2020logitlens" %}

At each layer $\ell$, we can read off what the model would predict if processing stopped at that layer:

$$
\text{LogitLens}(\mathbf{h}_\ell) = \text{LayerNorm}(\mathbf{h}_\ell) \cdot W_U
$$

This gives us a distribution over vocabulary at every layer, not just the last one.

> **Logit Lens:** The logit lens projects the intermediate residual stream $\mathbf{h}_\ell$ at layer $\ell$ through the final layer norm and unembedding matrix to produce a distribution over vocabulary. The resulting logits reveal what the model would "predict" if it stopped processing after layer $\ell$.

Consider a concrete example. When GPT-2 Small processes the prompt "The Eiffel Tower is located in the city of ___", it predicts "Paris" with 93% probability at the final layer. But at which layer does the model first "know" it will predict Paris?

![Logit lens applied layer by layer to the prompt about the Eiffel Tower, showing how the top predicted token evolves from generic words in early layers to the correct answer Paris in later layers.](/topics/logit-lens-and-probing/images/logit_lens_eiffel.png "Figure 1: The logit lens applied layer by layer to GPT-2 Small processing 'The Eiffel Tower is located in the city of ___'. Early layers produce generic predictions. The correct answer emerges gradually across middle and later layers.")

The results reveal a progression. Early layers (0-3) produce near-random predictions, returning generic tokens like "the" or "of." By layer 4, geographic associations begin to appear, with "France" surfacing as a top prediction. At layer 6, "Paris" first appears as the top prediction at around 12% probability. Through layers 7-11, "Paris" stabilizes with rapidly increasing confidence, reaching 93% at the final layer.{% sidenote "The logit lens reveals that the model does not 'keep inputs around' and gradually process them. Instead, it immediately converts to a prediction-like representation that is smoothly refined layer by layer. The transition from 'France' at layer 4 to 'Paris' at layer 6 suggests that the model first retrieves the country-level association and then narrows to the specific city." %}

The logit lens tells us *when* the answer appears, but not *how* the model computes it. It is a descriptive tool that shows the result of processing at each layer, revealing the trajectory without explaining the mechanism. The transition from "France" to "Paris" is interesting, but the logit lens alone cannot tell us which heads or MLPs are responsible for that transition.

### Limitations of the Logit Lens

The logit lens works well for GPT-2 but is systematically biased and fails on several other models, including GPT-Neo, BLOOM, and OPT {% cite "nostalgebraist2020logitlens" %}. The reason is that intermediate layers may represent information in a rotated or shifted basis that does not align with the unembedding matrix $W_U$. The logit lens assumes intermediate representations live in the same coordinate system as the final layer. When this assumption is wrong, the projections produce misleading results.

This failure does not mean the information is absent from intermediate layers. It means the information is encoded in a different basis that the raw unembedding matrix cannot decode. This motivates a natural improvement: what if we learned a per-layer correction?

## The Tuned Lens

The tuned lens, introduced by Belrose et al. in 2023, trains a learned affine translator at each layer {% cite "belrose2023tunedlens" %}:

$$
\text{TunedLens}(\mathbf{h}_\ell) = (A_\ell \mathbf{h}_\ell + \mathbf{b}_\ell) \cdot W_U
$$

Each translator consists of a matrix $A_\ell$ and a bias vector $\mathbf{b}_\ell$, trained to account for how the representation basis changes from layer to layer. The affine translators correct for rotations, shifts, and stretches in the intermediate representations.

> **Tuned Lens:** The tuned lens improves on the logit lens by learning an affine probe per layer that maps intermediate representations to the final-layer basis before applying the unembedding matrix. It is more reliable and less biased, working across a wider range of models.

A critical design choice: the translators minimize KL divergence between their output and the *final layer's* output distribution, not ground truth labels. This means the tuned lens learns to extract what the *model* knows at each layer, not what is true in the world. The distinction matters. At layer 4, the model might "believe" the answer is France. The tuned lens faithfully reports this belief, even though France is not the final answer.

The pedagogical lesson is important. The logit lens fails on some models, but this does not mean those models lack information at intermediate layers. The information is there, encoded in a different basis. The tuned lens recovers it by learning the basis correction. **Representation format matters as much as information content.**{% sidenote "The tuned lens achieves lower perplexity than the logit lens across all tested models and layers. More importantly, its predictions are more calibrated and less biased toward high-frequency tokens. For researchers who want to track intermediate predictions, the tuned lens is strictly superior." %}

<details class="pause-and-think">
<summary>Pause and think: What the logit lens failure tells us</summary>

The logit lens fails on some models but the tuned lens works. What does this tell us about how models represent information across layers? Does every layer use the same coordinate system?

No. Different layers can represent information in different bases. The final unembedding matrix $W_U$ is calibrated for the final layer's basis only. Intermediate layers may rotate or shift their representations freely, as long as subsequent layers can read them correctly. The tuned lens compensates for these basis changes, confirming that the information is present even when the raw projection fails. This suggests that the "residual stream as shared communication channel" view needs nuance: the channel's encoding conventions can drift across layers.

</details>

## Probing Classifiers: The Promise

The logit lens and tuned lens project intermediate states to vocabulary space, answering "what would the model predict at this layer?" Probing classifiers ask a different question: "what information is encoded in the representations at this layer?"

A probing classifier is a simple model, typically linear, trained to predict a linguistic or semantic property from the internal activations at a given layer:

$$
\hat{y} = \text{Probe}(\mathbf{h}_\ell) = \sigma(W_p \mathbf{h}_\ell + \mathbf{b}_p)
$$

If a linear probe achieves high accuracy, the information is *present and linearly accessible* in the representations. The probe's simplicity is deliberate: a powerful nonlinear probe might learn the property itself rather than detecting it in the representations.

> **Probing Classifier:** A probing classifier is a simple model (typically linear) trained to predict a linguistic or semantic property $y$ from the internal activations $\mathbf{h}_\ell$ of a neural network at layer $\ell$. High probe accuracy indicates the property is encoded in the representations. The probe's simplicity ensures that a successful readout reflects information in the representations, not computation performed by the probe itself.

Why restrict probes to be linear? The restriction connects directly to the [linear representation hypothesis](/topics/linear-representation-hypothesis/): if features are represented as linear directions in activation space, then a linear probe is exactly the right tool to detect them. A nonlinear probe might succeed even on random representations by performing substantial computation of its own, rendering the results uninterpretable.{% sidenote "The question of probe complexity is a recurring theme in the probing literature. If a two-layer MLP probe achieves higher accuracy than a linear probe, does that mean the information is encoded nonlinearly? Or does it mean the MLP probe is partially computing the property rather than merely reading it? There is no consensus answer, which is one reason the field has gravitated toward linear probes as the default." %}

### Structural Probes: Beyond Labels

Hewitt and Manning (2019) pushed probing beyond simple classification by introducing structural probes {% cite "hewitt2019structural" %}. Instead of asking "is this token a noun?", they asked: "does the geometry of the representations encode the entire syntax tree?"

The key idea: find a linear transformation $B$ under which the squared L2 distance between word representations encodes parse tree distance:

$$
d_B(\mathbf{h}_i, \mathbf{h}_j)^2 = (B(\mathbf{h}_i - \mathbf{h}_j))^T B(\mathbf{h}_i - \mathbf{h}_j) \approx \text{tree\_distance}(i, j)
$$

Their results showed that syntax trees are embedded in a linear subspace of BERT representations. Different layers encode different syntactic details: earlier layers capture local structure, later layers capture longer-range dependencies. The structural probe levels off with increasing rank, indicating a lower-dimensional syntactic subspace within the full representation.

Probes can detect not just labels but *relational structure* in representations. The promise is tantalizing: we can read rich, structured information directly from how the model represents language internally.

But there is a catch.

## The Probing Critique: Correlation vs. Causation

High probe accuracy tells us information *exists* in the representations. It does *not* tell us the model *uses* that information. This is the correlation-vs-causation gap at the heart of the probing debate.

### MDL Probing: Measuring Effort, Not Accuracy

Voita and Titov (2020) demonstrated that probe accuracy alone is an inadequate metric {% cite "voita2020mdl" %}. Their key finding is striking: a probe can achieve *similar accuracy on pretrained representations and random representations*. If a probe can decode a property from random vectors, that property is not meaningfully "encoded" in any useful sense. The probe is simply powerful enough to memorize the mapping.

Minimum Description Length (MDL) probing reframes the question. Instead of asking "can a probe predict this property?", ask "how much effort does the probe need?"

Better representations require simpler probes (lower description length). Think of it as compression: good representations compress the labels more, requiring less effort to decode them. A representation where part-of-speech can be read off with a simple weight vector encodes POS more accessibly than one where the probe needs thousands of training examples and a high-rank weight matrix to decode the same labels.

MDL probing is more informative than accuracy alone. It distinguishes between representations where information is readily available (low MDL) and representations where the probe must do significant computation (high MDL). But MDL is still a correlational measure. It tells us how *easily accessible* a property is, not whether the model *actually accesses* it.

### Amnesic Probing: The Bridge to Causation

Elazar et al. (2021) took the crucial next step {% cite "elazar2021amnesic" %}. Instead of asking "can we decode property $Z$?", they asked: "what happens to task performance if we *remove* property $Z$?"

Their method uses Iterative Null-Space Projection (INLP) to project out a property from the representations, then measures the behavioral impact on the model's downstream task. If removing a property hurts performance, the model relied on it. If removing it has no effect, the model encoded the property but did not use it.

The key finding is a direct challenge to the probing paradigm: **conventional probing performance is not correlated with task importance**. Consider this scenario:

- A linear probe detects part-of-speech with 95% accuracy at layer 6.
- But removing POS information from layer 6 does *not* hurt language modeling performance.
- The information is *there* but the model does *not rely on it*.

Conventional probe accuracy told us the wrong story. A property may be easily decodable but irrelevant -- the model encodes it as a byproduct, not as a functional component. Or a property may be hard to decode but essential -- the model uses it in a way that a linear probe cannot easily extract.

This disconnect is the most important lesson of the probing literature {% cite "belinkov2022probing" %}. Probes detect *correlations*, not *causes*. Random baselines are essential for context. And the most sophisticated probing method (amnesic probing) points beyond probing altogether, toward the causal intervention methods that can definitively answer what the model relies on.

<details class="pause-and-think">
<summary>Pause and think: Probes and causation</summary>

A probe achieves 95% accuracy at detecting part-of-speech from layer 6 activations. Does the model "know" POS? Does it "use" POS? How would you test the difference?

The model "knows" POS in the sense that the information is linearly decodable from its representations. But "knowing" and "using" are different. To test whether the model uses POS, you would need an intervention: remove POS information (via amnesic probing or [activation patching](/topics/activation-patching/)) and measure whether downstream task performance degrades. If it does, POS is causally relevant. If it does not, POS is a byproduct -- encoded but not relied upon.

</details>

## Attention Pattern Visualization

The third observational tool is the most intuitive: look at where attention heads direct their focus. We examined attention patterns briefly in the context of [direct logit attribution](/topics/direct-logit-attribution/). Here we see them applied to real model data.

Consider GPT-2 Small processing a repeated sequence: "The cat sat on the mat. The cat sat on the." Two heads display distinctive patterns:

![Previous token head attention pattern showing a clear diagonal line where each position attends to the position immediately before it.](/topics/logit-lens-and-probing/images/attn_prev_token.png "Figure 2: Previous token head (Layer 0, Head 1) in GPT-2 Small. The strong diagonal pattern shows each token attending to its immediate predecessor.")

![Induction head attention pattern showing off-diagonal attention where repeated tokens attend to tokens that followed their first occurrence.](/topics/logit-lens-and-probing/images/attn_induction.png "Figure 3: Induction head (Layer 5, Head 1) in GPT-2 Small. In the second half of the sequence, attention jumps to specific positions in the first half, attending to tokens that followed the first occurrence of each repeated token.")

The left pattern is a **previous token head** (Layer 0, Head 1): a clean diagonal where each position attends to the position immediately before it. This head implements the first step of the [induction circuit](/topics/induction-heads/), writing "my predecessor was token X" into each position's residual stream.

The right pattern is an **induction head** (Layer 5, Head 1): in the second half of the repeated sequence, attention jumps to specific positions in the first half. The second "The" attends to " cat" (the token after the first "The"). This head implements the second step: querying "who has predecessor equal to my current token?" and copying that position's token to the output.{% sidenote "These attention patterns are from actual GPT-2 Small runs in TransformerLens, not idealized illustrations. Real attention patterns are messier than textbook diagrams -- notice that the previous token head has some diffuse attention beyond the strict diagonal, and the induction head has background attention to various positions. The diagnostic patterns are strong enough to identify the head types, but interpreting attention requires looking at the dominant structure, not expecting perfect textbook examples." %}

These visualizations let us *see* the two-step mechanism we studied theoretically. But attention patterns reveal only *where* a head looks, not *what* it does with the information. The attention pattern comes from the QK circuit. What information gets moved comes from the OV circuit. Two heads with identical attention patterns can have completely different effects on the output.

## The Key Limitation: Observation Cannot Establish Causation

Let us take stock of what our observational toolkit can and cannot do.

The **logit lens and tuned lens** show what the model would predict if processing stopped at a given layer. They reveal the trajectory of predictions across layers. They do not tell us which components are responsible for those predictions or whether the computation at any particular layer is necessary.

**Probing classifiers** detect what information is linearly decodable from representations. They can reveal rich structure, from part-of-speech labels to syntax trees. But probe accuracy is not correlated with task importance. Information can be encoded yet unused.

**Attention patterns** show where heads look. They reveal structural patterns like diagonal (previous token) and off-diagonal (induction) that provide clues about head function. But they do not tell us what information the head moves or whether the attended information matters downstream.

None of these tools establish whether the detected information is *causally necessary* for the model's behavior. The logit lens shows "Paris" at layer 8, but is the computation at layer 8 *necessary* for predicting "Paris"? A probe detects syntax at layer 6, but does the model *use* syntax at layer 6? A head attends to the previous token, but does that attention *matter* for the output?

All three observational tools establish *correlations*: the information co-occurs with the activations. To establish *causation*, we need a different kind of experiment, one where we *intervene* on the model's internals and observe changes in behavior. If we *change* an intermediate activation and observe a *change* in the model's output, we have causal evidence.

This is the shift from observation to causation, and it is the subject of the next articles. [Activation patching](/topics/activation-patching/) replaces one component's activation with an activation from a different input and measures the effect on predictions. Path patching traces the causal flow through specific pathways in the computational graph. These tools complete the methodological toolkit, moving us from "what exists?" to "what matters?"

**Observation reveals what exists. Only intervention reveals what matters. We can look inside the model. But looking is not the same as proving.**
