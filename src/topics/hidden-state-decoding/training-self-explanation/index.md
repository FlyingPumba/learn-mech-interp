---
title: "Training Models to Explain Their Computations"
description: "Fine-tuning language models to generate natural language descriptions of their internal processes, with a key finding: models explain their own computations better than external models can."
order: 4
prerequisites:
  - title: "SelfIE: Self-Interpretation of Embeddings"
    url: "/topics/selfie-interpretation/"
---

## Beyond Zero-Shot Interpretation

The methods we have seen so far, Patchscopes and SelfIE, rely on prompting to elicit interpretations. They assume that language models already possess the capability to describe their internal representations; we just need to ask correctly.

But what if models do not naturally explain themselves well? Prompting might produce plausible-sounding descriptions that are not faithful to actual computations. Li et al. {% cite "li2025training" %} investigate a different approach: explicitly *training* models to generate accurate explanations of their internal processes.

> **Trained Self-Explanation:** Fine-tuning language models on datasets of ground-truth explanations derived from interpretability techniques. The goal is to produce models that generate faithful descriptions of their internal features, causal structure, and token influence.

## What Explanations Are Trained

The work focuses on three types of computational explanations:

### Feature Descriptions

What do internal features encode? Given an activation pattern, the trained model should describe what concept or property that pattern represents.

For training data, the authors use existing interpretability techniques (like [sparse autoencoder](/topics/sparse-autoencoders/) feature analysis) as ground truth. If an SAE feature has been labeled as "mentions of US presidents," examples where that feature activates become training data for the explanation "This activation represents references to US presidents."

### Causal Structure

How do components influence each other? Given information about which model components affect which outputs, the trained model should describe these causal relationships.

Techniques like [activation patching](/topics/activation-patching/) and [attribution patching](/topics/attribution-patching/) provide ground truth. If patching attention head 9.1 changes the output from "Paris" to "London," this becomes training data for explaining that "Head 9.1 is responsible for retrieving the city name."

### Token Influence

Which input tokens affect the output? Given information about how input tokens contribute to predictions, the trained model should articulate these dependencies.

Methods like gradient-based attribution provide supervision. If the token "French" strongly influences predicting "Paris," this becomes training data for explaining input-output relationships.

## The Key Finding: Self-Explanation Superiority

The central empirical result is striking:

**Models explain their own computations better than external models can, even when the external model is more capable.**

This runs counter to a natural intuition. If we have a small model $S$ and a large, capable model $M$, we might expect $M$ to provide better explanations of $S$'s behavior. After all, $M$ has more capacity and linguistic sophistication.

But the experiments show otherwise. When fine-tuned for self-explanation, a model produces more accurate descriptions of its own internal states than an external model produces, even when the external model is significantly larger.

<details class="pause-and-think">
<summary>Pause and think: Why might self-explanation work better?</summary>

What mechanisms could explain why self-explanation outperforms external explanation?

Several possibilities:
1. **Shared representations:** When a model explains itself, the input (the internal state) and the explainer share the same representational basis.
2. **Privileged access:** The model has direct access to information about its own computations that cannot be fully communicated to an external system.
3. **Alignment of training:** The same training that produced the internal representations also shapes how the model uses language, creating natural correspondences.

The finding suggests that self-interpretation is not just convenient but may be fundamentally more powerful than external interpretation for certain tasks.

</details>

## Training Procedure

The training pipeline works as follows:

1. **Generate ground-truth explanations.** Run interpretability techniques (SAE analysis, patching, attribution) to produce accurate descriptions of internal computations.

2. **Create training examples.** Pair internal states or computation patterns with their ground-truth explanations.

3. **Fine-tune the model.** Train the model to generate the correct explanation given the internal state as input.

4. **Evaluate generalization.** Test on held-out examples to measure whether the trained explainer generalizes beyond its training distribution.

The authors find that explainer models trained on tens of thousands of examples exhibit meaningful generalization to new queries. This suggests that models learn genuine patterns about their own computations, not just memorized associations.

## Faithfulness Considerations

Training for explanation introduces a tension. We want explanations to be faithful (accurately describing actual computations), but training optimizes for matching ground-truth labels. If the labels are imperfect, the model might learn to reproduce those imperfections.

The authors address this by:
- Using multiple independent interpretability techniques as cross-validation
- Testing generalization to novel scenarios not seen during training
- Comparing self-explanation to external explanation as a consistency check

The generalization results are encouraging. Models do not simply memorize training explanations; they learn patterns that transfer to new situations. This suggests the explanations capture genuine regularities in how the model computes.

## Scalability

A key advantage of trained explainers is scalability. Once trained, the explainer can generate explanations for new internal states without rerunning expensive interpretability techniques.

Consider the alternative: analyzing each SAE feature individually requires extensive human effort or automated analysis. A trained explainer can describe new features by leveraging patterns learned from previously analyzed features.

This creates a bootstrapping opportunity:
1. Analyze a subset of internal states using expensive techniques
2. Train an explainer on this subset
3. Use the explainer to analyze the remaining states
4. Optionally, validate a sample of generated explanations

The approach scales interpretation capacity without proportionally scaling interpretation cost.

## Limitations

**Ground truth dependency.** The method is only as good as the interpretability techniques that provide training data. If those techniques are biased or incomplete, the trained explainer inherits their limitations.

**Distribution shift.** Explainers may not generalize well to internal states very different from their training distribution. Novel computations may require new training data.

**Explanation vs. understanding.** Generating accurate explanations does not guarantee that the explanations are useful for human understanding. The model might produce technically correct but uninformative descriptions.

**Computational cost.** Training requires substantial compute for generating ground-truth explanations and fine-tuning. This may limit applicability to very large models.

## Implications for Interpretability

The finding that self-explanation outperforms external explanation has important implications:

**Self-reference is valuable.** Rather than treating interpretation as purely external (researchers analyzing a model), we should consider interpretability as a capacity models can develop about themselves.

**Scaling interpretation.** As models grow, human interpretation capacity does not scale. Trained self-explainers offer a path to interpretability that scales with model capability.

**Complementary to other methods.** Trained explanation does not replace techniques like patching or probing. It builds on them, using their outputs as training data to create more scalable interpretation tools.

## Looking Ahead

Training models to explain themselves is promising, but the approach requires careful design of training data and evaluation. [LatentQA](/topics/latentqa/) takes a related approach with a different framing: rather than generating open-ended explanations, it formulates interpretation as question-answering. This structured format enables more systematic evaluation and potentially more reliable responses.
