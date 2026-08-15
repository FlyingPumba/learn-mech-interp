---
title: "Training Models to Explain Their Computations"
description: "Training language models to describe their own internal computations, and testing whether those self-explanations reveal more than an external observer can recover."
order: 4
prerequisites:
  - title: "SelfIE: Self-Interpretation of Embeddings"
    url: "/topics/selfie-interpretation/"
---

## Beyond Zero-Shot Interpretation

The methods we have seen so far, Patchscopes and SelfIE, rely on prompting to elicit interpretations. They assume that language models already possess the capability to describe their internal representations; we just need to ask correctly.

But what if models do not naturally explain themselves well? Prompting might produce plausible-sounding descriptions that are not faithful to actual computations. Li et al. {% cite "li2025training" %} investigate a different approach: explicitly *training* models to generate accurate explanations of their internal processes.

> **Trained Self-Explanation:** Fine-tuning a language model to reproduce explanation targets derived from existing interpretability methods. The resulting model can amortize those methods, but cannot be more faithful than its targets without independent validation.

## What Explanations Are Trained

The work focuses on three types of computational explanations:

### Feature Descriptions

What do internal features encode? Given an activation pattern, the trained model should describe what concept or property that pattern represents.

For training data, the authors use targets from methods such as [sparse-autoencoder](/topics/sparse-autoencoders/) feature analysis. If a latent has been labeled “mentions of US presidents,” its activation examples can supervise that description. The label is inherited evidence, not literal ground truth: any weakness in the original feature analysis enters the training set.

### Causal Structure

How do components influence each other? Given information about which model components affect which outputs, the trained model should describe these causal relationships.

Techniques like [activation patching](/topics/activation-patching/) and [attribution patching](/topics/attribution-patching/) provide supervision. If patching attention head 9.1 changes “Paris” to “London,” a careful target can say that this replacement changed the city prediction. Saying the head “is responsible for retrieving the city” adds a mechanistic interpretation that the patch alone does not establish.

### Token Influence

Which input tokens affect the output? Given information about how input tokens contribute to predictions, the trained model should articulate these dependencies.

Methods like gradient-based attribution provide supervision. If the token "French" strongly influences predicting "Paris," this becomes training data for explaining input-output relationships.

## Comparing Self- and External Explanation

On the study's explanation targets and evaluation metrics, fine-tuned self-explainers outperform the tested external explainers, including some larger models. That is not the result we would get by assuming linguistic sophistication alone determines explanation quality: a larger model $M$ might describe a smaller model $S$ fluently while lacking a well-matched interface to $S$'s internal state. The result is specific to the study's targets and scoring procedure; it does not establish privileged or generally faithful introspective access.

<details class="pause-and-think">
<summary>Pause and think: Why might self-explanation work better?</summary>

What mechanisms could explain why self-explanation outperforms external explanation?

Several possibilities:
1. **Shared representations:** When a model explains itself, the input (the internal state) and the explainer share the same representational basis.
2. **Privileged access:** The model has direct access to information about its own computations that cannot be fully communicated to an external system.
3. **Alignment of training:** The same training that produced the internal representations also shapes how the model uses language, creating natural correspondences.

One hypothesis is that a shared representational basis gives self-explanation an advantage on these tasks. Another is that the self-explainer is better matched to the training labels. Distinguishing those explanations requires evaluations whose targets do not come from the same interpretation pipeline.

</details>

## Training Procedure

The training pipeline works as follows:

1. **Generate explanation targets.** Run SAE analysis, patching, or attribution to produce descriptions of internal states and effects.

2. **Create training examples.** Pair internal states or computation patterns with their ground-truth explanations.

3. **Fine-tune the model.** Train the model to generate the correct explanation given the internal state as input.

4. **Evaluate generalization.** Test on held-out examples to measure whether the trained explainer generalizes beyond its training distribution.

Explainer models trained on tens of thousands of examples generalize to held-out queries under the study's metrics. This is evidence against simple example memorization, while still leaving open whether the learned pattern is the target method's regularity or the model's underlying mechanism.

## Faithfulness Considerations

Training for explanation introduces a tension. We want descriptions to track the actual computation, but the objective rewards matching targets produced by existing interpretation methods. If those targets are imperfect, the trained model can reproduce their mistakes fluently.

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
