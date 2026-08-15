---
title: "ARENA: Hands-On Technical Training"
description: "How ARENA’s open curriculum complements this site with implementation-heavy exercises on transformers, causal interventions, sparse features, and circuits."
order: 1
---

## What is ARENA?

**ARENA** (Alignment Research Engineer Accelerator) is a technical AI-safety training program with curriculum materials available online for self-study. Program formats and cohort schedules can change; the durable resource for this course is its public set of coding exercises.

The program covers a broad range of ML engineering and AI safety topics. Its [Chapter 1: Transformer Interpretability](https://arena-chapter1-transformer-interp.streamlit.app/) is the most directly relevant to this course. It walks through mechanistic interpretability from the ground up, with hands-on Python exercises at every step.

- **Program homepage:** [arena.education](https://www.arena.education/)
- **Chapter 1 (Transformer Interpretability):** [arena-chapter1-transformer-interp.streamlit.app](https://arena-chapter1-transformer-interp.streamlit.app/)

## What it Covers

ARENA's interpretability chapter progresses through:

- **Building transformers from scratch**, implementing GPT-2 in PyTorch, including attention, MLPs, embeddings, and sampling algorithms. This gives concrete intuition for the architectural concepts we covered in [Transformer Foundations](/topics/transformer-architecture/).
- **TransformerLens and induction heads**, loading models, caching activations, using hooks for interventions, and reverse-engineering induction circuits by examining weights directly.
- **Superposition and SAEs**, implementing toy models of superposition, training sparse autoencoders, and working with SAE variants (Gated SAEs, JumpReLU).
- **Interpretability with SAEs**, using SAELens and Neuronpedia to inspect features, compute dashboards, and trace circuits between SAE latents across layers.
- **The IOI circuit**, a full implementation of the indirect object identification circuit analysis, including activation patching, path patching, and circuit validation.
- **Function vectors and model steering**, extracting task-encoding vectors from in-context learning and using them to steer model behavior.
- **Algorithmic interpretability**, case studies on a balanced bracket classifier, grokking in modular arithmetic (with Fourier analysis of learned algorithms), and OthelloGPT (probing for emergent world models).

## How it Complements This Course

This course focuses on conceptual understanding: what the techniques are, why they work, what they reveal, and where they break down. ARENA focuses on implementation: writing the code, running the experiments, and building muscle memory with the tools.

Reading about activation patching gives you the conceptual framework to judge what the intervention means. Implementing it in ARENA forces you to handle tensor shapes, caching, metrics, and debugging. That makes the exercises a useful bridge from recognizing a method to running it yourself.

<details class="pause-and-think">
<summary>Pause and think: Which exercise should you choose?</summary>

Pick one method from this curriculum that you understand conceptually but have not implemented. What is the smallest ARENA exercise that would force you to produce and interpret a real result with it?

A useful choice has a concrete output you can check: reproduce one attention pattern, patch one activation, or train one toy sparse autoencoder. Start there before attempting an entire chapter. The goal is to discover which parts of your understanding survive contact with tensor shapes, baselines, and actual model outputs.

</details>

ARENA's materials are designed to be worked through independently. Prior conceptual grounding should make the exercises more approachable because you will already understand *why* each technique exists before you implement it.
