---
title: "Hidden State Decoding: From Vectors to Language"
description: "Using language models to translate hidden representations into natural language, with causal tests for whether those descriptions track activations."
order: 1
prerequisites:
  - title: "The Logit Lens and Tuned Lens"
    url: "/topics/logit-lens-and-tuned-lens/"
  - title: "Sparse Autoencoders"
    url: "/topics/sparse-autoencoders/"
---

## The Interpretation Bottleneck

The [logit lens](/topics/logit-lens-and-tuned-lens/) projects states into vocabulary space, [sparse autoencoders](/topics/sparse-autoencoders/) decompose them into learned latents, and probes test whether chosen labels are decodable. Each method restricts the form of the answer. Hidden-state decoding asks whether a language model can instead produce an open-ended description.

Consider an SAE feature that activates on certain inputs. A researcher must examine examples, propose a label, seek counterexamples, and refine the hypothesis. Doing this carefully is slow, and dictionaries can contain millions of features. Automated descriptions could help researchers triage that workload, although they do not remove the need for validation.

What if we could automate this translation? What if we could ask a model directly: "What does this activation represent?" and receive a natural language answer?

## The Core Idea: LLMs as Interpreters

Language models are trained to produce coherent, contextually appropriate text. They have learned rich associations between concepts, contexts, and linguistic expressions. The central insight of hidden state decoding is that we can leverage this capability to interpret activations.

> **Hidden State Decoding:** The use of language models to translate neural network activations into natural language descriptions. Rather than relying solely on human interpretation or indirect methods like vocabulary projection, we query LLMs to explain what information is encoded in a given activation.

The approach takes various forms. We can patch activations into a model and observe how its generation changes. We can train models to answer questions about activations. We can fine-tune models on datasets pairing activations with descriptions. But the underlying principle is consistent: use the linguistic competence of LLMs to bridge the gap between vector representations and human understanding.

## Why This Matters

Hidden state decoding addresses several limitations of existing interpretability methods:

**Scalability.** Manual interpretation does not scale to models with billions of parameters and millions of features. Automated natural language descriptions enable systematic analysis of large-scale representations.

**Expressiveness.** Vocabulary projection reduces representations to single-token predictions. Natural language can express nuanced, multi-faceted descriptions: "This activation represents uncertainty about whether the speaker is being sarcastic, with attention to social context cues."

**Accessibility.** Natural-language questions let domain experts participate without learning every underlying tensor operation, provided the interface exposes uncertainty and failure modes rather than hiding them behind fluent prose.

**Novel queries.** Traditional methods answer fixed questions (what token would be predicted? does this probe classify correctly?). LLM-based interpretation enables open-ended questions: "What is this activation attending to? Why might this feature activate here? What would change if we modified this representation?"

## The Landscape of Methods

This block covers several complementary approaches to hidden state decoding:

[**Patchscopes**](/topics/patchscopes/) provides a unifying framework for activation inspection. By patching hidden states into carefully designed prompts, we can elicit natural language descriptions of what those states represent. Patchscopes generalizes several prior methods and enables cross-model interpretation.

[**SelfIE**](/topics/selfie-interpretation/) focuses on self-interpretation. It injects an activation where the model expects a text representation, then prompts the model for a description. The generated text is an elicited readout rather than a direct transcript of the model's reasoning.

[**Testing Introspection with Concept Injection**](/topics/concept-injection/) reverses the decoding problem. It injects a direction with known content and asks whether the model reports the induced internal change before expressing the concept in text.

[**Training models to explain their computations**](/topics/training-self-explanation/) compares fine-tuned self-explainers with external explainers on targets produced by existing interpretation methods, then examines introspection adapters trained across models with deliberately implanted behaviors.

[**LatentQA**](/topics/latentqa/) frames activation interpretation as question-answering. By training decoder models on paired datasets of activations and Q&A, we can ask arbitrary questions about what a representation encodes and receive natural language answers.

[**Activation Oracles**](/topics/activation-oracles/) train one decoder across diverse interpretation tasks and test how far that common interface generalizes beyond its training mixture.

[**Natural Language Autoencoders**](/topics/natural-language-autoencoders/) remove the labels entirely. A verbalizer and a reconstructor are trained jointly to autoencode an activation through a natural-language bottleneck, so the explanations are learned from a reconstruction objective rather than from data whose answers we already know.

## Causal Tests for Faithfulness

A persistent concern is whether an explanation is *faithful* to the activation it claims to describe. Fluent text is weak evidence on its own: a decoder can rely on the prompt, visible context, or its prior beliefs and still produce a plausible answer.

[Concept injection](/topics/concept-injection/) reverses the usual decoding problem. Instead of starting with an unknown activation and asking what it means, construct a direction for a known concept, inject it into the residual stream, and ask whether the model reports the induced internal state. A convincing result needs more than the right word. The report should change with the injected state, distinguish it from no-injection and random-vector controls, and occur before the model has emitted the concept into its own visible context. This is causal evidence that the report depends on an internal intervention rather than only on sampled text {% cite "lindsey2025introspection" %}.

Even that experiment has limited scope. Detecting an artificial perturbation does not show that every natural-language explanation faithfully describes ordinary computation. Other methods in this block use held-out labels, reconstruction, comparisons with external explainers, and downstream interventions. Each validates a different link in the chain from activation to description.

<details class="pause-and-think">
<summary>Pause and think: What would convince you?</summary>

What evidence would convince you that an LLM's description of an activation is faithful to what that activation actually represents? Consider:

- If the description predicts downstream behavior, does that establish faithfulness?
- If different models give consistent descriptions, does that help?
- If causal interventions based on the description produce expected effects, is that sufficient?

There is no consensus answer. Different methods in this block offer different sources of evidence. As you read, consider what standards you find compelling.

</details>

## Looking Ahead

We begin with [Patchscopes](/topics/patchscopes/), a framework that unifies many prior inspection techniques under a common abstraction. Understanding Patchscopes provides the conceptual foundation for the specialized methods that follow.
