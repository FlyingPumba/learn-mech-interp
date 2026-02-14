---
title: "ARENA: Hands-On Technical Training"
description: "The Alignment Research Engineer Accelerator -- an intensive program and open curriculum for building practical mechanistic interpretability skills through coding exercises."
order: 1
---

## What is ARENA?

**ARENA** (Alignment Research Engineer Accelerator) is an intensive training program designed to equip people with the technical skills to contribute to AI safety research. It runs as a 4-5 week in-person bootcamp in London, with 2-3 cohorts per year, but all of its curriculum materials are freely available online for self-study.

The program covers a broad range of ML engineering and AI safety topics. Its [Chapter 1: Transformer Interpretability](https://arena-chapter1-transformer-interp.streamlit.app/) is the most directly relevant to this course. It walks through mechanistic interpretability from the ground up, with hands-on Python exercises at every step.

- **Program homepage:** [arena.education](https://www.arena.education/)
- **Chapter 1 (Transformer Interpretability):** [arena-chapter1-transformer-interp.streamlit.app](https://arena-chapter1-transformer-interp.streamlit.app/)

## What it Covers

ARENA's interpretability chapter progresses through:

- **Building transformers from scratch** -- implementing GPT-2 in PyTorch, including attention, MLPs, embeddings, and sampling algorithms. This gives concrete intuition for the architectural concepts we covered in [Transformer Foundations](/topics/transformer-architecture/).
- **TransformerLens and induction heads** -- loading models, caching activations, using hooks for interventions, and reverse-engineering induction circuits by examining weights directly.
- **Superposition and SAEs** -- implementing toy models of superposition, training sparse autoencoders, and working with SAE variants (Gated SAEs, JumpReLU).
- **Interpretability with SAEs** -- using SAELens and Neuronpedia to inspect features, compute dashboards, and trace circuits between SAE latents across layers.
- **The IOI circuit** -- a full implementation of the indirect object identification circuit analysis, including activation patching, path patching, and circuit validation.
- **Function vectors and model steering** -- extracting task-encoding vectors from in-context learning and using them to steer model behavior.
- **Algorithmic interpretability** -- case studies on a balanced bracket classifier, grokking in modular arithmetic (with Fourier analysis of learned algorithms), and OthelloGPT (probing for emergent world models).

## How it Complements This Course

This course focuses on conceptual understanding: what the techniques are, why they work, what they reveal, and where they break down. ARENA focuses on implementation: writing the code, running the experiments, and building muscle memory with the tools.

The two approaches are complementary. Reading about activation patching gives you the conceptual framework to understand what the technique does and when to use it. Implementing activation patching in ARENA gives you the practical skill to actually do it. If you want to move from understanding mechanistic interpretability to practicing it, ARENA's exercises are an excellent next step.

ARENA's materials are self-contained and assume no prior MI knowledge, so they can be worked through independently. But having the conceptual grounding from this course will make the exercises significantly more approachable -- you will already understand *why* each technique exists before you implement it.
