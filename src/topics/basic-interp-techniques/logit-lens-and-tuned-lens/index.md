---
title: "The Logit Lens and Tuned Lens"
seoTitle: "Logit Lens and Tuned Lens"
description: "Reading intermediate predictions in vocabulary space with the logit lens, then correcting its layer-by-layer distortions with the tuned lens."
order: 1
prerequisites:
  - title: "Direct Logit Attribution"
    url: "/topics/direct-logit-attribution/"

glossary:
  - term: "Logit Lens"
    definition: "An observational technique that applies the model's unembedding matrix to intermediate residual stream states, converting hidden representations into vocabulary-space predictions to see how the model's output evolves across layers."
  - term: "Tuned Lens"
    definition: "An improvement on the logit lens that trains a learned affine transformation at each layer (rather than reusing the final unembedding matrix), producing more accurate predictions of the model's evolving computation at intermediate layers."
  - term: "Unembedding"
    definition: "The learned linear map from the final residual representation to vocabulary logits. A subsequent softmax converts those logits into probabilities."
---

## Looking Inside the Model

[Direct logit attribution](/topics/direct-logit-attribution/) projects component writes toward output logits, while attention patterns show where a head reads. Vocabulary lenses ask a different observational question: what token-level scores can we extract from an intermediate residual state?

The **logit lens** applies the unembedding matrix directly to intermediate layers. The **tuned lens** learns a correction for each layer's changing basis. Both reveal decodable information, but neither shows that the model uses it.

## The Logit Lens

The unembedding matrix $W_U$ maps the final residual stream to vocabulary logits. The logit lens, introduced by nostalgebraist in 2020, asks a simple question: what if we applied $W_U$ to intermediate layers? {% cite "nostalgebraist2020logitlens" %}

At each layer $\ell$, we apply the model's final readout early:

$$
\text{LogitLens}(\mathbf{h}_\ell) = \text{LayerNorm}(\mathbf{h}_\ell) \cdot W_U
$$

This gives vocabulary logits at every layer. Applying softmax produces a diagnostic distribution, although the model itself does not normally stop and emit from that layer.

> **Logit Lens:** The logit lens applies the final normalization and unembedding to an intermediate residual state. Its vocabulary logits show how that state aligns with the model's output directions before later layers transform it.

Consider a concrete example. When GPT-2 Small processes the prompt "The Eiffel Tower is located in the city of ___", it predicts "Paris" with 93% probability at the final layer. But at which layer does the model first "know" it will predict Paris?

![Logit lens applied layer by layer to the prompt about the Eiffel Tower, showing how the top predicted token evolves from generic words in early layers to the correct answer Paris in later layers.](/topics/logit-lens-and-tuned-lens/images/logit_lens_eiffel.png "Figure 1: The logit lens applied layer by layer to GPT-2 Small processing 'The Eiffel Tower is located in the city of ___'. Early layers produce generic predictions. The correct answer emerges gradually across middle and later layers.")

In this example, early-layer projections favor frequent generic tokens. A country-related token appears in the middle layers, and “Paris” becomes the top projected token later. This progression is a useful hypothesis about staged factual processing, but the lens alone cannot tell whether the “France” score is an intermediate variable the model uses or an incidental alignment with the unembedding.{% sidenote "A readable sequence of tokens invites a narrative. Treat that narrative as a prediction to test with component-level and causal methods, especially because another lens or prompt may produce a different sequence." %}

The logit lens tells us *when* the answer appears, but not *how* the model computes it. It is a descriptive tool that shows the result of processing at each layer, revealing the trajectory without explaining the mechanism. The transition from "France" to "Paris" is interesting, but the logit lens alone cannot tell us which heads or MLPs are responsible for that transition.

### Limitations of the Logit Lens

The raw logit lens can be biased toward frequent tokens and poorly calibrated at intermediate layers, with severity varying by model {% cite "nostalgebraist2020logitlens" %}. Later layers are trained to transform intermediate states before the final unembedding is applied, so an early state need not already align with output directions in a directly readable way.

A poor raw projection does not distinguish absent information from information accessible through another map. The tuned lens tests whether a learned affine translator can predict the final distribution more accurately.

## The Tuned Lens

The tuned lens, introduced by Belrose et al. in 2023, trains a learned affine translator at each layer {% cite "belrose2023tunedlens" %}:

$$
\text{TunedLens}(\mathbf{h}_\ell) = (\mathbf{h}_\ell A_\ell + \mathbf{b}_\ell) \cdot W_U
$$

Each translator consists of a matrix $A_\ell$ and bias $\mathbf{b}_\ell$, trained so the translated state predicts the model's final output distribution. The affine map can compensate for systematic rotations, shifts, stretches, and other linearly correctable differences.

> **Tuned Lens:** The tuned lens trains an affine translator at each layer to predict the final output distribution through the unembedding. It often produces better-calibrated intermediate readouts than the raw logit lens, at the cost of a learned probe.

<figure>
  <img src="images/tuned_lens_comparison.png" alt="Side-by-side comparison of logit lens (top) and tuned lens (bottom) applied to GPT-Neo-2.7B. The logit lens produces incoherent predictions at early and middle layers, while the tuned lens produces meaningful token predictions starting from much earlier layers.">
  <figcaption>Logit lens (top) vs. tuned lens (bottom) applied to GPT-Neo-2.7B. The logit lens produces garbled predictions at early layers because intermediate representations use a different basis than the final layer. The tuned lens corrects for this, yielding coherent predictions across all layers. From Belrose et al., <em>Eliciting Latent Predictions from Transformers with the Tuned Lens</em>. {%- cite "belrose2023tunedlens" -%}</figcaption>
</figure>

A critical design choice is that the translators minimize KL divergence to the *final layer's* output distribution, not to ground-truth labels. The lens is therefore trained to forecast the model's eventual prediction. A token score at layer 4 should not automatically be called the model's belief at layer 4; the translator may use any linearly accessible signal that helps predict the final distribution.

Comparing the lenses separates two questions: how an intermediate state aligns with the existing unembedding, and how well a learned affine probe can forecast the final output. Better tuned-lens performance shows that useful predictive signal is linearly accessible to the translator; it does not prove that later layers implement that translator or that the decoded token is an explicit intermediate variable.{% sidenote "The tuned lens improved perplexity and calibration over the raw lens in the reported comparisons. The raw lens remains useful when the research question specifically concerns direct alignment with the unembedding or when avoiding a trained probe matters." %}

<details class="pause-and-think">
<summary>Pause and think: What the logit lens failure tells us</summary>

The logit lens fails on some models but the tuned lens works. What does this tell us about how models represent information across layers? Does every layer use the same coordinate system?

No single readout is guaranteed to be equally calibrated at every depth. The final unembedding is trained for the final state, while an affine translator can recover predictive structure from earlier states. This is consistent with systematic representational changes across depth, but tuned-lens success does not identify the exact transformation used by the model's later layers.

</details>

## Applications of the Logit Lens Observation

The observation that layerwise projections differ has inspired decoding methods. **DoLa** (Decoding by Contrasting Layers) contrasts early- and late-layer logit distributions during generation {% cite "li2023dola" %}. It improved factuality metrics on the reported benchmarks without fine-tuning, supporting the practical value of the contrast even though the layerwise scores need not be literal beliefs.

Wendler et al. {% cite "wendler2024latent" %} found that middle-layer vocabulary projections in multilingual models often skew toward English, even for non-English inputs and outputs. This is consistent with an English-biased intermediate representation. Because the unembedding and token frequencies can also favor English, stronger claims about internal translation require controls beyond the projection itself.

Yang et al. {% cite "yang2024multihop" %} combined vocabulary projections with [activation patching](/topics/activation-patching/) to test a staged account of multi-hop factual questions. Intermediate-entity tokens appeared in middle-layer projections, and interventions supplied additional evidence about where relevant information affected the answer. The causal evidence is what turns a readable trajectory into more than a story about token scores.

## The Key Limitation: Observation Cannot Establish Causation

The logit lens and tuned lens show what the model would predict if processing stopped at a given layer. They reveal the trajectory of predictions across layers. But they do not tell us which components are responsible for those predictions or whether the computation at any particular layer is necessary.

The logit lens shows "Paris" at layer 8, but is the computation at layer 8 *necessary* for predicting "Paris"? These observational tools establish *correlations*: the information co-occurs with the activations. To establish *causation*, we need a different kind of experiment, one where we *intervene* on the model's internals and observe changes in behavior.

This is the shift from observation to causation. [Activation patching](/topics/activation-patching/) replaces one component's activation with an activation from a different input and measures the effect on predictions. These causal tools complete the methodological toolkit, moving us from "what exists?" to "what matters?"

Observation proposes what may be accessible; a well-designed intervention tests what changes under a specified counterfactual.
