---
title: "Hidden State Decoding: From Vectors to Language"
description: "An introduction to LLM-based activation interpretation: using language models themselves to decode their hidden representations into human-readable natural language."
prerequisites:
  - title: "The Logit Lens and Tuned Lens"
    url: "/topics/logit-lens-and-tuned-lens/"
  - title: "Sparse Autoencoders"
    url: "/topics/sparse-autoencoders/"
block: "hidden-state-decoding"
category: "concepts"
---

## The Interpretation Bottleneck

We have made significant progress in extracting structure from neural network activations. The [logit lens](/topics/logit-lens-and-tuned-lens/) projects intermediate representations to vocabulary space. [Sparse autoencoders](/topics/sparse-autoencoders/) decompose activations into interpretable features. Probing classifiers detect specific properties. These methods reveal *that* information is present, but translating their outputs into human understanding requires substantial manual effort.

Consider a SAE feature that activates on certain inputs. A researcher must examine activation patterns across many examples, hypothesize what the feature represents, and iteratively refine their understanding. This process is slow, subjective, and does not scale. As models grow larger and feature dictionaries expand to millions of features, human-in-the-loop interpretation becomes a bottleneck.

What if we could automate this translation? What if we could ask a model directly: "What does this activation represent?" and receive a natural language answer?

## The Core Idea: LLMs as Interpreters

Language models are trained to produce coherent, contextually appropriate text. They have learned rich associations between concepts, contexts, and linguistic expressions. The central insight of hidden state decoding is that we can leverage this capability to interpret activations.

> **Hidden State Decoding:** The use of language models to translate neural network activations into natural language descriptions. Rather than relying solely on human interpretation or indirect methods like vocabulary projection, we query LLMs to explain what information is encoded in a given activation.

The approach takes various forms. We can patch activations into a model and observe how its generation changes. We can train models to answer questions about activations. We can fine-tune models on datasets pairing activations with descriptions. But the underlying principle is consistent: use the linguistic competence of LLMs to bridge the gap between vector representations and human understanding.

## Why This Matters

Hidden state decoding addresses several limitations of existing interpretability methods:

**Scalability.** Manual interpretation does not scale to models with billions of parameters and millions of features. Automated natural language descriptions enable systematic analysis of large-scale representations.

**Expressiveness.** Vocabulary projection reduces representations to single-token predictions. Natural language can express nuanced, multi-faceted descriptions: "This activation represents uncertainty about whether the speaker is being sarcastic, with attention to social context cues."

**Accessibility.** Natural language is the universal interface for human understanding. Researchers, auditors, and non-specialists can engage with model internals without requiring deep technical expertise in linear algebra or representation geometry.

**Novel queries.** Traditional methods answer fixed questions (what token would be predicted? does this probe classify correctly?). LLM-based interpretation enables open-ended questions: "What is this activation attending to? Why might this feature activate here? What would change if we modified this representation?"

## The Landscape of Methods

This block covers several complementary approaches to hidden state decoding:

[**Patchscopes**](/topics/patchscopes/) provides a unifying framework for activation inspection. By patching hidden states into carefully designed prompts, we can elicit natural language descriptions of what those states represent. Patchscopes generalizes several prior methods and enables cross-model interpretation.

[**SelfIE**](/topics/selfie-interpretation/) focuses on self-interpretation, where a model explains its own embeddings. By injecting activations back into the model with appropriate prompts, we can extract descriptions of internal reasoning, including cases like ethical decision-making and prompt injection detection.

[**Training models to explain their computations**](/topics/training-self-explanation/) investigates whether fine-tuning can produce faithful explanations. A key finding: models explain their own computations better than external models can, suggesting privileged access to internal structure.

[**LatentQA**](/topics/latentqa/) frames activation interpretation as question-answering. By training decoder models on paired datasets of activations and Q&A, we can ask arbitrary questions about what a representation encodes and receive natural language answers.

[**Activation Oracles**](/topics/activation-oracles/) scale this approach to general-purpose explainers. Trained on diverse interpretation tasks, these models generalize to novel settings, recovering information that does not appear in input text and matching specialized white-box methods.

## A Note on Faithfulness

A persistent concern in interpretability is whether explanations are *faithful* to actual model computations. A model might produce plausible-sounding but incorrect descriptions of its activations. This is not unique to hidden state decoding; all interpretation methods face questions about whether their outputs reflect ground truth.

The methods in this block take different approaches to faithfulness. Some evaluate against held-out benchmarks. Others compare self-interpretation to external interpretation, finding that models have privileged access to their own representations. Still others design training procedures that incentivize accuracy over plausibility.

We will examine these faithfulness considerations for each method. For now, the key point is that hidden state decoding is not a solved problem but a research frontier. The promise is significant, but so are the open questions.

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
