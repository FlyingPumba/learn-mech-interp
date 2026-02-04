---
title: "Feature Dashboards and Automated Interpretability"
description: "How researchers visualize and interpret the features SAEs discover, from manual feature dashboards to automated LLM-based interpretation."
prerequisites:
  - title: "Sparse Autoencoders: Decomposing Superposition"
    url: "/topics/sparse-autoencoders/"
difficulty: "intermediate"
block: "superposition-and-feature-extraction"
category: "methods"
---

## What Monosemantic Features Look Like

A [sparse autoencoder](/topics/sparse-autoencoders/) trained on a one-layer transformer extracts over 4,000 features from just 512 neurons {% cite "bricken2023monosemanticity" %}. Each feature is a direction in activation space with a corresponding latent dimension in the SAE. But how do we know that these features are genuinely interpretable? How do we move from "this latent dimension activates on certain inputs" to "this feature represents Arabic script" or "this feature detects legal citations"?

The answer requires systematic inspection. A feature is not interpretable just because it exists in the SAE's latent space. It is interpretable when a human can examine the inputs that activate it and state a coherent rule that predicts its behavior. The tooling and methodology for this inspection are the subject of this article.

When Bricken et al. examined their SAE features, they found remarkably specific and coherent responses {% cite "bricken2023monosemanticity" %}. One feature fires exclusively on Arabic script. Another fires on DNA sequences -- patterns like ATCG and genetic terminology. Another responds to legal language: court cases, statutory references, legal citations. Others detect HTTP requests, Hebrew text, or nutrition statements. Each feature activates for one semantic category and stays quiet for everything else. Compare this to the polysemantic neurons they replaced, where a single neuron might respond to sports, the color red, and questions about geography simultaneously.{% sidenote "The specificity of SAE features is what makes them useful for mechanistic interpretability. A polysemantic neuron tells you very little about what the model is computing -- it fires for many unrelated reasons. A monosemantic SAE feature tells you exactly what concept the model is tracking at that point in its computation. This is the difference between seeing a jumble of overlapping signals and seeing each signal individually." %}

## Feature Dashboards

Feature dashboards became the standard tool for inspecting SAE features. A dashboard compiles three complementary views of what a feature does, giving researchers enough information to assess whether the feature represents a coherent concept.

> **Feature Dashboard:** A visualization showing three key pieces of information about an SAE feature: (1) the text examples where the feature activates most strongly, with activating tokens highlighted; (2) the tokens the feature promotes or suppresses in the model's output when active (logit effects); and (3) the impact of removing the feature from the representation (ablation).

**Activation examples** are the most intuitive component. The dashboard shows text excerpts where the feature fires strongly, with the specific tokens that triggered activation highlighted. If a feature is truly monosemantic, the top activation examples will all share a common theme. For a legal language feature, every top example will contain court cases, statutes, or legal terminology. For a DNA feature, every example will contain genetic sequences. The consistency of the top examples is the first test of interpretability.

**Logit effects** show how the feature influences the model's predictions when it is active. Each column of the SAE's decoder matrix corresponds to a feature direction, and projecting this direction onto the model's unembedding matrix reveals which output tokens the feature promotes or suppresses. If the legal language feature promotes tokens like "court," "statute," "plaintiff," and "defendant" while suppressing unrelated tokens, this corroborates the interpretation from the activation examples. Inconsistent logit effects -- where the feature promotes an incoherent mix of unrelated tokens -- suggest the feature may still be polysemantic.{% sidenote "Logit effects provide a kind of causal evidence that activation examples alone cannot. Activation examples show what inputs trigger the feature, but logit effects show what the feature does to the model's computation. A feature that activates on legal text AND promotes legal tokens in the output has both sides of the story: it detects legal content and it steers the model toward legal predictions." %}

**Ablation impact** shows what changes when the feature is removed from the representation entirely. If the model's performance on legal text degrades when the legal feature is ablated, but performance on other text types is unaffected, we have strong evidence that this feature is specifically responsible for the model's handling of legal content. Minimal ablation impact is a warning sign: if removing the feature changes nothing, it may be a dead or redundant feature that does not meaningfully contribute to the model's computation.

## How to Read a Dashboard

Reading a dashboard well requires looking for both positive and negative evidence. A well-behaved monosemantic feature shows a consistent pattern across all three views:

- The top activation examples all share a recognizable theme.
- The logit effects are consistent with that theme.
- Ablation causes degradation specifically on inputs related to that theme.

But not all features are clean. Several warning signs indicate that a feature may not be as interpretable as it first appears:

**Mixed activation examples.** If the top activations include legal text, code, and poetry, the feature may still be polysemantic -- representing a blend of concepts rather than a single one. This can happen when the SAE does not have enough latent dimensions to fully decompose all the features the model represents. Larger SAEs with higher expansion factors can sometimes resolve these mixed features by splitting them into finer sub-features.

**Inconsistent logit effects.** If the feature promotes unrelated types of tokens -- legal terms, cooking vocabulary, and mathematical symbols -- it likely represents a blend of concepts. The logit effects should tell the same story as the activation examples.

**Minimal ablation impact.** If removing the feature from the representation changes nothing about the model's behavior, the feature may be dead (never active on real data) or redundant (its contribution is duplicated by other features). Either way, it is not doing meaningful work in the model's computation.

<details class="pause-and-think">
<summary>Pause and think: Evaluating a feature</summary>

Suppose you are examining an SAE feature whose top activation examples all contain the word "bank." The examples include sentences about river banks, financial banks, and data banks. Is this feature monosemantic? How would you use the logit effects and ablation results to resolve the ambiguity?

If the logit effects promote financial terms (interest, deposit, loan), the feature is likely a financial-bank feature and the river-bank examples may be false positives that happen to share the surface form. If the logit effects are mixed, the feature may be responding to the word form "bank" rather than any specific meaning, which would make it a word-level feature rather than a concept-level feature. Ablation results that show degradation specifically on financial text would confirm the financial interpretation.

</details>

## Automated Interpretability

With 4,000+ features from a tiny one-layer transformer, manual inspection of every feature dashboard is already time-consuming. At production scale, SAEs extract millions of features. Inspecting each one manually is impossible. How do you evaluate whether millions of features are interpretable?

The solution is to use another language model to automatically describe and evaluate features. The automated interpretability pipeline works in three steps:

1. **Show the LLM many examples** where the feature activates strongly, with the activating tokens highlighted.
2. **Ask the LLM to generate a description** of what the feature responds to (for example, "This feature fires on legal citations and statutory references").
3. **Test the description on held-out examples:** Does the feature fire on new legal citations that the LLM has not seen? Does it stay quiet on non-legal text?

If the description accurately predicts the feature's behavior on held-out data, the feature is likely monosemantic and the description is likely accurate. If the description fails to predict -- the feature fires on examples that do not match the description, or stays quiet on examples that should match -- then either the feature is not cleanly monosemantic or the description is too narrow.{% sidenote "Automated interpretability has an inherent circularity concern: we are using one neural network (the evaluating LLM) to assess interpretability claims about another neural network (the model being studied). If the evaluating LLM has its own blind spots or biases, those could systematically affect the evaluation. This is why Bricken et al. used multiple lines of evidence -- automated methods complement but do not replace human evaluation." %}

## The Promise and Limits of Automated Interpretation

Automated interpretability enables the kind of broad coverage that manual analysis cannot achieve. Bricken et al. used it alongside human evaluation to assess thousands of features, combining targeted manual investigation of important features with automated screening of the full feature set {% cite "bricken2023monosemanticity" %}.

But automated interpretability is imperfect in important ways. It can miss subtle patterns that a human expert would catch -- a feature that responds to a specific syntactic construction may look like noise to an LLM that focuses on semantic content. It may generate overly broad descriptions: "this feature fires on text" is technically correct for a feature that responds to English prose, but the description is useless for understanding what the feature does.{% sidenote "The risk of overly broad descriptions connects to what Bolukbasi et al. (2021) called the 'interpretability illusion': explanations that have good recall but poor precision. A feature described as 'responds to safety-related content' might actually fire on a much broader category that includes safety text along with many other things. The description looks right when you check it against the feature's activations (good recall), but it incorrectly predicts that the feature would fire on safety content it actually ignores (poor precision)." %}

More fundamentally, automated interpretability provides a tool for scaling evaluation, not a substitute for careful manual analysis on important features. The pipeline can tell you that most features have coherent descriptions, but it cannot tell you whether those features are causally meaningful -- whether they correspond to computations the model actually performs rather than statistical patterns in the activations.

The combination of all four evaluation methods -- detailed case studies for important features, human evaluation on random samples, automated interpretability on activations for broad coverage, and automated interpretability on logit weights for understanding downstream effects -- gives the most reliable picture of feature quality. No single method is sufficient on its own.

## From Features to Function

Feature dashboards and automated interpretability give us tools to inspect what SAE features represent. But inspection is only the first step. The deeper question is whether these features can serve as the building blocks for a mechanistic understanding of the model.

If SAE features are genuinely monosemantic, they offer a path beyond the [polysemanticity problem](/topics/superposition/#why-superposition-makes-interpretability-hard) that makes neuron-level analysis fail. Instead of trying to interpret polysemantic neurons -- each a confusing blend of multiple concepts -- we can work with monosemantic features, each representing a single coherent concept. Circuit analysis at the feature level becomes possible even when head-level analysis fails.

Whether this promise holds at scale is the subject of the next articles. The question of whether SAEs scale to production models with billions of parameters, and what the features look like at that scale, is addressed in [scaling monosemanticity](/topics/scaling-monosemanticity/). The honest limitations -- including failure modes that feature dashboards alone cannot reveal -- are covered in [SAE variants, evaluation, and honest limitations](/topics/sae-variants-and-evaluation/).

<details class="pause-and-think">
<summary>Pause and think: The scalability challenge</summary>

The one-layer transformer in Bricken et al.'s experiment had 512 MLP neurons and the SAE extracted about 4,000 features -- an 8x ratio. If this ratio holds for larger models, a model like GPT-2 Small with 768 residual stream dimensions might contain over 6,000 features per layer, and a model like Claude 3 Sonnet with tens of thousands of dimensions could contain millions of features across all layers.

How would you evaluate millions of features? Manual dashboard inspection is clearly impossible. Can automated interpretability handle this scale? What new evaluation methods might be needed?

</details>
