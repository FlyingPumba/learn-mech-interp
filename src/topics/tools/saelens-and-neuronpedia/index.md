---
title: "SAELens and Neuronpedia"
description: "The primary tools for working with sparse autoencoders in practice: SAELens for training, loading, and analyzing SAEs programmatically, and Neuronpedia for interactive exploration of SAE features."
order: 3
prerequisites:
  - title: "Sparse Autoencoders"
    url: "/topics/sparse-autoencoders/"
  - title: "TransformerLens"
    url: "/topics/transformerlens/"

---

## The SAE Workflow Gap

[Sparse autoencoders](/topics/sparse-autoencoders/) decompose model activations into interpretable features. But going from "SAEs exist" to actually using them in research requires practical tooling. You need to train SAEs (or load pre-trained ones), run them alongside a language model, inspect what individual features respond to, and connect features to model behavior. Two tools have become central to this workflow: **SAELens** for the programmatic side and **Neuronpedia** for interactive exploration.

## SAELens

SAELens is an open-source Python library for training and analyzing sparse autoencoders on language models {% cite "bloom2024saelens" %}. It fills the gap between the theory of SAEs and their practical use in MI research.

### Loading Pre-Trained SAEs

Training an SAE from scratch is expensive: it requires generating millions of activation vectors from the target model, then training the autoencoder on them. For most research questions, pre-trained SAEs are the starting point. SAELens maintains a directory of pre-trained SAEs covering models like GPT-2, Gemma 2, and Pythia, and provides a consistent interface for loading them.

The typical workflow is: load a language model (via [TransformerLens](/topics/transformerlens/) or another framework), load a pre-trained SAE for a specific layer or component, run the model on some input, and pass the activations through the SAE to get sparse feature activations. SAELens handles the plumbing: matching the SAE to the correct hook point, managing device placement, and converting between formats.

### Training SAEs

When pre-trained SAEs are not available for your model or component of interest, SAELens provides a training pipeline. The key design decisions when training an SAE are:

- **Expansion factor:** How many features relative to the model's hidden dimension. Common choices range from 4x to 256x, trading off between feature granularity and training cost.
- **Architecture variant:** Standard ReLU SAEs, [Gated SAEs, TopK SAEs, or JumpReLU SAEs](/topics/sae-variants-and-evaluation/), each with different sparsity mechanisms.
- **Hook point:** Which model activation to decompose. The residual stream, MLP output, and attention output each reveal different aspects of the model's computation.
- **Training data:** The activation dataset should match the distribution you care about analyzing.

SAELens provides implementations of the major SAE variants and handles activation caching, training loops, and evaluation metrics (reconstruction loss, L0 sparsity, explained variance).

### Analysis and Integration

Beyond training and loading, SAELens integrates with the broader MI toolchain. Features can be analyzed with the **SAE-Vis** library (which generates feature dashboards), exported for use in [Neuronpedia](#neuronpedia), or used directly in downstream experiments like [feature-level circuit analysis](/topics/sparse-feature-circuits/).

SAELens works with TransformerLens models natively, and also supports running SAE inference on models loaded through HuggingFace Transformers or [nnsight](/topics/nnsight-and-nnterp/). This flexibility matters because no single framework covers all models, and SAE analysis should not be limited by the model-loading library.

## Neuronpedia

**Neuronpedia** is a web platform for interactively exploring SAE features across models and layers. Where SAELens is a programmer's tool, Neuronpedia is a microscope: it lets you browse, search, and experiment with features visually.

### Feature Dashboards

The core unit of Neuronpedia is the **feature dashboard**. For each feature in a hosted SAE, Neuronpedia shows:

- **Top activating examples:** Dataset sequences where the feature fires most strongly, with the activating tokens highlighted. This is the primary way to build intuition about what a feature responds to.
- **Activation distribution:** How often and how strongly the feature fires across a dataset.
- **Logit effects:** Which tokens in the vocabulary are promoted or suppressed when the feature is active. This reveals the feature's downstream effect on the model's predictions.
- **Auto-generated explanation:** A natural language description produced by an LLM that has been shown the feature's top examples.{% sidenote "Auto-generated explanations are useful starting points, but they can miss subtleties. A feature that fires on 'basketball,' 'football,' and 'tennis' might get the explanation 'sports,' but closer inspection might reveal it actually fires on 'competitive activities' more broadly, including chess and debate. The examples are always more trustworthy than the explanation." %}

> **Feature Dashboard:** A visual summary of a single SAE feature that displays its top activating dataset examples, activation distribution, logit effects, and an auto-generated explanation. Feature dashboards are the primary tool for understanding what individual SAE features represent.

### Searching and Navigating Features

With SAEs that have hundreds of thousands of features, browsing one by one is impractical. Neuronpedia provides two search modes:

- **Semantic search:** Find features by description. Searching "Python programming" returns features whose auto-generated explanations or activation patterns match that concept. This is useful when you have a hypothesis about what the model represents and want to find the corresponding feature.
- **Activation search:** Paste in custom text and run it through the model to find which features fire most strongly. This is the reverse direction: instead of searching by concept, you search by input and see what features the model activates.

### Steering Interface

Neuronpedia also provides an interactive **steering** interface where you can clamp SAE features to fixed values during generation and observe the effect on the model's output. This connects directly to the [feature steering](/topics/addition-steering/) techniques covered in the steering block: instead of writing code to intervene on activations, you can experiment with feature-level steering in the browser.

## Gemma Scope

A significant milestone for SAE tooling was **Gemma Scope** {% cite "lieberum2024gemma" %}: a comprehensive release of pre-trained SAEs for every layer and sublayer of Google DeepMind's Gemma 2 models (2B and 9B parameters). Gemma Scope provides SAEs at multiple expansion factors (16K to 1M features), enabling researchers to study Gemma 2's internals without training their own SAEs.

Gemma Scope SAEs are available through both SAELens (for programmatic access) and Neuronpedia (for interactive exploration), making them a practical starting point for anyone wanting to study SAE features on a modern, capable model.

<details class="pause-and-think">
<summary>Pause and think: Choosing your tool</summary>

You want to investigate how a language model represents the concept of "deception." You have access to pre-trained SAEs for the model. What would your workflow look like using these tools?

A reasonable approach: start on Neuronpedia with a semantic search for "deception," "lying," or related terms to find candidate features. Examine their dashboards to see if they genuinely capture deception or something adjacent. Then switch to SAELens to run these features programmatically on a curated dataset of deceptive vs. honest prompts, measuring activation differences. If the features look promising, use SAELens to test whether steering on them changes the model's behavior. The interactive exploration narrows the search; the programmatic analysis provides rigor.

</details>

## The MI Toolchain

SAELens and Neuronpedia complete a toolchain that spans the full MI workflow:

| Tool | Role |
|---|---|
| [TransformerLens](/topics/transformerlens/) | Model loading, weight access, hook-based interventions |
| [nnsight](/topics/nnsight-and-nnterp/) | Framework-agnostic interventions, remote execution for large models |
| **SAELens** | SAE training, loading, and programmatic feature analysis |
| **Neuronpedia** | Interactive feature exploration, search, and steering |

These tools are complementary rather than competing. A typical research project might use TransformerLens or nnsight to study model behavior, SAELens to decompose activations into features, and Neuronpedia to build intuition about what those features represent. The boundaries are fluid: SAELens integrates with both TransformerLens and nnsight, and Neuronpedia can import SAEs trained with SAELens.

The tooling ecosystem continues to evolve rapidly. New SAE variants, larger pre-trained SAE releases, and tighter integration between tools appear regularly. But the core workflow of train/load, analyze, explore remains stable, and SAELens and Neuronpedia are currently the standard tools for each step.
